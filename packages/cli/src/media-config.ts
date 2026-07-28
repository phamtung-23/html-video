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
import {
  resolveEdgeTtsCommand,
  EDGE_TTS_DEFAULT_VOICE,
  resolveVieNeuCommand,
  VIENEU_DEFAULT_VOICE,
} from '@html-video/core';

interface YouTubeAccount {
  id: string;
  label: string;
  refreshToken: string;
}

interface MediaConfig {
  tts?: { edgeVoice?: string; vieneuVoice?: string };
  youtube?: {
    clientId?: string;
    clientSecret?: string;
    /** Legacy single-account token — migrated into `accounts` on read. */
    refreshToken?: string;
    /** Multiple connected channels; upload picks one by id. */
    accounts?: YouTubeAccount[];
  };
  facebook?: {
    appId?: string;
    appSecret?: string;
    userToken?: string;
    pageId?: string;
    pageName?: string;
    pageToken?: string;
  };
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

  /** Voice for VieNeu-TTS. config file → HV_VIENEU_VOICE env → built-in default. */
  getVieneuVoice(): string {
    return (
      this.read().tts?.vieneuVoice ||
      (process.env.HV_VIENEU_VOICE || '').trim() ||
      VIENEU_DEFAULT_VOICE
    );
  }

  /** Persist the chosen VieNeu voice (preset id). */
  setVieneuVoice(voice: string): void {
    const v = (voice ?? '').trim();
    if (!v) return;
    const cfg = this.read();
    cfg.tts = { ...(cfg.tts ?? {}), vieneuVoice: v };
    this.write(cfg);
  }

  /** Is the free Edge-TTS engine usable on this machine? */
  edgeAvailable(): boolean {
    return resolveEdgeTtsCommand({ projectRoot: this.projectRoot }) !== null;
  }

  /** Is the free, offline VieNeu-TTS engine usable on this machine? */
  vieneuAvailable(): boolean {
    return resolveVieNeuCommand({ projectRoot: this.projectRoot }) !== null;
  }

  /** The default narration engine — Edge-TTS when available, else VieNeu, else null.
   *  (Per-request routing is by voice id; this is only the fallback default.) */
  resolveNarrationProvider(): 'edge' | 'vieneu' | null {
    if (this.edgeAvailable()) return 'edge';
    if (this.vieneuAvailable()) return 'vieneu';
    return null;
  }

  /** Status payload for the Settings UI / doctor. */
  getTtsStatus(): {
    edgeAvailable: boolean;
    edgeVoice: string;
    vieneuAvailable: boolean;
    vieneuVoice: string;
  } {
    return {
      edgeAvailable: this.edgeAvailable(),
      edgeVoice: this.getEdgeVoice(),
      vieneuAvailable: this.vieneuAvailable(),
      vieneuVoice: this.getVieneuVoice(),
    };
  }

  // ── YouTube (personal channels) OAuth — supports multiple accounts ─────────
  /** Stored YouTube config with a legacy single `refreshToken` migrated into
   *  the `accounts` array (non-persisted migration; add/remove persist it). */
  getYouTube(): { clientId?: string; clientSecret?: string; accounts: YouTubeAccount[] } {
    const y = this.read().youtube ?? {};
    let accounts = y.accounts ?? [];
    if ((!accounts || accounts.length === 0) && y.refreshToken) {
      accounts = [{ id: 'default', label: 'Kênh của bạn', refreshToken: y.refreshToken }];
    }
    return { clientId: y.clientId, clientSecret: y.clientSecret, accounts };
  }

  /** Save the user's OAuth client id + secret (from their Google Cloud project). */
  setYouTubeCreds(clientId: string, clientSecret: string): void {
    const y = this.getYouTube();
    const cfg = this.read();
    cfg.youtube = {
      clientId: (clientId ?? '').trim(),
      clientSecret: (clientSecret ?? '').trim(),
      accounts: y.accounts,
    };
    this.write(cfg);
  }

  /** Add (or update, by channel id) a connected YouTube account. */
  addYouTubeAccount(acc: YouTubeAccount): void {
    const y = this.getYouTube();
    const accounts = y.accounts.filter((a) => a.id !== acc.id);
    accounts.push({ id: acc.id, label: acc.label, refreshToken: acc.refreshToken });
    const cfg = this.read();
    cfg.youtube = { clientId: y.clientId, clientSecret: y.clientSecret, accounts };
    this.write(cfg);
  }

  /** Look up one account's full record (incl. refresh token) by id. */
  getYouTubeAccount(id?: string): YouTubeAccount | undefined {
    const accounts = this.getYouTube().accounts;
    if (!id) return accounts[0];
    return accounts.find((a) => a.id === id);
  }

  /** Remove one account by id (keeps creds + other accounts). */
  removeYouTubeAccount(id: string): void {
    const y = this.getYouTube();
    const cfg = this.read();
    cfg.youtube = {
      clientId: y.clientId,
      clientSecret: y.clientSecret,
      accounts: y.accounts.filter((a) => a.id !== id),
    };
    this.write(cfg);
  }

  /** Forget all connections (keeps creds) or everything. */
  clearYouTube(opts?: { keepCreds?: boolean }): void {
    const cfg = this.read();
    if (opts?.keepCreds && cfg.youtube) {
      cfg.youtube = { clientId: cfg.youtube.clientId, clientSecret: cfg.youtube.clientSecret, accounts: [] };
    } else {
      delete cfg.youtube;
    }
    this.write(cfg);
  }

  /** Status for the Settings UI: creds set + the list of connected channels. */
  getYouTubeStatus(): { hasCreds: boolean; connected: boolean; accounts: Array<{ id: string; label: string }> } {
    const y = this.getYouTube();
    const accounts = y.accounts.map((a) => ({ id: a.id, label: a.label }));
    return { hasCreds: !!(y.clientId && y.clientSecret), connected: accounts.length > 0, accounts };
  }

  // ── Facebook Reels (Page) OAuth ───────────────────────────────────────────
  /** Raw stored Facebook config (app id/secret + user token + selected Page). */
  getFacebook(): {
    appId?: string;
    appSecret?: string;
    userToken?: string;
    pageId?: string;
    pageName?: string;
    pageToken?: string;
  } {
    return this.read().facebook ?? {};
  }

  /** Save the user's Facebook App id + secret (from their Meta app). */
  setFacebookCreds(appId: string, appSecret: string): void {
    const cfg = this.read();
    cfg.facebook = {
      ...(cfg.facebook ?? {}),
      appId: (appId ?? '').trim(),
      appSecret: (appSecret ?? '').trim(),
    };
    this.write(cfg);
  }

  /** Save the long-lived user token from the consent flow (Page not yet chosen). */
  setFacebookUserToken(userToken: string): void {
    const cfg = this.read();
    cfg.facebook = { ...(cfg.facebook ?? {}), userToken: (userToken ?? '').trim() };
    this.write(cfg);
  }

  /** Persist the chosen Page (id + name + its own long-lived Page token). */
  setFacebookPage(pageId: string, pageName: string, pageToken: string): void {
    const cfg = this.read();
    cfg.facebook = {
      ...(cfg.facebook ?? {}),
      pageId: (pageId ?? '').trim(),
      pageName: (pageName ?? '').trim(),
      pageToken: (pageToken ?? '').trim(),
    };
    this.write(cfg);
  }

  /** Forget the connection (keeps app creds; drops tokens + Page) or everything. */
  clearFacebook(opts?: { keepCreds?: boolean }): void {
    const cfg = this.read();
    if (opts?.keepCreds && cfg.facebook) {
      delete cfg.facebook.userToken;
      delete cfg.facebook.pageId;
      delete cfg.facebook.pageName;
      delete cfg.facebook.pageToken;
    } else {
      delete cfg.facebook;
    }
    this.write(cfg);
  }

  /** Status for the Settings UI: creds set? logged in? Page chosen? */
  getFacebookStatus(): { hasCreds: boolean; connected: boolean; pageSelected: boolean; pageName: string } {
    const f = this.getFacebook();
    return {
      hasCreds: !!(f.appId && f.appSecret),
      connected: !!f.userToken,
      pageSelected: !!f.pageToken,
      pageName: f.pageName ?? '',
    };
  }
}
