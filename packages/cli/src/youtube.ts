/**
 * YouTube upload (personal channel) via the Data API v3 + OAuth 2.0.
 *
 * Uses only global `fetch` — no SDK/deps. Designed for the studio's local
 * OAuth flow: the user pastes their own OAuth client id/secret (from a Google
 * Cloud project with the YouTube Data API enabled), connects once (loopback
 * redirect), and we keep the refresh token in the local media-config.
 *
 * A vertical (9:16) clip ≤ 3 min is treated as a Short by YouTube automatically;
 * appending #Shorts to the description makes it explicit.
 */

const OAUTH_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const OAUTH_TOKEN = 'https://oauth2.googleapis.com/token';
const UPLOAD_URL =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';
// upload = publish videos; readonly = read the channel name to label the account.
export const YOUTUBE_SCOPE =
  'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';

/** Build the consent URL the user opens to authorize the studio. */
export function buildAuthUrl(clientId: string, redirectUri: string): string {
  const p = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_SCOPE,
    access_type: 'offline',
    // select_account: let the user pick WHICH Google account (for multi-account);
    // consent: force a refresh_token every time.
    prompt: 'select_account consent',
    include_granted_scopes: 'true',
  });
  return `${OAUTH_AUTH}?${p.toString()}`;
}

/** Exchange the auth code for tokens; returns the refresh token to persist. */
export async function exchangeCode(args: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{ refreshToken: string }> {
  const res = await fetch(OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: args.clientId,
      client_secret: args.clientSecret,
      code: args.code,
      grant_type: 'authorization_code',
      redirect_uri: args.redirectUri,
    }),
  });
  const data = (await res.json()) as { refresh_token?: string; error_description?: string; error?: string };
  if (!res.ok || !data.refresh_token) {
    throw new Error(data.error_description || data.error || 'Token exchange failed (no refresh_token)');
  }
  return { refreshToken: data.refresh_token };
}

/** Trade the stored refresh token for a short-lived access token. */
export async function getAccessToken(args: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> {
  const res = await fetch(OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: args.clientId,
      client_secret: args.clientSecret,
      refresh_token: args.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = (await res.json()) as { access_token?: string; error_description?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Could not refresh access token');
  }
  return data.access_token;
}

/** Best-effort channel id + title for the signed-in account (to label it in the
 *  UI). Works with the upload scope on most accounts; returns a fallback on any
 *  error so connecting never breaks over a missing label. */
export async function getChannelInfo(accessToken: string): Promise<{ id: string; title: string }> {
  try {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { authorization: `Bearer ${accessToken}` } },
    );
    const data = (await res.json()) as { items?: Array<{ id?: string; snippet?: { title?: string } }> };
    const ch = data.items?.[0];
    if (ch?.id) return { id: ch.id, title: ch.snippet?.title || 'Kênh YouTube' };
  } catch { /* fall through */ }
  return { id: '', title: '' };
}

/**
 * Upload an MP4 as a (Short) video. Resumable protocol: POST metadata → get the
 * upload URL → single PUT of the bytes (clips here are a few MB, so one PUT is
 * fine). Returns the new video id + watch URL.
 */
export async function uploadVideo(args: {
  accessToken: string;
  bytes: Buffer | Uint8Array;
  title: string;
  description?: string;
  tags?: string[];
  privacyStatus?: 'private' | 'unlisted' | 'public';
}): Promise<{ videoId: string; url: string }> {
  const metadata = {
    snippet: {
      title: (args.title || 'Untitled').slice(0, 100),
      description: (args.description || '').slice(0, 4900),
      ...(args.tags && args.tags.length ? { tags: args.tags.slice(0, 30) } : {}),
      categoryId: '22', // People & Blogs — a safe default
    },
    status: {
      privacyStatus: args.privacyStatus || 'private',
      selfDeclaredMadeForKids: false,
    },
  };

  // 1) Start the resumable session.
  const start = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${args.accessToken}`,
      'content-type': 'application/json; charset=UTF-8',
      'x-upload-content-type': 'video/mp4',
      'x-upload-content-length': String(args.bytes.byteLength),
    },
    body: JSON.stringify(metadata),
  });
  if (!start.ok) {
    const txt = await start.text().catch(() => '');
    throw new Error(`YouTube rejected the upload start (${start.status}): ${txt.slice(0, 500)}`);
  }
  const uploadUrl = start.headers.get('location');
  if (!uploadUrl) throw new Error('No resumable upload URL returned by YouTube');

  // 2) Send the bytes. Node's fetch accepts a Uint8Array/Buffer body at runtime
  //    (and sets Content-Length); the DOM fetch types are stricter, hence the cast.
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': 'video/mp4', 'content-length': String(args.bytes.byteLength) },
    body: args.bytes as unknown as BodyInit,
  });
  const result = (await put.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!put.ok || !result.id) {
    throw new Error(result.error?.message || `Upload failed (${put.status})`);
  }
  return { videoId: result.id, url: `https://youtube.com/shorts/${result.id}` };
}
