/**
 * Studio media config — persists narration (Edge-TTS) preferences to
 * `.html-video/media-config.json` under the project root.
 *
 * Narration uses the free, key-less Edge-TTS engine, so there are no API
 * credentials to manage here — only the chosen voice. The file lives in the
 * gitignored `.html-video/` runtime dir.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { resolveEdgeTtsCommand, EDGE_TTS_DEFAULT_VOICE } from '@html-video/core';

interface MediaConfig {
  tts?: { edgeVoice?: string };
}

export class MediaConfigStore {
  private readonly path: string;
  private readonly dir: string;
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.dir = join(projectRoot, '.html-video');
    this.path = join(this.dir, 'media-config.json');
  }

  private read(): MediaConfig {
    if (!existsSync(this.path)) return {};
    try {
      return JSON.parse(readFileSync(this.path, 'utf8')) as MediaConfig;
    } catch {
      return {};
    }
  }

  private write(cfg: MediaConfig): void {
    if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true });
    writeFileSync(this.path, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  }

  /** Voice for Edge-TTS. config file → HV_EDGE_TTS_VOICE env → built-in default. */
  getEdgeVoice(): string {
    return (
      this.read().tts?.edgeVoice ||
      (process.env.HV_EDGE_TTS_VOICE || '').trim() ||
      EDGE_TTS_DEFAULT_VOICE
    );
  }

  /** Persist the chosen Edge-TTS voice. */
  setEdgeVoice(voice: string): void {
    const v = (voice ?? '').trim();
    if (!v) return;
    const cfg = this.read();
    cfg.tts = { ...(cfg.tts ?? {}), edgeVoice: v };
    this.write(cfg);
  }

  /** Is the free Edge-TTS engine usable on this machine? */
  edgeAvailable(): boolean {
    return resolveEdgeTtsCommand({ projectRoot: this.projectRoot }) !== null;
  }

  /** The narration engine — always Edge-TTS when available, else null. */
  resolveNarrationProvider(): 'edge' | null {
    return this.edgeAvailable() ? 'edge' : null;
  }

  /** Status payload for the Settings UI / doctor. */
  getTtsStatus(): { edgeAvailable: boolean; edgeVoice: string } {
    return { edgeAvailable: this.edgeAvailable(), edgeVoice: this.getEdgeVoice() };
  }
}
