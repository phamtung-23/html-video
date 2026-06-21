/**
 * @html-video/core — Edge-TTS speech provider (free, no API key).
 *
 * The studio's narration engine. It shells out to Microsoft's `edge-tts` CLI,
 * which streams from the public Edge "read aloud" endpoint: it needs network
 * access but NO account, NO key, and no per-character billing — so the studio
 * produces voiceover for free.
 *
 * It returns a {@link TtsAudioResult} (bytes + metadata) that callers
 * (studio-server / CLI) hand straight to the asset-store and ffmpeg mux.
 *
 * Binary resolution (first hit wins, see {@link resolveEdgeTtsCommand}):
 *   1. EDGE_TTS_BIN env (explicit path to an `edge-tts` executable)
 *   2. <projectRoot>/.html-video/edge-tts-venv/bin/edge-tts (the venv the CLI
 *      manages — gitignored runtime dir, zero-config once created)
 *   3. `edge-tts` on PATH
 *   4. `python3 -m edge_tts` when the module is importable
 * Returns null when none are found, so callers report a friendly install hint
 * instead of throwing a raw ENOENT.
 */

import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HtmlVideoError } from './errors.js';

/** Result of a text-to-speech synthesis: decoded audio bytes plus metadata. */
export interface TtsAudioResult {
  /** Decoded audio bytes (MP3). */
  bytes: Buffer;
  /** File extension to store under. */
  ext: '.mp3';
  /** Human-readable note of what was produced (provider · voice · size). */
  providerNote: string;
  /** Reported duration in seconds, if known. */
  durationSec?: number;
}

/** Friendly built-in Vietnamese voices, surfaced so the UI/CLI can offer them. */
export const EDGE_TTS_VIETNAMESE_VOICES = {
  female: 'vi-VN-HoaiMyNeural',
  male: 'vi-VN-NamMinhNeural',
} as const;

/** Default voice when the caller doesn't pick one. Vietnamese female (this
 *  project's primary content language); override per-call or via env. */
export const EDGE_TTS_DEFAULT_VOICE = EDGE_TTS_VIETNAMESE_VOICES.female;

/** Hard ceiling for a single synthesis. Edge-TTS is fast; a request that hasn't
 *  returned in 2 minutes is hung, not slow. */
const EDGE_TTS_TIMEOUT_MS = 120_000;

/** A resolved, runnable edge-tts invocation: `cmd` plus any leading args (e.g.
 *  `['-m', 'edge_tts']` for the python-module fallback). */
export interface EdgeTtsCommand {
  cmd: string;
  baseArgs: string[];
  /** How it was found — for diagnostics / doctor output. */
  source: 'env' | 'project-venv' | 'path' | 'python-module';
}

/** Conventional path to the CLI-managed venv binary under a project root. */
export function edgeTtsVenvBin(projectRoot: string): string {
  return join(projectRoot, '.html-video', 'edge-tts-venv', 'bin', 'edge-tts');
}

function commandExists(cmd: string): boolean {
  try {
    execFileSync('which', [cmd], { stdio: ['ignore', 'ignore', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

function pythonModuleAvailable(): boolean {
  try {
    execFileSync('python3', ['-c', 'import edge_tts'], { stdio: ['ignore', 'ignore', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a runnable edge-tts command, or null if Edge-TTS isn't installed.
 * `projectRoot` lets us prefer the gitignored venv the CLI manages.
 */
export function resolveEdgeTtsCommand(opts?: {
  env?: NodeJS.ProcessEnv;
  projectRoot?: string;
}): EdgeTtsCommand | null {
  const env = opts?.env ?? process.env;

  const explicit = (env.EDGE_TTS_BIN || '').trim();
  if (explicit) return { cmd: explicit, baseArgs: [], source: 'env' };

  if (opts?.projectRoot) {
    const venvBin = edgeTtsVenvBin(opts.projectRoot);
    if (existsSync(venvBin)) return { cmd: venvBin, baseArgs: [], source: 'project-venv' };
  }

  if (commandExists('edge-tts')) return { cmd: 'edge-tts', baseArgs: [], source: 'path' };

  if (pythonModuleAvailable()) return { cmd: 'python3', baseArgs: ['-m', 'edge_tts'], source: 'python-module' };

  return null;
}

/** Convert a numeric `speed` (1.0 = normal) into edge-tts's `--rate ±N%`
 *  string. 1.1 → "+10%", 0.9 → "-10%", 1.0 → "+0%". */
function speedToRate(speed: number): string {
  const pct = Math.round((speed - 1) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

/** Probe duration with ffprobe (best-effort; undefined if ffprobe is absent). */
function probeDurationSec(file: string): number | undefined {
  try {
    const out = execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    ).toString().trim();
    const n = Number.parseFloat(out);
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Synthesize narration with Edge-TTS and return MP3 bytes.
 *
 * `speed`/`rate`, `pitch` and `volume` map to edge-tts CLI flags; an explicit
 * `rate`/`pitch`/`volume` string wins over the numeric `speed` convenience.
 */
export async function generateTtsEdge(opts: {
  text: string;
  voiceId?: string;
  /** Numeric speed (1.0 = normal). Mapped to --rate. */
  speed?: number;
  /** edge-tts --rate, e.g. "+10%". Overrides `speed` when set. */
  rate?: string;
  /** edge-tts --pitch, e.g. "+5Hz". Default "+0Hz". */
  pitch?: string;
  /** edge-tts --volume, e.g. "+0%". Default "+0%". */
  volume?: string;
  /** Where to look for the managed venv binary. */
  projectRoot?: string;
  env?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
}): Promise<TtsAudioResult> {
  const text = (opts.text || '').trim();
  if (!text) {
    throw new HtmlVideoError('invalid-input', 'narration text is empty');
  }

  const resolved = resolveEdgeTtsCommand({
    ...(opts.env !== undefined && { env: opts.env }),
    ...(opts.projectRoot !== undefined && { projectRoot: opts.projectRoot }),
  });
  if (!resolved) {
    throw new HtmlVideoError(
      'render-failed',
      'Edge-TTS not found. Install it (free, no key): `pipx install edge-tts` or ' +
        '`python3 -m pip install edge-tts`, or set EDGE_TTS_BIN to its path.',
    );
  }

  const voice = (opts.voiceId || '').trim() || EDGE_TTS_DEFAULT_VOICE;
  const rate = (opts.rate || '').trim() || (opts.speed !== undefined ? speedToRate(opts.speed) : '+0%');
  const pitch = (opts.pitch || '').trim() || '+0Hz';
  const volume = (opts.volume || '').trim() || '+0%';

  // Pass text via a temp file (--file), never argv: narration can be long and
  // can contain quotes/newlines that would break shell-free argv too.
  const work = await mkdtemp(join(tmpdir(), 'hv-edge-tts-'));
  const textFile = join(work, 'narration.txt');
  const outFile = join(work, 'narration.mp3');
  try {
    await writeFile(textFile, text, 'utf8');

    const args = [
      ...resolved.baseArgs,
      '--voice', voice,
      '--rate', rate,
      '--pitch', pitch,
      '--volume', volume,
      '--file', textFile,
      '--write-media', outFile,
    ];

    await new Promise<void>((resolvePromise, reject) => {
      const child = spawn(resolved.cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new HtmlVideoError('render-failed', `edge-tts timed out after ${EDGE_TTS_TIMEOUT_MS}ms`));
      }, EDGE_TTS_TIMEOUT_MS);

      const onAbort = () => {
        child.kill('SIGKILL');
        reject(new HtmlVideoError('render-failed', 'edge-tts aborted'));
      };
      if (opts.signal) {
        if (opts.signal.aborted) onAbort();
        else opts.signal.addEventListener('abort', onAbort, { once: true });
      }

      child.stderr?.on('data', (d) => { stderr += d.toString(); });
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(new HtmlVideoError('render-failed', `edge-tts failed to launch: ${err.message}`));
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (opts.signal) opts.signal.removeEventListener('abort', onAbort);
        if (code === 0) resolvePromise();
        else reject(new HtmlVideoError('render-failed', `edge-tts exited with code ${code}: ${stderr.slice(-500)}`));
      });
    });

    if (!existsSync(outFile)) {
      throw new HtmlVideoError('render-failed', 'edge-tts produced no audio file');
    }
    const bytes = await readFile(outFile);
    if (bytes.length === 0) {
      throw new HtmlVideoError('render-failed', 'edge-tts produced an empty audio file');
    }
    const durationSec = probeDurationSec(outFile);
    return {
      bytes,
      ext: '.mp3',
      providerNote: `edge-tts · ${voice} · ${durationSec ?? '?'}s · ${bytes.length} bytes`,
      ...(durationSec !== undefined && { durationSec }),
    };
  } finally {
    await rm(work, { recursive: true, force: true }).catch(() => {});
  }
}
