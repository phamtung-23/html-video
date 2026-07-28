/**
 * @html-video/core — VieNeu-TTS speech provider (free, no API key, offline).
 *
 * A second narration engine alongside {@link generateTtsEdge}. Where Edge-TTS
 * offers only two Vietnamese voices (and needs the network), VieNeu-TTS ships
 * **14 built-in Vietnamese voices** (North / Central / South, both genders,
 * three reading styles) and runs **fully offline on the CPU** via ONNX — no
 * account, no key, no per-character billing, no GPU.
 *
 * VieNeu is a Python package (`pip install vieneu`). Loading its model costs a
 * few seconds, so we do NOT cold-start Python per sentence: a **persistent
 * worker** (see {@link VieNeuWorker}) keeps the model warm and answers
 * JSON-lines requests over stdin/stdout. The worker is spawned lazily on the
 * first synthesis and torn down after an idle period.
 *
 * The synthesized WAV (48 kHz) is transcoded to MP3 with ffmpeg (optionally
 * time-stretched with `atempo` to honour the speed slider — VieNeu has no
 * native rate control), and sentence-level {@link CaptionCue}s are synthesized
 * by distributing the measured duration across the text's sentences (VieNeu,
 * unlike Edge-TTS, produces no subtitle timing). The result is a
 * {@link TtsAudioResult} — the SAME shape Edge-TTS returns — so callers
 * (studio-server / CLI) route by voice id without special-casing the engine.
 *
 * Python resolution (first hit wins, see {@link resolveVieNeuCommand}):
 *   1. VIENEU_BIN env (explicit path to a python with `vieneu` installed)
 *   2. <projectRoot>/.html-video/vieneu-venv/bin/python (the CLI-managed venv)
 *   3. `python3` on PATH when `import vieneu` succeeds
 * Returns null when none are found, so callers show a friendly install hint.
 */

import { type ChildProcess, spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { HtmlVideoError } from './errors.js';
import type { CaptionCue } from './subtitles.js';
import { ffmpegBin } from './ffmpeg.js';
import { probeDurationSec, type TtsAudioResult } from './edge-tts.js';

/** A VieNeu reading style — how a line is delivered, independent of the voice. */
export type VieNeuStyle = 'tu_nhien' | 'tin_tuc' | 'doc_truyen';

/** A built-in VieNeu preset voice. `id` is the exact string passed to the model. */
export interface VieNeuVoice {
  /** Exact preset name understood by `Vieneu.infer(voice=…)`. */
  id: string;
  gender: 'male' | 'female';
  /** Regional accent: Bắc (North) / Trung (Central) / Nam (South). */
  region: 'bac' | 'trung' | 'nam';
  /** The voice's native reading style (used as the default `style`). */
  style: VieNeuStyle;
}

/**
 * The 14 built-in VieNeu Vietnamese voices (from `vieneu.list_preset_voices()`,
 * pinned here so the studio/CLI can offer them without loading the model).
 */
export const VIENEU_VIETNAMESE_VOICES: readonly VieNeuVoice[] = [
  { id: 'Minh Đức', gender: 'male', region: 'bac', style: 'tin_tuc' },
  { id: 'Phạm Tuyên', gender: 'male', region: 'bac', style: 'tu_nhien' },
  { id: 'Thanh Bình', gender: 'male', region: 'bac', style: 'doc_truyen' },
  { id: 'Trúc Ly', gender: 'female', region: 'bac', style: 'tu_nhien' },
  { id: 'Ngọc Linh', gender: 'female', region: 'bac', style: 'doc_truyen' },
  { id: 'Đoan Trang', gender: 'female', region: 'bac', style: 'tu_nhien' },
  { id: 'Mai Anh', gender: 'female', region: 'bac', style: 'tin_tuc' },
  { id: 'Quang Sơn', gender: 'male', region: 'trung', style: 'tu_nhien' },
  { id: 'Ngọc Trân', gender: 'female', region: 'trung', style: 'tu_nhien' },
  { id: 'Xuân Vĩnh', gender: 'male', region: 'nam', style: 'tu_nhien' },
  { id: 'Thái Sơn', gender: 'male', region: 'nam', style: 'doc_truyen' },
  { id: 'Minh Triết', gender: 'male', region: 'nam', style: 'tin_tuc' },
  { id: 'Thục Đoan', gender: 'female', region: 'nam', style: 'doc_truyen' },
  { id: 'Thùy Dung', gender: 'female', region: 'nam', style: 'tin_tuc' },
] as const;

/** Default VieNeu voice when the caller doesn't pick one (Northern female, natural). */
export const VIENEU_DEFAULT_VOICE = 'Trúc Ly';

/** Look up a preset by id (exact match). */
export function findVieNeuVoice(id: string): VieNeuVoice | undefined {
  return VIENEU_VIETNAMESE_VOICES.find((v) => v.id === id);
}

/** Hard ceiling for a single synthesis once the worker is warm. */
const VIENEU_INFER_TIMEOUT_MS = 120_000;
/** First-request budget: covers a cold model download from Hugging Face. */
const VIENEU_START_TIMEOUT_MS = 300_000;
/** Kill an idle warm worker after this long to free memory. */
const VIENEU_IDLE_MS = 10 * 60_000;

/** A resolved VieNeu invocation: the python interpreter plus how it was found. */
export interface VieNeuCommand {
  python: string;
  source: 'env' | 'project-venv' | 'python-module';
}

/** Conventional path to the CLI-managed venv's python under a project root. */
export function vieneuVenvPython(projectRoot: string): string {
  return join(projectRoot, '.html-video', 'vieneu-venv', 'bin', 'python');
}

/**
 * Resolve a runnable python with `vieneu` available, or null if not installed.
 * `projectRoot` lets us prefer the gitignored venv the CLI manages.
 */
export function resolveVieNeuCommand(opts?: {
  env?: NodeJS.ProcessEnv;
  projectRoot?: string;
}): VieNeuCommand | null {
  const env = opts?.env ?? process.env;

  const explicit = (env.VIENEU_BIN || '').trim();
  if (explicit) return { python: explicit, source: 'env' };

  if (opts?.projectRoot) {
    const p = vieneuVenvPython(opts.projectRoot);
    if (existsSync(p)) return { python: p, source: 'project-venv' };
  }

  try {
    execFileSync('python3', ['-c', 'import vieneu'], { stdio: ['ignore', 'ignore', 'ignore'] });
    return { python: 'python3', source: 'python-module' };
  } catch {
    return null;
  }
}

// ── Persistent worker ────────────────────────────────────────────────────────

/** The Python worker: loads the model once, answers JSON-lines infer requests.
 *  Kept as a string literal so core needs no build step to copy a `.py` file. */
const WORKER_SOURCE = `import sys, os, json, traceback
# Route ALL library output (HF download bars, warnings, prints) to stderr so our
# stdout carries ONLY the JSON-lines protocol.
_out = sys.stdout
sys.stdout = sys.stderr

def emit(obj):
    _out.write(json.dumps(obj, ensure_ascii=False) + "\\n")
    _out.flush()

try:
    from vieneu import Vieneu
    precision = os.environ.get("VIENEU_PRECISION", "").strip()
    tts = Vieneu(precision=precision) if precision else Vieneu()
    emit({"ready": True})
except Exception as e:
    emit({"ready": False, "error": str(e), "trace": traceback.format_exc()[-1000:]})
    sys.exit(1)

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    rid = None
    try:
        req = json.loads(line)
        rid = req.get("id")
        audio = tts.infer(
            req["text"],
            voice=req.get("voice") or "Trúc Ly",
            style=req.get("style") or "tu_nhien",
        )
        tts.save(audio, req["out"])
        dur = None
        try:
            dur = float(len(audio)) / 48000.0
        except Exception:
            pass
        emit({"id": rid, "ok": True, "duration": dur})
    except Exception as e:
        emit({"id": rid, "ok": False, "error": str(e), "trace": traceback.format_exc()[-1000:]})
`;

interface Pending {
  resolve: (v: { duration: number | null }) => void;
  reject: (e: Error) => void;
  timer: NodeJS.Timeout;
}

interface InferRequest {
  text: string;
  voice: string;
  style: VieNeuStyle;
  out: string;
}

/**
 * A warm VieNeu process. Spawned lazily; parses stdout JSON-lines with a
 * {@link StringDecoder} (multibyte-safe — Vietnamese diacritics can split
 * across stdout chunks) and matches responses to requests by id.
 */
class VieNeuWorker {
  private child: ChildProcess | null = null;
  private ready: Promise<void> | null = null;
  private readonly decoder = new StringDecoder('utf8');
  private buf = '';
  private stderr = '';
  private readonly pending = new Map<string, Pending>();
  private seq = 0;
  private idleTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly python: string,
    private readonly scriptPath: string,
  ) {}

  private async ensureStarted(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = new Promise<void>((resolvePromise, reject) => {
      void (async () => {
        try {
          await mkdir(dirname(this.scriptPath), { recursive: true });
          await writeFile(this.scriptPath, WORKER_SOURCE, 'utf8');
        } catch (err) {
          reject(new HtmlVideoError('render-failed', `vieneu: cannot write worker script: ${(err as Error).message}`));
          return;
        }

        const child = spawn(this.python, [this.scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
        this.child = child;
        let started = false;

        const startTimer = setTimeout(() => {
          if (!started) {
            child.kill('SIGKILL');
            reject(new HtmlVideoError('render-failed', `vieneu: model failed to load within ${VIENEU_START_TIMEOUT_MS}ms`));
          }
        }, VIENEU_START_TIMEOUT_MS);

        child.stderr?.on('data', (d) => {
          this.stderr += d.toString();
          if (this.stderr.length > 8000) this.stderr = this.stderr.slice(-8000);
        });

        child.stdout?.on('data', (chunk: Buffer) => {
          this.buf += this.decoder.write(chunk);
          let nl: number;
          while ((nl = this.buf.indexOf('\n')) >= 0) {
            const line = this.buf.slice(0, nl).trim();
            this.buf = this.buf.slice(nl + 1);
            if (!line) continue;
            let msg: { ready?: boolean; id?: string; ok?: boolean; duration?: number | null; error?: string };
            try {
              msg = JSON.parse(line);
            } catch {
              continue; // ignore any non-JSON stray line
            }
            if (msg.ready !== undefined) {
              if (msg.ready) {
                started = true;
                clearTimeout(startTimer);
                resolvePromise();
              } else {
                clearTimeout(startTimer);
                reject(new HtmlVideoError('render-failed', `vieneu: model load failed: ${msg.error ?? 'unknown'}`));
              }
              continue;
            }
            if (msg.id !== undefined) this.settle(msg);
          }
        });

        child.on('error', (err) => {
          clearTimeout(startTimer);
          const e = new HtmlVideoError('render-failed', `vieneu: failed to launch python: ${err.message}`);
          if (!started) reject(e);
          this.failAll(e);
        });
        child.on('close', (code) => {
          clearTimeout(startTimer);
          const e = new HtmlVideoError('render-failed', `vieneu: worker exited (code ${code})${this.stderr ? `: ${this.stderr.slice(-500)}` : ''}`);
          if (!started) reject(e);
          this.failAll(e);
          this.reset();
        });
      })();
    });
    return this.ready;
  }

  private settle(msg: { id?: string; ok?: boolean; duration?: number | null; error?: string }): void {
    const id = msg.id!;
    const p = this.pending.get(id);
    if (!p) return;
    clearTimeout(p.timer);
    this.pending.delete(id);
    if (msg.ok) p.resolve({ duration: msg.duration ?? null });
    else p.reject(new HtmlVideoError('render-failed', `vieneu: ${msg.error ?? 'synthesis failed'}`));
  }

  private failAll(err: Error): void {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(err);
    }
    this.pending.clear();
  }

  private reset(): void {
    this.child = null;
    this.ready = null;
    this.buf = '';
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private touchIdle(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.stop(), VIENEU_IDLE_MS);
    this.idleTimer.unref?.();
  }

  /** Stop the worker (idempotent). */
  stop(): void {
    if (this.child) this.child.kill('SIGTERM');
    this.reset();
  }

  async infer(req: InferRequest, opts?: { signal?: AbortSignal; timeoutMs?: number }): Promise<{ duration: number | null }> {
    await this.ensureStarted();
    const child = this.child;
    if (!child?.stdin) throw new HtmlVideoError('render-failed', 'vieneu: worker not running');

    const id = String(++this.seq);
    const timeoutMs = opts?.timeoutMs ?? VIENEU_INFER_TIMEOUT_MS;
    const result = new Promise<{ duration: number | null }>((resolvePromise, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new HtmlVideoError('render-failed', `vieneu: synthesis timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const onAbort = () => {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(new HtmlVideoError('render-failed', 'vieneu: aborted'));
      };
      if (opts?.signal) {
        if (opts.signal.aborted) return onAbort();
        opts.signal.addEventListener('abort', onAbort, { once: true });
      }

      this.pending.set(id, {
        resolve: (v) => {
          if (opts?.signal) opts.signal.removeEventListener('abort', onAbort);
          resolvePromise(v);
        },
        reject: (e) => {
          if (opts?.signal) opts.signal.removeEventListener('abort', onAbort);
          reject(e);
        },
        timer,
      });
    });

    child.stdin.write(`${JSON.stringify({ id, text: req.text, voice: req.voice, style: req.style, out: req.out })}\n`);
    try {
      return await result;
    } finally {
      this.touchIdle();
    }
  }
}

/** Warm workers keyed by python interpreter + script path. */
const WORKERS = new Map<string, VieNeuWorker>();
let exitHookInstalled = false;

function getWorker(python: string, projectRoot?: string): VieNeuWorker {
  // Safety net: kill any warm worker when the process exits, so a one-shot CLI
  // run (or a crash) never orphans the python child. Long-lived callers (the
  // studio server) still stop workers explicitly on shutdown.
  if (!exitHookInstalled) {
    exitHookInstalled = true;
    process.once('exit', () => stopAllVieNeuWorkers());
  }

  const scriptPath = projectRoot
    ? join(projectRoot, '.html-video', 'vieneu-worker.py')
    : join(tmpdir(), 'hv-vieneu-worker.py');
  const key = `${python} ${scriptPath}`;
  let w = WORKERS.get(key);
  if (!w) {
    w = new VieNeuWorker(python, scriptPath);
    WORKERS.set(key, w);
  }
  return w;
}

/** Stop all warm VieNeu workers (call on server shutdown). */
export function stopAllVieNeuWorkers(): void {
  for (const [, w] of WORKERS) w.stop();
  WORKERS.clear();
}

// ── ffmpeg + captions helpers ────────────────────────────────────────────────

/** Transcode WAV → MP3, optionally time-stretching to `speed` (1.0 = normal). */
async function transcodeToMp3(wav: string, mp3: string, speed?: number): Promise<void> {
  const args = ['-y', '-i', wav];
  if (speed !== undefined && Number.isFinite(speed) && Math.abs(speed - 1) > 0.001) {
    const s = Math.min(2, Math.max(0.5, speed)); // atempo supports 0.5–2.0
    args.push('-filter:a', `atempo=${s}`);
  }
  args.push('-codec:a', 'libmp3lame', '-qscale:a', '2', mp3);

  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(ffmpegBin(), args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr?.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => reject(new HtmlVideoError('render-failed', `vieneu: ffmpeg failed to launch: ${err.message}`)));
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new HtmlVideoError('render-failed', `vieneu: ffmpeg exited ${code}: ${stderr.slice(-400)}`));
    });
  });
}

/**
 * Synthesize sentence-level caption cues by distributing `durationSec` across
 * the text's sentences in proportion to their length. VieNeu produces no
 * subtitle timing (unlike Edge-TTS's SRT), so this is our best-effort stand-in;
 * the downstream burner splits each cue window into words.
 */
export function synthesizeCaptionCues(text: string, durationSec: number): CaptionCue[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean || !(durationSec > 0)) return [];
  const parts = clean.match(/[^.!?…\n]+[.!?…]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean];
  const total = parts.reduce((n, s) => n + s.length, 0) || 1;
  const cues: CaptionCue[] = [];
  let t = 0;
  for (let i = 0; i < parts.length; i++) {
    const sentence = parts[i]!;
    const share = (sentence.length / total) * durationSec;
    const start = t;
    const end = i === parts.length - 1 ? durationSec : t + share;
    cues.push({ text: sentence, start: Math.round(start * 100) / 100, end: Math.max(end, start + 0.2) });
    t = end;
  }
  return cues;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Synthesize narration with VieNeu-TTS and return MP3 bytes.
 *
 * `voiceId` is a built-in preset id (see {@link VIENEU_VIETNAMESE_VOICES});
 * `style` overrides the voice's native reading style. `speed` (1.0 = normal) is
 * applied as an ffmpeg `atempo` time-stretch (VieNeu has no native rate).
 */
export async function generateTtsVieNeu(opts: {
  text: string;
  voiceId?: string;
  style?: VieNeuStyle;
  /** Numeric speed (1.0 = normal); applied via ffmpeg atempo. */
  speed?: number;
  projectRoot?: string;
  env?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
}): Promise<TtsAudioResult> {
  const text = (opts.text || '').trim();
  if (!text) throw new HtmlVideoError('invalid-input', 'narration text is empty');

  const resolved = resolveVieNeuCommand({
    ...(opts.env !== undefined && { env: opts.env }),
    ...(opts.projectRoot !== undefined && { projectRoot: opts.projectRoot }),
  });
  if (!resolved) {
    throw new HtmlVideoError(
      'render-failed',
      'VieNeu-TTS not found. Install it (free, no key): `html-video tts install-vieneu`, ' +
        'or `pip install vieneu`, or set VIENEU_BIN to a python that has it.',
    );
  }

  const voiceId = (opts.voiceId || '').trim() || VIENEU_DEFAULT_VOICE;
  const preset = findVieNeuVoice(voiceId);
  const style = opts.style || preset?.style || 'tu_nhien';

  const worker = getWorker(resolved.python, opts.projectRoot);
  const work = await mkdtemp(join(tmpdir(), 'hv-vieneu-'));
  const wavFile = join(work, 'narration.wav');
  const mp3File = join(work, 'narration.mp3');
  try {
    await worker.infer(
      { text, voice: voiceId, style, out: wavFile },
      { ...(opts.signal !== undefined && { signal: opts.signal }) },
    );
    if (!existsSync(wavFile)) throw new HtmlVideoError('render-failed', 'vieneu: produced no audio file');

    await transcodeToMp3(wavFile, mp3File, opts.speed);
    const bytes = await readFile(mp3File);
    if (bytes.length === 0) throw new HtmlVideoError('render-failed', 'vieneu: produced an empty audio file');

    const durationSec = probeDurationSec(mp3File);
    const boundaries = durationSec !== undefined ? synthesizeCaptionCues(text, durationSec) : undefined;
    return {
      bytes,
      ext: '.mp3',
      providerNote: `vieneu · ${voiceId} · ${style} · ${durationSec ?? '?'}s · ${bytes.length} bytes`,
      ...(durationSec !== undefined && { durationSec }),
      ...(boundaries !== undefined && boundaries.length > 0 && { boundaries }),
    };
  } finally {
    await rm(work, { recursive: true, force: true }).catch(() => {});
  }
}
