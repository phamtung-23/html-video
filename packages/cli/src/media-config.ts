/**
 * Studio media-provider config — persists API credentials entered through the
 * Settings UI to `.html-video/media-config.json` under the project root, so
 * users don't have to set environment variables by hand.
 *
 * Credential precedence when resolving (config file wins over env, since the
 * GUI is the explicit user choice):
 *   media-config.json  →  OD_MINIMAX_API_KEY / MINIMAX_API_KEY env
 *
 * Mirrors open-design's `.od/media-config.json` shape loosely; we only need
 * MiniMax here. The file holds the raw key, so it lives in the gitignored
 * `.html-video/` runtime dir, never the repo.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveMinimaxCredentials,
  resolveEdgeTtsCommand,
  EDGE_TTS_DEFAULT_VOICE,
  type MinimaxCredentials,
} from '@html-video/core';

/** Which engine synthesizes narration. `edge` is free (no key); `minimax` is
 *  paid; `auto` prefers MiniMax when a key is configured, else falls back to the
 *  free Edge-TTS so narration works out of the box. */
export type TtsProvider = 'auto' | 'edge' | 'minimax';

interface MediaConfig {
  minimax?: { apiKey?: string; baseUrl?: string };
  tts?: { provider?: TtsProvider; edgeVoice?: string };
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

  /** What the Settings UI shows: whether a key is set + masked key + base URL.
   *  Never returns the raw key. Reports the source (config file vs env). */
  getMinimaxStatus(): { configured: boolean; source: 'config' | 'env' | 'none'; maskedKey: string; baseUrl: string } {
    const cfg = this.read().minimax;
    if (cfg?.apiKey) {
      return { configured: true, source: 'config', maskedKey: mask(cfg.apiKey), baseUrl: cfg.baseUrl ?? '' };
    }
    const env = resolveMinimaxCredentials();
    if (env) {
      return { configured: true, source: 'env', maskedKey: mask(env.apiKey), baseUrl: env.baseUrl };
    }
    return { configured: false, source: 'none', maskedKey: '', baseUrl: '' };
  }

  /** Persist a key (and optional base URL) entered in the UI. */
  setMinimax(apiKey: string, baseUrl?: string): void {
    const cfg = this.read();
    cfg.minimax = { apiKey: apiKey.trim() };
    const b = (baseUrl ?? '').trim();
    if (b) cfg.minimax.baseUrl = b;
    this.write(cfg);
  }

  /** Forget the stored MiniMax key (env fallback, if any, still applies). */
  clearMinimax(): void {
    const cfg = this.read();
    delete cfg.minimax;
    this.write(cfg);
  }

  /** Resolve usable credentials: config file first, then env. null if neither. */
  resolveMinimax(): MinimaxCredentials | null {
    const cfg = this.read().minimax;
    if (cfg?.apiKey) {
      // Default to the international endpoint when none is set. The old
      // api.minimaxi.chat host is RETIRED server-side (issue #4); MiniMax now
      // splits into api.minimax.io (international) and api.minimaxi.com (China),
      // and keys are region-bound — so the Settings UI asks the user to pick.
      const baseUrl = (cfg.baseUrl || '').trim().replace(/\/$/, '') || 'https://api.minimax.io/v1';
      return { apiKey: cfg.apiKey, baseUrl };
    }
    return resolveMinimaxCredentials();
  }

  // ===== TTS provider (narration engine) =====

  /** Configured provider preference. config file → HV_TTS_PROVIDER env → 'auto'. */
  getTtsProvider(): TtsProvider {
    const fromCfg = this.read().tts?.provider;
    if (fromCfg) return fromCfg;
    const env = (process.env.HV_TTS_PROVIDER || '').trim().toLowerCase();
    if (env === 'edge' || env === 'minimax' || env === 'auto') return env;
    return 'auto';
  }

  /** Voice for Edge-TTS. config file → HV_EDGE_TTS_VOICE env → built-in default. */
  getEdgeVoice(): string {
    return (
      this.read().tts?.edgeVoice ||
      (process.env.HV_EDGE_TTS_VOICE || '').trim() ||
      EDGE_TTS_DEFAULT_VOICE
    );
  }

  /** Is the free Edge-TTS engine usable on this machine? */
  edgeAvailable(): boolean {
    return resolveEdgeTtsCommand({ projectRoot: this.projectRoot }) !== null;
  }

  /**
   * Resolve which engine narration will actually use, honoring the `auto` rule:
   * prefer MiniMax when a key is set, otherwise fall back to free Edge-TTS.
   * Returns the concrete engine or null when the chosen engine isn't usable.
   */
  resolveNarrationProvider(): 'edge' | 'minimax' | null {
    const pref = this.getTtsProvider();
    const hasMinimax = this.resolveMinimax() !== null;
    const hasEdge = this.edgeAvailable();
    if (pref === 'minimax') return hasMinimax ? 'minimax' : null;
    if (pref === 'edge') return hasEdge ? 'edge' : null;
    // auto
    if (hasMinimax) return 'minimax';
    if (hasEdge) return 'edge';
    return null;
  }

  /** Persist the narration provider preference (and optional Edge voice). */
  setTts(provider: TtsProvider, edgeVoice?: string): void {
    const cfg = this.read();
    cfg.tts = { ...(cfg.tts ?? {}), provider };
    const v = (edgeVoice ?? '').trim();
    if (v) cfg.tts.edgeVoice = v;
    this.write(cfg);
  }

  /** Status payload for the Settings UI / doctor. */
  getTtsStatus(): {
    provider: TtsProvider;
    effective: 'edge' | 'minimax' | null;
    edgeAvailable: boolean;
    edgeVoice: string;
    minimaxConfigured: boolean;
  } {
    return {
      provider: this.getTtsProvider(),
      effective: this.resolveNarrationProvider(),
      edgeAvailable: this.edgeAvailable(),
      edgeVoice: this.getEdgeVoice(),
      minimaxConfigured: this.resolveMinimax() !== null,
    };
  }
}

function mask(key: string): string {
  if (key.length <= 8) return '••••';
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}
