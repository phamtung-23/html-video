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
  youtube?: { clientId?: string; clientSecret?: string; refreshToken?: string };
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

  // ── YouTube (personal channel) OAuth ──────────────────────────────────────
  /** Raw stored YouTube config (client id/secret + refresh token). */
  getYouTube(): { clientId?: string; clientSecret?: string; refreshToken?: string } {
    return this.read().youtube ?? {};
  }

  /** Save the user's OAuth client id + secret (from their Google Cloud project). */
  setYouTubeCreds(clientId: string, clientSecret: string): void {
    const cfg = this.read();
    cfg.youtube = {
      ...(cfg.youtube ?? {}),
      clientId: (clientId ?? '').trim(),
      clientSecret: (clientSecret ?? '').trim(),
    };
    this.write(cfg);
  }

  /** Save the long-lived refresh token obtained after the consent flow. */
  setYouTubeToken(refreshToken: string): void {
    const cfg = this.read();
    cfg.youtube = { ...(cfg.youtube ?? {}), refreshToken: (refreshToken ?? '').trim() };
    this.write(cfg);
  }

  /** Forget the connection (keeps creds; drops the token) or everything. */
  clearYouTube(opts?: { keepCreds?: boolean }): void {
    const cfg = this.read();
    if (opts?.keepCreds && cfg.youtube) {
      delete cfg.youtube.refreshToken;
    } else {
      delete cfg.youtube;
    }
    this.write(cfg);
  }

  /** Status for the Settings UI: are creds set, and are we connected? */
  getYouTubeStatus(): { hasCreds: boolean; connected: boolean } {
    const y = this.getYouTube();
    return { hasCreds: !!(y.clientId && y.clientSecret), connected: !!y.refreshToken };
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
