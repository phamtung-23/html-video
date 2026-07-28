/**
 * TTS management commands.
 *
 * `html-video tts install-vieneu` provisions the free, offline VieNeu-TTS
 * engine (14 Vietnamese voices) into a gitignored venv under the project root
 * (`.html-video/vieneu-venv/`), mirroring how Edge-TTS is managed. VieNeu is a
 * pure-ONNX/CPU stack (no PyTorch, no GPU), so this works on macOS.
 */

import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CliContext } from '../context.js';
import { fail, ok, progress } from '../output.js';
import { vieneuVenvPython } from '@html-video/core';

/** Run a child process, streaming its output to stderr (keeps stdout clean for
 *  JSON). Resolves on exit 0, rejects otherwise. */
function run(cmd: string, args: string[], label: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    process.stderr.write(`\n$ ${cmd} ${args.join(' ')}\n`);
    const child = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', (err) => reject(new Error(`${label}: failed to launch (${err.message})`)));
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${label}: exited with code ${code}`));
    });
  });
}

/** Find a python3 with version >= 3.10 (VieNeu's floor). Returns the path. */
function findPython(): string {
  for (const candidate of ['python3', 'python3.12', 'python3.11', 'python3.10']) {
    try {
      const ver = execFileSync(candidate, ['-c', 'import sys;print("%d.%d"%sys.version_info[:2])'], {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      const [maj, min] = ver.split('.').map(Number);
      if (maj === 3 && (min ?? 0) >= 10) return candidate;
    } catch {
      /* try next */
    }
  }
  fail(
    'render-failed',
    'No suitable Python found (need >= 3.10). Install Python 3, e.g. `brew install python@3.12`.',
  );
}

/** Provision VieNeu-TTS into the project's managed venv. */
export async function installVieNeu(ctx: CliContext, opts?: { warmup?: boolean }): Promise<void> {
  const venvPython = vieneuVenvPython(ctx.projectRoot);

  // Idempotent: if vieneu already imports from the venv, we're done.
  if (existsSync(venvPython)) {
    try {
      execFileSync(venvPython, ['-c', 'import vieneu'], { stdio: ['ignore', 'ignore', 'ignore'] });
      if (!opts?.warmup) {
        ok({ installed: true, python: venvPython, note: 'VieNeu-TTS already installed.' });
        return;
      }
    } catch {
      /* venv exists but vieneu missing — (re)install below */
    }
  }

  const base = findPython();
  progress('create-venv', 10, { detail: 'creating .html-video/vieneu-venv' });
  await mkdir(dirname(dirname(venvPython)), { recursive: true }); // ensure .html-video/
  if (!existsSync(venvPython)) {
    // venv dir = parent of bin/python
    await run(base, ['-m', 'venv', dirname(dirname(venvPython))], 'create-venv');
  }

  progress('pip-upgrade', 30, { detail: 'upgrading pip' });
  await run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip', '-q'], 'pip-upgrade');

  progress('install', 50, { detail: 'pip install vieneu (this downloads onnxruntime; ~1–2 min)' });
  await run(venvPython, ['-m', 'pip', 'install', 'vieneu'], 'install');

  if (opts?.warmup) {
    progress('warmup', 85, { detail: 'downloading the VieNeu model (first run only)' });
    await run(
      venvPython,
      ['-c', 'from vieneu import Vieneu; Vieneu(); print("model ready")'],
      'warmup',
    );
  }

  ok({
    installed: true,
    python: venvPython,
    warmup: !!opts?.warmup,
    note: 'VieNeu-TTS installed. Pick a "vieneu:" voice in the studio narration panel, or run `html-video doctor`.',
  });
}
