/**
 * Facebook Reels publishing (to a Page) via the Graph API + Facebook Login.
 *
 * Uses only global `fetch` — no SDK. Mirrors the YouTube flow: the user pastes
 * their own Facebook App id/secret (from a Meta app with Facebook Login +
 * appropriate Page permissions), connects once (loopback redirect), picks which
 * Page to publish to, and we keep the long-lived Page access token in the local
 * media-config.
 *
 * Reels can only be published to a Page (personal-profile publishing was
 * removed from the API). In an app that is still in Development mode, an app
 * admin/tester can publish to their own Pages without full App Review — the
 * same "personal / testing" posture as the YouTube integration.
 *
 * Publish flow is 3-phase: start (init an upload session) → upload the bytes to
 * rupload.facebook.com → finish (publish / draft / schedule).
 */

const GRAPH = 'https://graph.facebook.com/v21.0';
const OAUTH_DIALOG = 'https://www.facebook.com/v21.0/dialog/oauth';
const RUPLOAD = 'https://rupload.facebook.com/video-upload/v21.0';
// pages_manage_posts is what actually authorizes Reel publishing; the other two
// let us list the user's Pages and read their metadata to fetch a Page token.
export const FB_SCOPES = 'pages_show_list,pages_read_engagement,pages_manage_posts';

/** Build the consent URL the user opens to authorize the studio. */
export function buildAuthUrl(appId: string, redirectUri: string): string {
  const p = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: FB_SCOPES,
  });
  return `${OAUTH_DIALOG}?${p.toString()}`;
}

/**
 * Exchange the auth code for a **long-lived user** access token. FB returns a
 * short-lived token first; we immediately swap it for a long-lived one (~60d),
 * from which Page tokens derived via /me/accounts are effectively non-expiring.
 */
export async function exchangeCode(args: {
  appId: string;
  appSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{ userToken: string }> {
  const shortU = new URL(`${GRAPH}/oauth/access_token`);
  shortU.searchParams.set('client_id', args.appId);
  shortU.searchParams.set('client_secret', args.appSecret);
  shortU.searchParams.set('redirect_uri', args.redirectUri);
  shortU.searchParams.set('code', args.code);
  const shortRes = await fetch(shortU);
  const short = (await shortRes.json()) as { access_token?: string; error?: { message?: string } };
  if (!shortRes.ok || !short.access_token) {
    throw new Error(short.error?.message || 'Facebook token exchange failed');
  }

  const longU = new URL(`${GRAPH}/oauth/access_token`);
  longU.searchParams.set('grant_type', 'fb_exchange_token');
  longU.searchParams.set('client_id', args.appId);
  longU.searchParams.set('client_secret', args.appSecret);
  longU.searchParams.set('fb_exchange_token', short.access_token);
  const longRes = await fetch(longU);
  const long = (await longRes.json()) as { access_token?: string; error?: { message?: string } };
  // Fall back to the short-lived token if the exchange somehow fails — the user
  // can always reconnect; a working token now beats erroring out.
  return { userToken: long.access_token || short.access_token };
}

/** List the Pages the user manages, each with its own Page access token. */
export async function listPages(args: {
  userToken: string;
  appId?: string;
  appSecret?: string;
}): Promise<Array<{ id: string; name: string; accessToken: string }>> {
  const { userToken, appId, appSecret } = args;
  // Primary path: the classic Page list.
  const u = new URL(`${GRAPH}/me/accounts`);
  u.searchParams.set('access_token', userToken);
  u.searchParams.set('fields', 'id,name,access_token');
  const res = await fetch(u);
  const data = (await res.json()) as { data?: Array<{ id: string; name: string; access_token: string }>; error?: { message?: string } };
  if (!res.ok) throw new Error(data.error?.message || 'Could not list Facebook Pages');
  let pages = (data.data ?? []).map((p) => ({ id: p.id, name: p.name, accessToken: p.access_token }));

  // Fallback for the "New Pages Experience": /me/accounts is frequently EMPTY
  // even when the user granted access to specific Pages. Recover the granted
  // Page ids from the user token's granular_scopes, then fetch each Page (and
  // its own Page access token) directly — that path works for NPE Pages.
  if (!pages.length && appId && appSecret) {
    const ids = await grantedPageIds(userToken, appId, appSecret);
    const fetched = await Promise.all(ids.map(async (id) => {
      try {
        const pu = new URL(`${GRAPH}/${id}`);
        pu.searchParams.set('fields', 'id,name,access_token');
        pu.searchParams.set('access_token', userToken);
        const pr = await fetch(pu);
        const pd = (await pr.json()) as { id?: string; name?: string; access_token?: string };
        if (pr.ok && pd.id && pd.access_token) return { id: pd.id, name: pd.name || pd.id, accessToken: pd.access_token };
      } catch { /* skip this id */ }
      return null;
    }));
    pages = fetched.filter((p): p is { id: string; name: string; accessToken: string } => p !== null);
  }
  return pages;
}

/** Page ids the user granted (from the token's granular_scopes). */
async function grantedPageIds(userToken: string, appId: string, appSecret: string): Promise<string[]> {
  try {
    const u = new URL(`${GRAPH}/debug_token`);
    u.searchParams.set('input_token', userToken);
    u.searchParams.set('access_token', `${appId}|${appSecret}`);
    const res = await fetch(u);
    const data = (await res.json()) as { data?: { granular_scopes?: Array<{ scope: string; target_ids?: string[] }> } };
    const ids = new Set<string>();
    for (const s of data.data?.granular_scopes ?? []) {
      if (s.scope.startsWith('pages_')) (s.target_ids ?? []).forEach((id) => ids.add(id));
    }
    return [...ids];
  } catch {
    return [];
  }
}

/**
 * Publish (or draft) a Reel to a Page. Vertical (9:16) clips, 3s–90s, are what
 * Reels expects. Returns the reel id + a watch URL (only meaningful once the
 * reel is PUBLISHED; DRAFT reels live in Meta Business Suite).
 */
export async function uploadReel(args: {
  pageId: string;
  pageToken: string;
  bytes: Buffer | Uint8Array;
  description?: string;
  state?: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED';
}): Promise<{ videoId: string; url: string }> {
  const state = args.state || 'PUBLISHED';

  // 1) Initialize the upload session.
  const startU = new URL(`${GRAPH}/${args.pageId}/video_reels`);
  startU.searchParams.set('upload_phase', 'start');
  startU.searchParams.set('access_token', args.pageToken);
  const startRes = await fetch(startU, { method: 'POST' });
  const start = (await startRes.json()) as { video_id?: string; upload_url?: string; error?: { message?: string } };
  if (!startRes.ok || !start.video_id) {
    throw new Error(start.error?.message || `Reel init failed (${startRes.status})`);
  }
  const videoId = start.video_id;
  const uploadUrl = start.upload_url || `${RUPLOAD}/${videoId}`;

  // 2) Upload the bytes. Node's fetch accepts a Uint8Array/Buffer body at
  //    runtime; the DOM fetch types are stricter, hence the cast.
  const up = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${args.pageToken}`,
      offset: '0',
      file_size: String(args.bytes.byteLength),
    },
    body: args.bytes as unknown as BodyInit,
  });
  const upData = (await up.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
  if (!up.ok || upData.success === false) {
    throw new Error(upData.error?.message || `Reel upload failed (${up.status})`);
  }

  // 3) Finish → publish / draft / schedule.
  const finU = new URL(`${GRAPH}/${args.pageId}/video_reels`);
  finU.searchParams.set('upload_phase', 'finish');
  finU.searchParams.set('video_id', videoId);
  finU.searchParams.set('video_state', state);
  if (args.description) finU.searchParams.set('description', args.description.slice(0, 2200));
  finU.searchParams.set('access_token', args.pageToken);
  const finRes = await fetch(finU, { method: 'POST' });
  const fin = (await finRes.json()) as { success?: boolean; post_id?: string; error?: { message?: string } };
  if (!finRes.ok || fin.success === false) {
    throw new Error(fin.error?.message || `Reel publish failed (${finRes.status})`);
  }

  return { videoId, url: `https://www.facebook.com/reel/${videoId}` };
}
