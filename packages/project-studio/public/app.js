// html-video studio v0.4 — chat-driven HTML + template gallery + text-node editor

import {
  t,
  getLocale,
  setLocale,
  AVAILABLE_LOCALES,
} from "./i18n.js?v=0.9-youtube";

// Re-render whole UI on language change.
document.addEventListener("hv-locale-change", () => {
  document.documentElement.lang = getLocale();
  if (typeof renderToolbar === "function") renderToolbar();
  if (typeof renderMain === "function") renderMain();
  if (typeof renderSidebar === "function") renderSidebar();
});
document.documentElement.lang = getLocale();

// ─── Icon set ───────────────────────────────────────────────────────────────
// Standard inline-SVG icons (Lucide geometry, MIT). Stroke uses `currentColor`
// so an icon inherits the surrounding text color, and is sized in `em` via the
// `.ico-svg` CSS rule (so it scales with the host's font-size). Self-contained:
// no icon-font / CDN dependency. `icon()` = bare glyph; `iconL()` = leading
// glyph with a right gap, for "icon + label" buttons.
const ICON_PATHS = {
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clipboard:
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  paperclip:
    '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  film: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  clapperboard:
    '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  image:
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  video:
    '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  music:
    '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  barChart:
    '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
  type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
  crosshair:
    '<circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/>',
  message:
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  externalLink:
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  folder:
    '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  youtube:
    '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  sparkles:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  refresh:
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
  arrowLeftRight:
    '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  cornerDownLeft:
    '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  monitor:
    '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
};
function icon(name, extraClass) {
  const p = ICON_PATHS[name];
  if (!p) return "";
  const cls = extraClass ? `ico-svg ${extraClass}` : "ico-svg";
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
// Leading icon (icon + text label): adds a right gap.
function iconL(name) {
  return icon(name, "ico-lead");
}

// Official multi-colour YouTube logo (red body + white play triangle). Kept
// separate from the monochrome icon() set — it has its own viewBox/aspect and
// uses fills, not currentColor. Pass 'ico-lead' when it precedes a text label.
function ytGlyph(extraClass) {
  const cls = extraClass ? `ico-yt-logo ${extraClass}` : "ico-yt-logo";
  return `<svg class="${cls}" viewBox="0 0 256 180" preserveAspectRatio="xMidYMid" aria-hidden="true"><path fill="red" d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134Z"/><path fill="#FFF" d="m102.421 128.06 66.328-38.418-66.328-38.418z"/></svg>`;
}

// Official Facebook "f" logo (blue disc + white f). Same rationale as ytGlyph.
function fbGlyph(extraClass) {
  const cls = extraClass ? `ico-fb-logo ${extraClass}` : "ico-fb-logo";
  return `<svg class="${cls}" viewBox="0 0 666.667 666.667" aria-hidden="true"><defs><clipPath id="fbclip"><path d="M0 700h700V0H0Z"/></clipPath></defs><g clip-path="url(#fbclip)" transform="matrix(1.33333 0 0 -1.33333 -133.333 800)"><path d="M0 0c0 138.071-111.929 250-250 250S-500 138.071-500 0c0-117.245 80.715-215.622 189.606-242.638v166.242h-51.552V0h51.552v32.919c0 85.092 38.508 124.532 122.048 124.532 15.838 0 43.167-3.105 54.347-6.211V81.986c-5.901.621-16.149.932-28.882.932-40.993 0-56.832-15.528-56.832-55.9V0h81.659l-14.028-76.396h-67.631v-171.773C-95.927-233.218 0-127.818 0 0" style="fill:#0866ff;fill-rule:nonzero;stroke:none" transform="translate(600 350)"/><path d="m0 0 14.029 76.396H-67.63v27.019c0 40.372 15.838 55.899 56.831 55.899 12.733 0 22.981-.31 28.882-.931v69.253c-11.18 3.106-38.509 6.212-54.347 6.212-83.539 0-122.048-39.441-122.048-124.533V76.396h-51.552V0h51.552v-166.242a250.559 250.559 0 0 1 60.394-7.362c10.254 0 20.358.632 30.288 1.831V0Z" style="fill:#fff;fill-rule:nonzero;stroke:none" transform="translate(447.918 273.604)"/></g></svg>`;
}

// ─── Theme (light / dark / auto) ──────────────────────────────────────────────
// Stored in localStorage; written to <html data-theme> ('light'|'dark') or
// removed ('auto' → follow OS via prefers-color-scheme). An inline <head> script
// applies it before first paint; this keeps it in sync for in-app toggling.
const THEME_KEY = "hv-theme";
const TF_WIDTH_KEY = "hv-textfields-w"; // right column width (px), set before first paint
function getTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}
function applyTheme(theme) {
  const el = document.documentElement;
  if (theme === "light" || theme === "dark") el.dataset.theme = theme;
  else delete el.dataset.theme;
}
function setTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  applyTheme(theme);
}

// Collapse state of the two side panels (left project sidebar, right text pane).
// They're body classes; persist so a reload keeps them the way the user left
// them. Applied on load via JS (panels may flash expanded for a blink — no
// inline-head apply since body classes need <body> to exist).
const SIDEBAR_KEY = "hv-sidebar-collapsed";
const TEXTPANE_KEY = "hv-textpane-collapsed";
function applyCollapsedFromStorage() {
  try {
    if (localStorage.getItem(SIDEBAR_KEY) === "1")
      document.body.classList.add("sidebar-collapsed");
    if (localStorage.getItem(TEXTPANE_KEY) === "1")
      document.body.classList.add("textfields-collapsed");
  } catch {}
}
function saveCollapsed() {
  try {
    localStorage.setItem(
      SIDEBAR_KEY,
      document.body.classList.contains("sidebar-collapsed") ? "1" : "0",
    );
    localStorage.setItem(
      TEXTPANE_KEY,
      document.body.classList.contains("textfields-collapsed") ? "1" : "0",
    );
  } catch {}
}
applyTheme(getTheme());
applySavedTextfieldsWidth();
applyCollapsedFromStorage();

// Narration voices. Two free, key-less engines:
//  • Edge-TTS (online): locale-prefixed ids (e.g. "vi-VN-HoaiMyNeural"). `key`
//    maps to a localized label (soundtrack.voice_<key>).
//  • VieNeu-TTS (offline): 14 Vietnamese voices, ids prefixed "vieneu:" — the
//    server routes these to the offline engine. Labels are built from the
//    voice's name + gender + region (proper nouns; no per-voice i18n key).
// `group` buckets options into <optgroup>s; adding a voice here is all it takes.
const VIENEU_VOICES = [
  { name: "Minh Đức", gender: "male", region: "bac" },
  { name: "Phạm Tuyên", gender: "male", region: "bac" },
  { name: "Thanh Bình", gender: "male", region: "bac" },
  { name: "Trúc Ly", gender: "female", region: "bac" },
  { name: "Ngọc Linh", gender: "female", region: "bac" },
  { name: "Đoan Trang", gender: "female", region: "bac" },
  { name: "Mai Anh", gender: "female", region: "bac" },
  { name: "Quang Sơn", gender: "male", region: "trung" },
  { name: "Ngọc Trân", gender: "female", region: "trung" },
  { name: "Xuân Vĩnh", gender: "male", region: "nam" },
  { name: "Thái Sơn", gender: "male", region: "nam" },
  { name: "Minh Triết", gender: "male", region: "nam" },
  { name: "Thục Đoan", gender: "female", region: "nam" },
  { name: "Thùy Dung", gender: "female", region: "nam" },
];
const NARRATION_VOICES = [
  // Tiếng Việt — Edge (online)
  { group: "vi_edge", key: "vi_female_edge", voiceId: "vi-VN-HoaiMyNeural" },
  { group: "vi_edge", key: "vi_male_edge", voiceId: "vi-VN-NamMinhNeural" },
  // Tiếng Việt — VieNeu (offline, 14 voices). Label built at render time so it
  // follows language switches (name + gender + region).
  ...VIENEU_VOICES.map((v) => ({
    group: "vieneu",
    voiceId: `vieneu:${v.name}`,
    name: v.name,
    gender: v.gender,
    region: v.region,
  })),
  // English — US
  { group: "en", key: "en_us_male_guy", voiceId: "en-US-GuyNeural" },
  { group: "en", key: "en_us_male_christopher", voiceId: "en-US-ChristopherNeural" },
  { group: "en", key: "en_us_male_eric", voiceId: "en-US-EricNeural" },
  { group: "en", key: "en_us_female_aria", voiceId: "en-US-AriaNeural" },
  { group: "en", key: "en_us_female_jenny", voiceId: "en-US-JennyNeural" },
  // English — UK
  { group: "en", key: "en_gb_male_ryan", voiceId: "en-GB-RyanNeural" },
  { group: "en", key: "en_gb_female_sonia", voiceId: "en-GB-SoniaNeural" },
];
// Ordered <optgroup> buckets → localized group label key.
const NARRATION_VOICE_GROUPS = [
  { id: "vi_edge", labelKey: "soundtrack.voicegroup_vi_edge" },
  { id: "vieneu", labelKey: "soundtrack.voicegroup_vieneu" },
  { id: "en", labelKey: "soundtrack.voicegroup_en" },
];

// Localized label for one voice option (resolved at render time so it follows
// language switches). Edge voices use their i18n key; VieNeu voices are built
// from name + gender + region.
function narrationVoiceLabel(v) {
  if (v.name) {
    return `${v.name} · ${t(`soundtrack.g_${v.gender}`)} · ${t(`soundtrack.r_${v.region}`)}`;
  }
  return t(`soundtrack.voice_${v.key}`);
}

// Build the <optgroup>-grouped <option> markup for the narration voice picker.
function narrationVoiceOptionsHtml() {
  return NARRATION_VOICE_GROUPS.map((g) => {
    const opts = NARRATION_VOICES.filter((v) => v.group === g.id)
      .map((v) => `<option value="${v.voiceId}">${narrationVoiceLabel(v)}</option>`)
      .join("");
    return opts ? `<optgroup label="${t(g.labelKey)}">${opts}</optgroup>` : "";
  }).join("");
}

const API = {
  projects: () => fetch("/api/projects").then((r) => r.json()),
  createProject: (b) =>
    fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(b),
    }).then((r) => r.json()),
  getProject: (id) => fetch(`/api/projects/${id}`).then((r) => r.json()),
  patchProject: (id, b) =>
    fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(b),
    }).then((r) => r.json()),
  deleteProject: (id) =>
    fetch(`/api/projects/${id}`, { method: "DELETE" }).then((r) => r.json()),
  templates: () => fetch("/api/templates").then((r) => r.json()),
  agents: () => fetch("/api/agents").then((r) => r.json()),
  setTemplate: (id, tid) =>
    fetch(`/api/projects/${id}/template`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ template_id: tid }),
    }).then((r) => r.json()),
  setAgent: (id, aid, model) =>
    fetch(`/api/projects/${id}/agent`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agent_id: aid,
        ...(model !== undefined && { agent_model: model }),
      }),
    }).then((r) => r.json()),
  exportMp4: (id) =>
    fetch(`/api/projects/${id}/export`, { method: "POST" }).then((r) =>
      r.json(),
    ),
  getMessages: (id) =>
    fetch(`/api/projects/${id}/messages`).then((r) => r.json()),
  rawHtml: (id) =>
    fetch(`/api/projects/${id}/raw-html`).then((r) => (r.ok ? r.text() : null)),
  putRawHtml: (id, html) =>
    fetch(`/api/projects/${id}/raw-html`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ html }),
    }).then((r) => r.json()),
  contentGraph: (id) =>
    fetch(`/api/projects/${id}/content-graph`).then((r) =>
      r.ok ? r.json() : null,
    ),
  unenhanceFrame: (id, nodeId) =>
    fetch(
      `/api/projects/${id}/frames/${encodeURIComponent(nodeId)}/unenhance`,
      { method: "POST" },
    ).then((r) => r.json()),
  testAgent: (id) =>
    fetch(`/api/agents/${encodeURIComponent(id)}/test`, {
      method: "POST",
    }).then((r) => r.json()),
  rescanAgents: () => fetch("/api/agents?force=1").then((r) => r.json()),
};

const state = {
  projects: [],
  templates: [],
  agents: [],
  selectedId: null,
  selected: null,
  messages: [],
  composing: false,
  textFields: [], // [{key, original, current}]
  textSaveTimer: null,
  rightTab: "text", // right column tab: 'text' (frame text) | 'narration' (voiceover)
  pendingAttachments: [], // [{file, dataUrl?, name, kind, size}] before send
  // v0.8: multi-frame timeline state
  activeFrameId: null, // graphNodeId currently shown in iframe
  iterateFocusFrameId: null, // graphNodeId iterations should target only (null = whole video)
  editTextMode: false, // when true, preview iframe accepts inline text edits
  exporting: false, // export run in progress
  exportProgress: null, // { pct, stage } during a streamed export
  lastGraph: null, // last fetched ContentGraph (for download)
  // Phase C: per-frame native Remotion enhancement
  frameKinds: {}, // { [graphNodeId]: 'entity'|'data'|'text' } for the selected project
  enhancing: null, // { nodeId, pct, stage } while a single-frame enhance render is in flight
};

// ============== boot ==============
async function init() {
  // Kick off agent detection in the background — `which` + `<bin> --version`
  // can take ~400ms+ cold and there's no point holding the whole UI for it.
  // Composer renders disabled-but-visible; we re-render it once agents land.
  const agentsPromise = refreshAgents().then(() => {
    renderToolbar();
    if (state.selected) renderComposer();
  });
  await Promise.all([refreshTemplates(), refreshProjects()]);
  renderToolbar();
  wireToolbar();
  wireModals();
  // Don't block — but surface failures in the console.
  agentsPromise.catch((e) => console.warn("agent detection failed:", e));

  // Empty list → spin up a default project so the user lands inside one
  // instead of an empty gallery.
  if (state.projects.length === 0) {
    const r = await API.createProject({ name: defaultProjectName(0) });
    if (r && r.project) {
      await refreshProjects();
      await selectProject(r.project.id);
      return;
    }
  }
  // First load with existing projects → open the most recently updated one.
  if (!state.selected && state.projects.length > 0) {
    await selectProject(state.projects[0].id);
  }
}

function defaultProjectName(seed) {
  const n = (state.projects?.length ?? 0) + (seed ?? 0) + 1;
  return `Untitled ${String(n).padStart(2, "0")}`;
}

/**
 * Format a percent value for inline progress UI.
 *  - integer pcts stay integer ("56" → "56")
 *  - fractional pcts truncate to 1 decimal place ("98.333…" → "98.3")
 * Avoids the JS-default "98.33333333334%" tail when sources publish
 * (frame_index + sub_pct/100) / total style fractions.
 */
function formatPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

async function createDefaultProject() {
  const r = await API.createProject({ name: defaultProjectName(0) });
  if (!r?.project) {
    toast(t("modal.new.failed"), "error");
    return;
  }
  await refreshProjects();
  await selectProject(r.project.id);
}

// ============== Export MP4 (streamed) ==============
async function startExportStream() {
  if (!state.selected) return;
  const projectId = state.selected.id;
  state.exporting = true;
  state.exportProgress = { pct: 0, stage: "starting" };
  renderToolbar();
  state.messages.push({
    role: "preview-event",
    content: t("export.starting"),
    ts: Date.now(),
  });
  renderChatLog();

  let res;
  try {
    res = await fetch(`/api/projects/${projectId}/export`, {
      method: "POST",
      headers: {
        accept: "text/event-stream",
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
  } catch (e) {
    state.exporting = false;
    state.exportProgress = null;
    toast(t("export.failed_short", { message: e?.message ?? e }), "error");
    renderToolbar();
    return;
  }
  if (!res.ok || !res.body) {
    state.exporting = false;
    state.exportProgress = null;
    const err = await res.text().catch(() => "");
    toast(t("export.failed_short", { message: err.slice(0, 200) }), "error");
    renderToolbar();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const events = buf.split("\n\n");
      buf = events.pop() ?? "";
      for (const line of events) {
        if (!line.startsWith("data: ")) continue;
        let ev;
        try {
          ev = JSON.parse(line.slice(6));
        } catch {
          continue;
        }
        if (ev.type === "export_progress") {
          state.exportProgress = { pct: ev.pct, stage: ev.stage };
          renderToolbar();
        } else if (ev.type === "export_done") {
          state.exporting = false;
          state.exportProgress = null;
          if (ev.project) state.selected = ev.project;
          const seconds = ev.elapsed_ms
            ? `${(ev.elapsed_ms / 1000).toFixed(1)}s`
            : "";
          state.messages.push({
            role: "preview-event",
            content: seconds
              ? t("export.done_seconds", { seconds })
              : t("export.done_no_seconds"),
            ts: Date.now(),
          });
          state.messages.push({
            role: "export-done",
            content: ev.output_path,
            ts: Date.now(),
          });
          renderChatLog();
          renderToolbar();
          refreshProjects();
        } else if (ev.type === "export_failed") {
          state.exporting = false;
          state.exportProgress = null;
          state.messages.push({
            role: "system",
            content: t("export.failed", { message: ev.message }),
            ts: Date.now(),
          });
          renderChatLog();
          renderToolbar();
        }
      }
    }
  } catch (e) {
    state.exporting = false;
    state.exportProgress = null;
    toast(
      t("export.stream_interrupted", { message: e?.message ?? e }),
      "error",
    );
    renderToolbar();
  }
}

// ============== Per-frame native enhancement (streamed) ==============
// Render ONE data frame with the native Remotion template and stream progress,
// mirroring startExportStream. On done, swap that frame's thumbnail + centre
// preview to the rendered <video>. User-initiated only (the toggle's click).
async function startEnhanceStream(
  nodeId,
  nativeTemplateId = "frame-data-rollup",
) {
  if (!state.selected || state.enhancing) return;
  const projectId = state.selected.id;
  state.enhancing = { nodeId, pct: 0, stage: "starting" };
  renderFramesStrip();

  let res;
  try {
    res = await fetch(
      `/api/projects/${projectId}/frames/${encodeURIComponent(nodeId)}/enhance`,
      {
        method: "POST",
        headers: {
          accept: "text/event-stream",
          "content-type": "application/json",
        },
        body: JSON.stringify({ nativeTemplateId }),
      },
    );
  } catch (e) {
    state.enhancing = null;
    toast(t("enhance.failed", { message: e?.message ?? e }), "error");
    renderFramesStrip();
    return;
  }
  if (!res.ok || !res.body) {
    state.enhancing = null;
    const err = await res.text().catch(() => "");
    toast(t("enhance.failed", { message: err.slice(0, 200) }), "error");
    renderFramesStrip();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const events = buf.split("\n\n");
      buf = events.pop() ?? "";
      for (const line of events) {
        if (!line.startsWith("data: ")) continue;
        let ev;
        try {
          ev = JSON.parse(line.slice(6));
        } catch {
          continue;
        }
        if (ev.type === "enhance_progress") {
          if (state.enhancing) {
            state.enhancing.pct = ev.pct;
            state.enhancing.stage = ev.stage;
          }
          renderFramesStrip();
        } else if (ev.type === "enhance_done") {
          state.enhancing = null;
          if (ev.project) state.selected = ev.project; // bumped updatedAt → fresh <video> URL
          state.messages.push({
            role: "preview-event",
            content: t("enhance.done"),
            ts: Date.now(),
          });
          renderChatLog();
          renderFramesStrip();
          renderPreview();
          refreshProjects();
        } else if (ev.type === "enhance_failed") {
          state.enhancing = null;
          toast(t("enhance.failed", { message: ev.message }), "error");
          renderFramesStrip();
        }
      }
    }
  } catch (e) {
    state.enhancing = null;
    toast(t("enhance.failed", { message: e?.message ?? e }), "error");
    renderFramesStrip();
  }
}

async function unenhanceFrameAction(nodeId) {
  if (!state.selected || state.enhancing) return;
  try {
    const r = await API.unenhanceFrame(state.selected.id, nodeId);
    if (r?.project) state.selected = r.project;
    renderFramesStrip();
    renderPreview();
    refreshProjects();
  } catch (e) {
    toast(t("enhance.failed", { message: e?.message ?? e }), "error");
  }
}

/**
 * Detect "I want to export this to MP4" intent in a chat message.
 * Hits both Chinese + English without leaning on the agent.
 */
function isExportIntent(text) {
  if (!text) return false;
  const t = text.trim();
  if (t.length > 40) return false; // long messages are content / iterate requests
  if (/https?:\/\//i.test(t)) return false; // a link is ALWAYS source material to build from, never "export"
  // "生成/做一个视频" is the most common way to ask to CREATE a video — it must
  // NOT count as export. Only match explicit export/render verbs that target an
  // already-produced result: 导出 / 出片 / 渲染 / export / render / encode / 输出mp4.
  return (
    /^\s*(?:export|render|encode|导出(?:视频|为?\s?mp4)?|出片|渲染|输出\s?mp4|存为\s?mp4|xuất(?:\s?video|\s?mp4)?|xuất\s?file)\s*$/i.test(
      t,
    ) ||
    /(?:^|\s)(?:导出|出片|渲染成?|export|render|encode|xuất)(?:$|\s|视频|为?\s?mp4|成\s?mp4|\s?video|\s?mp4)/i.test(
      t,
    )
  );
}

async function revealExportedFile() {
  if (!state.selected) return;
  try {
    const r = await fetch(`/api/projects/${state.selected.id}/reveal`, {
      method: "POST",
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `${r.status}`);
  } catch (e) {
    toast(t("export.reveal_failed", { message: e?.message ?? e }), "error");
  }
}
async function refreshTemplates() {
  const r = await API.templates();
  state.templates = r.templates ?? [];
}
async function refreshAgents() {
  try {
    state.agents = (await API.agents()).agents ?? [];
  } catch {
    state.agents = [];
  }
}
async function refreshProjects() {
  state.projects = (await API.projects()).projects ?? [];
  renderSidebar();
}

async function selectProject(id) {
  state.selectedId = id;
  state.selected = (await API.getProject(id)).project;
  state.activeFrameId = null; // reset frame selection on project switch
  state.iterateFocusFrameId = null;
  state.editTextMode = false;
  state.enhancing = null;
  // Phase C: map graph node id → kind so the strip can show the "⚡ Enhance"
  // toggle only on data frames. One fetch per project switch.
  state.frameKinds = {};
  try {
    const cg = await API.contentGraph(id);
    if (cg?.graph?.nodes)
      for (const n of cg.graph.nodes) state.frameKinds[n.id] = n.kind;
  } catch {
    /* no graph (single-frame project) — no toggles, fine */
  }
  // A generation running for the PREVIOUS project keeps going on the backend
  // (its result persists); just release the composer so this project is usable.
  // The in-flight SSE loop self-stops once it sees selectedId changed.
  state.composing = false;
  try {
    state.messages = (await API.getMessages(id)).messages ?? [];
  } catch {
    state.messages = [];
  }
  // Export history is persisted on the project — surface the latest export so
  // its "MP4 ready" card survives a session/project switch (it was previously
  // only an in-memory chat message and vanished on switch).
  const exports = state.selected?.exports ?? [];
  if (exports.length && exports[exports.length - 1]?.path) {
    state.messages.push({
      role: "export-done",
      content: exports[exports.length - 1].path,
      ts: Date.now(),
    });
  } else if (state.selected?.lastOutputMp4Path) {
    state.messages.push({
      role: "export-done",
      content: state.selected.lastOutputMp4Path,
      ts: Date.now(),
    });
  }
  // If a generation is still running on the backend for this project, surface a
  // live "still generating" line (the in-memory progress lines were lost on the
  // switch; the result will appear in messages once it finishes — reload to see).
  try {
    const g = await fetch(`/api/projects/${id}/generating`).then((r) =>
      r.json(),
    );
    if (g?.generating && id === state.selectedId) {
      state.messages.push({
        role: "preview-event",
        content: buildGenProgress(g),
        genPoll: true, // marker so the poll can find + update this message
        ts: Date.now(),
      });
      pollGenerating(id); // keep replaying live progress until it finishes
    }
  } catch {
    /* non-fatal */
  }
  renderSidebar();
  renderToolbar(); // <-- bug fix: toolbar buttons (template / agent / export) must
  //     be re-enabled after a project is selected
  renderMain();
  await refreshTextFields();
}

// The progress-panel content for a project that's generating in the background:
// its live log if we have one, else the static "still generating" line.
function buildGenProgress(g) {
  const log = (g?.progress || "").trim();
  return log || t("chat.still_generating");
}

// Poll a background generation, updating the progress panel until it finishes,
// then reload the persisted messages + preview so the result appears on its own
// (no manual "reload preview" needed). Stops if the user switches project.
async function pollGenerating(id) {
  while (id === state.selectedId) {
    await new Promise((r) => setTimeout(r, 2000));
    if (id !== state.selectedId) return;
    let g;
    try {
      g = await fetch(`/api/projects/${id}/generating`).then((r) => r.json());
    } catch {
      return; // network blip — stop; a later project switch can re-arm
    }
    if (id !== state.selectedId) return;
    const msg = state.messages.find((x) => x.genPoll);
    if (g?.generating) {
      if (msg) {
        msg.content = buildGenProgress(g);
        renderChatLog();
      }
    } else {
      // Finished → drop the poll panel, reload messages + preview + graph.
      state.messages = state.messages.filter((x) => !x.genPoll);
      try {
        state.messages = (await API.getMessages(id)).messages ?? state.messages;
      } catch {
        /* keep what we have */
      }
      try {
        const pr = await API.getProject(id);
        state.selected = pr.project;
        state.activeFrameId = null;
        state.frameKinds = {};
        try {
          const cg = await API.contentGraph(id);
          if (cg?.graph?.nodes)
            for (const n of cg.graph.nodes) state.frameKinds[n.id] = n.kind;
        } catch {
          /* single-frame — no graph */
        }
      } catch {
        /* keep current project state */
      }
      renderChatLog();
      renderPreview();
      await refreshTextFields();
      renderToolbar();
      renderFooter();
      return;
    }
  }
}

// ============== sidebar ==============
function renderSidebar() {
  const list = document.getElementById("project-list");
  if (!state.projects.length) {
    list.innerHTML = `<div class="empty-list">${t("sidebar.empty_list")}</div>`;
    return;
  }
  list.innerHTML = "";
  for (const p of state.projects) {
    const div = document.createElement("div");
    div.className = `project-row${p.id === state.selectedId ? " active" : ""}`;
    const initial = ((p.name || "").trim().charAt(0) || "?").toUpperCase();
    div.title = p.name || "";
    div.innerHTML = `
      <div class="project-avatar" aria-hidden="true">${esc(initial)}</div>
      <div class="name">${esc(p.name)}</div>
      <div class="meta">${p.template_id ? esc(p.template_id) : "no template"} · ${p.status}</div>
      <button class="row-menu-btn" title="More" data-pid="${esc(p.id)}">⋯</button>
    `;
    div.onclick = (e) => {
      // Ignore clicks that started inside the menu button.
      if (e.target.closest(".row-menu-btn") || e.target.closest(".row-menu"))
        return;
      selectProject(p.id);
    };
    list.appendChild(div);
  }
  list.querySelectorAll(".row-menu-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openProjectMenu(btn);
    };
  });
}

function openProjectMenu(anchor) {
  // Close any existing menu.
  document.querySelectorAll(".row-menu").forEach((m) => m.remove());
  const pid = anchor.dataset.pid;
  const proj = state.projects.find((p) => p.id === pid);
  if (!proj) return;
  const menu = document.createElement("div");
  menu.className = "row-menu";
  menu.innerHTML = `
    <button data-act="rename">${iconL("edit")}${t("sidebar.menu.rename")}</button>
    <button data-act="delete">${iconL("trash")}${t("sidebar.menu.delete")}</button>
  `;
  // Position below the button.
  const r = anchor.getBoundingClientRect();
  menu.style.top = `${r.bottom + 4}px`;
  menu.style.left = `${r.right - 140}px`;
  document.body.appendChild(menu);
  menu.querySelector('[data-act="rename"]').onclick = async () => {
    menu.remove();
    const next = prompt(t("sidebar.rename_prompt"), proj.name);
    if (next == null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === proj.name) return;
    await API.patchProject(proj.id, { name: trimmed });
    await refreshProjects();
    if (state.selectedId === proj.id) {
      state.selected = (await API.getProject(proj.id)).project;
      renderToolbar();
      renderFooter();
    }
  };
  menu.querySelector('[data-act="delete"]').onclick = async () => {
    menu.remove();
    if (!confirm(t("sidebar.delete_confirm", { name: proj.name }))) return;
    await API.deleteProject(proj.id);
    await refreshProjects();
    if (state.selectedId === proj.id) {
      state.selectedId = null;
      state.selected = null;
      state.messages = [];
      // Pick the next available project, or build a fresh default.
      if (state.projects.length > 0) {
        await selectProject(state.projects[0].id);
      } else {
        const r = await API.createProject({ name: defaultProjectName(0) });
        await refreshProjects();
        if (r?.project) await selectProject(r.project.id);
      }
    }
  };
  // Close on outside click / Escape.
  const close = (e) => {
    if (menu.contains(e.target)) return;
    menu.remove();
    document.removeEventListener("mousedown", close);
    document.removeEventListener("keydown", escClose);
  };
  const escClose = (e) => {
    if (e.key === "Escape") {
      menu.remove();
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escClose);
    }
  };
  setTimeout(() => {
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escClose);
  }, 0);
}

// ============== toolbar ==============
function renderToolbar() {
  const p = state.selected;
  const nameInput = document.getElementById("proj-name");
  const pickBtn = document.getElementById("btn-pick-template");
  const exportBtn = document.getElementById("btn-export");

  nameInput.disabled = !p;
  nameInput.placeholder = p ? "" : t("app.no_project");
  nameInput.value = p?.name ?? "";

  pickBtn.disabled = !p;
  if (p && p.templateId) {
    const tpl = state.templates.find((x) => x.id === p.templateId);
    pickBtn.classList.remove("empty");
    pickBtn.querySelector(".label").textContent = tpl ? tpl.name : p.templateId;
  } else {
    pickBtn.classList.add("empty");
    pickBtn.querySelector(".label").textContent = t("toolbar.template_pick");
  }

  // Frames-mode projects don't need a template to export — they have
  // frames[] directly. Single-frame projects still need a template until
  // the v0.x stub is gone.
  const hasFrames = !!(p && Array.isArray(p.frames) && p.frames.length > 0);
  exportBtn.disabled = !p || (!p.templateId && !hasFrames) || !!state.exporting;
  if (state.exporting) {
    exportBtn.textContent = state.exportProgress
      ? t("export.button_running", {
          pct: formatPct(state.exportProgress.pct),
          stage: state.exportProgress.stage,
        })
      : t("export.starting");
  } else {
    exportBtn.textContent = t("toolbar.export_mp4");
  }
  renderAgentPill();

  // Re-wire on every render so handlers always match the current DOM.
  wireToolbar();
}

/** Fill the top-bar Agent pill: current agent's logo + name + connection dot. */
function renderAgentPill() {
  const pill = document.getElementById("btn-agent");
  if (!pill) return;
  const p = state.selected;
  pill.disabled = !p;
  const dot = document.getElementById("agent-dot");
  const logo = document.getElementById("agent-pill-logo");
  const label = document.getElementById("agent-pill-label");
  if (!p) {
    label.textContent = t("toolbar.agent_none");
    logo.innerHTML = "";
    dot.className = "agent-dot";
    return;
  }
  const currentId =
    p.agentId ??
    state.agents.find((a) => a.available && a.id !== "amr")?.id ??
    "anthropic-api";
  const a = state.agents.find((x) => x.id === currentId);
  const available = a?.available ?? false;
  label.textContent = a?.name ?? currentId;
  logo.innerHTML = agentIconHtml(currentId);
  dot.className = `agent-dot ${available ? "ok" : "missing"}`;
  pill.title = available
    ? t("toolbar.agent_ready")
    : t("settings.agent.unavailable");
  renderModelSwitch(currentId);
}

/** Model picker — only for AMR (the one agent with a model catalog). Lazily
 *  fetches the live list, fills the dropdown, and persists the choice to the
 *  project so generation drives session/set_model with it. */
async function renderModelSwitch(currentAgentId) {
  const wrap = document.getElementById("model-switch");
  const sel = document.getElementById("model-select");
  if (!wrap || !sel) return;
  if (!state.selected || currentAgentId !== "amr") {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  // Fetch once per session; cache on state.
  if (!state._amrModels) {
    try {
      const data = await fetch("/api/agents/amr/models").then((r) => r.json());
      state._amrModels = data.models ?? [];
      state._amrDefaultModel = data.default ?? null;
    } catch {
      state._amrModels = [];
    }
  }
  const models = state._amrModels;
  if (!models.length) {
    wrap.hidden = true;
    return;
  }
  const chosen =
    state.selected.agentModel ?? state._amrDefaultModel ?? models[0].id;
  sel.innerHTML = models
    .map(
      (m) =>
        `<option value="${esc(m.id)}"${m.id === chosen ? " selected" : ""}>${esc(m.label)}</option>`,
    )
    .join("");
  sel.onchange = async () => {
    if (!state.selected) return;
    try {
      await API.setAgent(state.selected.id, "amr", sel.value);
      state.selected = (await API.getProject(state.selected.id)).project;
      toast(`✓ ${sel.value}`, "success");
    } catch (e) {
      toast(`${e?.message ?? e}`, "error");
    }
  };
}

/** Open/refresh the top-bar agent dropdown. */
function renderAgentMenu() {
  const menu = document.getElementById("agent-menu");
  if (!menu || !state.selected) return;
  const currentId =
    state.selected.agentId ??
    state.agents.find((a) => a.available && a.id !== "amr")?.id ??
    "anthropic-api";
  menu.innerHTML = state.agents
    .map((a) => {
      const cur = a.id === currentId ? " current" : "";
      const logo = agentIconHtml(a.id);
      // AMR is "found but needs login": it can be made available by signing in,
      // unlike a genuinely missing CLI. Offer a login button instead of just
      // greying it out + the misleading "Not installed".
      const needsLogin = !a.available && a.id === "amr" && !!a.hint;
      // Star the recommended agent (AMR) to draw the eye.
      const star =
        a.id === "amr"
          ? `<span class="mi-star" title="${esc(t("agent.recommended"))}">${icon("star")}</span>`
          : "";
      const inner = `<span class="mi-dot ${a.available ? "ok" : ""}"></span>
      <span class="mi-logo">${logo}</span>
      <span class="mi-name">${esc(a.name)}</span>${star}`;
      // AMR-needs-login: render the row as a DIV (not a button) so a real, separate
      // Sign-in <button> can live beside it — nesting a button inside a button is
      // invalid HTML and the outer one eats the inner one's clicks.
      if (needsLogin) {
        return `<div class="agent-menu-item is-unselectable" title="${esc(a.hint ?? "")}">
        ${inner}
        <button type="button" class="mi-login" data-login-agent="${esc(a.id)}">${esc(t("agent.sign_in"))}</button>
      </div>`;
      }
      const tag = a.available
        ? ""
        : `<span class="mi-tag">${esc(t("settings.agent.unavailable"))}</span>`;
      const unsel = a.available ? "" : " is-unselectable";
      return `<button type="button" class="agent-menu-item${cur}${unsel}" data-agent-id="${esc(a.id)}" data-selectable="${a.available ? "1" : "0"}" title="${esc(a.hint ?? "")}">
      ${inner}${tag}
    </button>`;
    })
    .join("");
  menu.querySelectorAll(".agent-menu-item").forEach((item) => {
    item.onclick = async (e) => {
      // Login button inside the item: don't treat as agent-select.
      if (e.target.closest(".mi-login")) return;
      const aid = item.dataset.agentId;
      if (!state.selected || item.dataset.selectable !== "1") return;
      try {
        await API.setAgent(state.selected.id, aid);
        state.selected = (await API.getProject(state.selected.id)).project;
        toast(`✓ ${aid}`, "success");
      } catch (e) {
        toast(`${e?.message ?? e}`, "error");
      }
      closeAgentMenu();
      renderToolbar();
    };
  });
  // AMR "Sign in" → spawn `vela login` server-side (opens the browser), then
  // re-detect so the agent flips to available.
  menu.querySelectorAll(".mi-login").forEach((btn) => {
    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.dataset.busy === "1") return;
      const label = btn.textContent;
      btn.textContent = t("agent.signing_in");
      btn.dataset.busy = "1";
      btn.classList.add("busy");
      try {
        const res = await fetch(`/api/agents/${btn.dataset.loginAgent}/login`, {
          method: "POST",
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          toast(t("agent.signed_in"), "success");
          state.agents =
            (await fetch("/api/agents?force=1").then((r) => r.json())).agents ??
            state.agents;
          renderAgentMenu();
          renderToolbar();
        } else {
          toast(data.error || t("agent.sign_in_failed"), "error");
          btn.textContent = label;
          delete btn.dataset.busy;
          btn.classList.remove("busy");
        }
      } catch (err) {
        toast(`${err?.message ?? err}`, "error");
        btn.textContent = label;
        delete btn.dataset.busy;
        btn.classList.remove("busy");
      }
    };
  });
}

function closeAgentMenu() {
  const menu = document.getElementById("agent-menu");
  if (menu) menu.hidden = true;
  document.removeEventListener("click", _agentMenuOutside, true);
}
function _agentMenuOutside(e) {
  const sw = document.getElementById("agent-switch");
  if (sw && !sw.contains(e.target)) closeAgentMenu();
}

// Wire toolbar elements — re-bind on every renderToolbar() so any DOM
// reuse / re-render can't strand stale event handlers. (Joey reported
// template + agent picks not responding in v0.6.2.)
function wireToolbar() {
  const settingsBtn = document.getElementById("btn-settings");
  if (settingsBtn) settingsBtn.onclick = () => openSettingsModal();
  const quickBtn = document.getElementById("btn-quick-upload");
  if (quickBtn) quickBtn.onclick = () => openQuickUpload();
  const pickBtn = document.getElementById("btn-pick-template");
  if (pickBtn) {
    pickBtn.onclick = (e) => {
      e.preventDefault();
      if (!state.selected) {
        toast(t("composer.placeholder.no_project"), "error");
        return;
      }
      openGallery();
    };
  }
  // Top-bar agent switcher: pill toggles a dropdown to view status + switch.
  const agentBtn = document.getElementById("btn-agent");
  if (agentBtn) {
    agentBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!state.selected) {
        toast(t("composer.placeholder.no_project"), "error");
        return;
      }
      const menu = document.getElementById("agent-menu");
      if (!menu) return;
      if (menu.hidden) {
        renderAgentMenu();
        menu.hidden = false;
        // close on outside click (capture so it fires before re-open)
        setTimeout(
          () => document.addEventListener("click", _agentMenuOutside, true),
          0,
        );
      } else {
        closeAgentMenu();
      }
    };
  }
  const exportBtn = document.getElementById("btn-export");
  if (exportBtn) {
    exportBtn.onclick = () => {
      if (!state.selected) return;
      if (state.exporting) return;
      startExportStream();
    };
  }
  const nameInput = document.getElementById("proj-name");
  if (nameInput) {
    nameInput.onblur = () => {
      if (state.selected) nameInput.value = state.selected.name;
    };
  }
  const sidebarToggle = document.getElementById("btn-sidebar-toggle");
  if (sidebarToggle) {
    sidebarToggle.onclick = () => {
      document.body.classList.toggle("sidebar-collapsed");
      saveCollapsed();
    };
  }
}

// ============== main: 4-column body ==============
function renderMain() {
  const body = document.getElementById("body");
  body.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-head">
        <h2>${t("sidebar.projects")}</h2>
        <button class="new-project" id="btn-new" title="${t("sidebar.new")}">${icon("plus")}<span class="np-label">${t("sidebar.new")}</span></button>
        <button class="sidebar-toggle" id="btn-sidebar-toggle" title="${t("sidebar.collapse")}">‹</button>
      </div>
      <div class="project-list" id="project-list"></div>
    </aside>

    ${
      state.selected
        ? `
        <section class="chat-pane">
          <div class="chat-log" id="chat-log"></div>
          <div class="composer">
            <div class="composer-shell" id="composer-shell">
              <div class="attachments" id="attachments"></div>
              <textarea id="composer-input" placeholder="..." rows="2"></textarea>
              <div class="actions">
                <button class="icon-btn" id="btn-attach" title="${t("composer.attach")}">${icon("paperclip")}</button>
                <input type="file" id="file-input" multiple style="display:none" />
                <span class="composer-help" tabindex="0" role="img" aria-label="${esc(t("composer.hint"))}" data-tip="${esc(t("composer.hint"))}">?</span>
                <button class="send-btn" id="btn-send" disabled>${t("composer.send")}</button>
              </div>
            </div>
          </div>
        </section>

        <section class="right-pane">
          <div class="preview-stage" id="preview-stage">
            <div class="preview-placeholder"><div><div class="ico">${icon("film")}</div>${t("preview.placeholder.pick_template")}</div></div>
          </div>
          <div class="frames-strip" id="frames-strip"></div>
          <div class="right-footer">
            <span class="status" id="footer-status">${t("app.no_project")}</span>
            <span class="grow"></span>
            <button class="reload-btn" id="btn-reload">${iconL("refresh")}${t("preview.reload")}</button>
          </div>
        </section>

        <section class="text-pane">
          <div class="text-pane-resizer" id="text-pane-resizer" title="${t("text_pane.resize_hint")}"></div>
          <div class="text-pane-head">
            <div class="text-tabs" role="tablist">
              <button class="text-tab${state.rightTab === "text" ? " active" : ""}" data-text-tab="text">${iconL("edit")}${t("text_pane.tab_text")}</button>
              <button class="text-tab${state.rightTab === "narration" ? " active" : ""}" data-text-tab="narration">${iconL("mic")}${t("text_pane.tab_narration")}</button>
              <button class="text-tab${state.rightTab === "exports" ? " active" : ""}" data-text-tab="exports">${iconL("film")}${t("text_pane.tab_exports")}</button>
            </div>
            <button class="textfields-toggle" id="btn-textfields-toggle" title="${t("text_pane.collapse")}">›</button>
          </div>
          <div class="text-pane-body">
            <!-- Tab 1: per-frame editable text -->
            <div class="text-tab-panel" data-panel="text"${state.rightTab === "text" ? "" : " hidden"}>
              <div class="text-fields-bar"><span class="save-state" id="text-save-state">${t("text_pane.save_state.idle")}</span></div>
              <div class="text-fields" id="text-fields">
                <div class="text-empty">${t("text_pane.empty_no_frames")}</div>
              </div>
            </div>
            <!-- Tab 2: narration / voiceover (free Edge-TTS). Same ids as before so
                 wireSoundtrackPanel() keeps working; #soundtrack-panel is now this panel. -->
            <div class="text-tab-panel narration-tab" data-panel="narration" id="soundtrack-panel"${state.rightTab === "narration" ? "" : " hidden"}>
              <div class="soundtrack-body">
                <div class="st-section st-narration">
                  <!-- Per-frame group: this frame's script + its draft button -->
                  <div class="st-substep st-box-frame">
                    <div class="st-substep-head">
                      <span class="st-step-label">${t("soundtrack.group_frame")}</span>
                      <span class="st-narration-which" id="st-narration-which"></span>
                    </div>
                    <textarea id="st-narration-text" rows="3" placeholder="${t("soundtrack.narration_placeholder")}"></textarea>
                    <button type="button" class="st-draft" id="btn-st-draft-frame">${iconL("sparkles")}${t("soundtrack.draft_frame")}</button>
                  </div>
                  <!-- Global group: everything that applies to the whole video -->
                  <div class="st-substep st-box-global">
                    <div class="st-substep-head">
                      <span class="st-step-label">${t("soundtrack.group_global")}</span>
                    </div>
                    <button type="button" class="st-draft" id="btn-st-draft-all">${iconL("sparkles")}${t("soundtrack.draft_all")}</button>
                    <div class="st-voice-row">
                      <span class="st-voice-label">${t("soundtrack.voice_label")}</span>
                      <select id="st-narration-voice" class="st-voice-select">
                        ${narrationVoiceOptionsHtml()}
                      </select>
                    </div>
                    <div class="st-vol-row"><label>${t("soundtrack.narration_volume")} <input type="range" id="st-narration-vol" min="-20" max="6" value="0" /><b id="st-narration-vol-val">0 dB</b></label></div>
                    <div class="st-vol-row"><label>${t("soundtrack.narration_speed")} <input type="range" id="st-narration-speed" min="0.5" max="1.5" step="0.05" value="1" /><b id="st-narration-speed-val">1.00×</b></label></div>
                    <label class="st-cap-row"><input type="checkbox" id="st-narration-captions"${state.selected?.soundtrack?.captions !== false ? " checked" : ""} /> <span>${t("soundtrack.captions")}</span></label>
                    <button type="button" class="st-fit" id="btn-st-fit" title="${t("soundtrack.fit_hint")}">${iconL("arrowLeftRight")}${t("soundtrack.fit_durations")}</button>
                    <div class="st-section-actions">
                      <button class="st-generate" id="btn-st-gen-narration">${iconL("mic")}${t("soundtrack.gen_narration")}</button>
                      <span class="st-status" id="st-narration-status"></span>
                    </div>
                  </div>
                </div>
                <div class="soundtrack-preview" id="st-preview"></div>
                <div class="soundtrack-actions">
                  <button class="st-clear" id="btn-st-clear">${t("soundtrack.clear")}</button>
                </div>
              </div>
            </div>
            <!-- Tab 3: exported MP4s — review / open / delete -->
            <div class="text-tab-panel exports-tab" data-panel="exports"${state.rightTab === "exports" ? "" : " hidden"}>
              <div class="exports-list" id="exports-list"></div>
            </div>
          </div>
        </section>
        <div class="graph-modal" id="graph-modal">
          <div class="panel">
            <header>
              <h3>Content graph</h3>
              <span class="grow"></span>
              <button class="download-btn" id="graph-download">${iconL("download")}Download JSON</button>
              <button class="close-btn" id="graph-close">${icon("x")}</button>
            </header>
            <pre id="graph-json"></pre>
          </div>
        </div>
      `
        : `<div class="empty-state"><div><div class="ico">${icon("clapperboard")}</div>
          <h2>${t("app.empty_pick_create")}</h2>
          <p>${t("app.empty_subtitle")}</p></div></div>`
    }
  `;
  // Re-attach sidebar handlers (renderMain rebuilt the DOM)
  renderSidebar();
  document.getElementById("btn-new").onclick = createDefaultProject;
  const togBtn = document.getElementById("btn-sidebar-toggle");
  if (togBtn)
    togBtn.onclick = () => {
      document.body.classList.toggle("sidebar-collapsed");
      saveCollapsed();
    };
  const tfTog = document.getElementById("btn-textfields-toggle");
  if (tfTog)
    tfTog.onclick = () => {
      document.body.classList.toggle("textfields-collapsed");
      saveCollapsed();
    };
  if (state.selected) {
    renderChatLog();
    renderComposer();
    renderPreview();
    renderFooter();
    document.getElementById("btn-send").onclick = sendMessage;
    document
      .getElementById("composer-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          sendMessage();
        }
      });
    document.getElementById("btn-attach").onclick = () =>
      document.getElementById("file-input").click();
    document.getElementById("file-input").onchange = (e) =>
      addAttachments([...e.target.files]);
    wireDragAndPaste();
    document.getElementById("btn-reload").onclick = () => {
      reloadPreview();
      refreshTextFields();
    };
    wireSoundtrackPanel();
    wireTextPaneTabs();
    wireTextPaneResizer();
  }
}

// Right column tabs: frame-text editor / narration / exported videos.
function wireTextPaneTabs() {
  const pane = document.querySelector(".text-pane");
  if (!pane) return;
  pane.querySelectorAll(".text-tab").forEach((btn) => {
    btn.onclick = () => {
      const tab = btn.dataset.textTab;
      state.rightTab = tab;
      pane
        .querySelectorAll(".text-tab")
        .forEach((b) => b.classList.toggle("active", b === btn));
      pane.querySelectorAll(".text-tab-panel").forEach((p) => {
        p.hidden = p.dataset.panel !== tab;
      });
      if (tab === "exports") renderExportsPanel();
    };
  });
  // If the pane opens straight onto the exports tab, load it now.
  if (state.rightTab === "exports") renderExportsPanel();
}

// ── Exported videos tab ───────────────────────────────────────────────────────
function fmtBytes(n) {
  if (!n || n < 1024) return `${n || 0} B`;
  const mb = n / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`;
}
function fmtWhen(ms) {
  const d = new Date(ms);
  const pad = (x) => String(x).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function renderExportsPanel() {
  const wrap = document.getElementById("exports-list");
  if (!wrap || !state.selected) return;
  wrap.innerHTML = `<div class="text-empty">${esc(t("exports.loading"))}</div>`;
  let items = [];
  try {
    const r = await fetch(`/api/projects/${state.selected.id}/exports`);
    items = (await r.json()).exports ?? [];
  } catch {
    wrap.innerHTML = `<div class="text-empty">${esc(t("exports.failed"))}</div>`;
    return;
  }
  if (!items.length) {
    wrap.innerHTML = `<div class="text-empty">${esc(t("exports.empty"))}</div>`;
    return;
  }
  wrap.innerHTML = items
    .map(
      (e) => `
    <div class="export-item${e.youtube ? " is-posted" : ""}" data-file="${esc(e.filename)}" data-path="${esc(e.path)}">
      <video class="export-video" controls preload="metadata" src="/asset?path=${encodeURIComponent(e.path)}"></video>
      <div class="export-row">
        <div class="export-meta">
          <span class="export-name" title="${esc(e.filename)}">${esc(e.filename)}</span>
          <span class="export-sub">${fmtBytes(e.sizeBytes)} · ${fmtWhen(e.mtime)}</span>
        </div>
        <button class="export-btn-icon export-youtube" title="${e.youtube ? "Đăng lại lên YouTube" : "Đăng YouTube Short"}">${ytGlyph()}</button>
        <button class="export-btn-icon export-facebook" title="${e.facebook ? "Đăng lại lên Facebook" : "Đăng Facebook Reel"}">${fbGlyph()}</button>
        <button class="export-btn-icon export-reveal" title="${esc(t("exports.reveal"))}">${icon("externalLink")}</button>
        <button class="export-btn-icon export-del" title="${esc(t("exports.delete"))}">${icon("trash")}</button>
      </div>
      ${
        e.youtube || e.facebook
          ? `<div class="export-posted-row">
        ${e.youtube ? `<a class="export-posted" href="${esc(e.youtube.url)}" target="_blank" rel="noopener" title="Mở trên YouTube">${icon("check", "ico-lead")}Đã đăng YouTube${e.youtube.postedAt ? ` · ${fmtWhen(Date.parse(e.youtube.postedAt))}` : ""}</a>` : ""}
        ${e.facebook ? `<a class="export-posted" href="${esc(e.facebook.url)}" target="_blank" rel="noopener" title="Mở trên Facebook">${icon("check", "ico-lead")}Đã đăng Facebook${e.facebook.postedAt ? ` · ${fmtWhen(Date.parse(e.facebook.postedAt))}` : ""}</a>` : ""}
      </div>`
          : ""
      }
    </div>`,
    )
    .join("");

  wrap.querySelectorAll(".export-youtube").forEach((btn) => {
    btn.onclick = () => {
      const f = btn.closest(".export-item")?.dataset.file;
      if (f) openYouTubeUpload(f);
    };
  });
  wrap.querySelectorAll(".export-facebook").forEach((btn) => {
    btn.onclick = () => {
      const f = btn.closest(".export-item")?.dataset.file;
      if (f) openFacebookUpload(f);
    };
  });
  wrap.querySelectorAll(".export-reveal").forEach((btn) => {
    btn.onclick = async () => {
      const path = btn.closest(".export-item")?.dataset.path;
      try {
        await fetch(`/api/projects/${state.selected.id}/reveal`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path }),
        });
      } catch (e) {
        toast(t("export.reveal_failed", { message: e?.message ?? e }), "error");
      }
    };
  });
  wrap.querySelectorAll(".export-del").forEach((btn) => {
    btn.onclick = async () => {
      const item = btn.closest(".export-item");
      const filename = item?.dataset.file;
      if (!filename) return;
      if (!confirm(t("exports.delete_confirm", { name: filename }))) return;
      try {
        const r = await fetch(
          `/api/projects/${state.selected.id}/delete-export`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ filename }),
          },
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        item.remove();
        if (!wrap.querySelector(".export-item"))
          wrap.innerHTML = `<div class="text-empty">${esc(t("exports.empty"))}</div>`;
        toast(t("exports.deleted"), "success");
      } catch (e) {
        toast(
          t("exports.delete_failed", { message: e?.message ?? e }),
          "error",
        );
      }
    };
  });
}

// Drag the right column's left edge to resize it. Width is stored as a CSS var
// on <html> (--tf-user-w, read as the grid fallback) and persisted to
// localStorage (TF_WIDTH_KEY, declared up top so the load-time apply runs
// before this point's definitions). Double-click resets to the default.
function tfWidthBounds() {
  return { min: 260, max: Math.min(720, Math.round(window.innerWidth * 0.55)) };
}
function applySavedTextfieldsWidth() {
  let w;
  try {
    w = Number.parseInt(localStorage.getItem(TF_WIDTH_KEY), 10);
  } catch {}
  const { min, max } = tfWidthBounds();
  if (w && w >= min)
    document.documentElement.style.setProperty(
      "--tf-user-w",
      `${Math.min(w, max)}px`,
    );
}
function wireTextPaneResizer() {
  const resizer = document.getElementById("text-pane-resizer");
  const pane = document.querySelector(".text-pane");
  if (!resizer || !pane) return;
  resizer.onmousedown = (e) => {
    e.preventDefault();
    document.body.classList.remove("textfields-collapsed"); // a drag always expands
    saveCollapsed();
    const startX = e.clientX;
    const startW = pane.getBoundingClientRect().width;
    document.body.classList.add("tf-resizing");
    const onMove = (ev) => {
      const { min, max } = tfWidthBounds();
      const w = Math.max(min, Math.min(max, startW + (startX - ev.clientX)));
      document.documentElement.style.setProperty("--tf-user-w", `${w}px`);
    };
    const onUp = () => {
      document.body.classList.remove("tf-resizing");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      const w = Number.parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--tf-user-w",
        ),
        10,
      );
      if (w) {
        try {
          localStorage.setItem(TF_WIDTH_KEY, w);
        } catch {}
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };
  resizer.ondblclick = () => {
    document.documentElement.style.removeProperty("--tf-user-w");
    try {
      localStorage.removeItem(TF_WIDTH_KEY);
    } catch {}
  };
}

/**
 * Soundtrack panel: generate free Edge-TTS narration, stream SSE progress,
 * preview the resulting MP3. The narration is stored on the project's
 * soundtrack and mixed in automatically at export time.
 */
function wireSoundtrackPanel() {
  const panel = document.getElementById("soundtrack-panel");
  if (!panel) return;
  const narrationText = document.getElementById("st-narration-text");
  const narrationVol = document.getElementById("st-narration-vol");
  const narrationVolVal = document.getElementById("st-narration-vol-val");
  const narrationSpeed = document.getElementById("st-narration-speed");
  const narrationSpeedVal = document.getElementById("st-narration-speed-val");
  const genNarrationBtn = document.getElementById("btn-st-gen-narration");
  const clearBtn = document.getElementById("btn-st-clear");
  const narrationStatusEl = document.getElementById("st-narration-status");
  const previewEl = document.getElementById("st-preview");
  const draftFrameBtn = document.getElementById("btn-st-draft-frame");
  const draftAllBtn = document.getElementById("btn-st-draft-all");
  const whichEl = document.getElementById("st-narration-which");

  // Status line under the synth button: busy = spinner, done = green + check,
  // error = red. Plain text otherwise.
  const setNarrStatus = (kind, text) => {
    const el = narrationStatusEl;
    if (!el) return;
    el.classList.remove("is-busy", "is-done", "is-error");
    if (kind === "busy") {
      el.classList.add("is-busy");
      el.innerHTML = `<span class="st-spinner" aria-hidden="true"></span>${esc(text)}`;
    } else if (kind === "done") {
      el.classList.add("is-done");
      el.innerHTML = `${icon("check", "ico-lead")}${esc(text)}`;
    } else if (kind === "error") {
      el.classList.add("is-error");
      el.textContent = text;
    } else el.textContent = text || "";
  };

  // ---- Per-frame narration model ----------------------------------------
  // narrationByFrame: { [graphNodeId]: text }. The textarea always shows the
  // line for the CURRENTLY SELECTED frame (state.activeFrameId); editing it
  // writes back to that frame. Switching frames in the strip swaps the text.
  const sortedFrames = [...(state.selected?.frames ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const hasFrames = sortedFrames.length > 0;
  // Seed from saved soundtrack; migrate a legacy single narrationText onto frame 1.
  state._narrationByFrame = {
    ...(state.selected?.soundtrack?.narrationByFrame ?? {}),
  };
  if (
    !Object.keys(state._narrationByFrame).length &&
    state.selected?.soundtrack?.narrationText &&
    sortedFrames[0]
  ) {
    state._narrationByFrame[sortedFrames[0].graphNodeId] =
      state.selected.soundtrack.narrationText;
  }
  const frameLabel = (fid) => {
    const i = sortedFrames.findIndex((f) => f.graphNodeId === fid);
    return i >= 0
      ? `${t("soundtrack.frame_word")} ${i + 1}/${sortedFrames.length}`
      : "";
  };
  // Read frames LIVE from state (not the wire-time snapshot) so button state is
  // always correct no matter what changed it (generate / regen / switch / clear).
  const liveFrames = () =>
    [...(state.selected?.frames ?? [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
  const currentFrameId = () =>
    state.activeFrameId ?? liveFrames()[0]?.graphNodeId ?? null;
  const syncNarrationField = () => {
    const frames = liveFrames();
    const has = frames.length > 0;
    const fid = currentFrameId();
    if (whichEl) {
      const i = frames.findIndex((f) => f.graphNodeId === fid);
      // Spell out which frame the script + "✨ draft this frame" act on, so it's
      // obvious the per-frame buttons follow the selected frame (issues #5):
      // users couldn't tell "draft this frame" only touched the active one.
      whichEl.textContent =
        has && i >= 0
          ? frames.length > 1
            ? t("soundtrack.editing_frame", { n: i + 1, total: frames.length })
            : ""
          : "";
    }
    // Only overwrite the textarea when it isn't the user's in-progress edit.
    if (document.activeElement !== narrationText) {
      narrationText.value = (fid && state._narrationByFrame[fid]) || "";
    }
    const dis = !has || !fid;
    if (draftFrameBtn) {
      draftFrameBtn.disabled = dis;
      draftFrameBtn.title = dis ? t("soundtrack.draft_need_frames") : "";
    }
    if (draftAllBtn) {
      draftAllBtn.disabled = !has;
      draftAllBtn.title = has ? "" : t("soundtrack.draft_need_frames");
    }
    const fitBtn = document.getElementById("btn-st-fit");
    if (fitBtn) {
      const anyNarr = Object.values(state._narrationByFrame || {}).some((v) =>
        (v || "").trim(),
      );
      fitBtn.disabled = !has || !anyNarr;
    }
  };
  // Persist edits back to the active frame as the user types.
  narrationText.oninput = () => {
    const fid = currentFrameId();
    if (fid) state._narrationByFrame[fid] = narrationText.value;
  };
  // Expose so ANY state change (frame switch, generation finished, regen, etc.)
  // can re-evaluate button enablement + the shown line without re-rendering the
  // whole panel. Called from renderPreview() — the convergence point all those
  // paths already hit — so buttons can never get stuck stale.
  window.__hvSyncNarration = syncNarrationField;
  syncNarrationField();

  async function draftNarration(frameId /* null = all */) {
    if (!state.selected) return;
    const btn = frameId ? draftFrameBtn : draftAllBtn;
    const label = btn?.innerHTML;
    if (btn) {
      btn.disabled = true;
      btn.textContent = t("soundtrack.drafting");
    }
    try {
      const res = await fetch(
        `/api/projects/${state.selected.id}/draft-narration`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            agentId:
              state.selected.agentId ??
              state.agents.find((a) => a.available && a.id !== "amr")?.id ??
              "anthropic-api",
            ...(frameId && { frameId }),
          }),
        },
      );
      const data = await res.json();
      if (res.ok && data.narrationByFrame) {
        // Merge (single-frame draft only returns that frame; global returns all).
        Object.assign(state._narrationByFrame, data.narrationByFrame);
        syncNarrationField();
      } else {
        setNarrStatus(
          "error",
          t("soundtrack.draft_failed", {
            message: data.error || `HTTP ${res.status}`,
          }),
        );
      }
    } catch (e) {
      setNarrStatus(
        "error",
        t("soundtrack.draft_failed", { message: e?.message ?? e }),
      );
    } finally {
      if (btn) {
        btn.innerHTML = label;
      }
      syncNarrationField();
    }
  }
  if (draftFrameBtn)
    draftFrameBtn.onclick = () => draftNarration(currentFrameId());
  if (draftAllBtn) draftAllBtn.onclick = () => draftNarration(null);

  // "Fit to narration": re-pace each frame's duration by its narration length.
  const fitBtn = document.getElementById("btn-st-fit");
  if (fitBtn) {
    const anyNarration = () =>
      Object.values(state._narrationByFrame || {}).some((v) =>
        (v || "").trim(),
      );
    fitBtn.disabled = !hasFrames || !anyNarration();
    fitBtn.onclick = async () => {
      if (!state.selected || !anyNarration()) return;
      const label = fitBtn.innerHTML;
      fitBtn.disabled = true;
      fitBtn.textContent = t("soundtrack.fitting");
      try {
        const res = await fetch(
          `/api/projects/${state.selected.id}/fit-durations`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ narrationByFrame: state._narrationByFrame }),
          },
        );
        const data = await res.json();
        if (res.ok && data.ok) {
          toast(t("soundtrack.fitted", { sec: data.totalSec }), "success");
          // Refresh frames so the strip + preview reflect the new per-frame durations.
          if (typeof renderPreview === "function") renderPreview();
          if (typeof renderFramesStrip === "function") renderFramesStrip();
        } else {
          toast(data.error || t("soundtrack.fit_failed"), "error");
        }
      } catch (e) {
        toast(`${e?.message ?? e}`, "error");
      } finally {
        fitBtn.innerHTML = label;
        fitBtn.disabled = !anyNarration();
      }
    };
  }

  // Restore previously generated soundtrack (narration preview + volume).
  const st = state.selected?.soundtrack;
  if (st) {
    if (typeof st.narrationVolumeDb === "number")
      narrationVol.value = String(st.narrationVolumeDb);
    if (typeof st.narrationSpeed === "number" && narrationSpeed)
      narrationSpeed.value = String(st.narrationSpeed);
    renderSoundtrackPreview(st);
    // A narration already exists → surface the ready state right away.
    if (st.narrationAssetId) setNarrStatus("done", t("soundtrack.done"));
  }
  narrationVolVal.textContent = `${narrationVol.value} dB`;
  narrationVol.oninput = () => {
    narrationVolVal.textContent = `${narrationVol.value} dB`;
  };
  if (narrationSpeed && narrationSpeedVal) {
    const showSpeed = () => {
      narrationSpeedVal.textContent = `${Number(narrationSpeed.value).toFixed(2)}×`;
    };
    showSpeed();
    narrationSpeed.oninput = showSpeed;
  }

  clearBtn.onclick = async () => {
    if (!state.selected) return;
    await fetch(`/api/projects/${state.selected.id}/soundtrack`, {
      method: "DELETE",
    });
    narrationText.value = "";
    previewEl.innerHTML = "";
    setNarrStatus("", "");
    if (state.selected) delete state.selected.soundtrack;
  };

  // Synthesize narration via the free Edge-TTS engine.
  async function runGenerate() {
    if (!state.selected) return;
    const btn = genNarrationBtn;
    const statusEl = narrationStatusEl;
    const payload = {};
    {
      // Stitch every frame's line into ONE narration track, in frame order.
      // Read frames LIVE (not the render-time snapshot) AND also append any
      // narration entries whose key isn't in the current frame list. Without
      // that, lines get silently dropped when a frame's id and its content-graph
      // node id drift apart (regenerate) — the bug where only frame 1 got voiced.
      const byFrame = state._narrationByFrame || {};
      const frameOrder = liveFrames().map((f) => f.graphNodeId);
      const orderedKeys = [
        ...new Set([...frameOrder, ...Object.keys(byFrame)].filter(Boolean)),
      ];
      const stitched = orderedKeys
        .map((k) => (byFrame[k] || "").trim())
        .filter((s) => s.length > 0)
        .join("\n");
      const nt = stitched || narrationText.value.trim();
      if (!nt) {
        setNarrStatus("error", t("soundtrack.empty_narration"));
        return;
      }
      const voiceSel = document.getElementById("st-narration-voice");
      const captionsChk = document.getElementById("st-narration-captions");
      payload.narration = {
        text: nt,
        volumeDb: Number(narrationVol.value),
        speed: Number(narrationSpeed?.value ?? 1),
        byFrame: state._narrationByFrame,
        captions: !!captionsChk?.checked,
        ...(voiceSel?.value && { voiceId: voiceSel.value }),
      };
    }

    const label = btn?.innerHTML;
    if (btn) btn.disabled = true;
    clearBtn.disabled = true;
    setNarrStatus("busy", t("soundtrack.starting"));

    let res;
    try {
      res = await fetch(`/api/projects/${state.selected.id}/generate-audio`, {
        method: "POST",
        headers: {
          accept: "text/event-stream",
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      setNarrStatus(
        "error",
        t("soundtrack.failed", { message: e?.message ?? e }),
      );
      if (btn) btn.disabled = false;
      clearBtn.disabled = false;
      return;
    }
    if (!res.ok || !res.body) {
      setNarrStatus(
        "error",
        t("soundtrack.failed", { message: `HTTP ${res.status}` }),
      );
      if (btn) btn.disabled = false;
      clearBtn.disabled = false;
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const line of events) {
          if (!line.startsWith("data: ")) continue;
          let ev;
          try {
            ev = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (ev.type === "audio_progress") {
            setNarrStatus("busy", t("soundtrack.progress_narration"));
          } else if (ev.type === "audio_done") {
            setNarrStatus("done", t("soundtrack.done"));
            if (ev.project) state.selected = ev.project;
            renderSoundtrackPreview(ev.soundtrack);
          } else if (ev.type === "audio_failed") {
            setNarrStatus(
              "error",
              t("soundtrack.failed", { message: ev.message }),
            );
          }
        }
      }
    } catch (e) {
      setNarrStatus(
        "error",
        t("soundtrack.failed", { message: e?.message ?? e }),
      );
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = label;
      }
      clearBtn.disabled = false;
    }
  }
  if (genNarrationBtn) genNarrationBtn.onclick = () => runGenerate();
}

function renderSoundtrackPreview(soundtrack) {
  const previewEl = document.getElementById("st-preview");
  if (!previewEl || !soundtrack || !state.selected) return;
  const assets = state.selected.assets || [];
  const srcFor = (id) => {
    const a = assets.find((x) => x.id === id);
    return a?.path ? `/asset?path=${encodeURIComponent(a.path)}` : null;
  };
  const blocks = [];
  const narrSrc =
    soundtrack.narrationAssetId && srcFor(soundtrack.narrationAssetId);
  if (narrSrc)
    blocks.push(
      `<div class="st-track"><span>${t("soundtrack.narration_ready")}</span><audio controls src="${narrSrc}"></audio></div>`,
    );
  previewEl.innerHTML = blocks.join("");
}

// ============== composer attachments ==============
function attachmentKind(file) {
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (
    t === "application/json" ||
    t === "text/csv" ||
    /\.(csv|tsv|json)$/i.test(file.name)
  )
    return "data";
  if (t.startsWith("text/")) return "text";
  return "reference-link";
}
function iconForKind(k) {
  return (
    {
      image: icon("image"),
      video: icon("video"),
      audio: icon("music"),
      data: icon("barChart"),
      text: icon("type"),
    }[k] ?? icon("paperclip")
  );
}

function addAttachments(files) {
  for (const f of files) {
    const kind = attachmentKind(f);
    const att = { file: f, name: f.name, kind, size: f.size };
    state.pendingAttachments.push(att);
    if (kind === "image") {
      const r = new FileReader();
      r.onload = (e) => {
        att.dataUrl = e.target.result;
        renderAttachments();
      };
      r.readAsDataURL(f);
    }
  }
  renderAttachments();
}

function removeAttachment(i) {
  state.pendingAttachments.splice(i, 1);
  renderAttachments();
}

function renderAttachments() {
  const wrap = document.getElementById("attachments");
  if (!wrap) return;
  wrap.innerHTML = state.pendingAttachments
    .map((a, i) => {
      const thumb = a.dataUrl
        ? `<img src="${a.dataUrl}" alt="" />`
        : `<span class="ico">${iconForKind(a.kind)}</span>`;
      return `<span class="att-chip">
      ${thumb}
      <span class="name" title="${esc(a.name)}">${esc(a.name)}</span>
      <button data-i="${i}" title="Remove">${icon("x")}</button>
    </span>`;
    })
    .join("");
  wrap.querySelectorAll("button[data-i]").forEach((btn) => {
    btn.onclick = () => removeAttachment(Number(btn.dataset.i));
  });
}

function wireDragAndPaste() {
  const shell = document.getElementById("composer-shell");
  const ta = document.getElementById("composer-input");
  if (!shell) return;
  shell.addEventListener("dragover", (e) => {
    e.preventDefault();
    shell.classList.add("dragging");
  });
  shell.addEventListener("dragleave", () => shell.classList.remove("dragging"));
  shell.addEventListener("drop", (e) => {
    e.preventDefault();
    shell.classList.remove("dragging");
    if (e.dataTransfer?.files?.length)
      addAttachments([...e.dataTransfer.files]);
  });
  ta.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const it of items) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addAttachments(files);
    }
  });
}

function renderComposer() {
  const p = state.selected;
  const ta = document.getElementById("composer-input");
  const sendBtn = document.getElementById("btn-send");
  if (!ta) return;
  const availableAgents = state.agents.filter((a) => a.available);
  const agentsKnown = state.agents.length > 0;
  const canType = !!p && !state.composing;
  const canSend = !!(p && availableAgents.length > 0 && !state.composing);
  ta.disabled = !canType;
  sendBtn.disabled = !canSend;

  // Focus chip: when a frame is pinned for single-frame iterate, show it
  // above the textarea so the user knows their next message will only
  // rewrite that frame. Click to clear.
  const shell = document.getElementById("composer-shell");
  if (shell) {
    let chip = shell.querySelector(".focus-chip");
    const focus = state.iterateFocusFrameId;
    if (focus) {
      const order =
        (p?.frames ?? []).find((f) => f.graphNodeId === focus)?.order ?? 0;
      const orderStr = String(order + 1).padStart(2, "0");
      const html = `${iconL("crosshair")}${t("composer.focus_chip", { order: orderStr, fid: "" })}<span class="fid">${esc(focus)}</span><button title="${t("composer.focus_clear")}" type="button">${icon("x")}</button>`;
      if (!chip) {
        chip = document.createElement("div");
        chip.className = "focus-chip";
        // Insert above attachments (or as first child).
        shell.insertBefore(chip, shell.firstChild);
      }
      chip.innerHTML = html;
      chip.querySelector("button").onclick = (e) => {
        e.stopPropagation();
        state.iterateFocusFrameId = null;
        renderComposer();
        renderFramesStrip();
      };
    } else if (chip) {
      chip.remove();
    }
  }

  ta.placeholder = !p
    ? t("composer.placeholder.no_project")
    : !agentsKnown
      ? t("composer.placeholder.detecting_agents")
      : availableAgents.length === 0
        ? t("composer.placeholder.no_agent")
        : state.iterateFocusFrameId
          ? t("composer.placeholder.focus")
          : !p.templateId
            ? t("composer.placeholder.no_template")
            : t("composer.placeholder.with_template");
}

function renderFooter() {
  const p = state.selected;
  const fs = document.getElementById("footer-status");
  if (!fs) return;
  if (p) {
    fs.innerHTML = `<b>${esc(p.name)}</b> · ${p.templateId ? `template <b>${esc(p.templateId)}</b>` : "<i>no template</i>"} · ${p.status}`;
  } else {
    fs.textContent = "no project";
  }
}

// ============== chat log ==============
function renderChatLog() {
  const log = document.getElementById("chat-log");
  if (!log) return;
  if (!state.messages.length) {
    log.innerHTML = `<div class="chat-empty"><div><div class="ico">${icon("message")}</div>
      <div style="font-weight:500;margin-bottom:6px;">${t("chat.empty.title")}</div>
      ${t("chat.empty.body")}
      <div class="examples">
        <b>"Warm-grain magazine outro: Open Design — design that evolves itself"</b>
        <b>"Cyberpunk glitch title saying SYSTEM ONLINE, neon cyan/magenta"</b>
        <b>"Swiss-grid data card: Templates 231, Skills 15, Systems 150, Craft 11"</b>
      </div>
    </div></div>`;
    return;
  }
  log.innerHTML = state.messages.map((m, i) => renderMessage(m, i)).join("");
  log.querySelectorAll("button.opt[data-opt-msg]").forEach((btn) => {
    btn.onclick = () => {
      const msgIdx = Number(btn.dataset.optMsg);
      const optI = Number(btn.dataset.optI);
      const m = state.messages[msgIdx];
      if (!m || m.pickedOption) return;
      const { options } = parseHvOptions(m.content ?? "");
      if (!options) return;
      const picked = options.options[optI];
      const label = picked?.label ?? "";
      m.pickedOption = label;
      // Fire as a new user turn
      pickAndSend(label);
    };
  });
  // Inline freeform input on each hv-options card
  log.querySelectorAll("textarea[data-freeform-msg]").forEach((ta) => {
    const msgIdx = Number(ta.dataset.freeformMsg);
    const sendBtn = log.querySelector(
      `button.freeform-send[data-freeform-msg="${msgIdx}"]`,
    );
    const submit = () => {
      const text = ta.value.trim();
      if (!text) return;
      const m = state.messages[msgIdx];
      if (!m || m.pickedOption) return;
      m.pickedOption = text; // mark answered so options collapse
      pickAndSend(text);
    };
    const autoResize = () => {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight + 2, 160)}px`;
    };
    ta.addEventListener("input", () => {
      if (sendBtn) sendBtn.disabled = ta.value.trim().length === 0;
      autoResize();
    });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });
    if (sendBtn) sendBtn.onclick = submit;
  });
  // hv-form: collect field values + optional file attachments, submit as
  // [hv-form:submit]\n<json>. Files go through the existing pendingAttachments
  // path so the server multipart handler treats them like normal uploads.
  // Segmented buttons: click writes to the hidden input + flips .selected.
  // Update the live "total = per_frame × frames" readout for a form card.
  const updateFormTotal = (msgIdx) => {
    const totalEl = document.getElementById(`form-total-${msgIdx}`);
    if (!totalEl) return;
    const card = totalEl.closest(".form-card");
    const val = (key) => {
      const h = card?.querySelector(
        `.form-seg[data-form-key="${CSS.escape(key)}"] input[type="hidden"]`,
      );
      return Number(h?.value || 0);
    };
    const pf = val("per_frame");
    const fc = val("frame_count");
    totalEl.textContent =
      pf > 0 && fc > 0
        ? `${t("soundtrack.total_word") || "Total"} ≈ ${pf * fc}s`
        : "";
  };
  log.querySelectorAll(".form-seg-btn[data-form-msg]").forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      if (btn.disabled) return;
      const seg = btn.closest(".form-seg");
      if (!seg) return;
      seg
        .querySelectorAll(".form-seg-btn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      const hidden = seg.querySelector('input[type="hidden"]');
      if (hidden) hidden.value = btn.dataset.val ?? "";
      updateFormTotal(Number(btn.dataset.formMsg));
    };
  });
  // Initial paint of any total readouts present.
  log
    .querySelectorAll('[id^="form-total-"]')
    .forEach((el) => updateFormTotal(Number(el.id.replace("form-total-", ""))));
  log.querySelectorAll("button.form-submit[data-form-msg]").forEach((btn) => {
    btn.onclick = async () => {
      const msgIdx = Number(btn.dataset.formMsg);
      const m = state.messages[msgIdx];
      if (!m || m.formSubmitted) return;
      const card = btn.closest(".form-card");
      if (!card) return;
      const collected = {};
      let missing = null;
      // Only grab inputs / textareas / selects — buttons share the data-form-key
      // attribute but their .value is empty, would clobber the real one.
      card
        .querySelectorAll(
          "input[data-form-key], textarea[data-form-key], select[data-form-key]",
        )
        .forEach((el) => {
          const key = el.dataset.formKey;
          const val = (el.value || "").trim();
          if (
            !val &&
            card.querySelector("label .req") &&
            card
              .querySelector(`[data-form-key="${CSS.escape(key)}"]`)
              .closest(".form-field")
              ?.querySelector("label .req")
          ) {
            // Required field that's empty
            missing = key;
          }
          collected[key] = val;
        });
      if (missing) {
        toast(`${t("text_pane.save_state.error")}: ${missing}`, "warn");
        return;
      }
      m.formSubmitted = collected;
      // Files: read from the existing form-att-<msgIdx> tray and route them
      // through state.pendingAttachments so sendMessage's multipart path picks
      // them up.
      const submitText = `[hv-form:submit]\n${JSON.stringify(collected, null, 2)}`;
      const ta = document.getElementById("composer-input");
      if (ta) ta.value = submitText;
      await sendMessage();
    };
  });
  // hv-form attach button — same flow as composer's 📎 button, scoped to the card.
  log
    .querySelectorAll("button.form-attach-btn[data-form-msg]")
    .forEach((btn) => {
      btn.onclick = () => {
        const msgIdx = Number(btn.dataset.formMsg);
        const fi = document.getElementById(`form-file-${msgIdx}`);
        if (fi) fi.click();
      };
    });
  log.querySelectorAll('input[type="file"][id^="form-file-"]').forEach((fi) => {
    fi.onchange = (e) => addAttachments([...e.target.files]);
  });
  // hv-confirm: generate / edit buttons
  log.querySelectorAll("[data-confirm-msg]").forEach((btn) => {
    btn.onclick = async () => {
      const msgIdx = Number(btn.dataset.confirmMsg);
      const action = btn.dataset.action;
      const m = state.messages[msgIdx];
      if (!m) return;
      // In-flight guard only — don't permanently mark resolved here. Whether
      // the card stays locked is recomputed from history each render
      // (renderMessage inspects whether the click actually produced output).
      if (m.confirmInFlight) return;
      m.confirmInFlight = true;
      renderChatLog(); // hide the buttons immediately → "⏳ Đang tạo…"
      try {
        const ta = document.getElementById("composer-input");
        if (ta)
          ta.value =
            action === "generate"
              ? "[hv-confirm:generate]"
              : "[hv-confirm:edit]";
        await sendMessage();
      } finally {
        m.confirmInFlight = false;
        renderChatLog(); // restore buttons if it failed; stays locked if it succeeded
      }
    };
  });
  // hv-brief: approve (with any edits) → generate HTML from this content
  log.querySelectorAll("button.brief-go[data-brief-msg]").forEach((btn) => {
    btn.onclick = async () => {
      const msgIdx = Number(btn.dataset.briefMsg);
      const m = state.messages[msgIdx];
      if (!m || m.briefApproved) return;
      const card = btn.closest(".form-card");
      const txt = card?.querySelector("textarea[data-brief-msg]")?.value ?? "";
      if (!txt.trim()) {
        toast("Nội dung đang trống", "warn");
        return;
      }
      m.briefApproved = true;
      const ta = document.getElementById("composer-input");
      if (ta) ta.value = `[hv-brief:approve]\n${txt}`;
      await sendMessage();
    };
  });
  log.querySelectorAll("[data-export-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.exportAction;
      const card = btn.closest(".export-done");
      const path = card?.querySelector(".export-path code")?.textContent ?? "";
      if (action === "youtube") {
        openYouTubeUpload(path.split("/").pop() || "");
      } else if (action === "facebook") {
        openFacebookUpload(path.split("/").pop() || "");
      } else if (action === "open-video") {
        // Jump to the Video tab in the right pane (un-collapse it first).
        document.body.classList.remove("textfields-collapsed");
        saveCollapsed();
        document.querySelector('.text-tab[data-text-tab="exports"]')?.click();
      } else if (action === "reveal") {
        // Reveal THIS card's file (not just the latest export).
        try {
          await fetch(`/api/projects/${state.selected.id}/reveal`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ path }),
          });
        } catch (e) {
          toast(
            t("export.reveal_failed", { message: e?.message ?? e }),
            "error",
          );
        }
      } else if (action === "copy" && path) {
        try {
          await navigator.clipboard.writeText(path);
          toast(t("export.copied"), "success");
        } catch (e) {
          toast(t("export.copy_failed", { message: e?.message ?? e }), "error");
        }
      }
    });
  });
  log.scrollTop = log.scrollHeight;
}

async function pickAndSend(label) {
  // Stuff the textarea with the chosen label and send it as a normal turn
  const ta = document.getElementById("composer-input");
  if (ta) ta.value = label;
  renderChatLog(); // shows the picked highlight on the previous message
  await sendMessage();
}

function renderMessage(m, idx) {
  if (m.role === "user") {
    // User-side form-submission marker carries hidden JSON the user can't read;
    // show a friendlier label instead of a wall of "topic=foo\nheadline=bar…".
    const formMatch = /^\[hv-form:submit\]\n([\s\S]*)$/.exec(m.content ?? "");
    if (formMatch) {
      return `<div class="msg user">${iconL("clipboard")}${t("chat.summary.form_submitted")}</div>`;
    }
    if ((m.content ?? "").trim() === "[hv-confirm:generate]") {
      return `<div class="msg user">${iconL("check")}${t("chat.summary.confirm_generate")}</div>`;
    }
    if ((m.content ?? "").trim() === "[hv-confirm:edit]") {
      return `<div class="msg user">${iconL("edit")}${t("chat.summary.confirm_edit")}</div>`;
    }
    if ((m.content ?? "").startsWith("[hv-brief:approve]")) {
      return `<div class="msg user">${iconL("check")}Đã duyệt nội dung</div>`;
    }
    return `<div class="msg user">${esc(m.content)}</div>`;
  }
  if (m.role === "system")
    return `<div class="msg system">${esc(m.content)}</div>`;
  if (m.role === "preview-event") {
    const c = (m.content ?? "").trim();
    // Multi-line / long = a generation progress log → render as a readable
    // left-aligned panel, one step per line with decorated glyphs. Short
    // one-liners (e.g. "🎞 storyboard reloaded (4 frames)") keep the pill.
    if (/\n/.test(c) || c.length > 90) {
      const lines = c
        // Break before each progress marker so every step lands on its own
        // line, whether the server joined them with newlines or spaces.
        .replace(/\s*(✓|🎬|🎞|⏳|🧠|📋|📄)/g, "\n$1")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const body = lines
        .map((l) => `<div class="gp-line">${decorateProgress(esc(l))}</div>`)
        .join("");
      return `<div class="msg gen-progress">${body}</div>`;
    }
    return `<div class="msg preview-event">${decorateProgress(esc(c))}</div>`;
  }
  if (m.role === "thinking")
    return `<div class="msg thinking">${esc(m.content || t("chat.thinking"))}</div>`;
  if (m.role === "export-done") {
    const path = m.content || "";
    const fname = path.split("/").pop() || "output.mp4";
    return `<div class="msg export-done">
      <div class="export-title">${iconL("clapperboard")}${t("export.title")}</div>
      <div class="export-path"><code>${esc(path)}</code></div>
      <div class="export-actions">
        <button class="export-btn-icon" data-export-action="youtube" title="Đăng YouTube Short">${ytGlyph()}</button>
        <button class="export-btn-icon" data-export-action="facebook" title="Đăng Facebook Reel">${fbGlyph()}</button>
        <button class="export-btn-icon" data-export-action="open-video" title="${esc(t("export.open_video"))}">${icon("film")}</button>
        <button class="export-btn-icon" data-export-action="reveal" title="${esc(t("export.reveal"))}">${icon("folder")}</button>
        <button class="export-btn-icon" data-export-action="copy" title="${esc(t("export.copy_path"))}">${icon("copy")}</button>
      </div>
      <div class="export-fname">${esc(fname)}</div>
    </div>`;
  }
  // assistant: try each card protocol in turn
  const raw = m.content ?? "";
  const formP = parseHvForm(raw);
  if (formP.form) {
    // Resolve "submitted" from history: any user turn after this card with
    // [hv-form:submit] marker counts as the answer.
    let submitted = m.formSubmitted;
    if (!submitted) {
      const nextUser = state.messages
        .slice(idx + 1)
        .find((x) => x.role === "user");
      if (nextUser) {
        const fm = /^\[hv-form:submit\]\n([\s\S]*)$/.exec(
          nextUser.content ?? "",
        );
        if (fm && fm[1]) {
          try {
            submitted = JSON.parse(fm[1]);
          } catch {
            submitted = null;
          }
        }
      }
    }
    const formHtml = renderFormCard(formP.form, submitted, idx);
    return `<div class="msg assistant">
      <div class="role">${esc(m.agent ?? "agent")}</div>
      <div class="body">${md(sanitizeAssistantProse(formP.prose))}${formHtml}</div>
    </div>`;
  }
  const confirmP = parseHvConfirm(raw);
  if (confirmP.confirm) {
    // Only lock the card when the click actually led somewhere:
    //   - "✏️ 改一下" → next assistant turn re-emitted hv-form (the edit landed)
    //   - "✓ 开始生成" → next assistant turn produced real output
    //                   (preview-event / ✓ HTML preview / storyboard summary)
    // If the click triggered an empty reply or generate failed, treat the
    // card as live so the user can press the button again.
    let resolved = m.confirmResolved;
    if (!resolved) {
      const after = state.messages.slice(idx + 1);
      const nextUser = after.find((x) => x.role === "user");
      if (nextUser) {
        const ans = (nextUser.content ?? "").trim();
        if (ans === "[hv-confirm:generate]") {
          // Did anything productive happen between this user click and the
          // next user turn?
          const userIdx = after.indexOf(nextUser);
          const between = after.slice(userIdx + 1);
          const sawSuccess = between.some((x) => {
            if (x.role === "preview-event") return true;
            if (x.role === "assistant") {
              const c = (x.content ?? "").trim();
              if (!c) return false;
              if (/^⚠️/.test(c)) return false;
              if (/^✓\s/.test(c)) return true;
              if (/storyboard generated|HTML preview updated/i.test(c))
                return true;
            }
            return false;
          });
          if (sawSuccess) resolved = t("card.confirm_generate");
        } else if (ans === "[hv-confirm:edit]") {
          resolved = t("card.confirm_edit");
        }
      }
    }
    // In-flight (clicked, generation running): lock the card + show a spinner
    // state so the button can't be clicked again while the agent is working.
    const pending = !resolved && !!m.confirmInFlight;
    const confirmHtml = renderConfirmCard(confirmP.confirm, resolved, idx, pending);
    return `<div class="msg assistant">
      <div class="role">${esc(m.agent ?? "agent")}</div>
      <div class="body">${md(sanitizeAssistantProse(confirmP.prose))}${confirmHtml}</div>
    </div>`;
  }
  // Content-brief review card: editable content shown BEFORE HTML generation.
  const briefP = parseHvBrief(raw);
  if (briefP.brief !== null) {
    // Lock once a following user turn approved it.
    let approved = m.briefApproved;
    if (!approved) {
      const nextUser = state.messages
        .slice(idx + 1)
        .find((x) => x.role === "user");
      if (nextUser && (nextUser.content ?? "").startsWith("[hv-brief:approve]"))
        approved = true;
    }
    const briefHtml = renderBriefCard(briefP.brief, approved, idx);
    return `<div class="msg assistant">
      <div class="role">${esc(m.agent ?? "agent")}</div>
      <div class="body">${md(sanitizeAssistantProse(briefP.prose))}${briefHtml}</div>
    </div>`;
  }
  // Default: hv-options + prose
  const { prose, options } = parseHvOptions(raw);
  // m.pickedOption is in-memory only — wiped on reload. Recover it from
  // history: any user turn AFTER this card is implicitly the answer.
  let picked = m.pickedOption;
  if (options && !picked) {
    const nextUser = state.messages
      .slice(idx + 1)
      .find((x) => x.role === "user");
    if (nextUser) picked = nextUser.content;
  }
  const optionsHtml = options ? renderOptionCard(options, picked, idx) : "";
  return `<div class="msg assistant">
    <div class="role">${esc(m.agent ?? "agent")}</div>
    <div class="body">${md(sanitizeAssistantProse(prose))}${optionsHtml}</div>
  </div>`;
}

/**
 * Strip HTML / content-graph code blocks from assistant text before render.
 * Streaming text comes in raw — without this the user sees a wall of CSS /
 * JSX / HTML scrolling past. We replace each block with a one-line collapsed
 * marker so they know something is being generated, but don't have to read
 * 600 lines of style declarations.
 *
 * Acts on render only; the underlying message content is untouched, so the
 * server's persisted "✓ frame X updated" summary still wins on reload.
 */
function sanitizeAssistantProse(text) {
  if (!text) return text;
  let out = text;
  const genHtml = t("chat.placeholder.gen_html");
  const planGraph = t("chat.placeholder.plan_graph");
  // ```html ... ``` (full block) — closed
  out = out.replace(/```html(?:#[\w-]+)?\s*\n[\s\S]*?```/gi, `\n${genHtml}\n`);
  // ```html ... (still open, mid-stream) — clip everything after the fence
  out = out.replace(/```html(?:#[\w-]+)?\s*\n[\s\S]*$/i, `\n${genHtml}`);
  // ```json#content-graph ...```
  out = out.replace(
    /```json#content-graph\s*\n[\s\S]*?```/gi,
    `\n${planGraph}\n`,
  );
  out = out.replace(/```json#content-graph\s*\n[\s\S]*$/i, `\n${planGraph}`);
  // ```hv-form / ```hv-confirm / ```hv-options blocks are parsed by their
  // own renderers above; if we got here they slipped past — collapse them.
  out = out.replace(/```hv-(?:form|confirm|options)\s*\n[\s\S]*?```/gi, "");
  return out;
}

// === Markdown rendering ===
// Uses `marked` from CDN for proper headings/lists/bold/links/code,
// then DOMPurify to sanitize, so user prompts can't inject script tags
// even if the agent echos them back.
// Swap the plain-text progress glyphs the server streams (📋/🎬/🎞) for the
// standard SVG icon set, and tint success ticks with the primary accent. Runs
// AFTER sanitize on trusted, fixed markup (DOMPurify strips <svg>, so it can't
// run before). The underlying message content is untouched, so phase detection
// (which reads m.content) is unaffected.
function decorateProgress(html) {
  return String(html)
    .replace(/📋️?/g, () => icon("clipboard"))
    .replace(/🎬️?/g, () => icon("clapperboard"))
    .replace(/🎞️?/g, () => icon("film"))
    .replace(/✓/g, '<span class="ok-check">✓</span>');
}
function md(text) {
  if (!text) return "";
  let html;
  if (typeof window.marked !== "undefined") {
    try {
      html = window.marked.parse(String(text), { breaks: true, gfm: true });
    } catch {
      html = esc(text);
    }
  } else {
    // Fallback: render bare with line breaks if CDN failed to load
    html = esc(text).replace(/\n/g, "<br>");
  }
  if (typeof window.DOMPurify !== "undefined") {
    html = window.DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "b",
        "i",
        "u",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "a",
        "code",
        "pre",
        "blockquote",
        "hr",
        "span",
      ],
      ALLOWED_ATTR: ["href", "title", "target", "rel"],
    });
  }
  return decorateProgress(html);
}

// === hv-options block parsing ===
// Splits assistant text into prose + an optional ```hv-options``` block.
function parseHvOptions(text) {
  const m = /```hv-options\s*\n([\s\S]*?)```/i.exec(text);
  if (!m) return { prose: text, options: null };
  const prose = (
    text.slice(0, m.index) + text.slice(m.index + m[0].length)
  ).trim();
  let parsed;
  try {
    parsed = JSON.parse(m[1].trim());
  } catch {
    return { prose: text, options: null };
  }
  if (!parsed || !Array.isArray(parsed.options) || !parsed.question) {
    return { prose: text, options: null };
  }
  return { prose, options: parsed };
}

// === hv-form block parsing ===
// Multi-field input card. Schema:
//   ```hv-form
//   {
//     "title": "讲一下你想做的视频…",
//     "fields": [
//       { "key": "topic",     "label": "主题 / who-what",   "kind": "text",     "required": true },
//       { "key": "headline",  "label": "Headline",          "kind": "text",     "required": true },
//       { "key": "data",      "label": "关键数字 / 数据",   "kind": "textarea" },
//       { "key": "aspect",    "label": "尺寸",              "kind": "select",   "options": ["16:9","9:16","1:1","4:5"], "default": "16:9" },
//       { "key": "duration",  "label": "时长(秒)",          "kind": "select",   "options": ["3","5","10","15","30"], "default": "5" },
//       { "key": "frame_count","label": "帧数 / 画面数",    "kind": "text",     "default": "1" },
//       { "key": "style",     "label": "风格描述",          "kind": "textarea" }
//     ],
//     "allow_attachments": true
//   }
function parseHvForm(text) {
  const m = /```hv-form\s*\n([\s\S]*?)```/i.exec(text);
  if (!m) return { prose: text, form: null };
  const prose = (
    text.slice(0, m.index) + text.slice(m.index + m[0].length)
  ).trim();
  let parsed;
  try {
    parsed = JSON.parse(m[1].trim());
  } catch {
    return { prose: text, form: null };
  }
  if (!parsed || !Array.isArray(parsed.fields) || parsed.fields.length === 0) {
    return { prose: text, form: null };
  }
  return { prose, form: parsed };
}

// === hv-confirm block parsing ===
//   ```hv-confirm
//   {
//     "title": "按这些信息开始生成？",
//     "summary": [{ "label": "主题", "value": "nexu-io" }, ...],
//     "actions": ["generate","edit"]   // optional, defaults to both
//   }
function parseHvConfirm(text) {
  const m = /```hv-confirm\s*\n([\s\S]*?)```/i.exec(text);
  if (!m) return { prose: text, confirm: null };
  const prose = (
    text.slice(0, m.index) + text.slice(m.index + m[0].length)
  ).trim();
  let parsed;
  try {
    parsed = JSON.parse(m[1].trim());
  } catch {
    return { prose: text, confirm: null };
  }
  if (!parsed || !Array.isArray(parsed.summary)) {
    return { prose: text, confirm: null };
  }
  return { prose, confirm: parsed };
}

// === hv-form render ===
function renderFormCard(form, submitted, msgIdx) {
  const title = form.title || "Tell me a bit more…";
  const fields = form.fields || [];
  const allowAttachments = form.allow_attachments !== false;
  const fieldsHtml = fields
    .map((f, i) => {
      const key = f.key || `field_${i}`;
      const label = f.label || key;
      const ph = f.placeholder || "";
      const required = f.required ? '<span class="req">*</span>' : "";
      const def =
        submitted && submitted[key] !== undefined
          ? submitted[key]
          : (f.default ?? "");
      const dis = submitted ? "disabled" : "";
      let control;
      if (f.kind === "textarea") {
        control = `<textarea data-form-msg="${msgIdx}" data-form-key="${esc(key)}" rows="2" placeholder="${esc(ph)}" ${dis}>${esc(def)}</textarea>`;
      } else if (f.kind === "select") {
        const opts = (f.options || [])
          .map((o) => {
            const v = typeof o === "string" ? o : o.value;
            const lbl = typeof o === "string" ? o : o.label || o.value;
            const sel = String(v) === String(def) ? "selected" : "";
            return `<option value="${esc(v)}" ${sel}>${esc(lbl)}</option>`;
          })
          .join("");
        control = `<select data-form-msg="${msgIdx}" data-form-key="${esc(key)}" ${dis}>${opts}</select>`;
      } else if (f.kind === "buttons") {
        // Segmented control: a hidden input carries the value, visible buttons
        // toggle. Wired up in renderChatLog.
        const optsHtml = (f.options || [])
          .map((o) => {
            const v = typeof o === "string" ? o : o.value;
            const lbl = typeof o === "string" ? o : o.label || o.value;
            const sel = String(v) === String(def) ? "selected" : "";
            return `<button type="button" class="form-seg-btn ${sel}" data-form-msg="${msgIdx}" data-form-key="${esc(key)}" data-val="${esc(v)}" ${dis}>${esc(lbl)}</button>`;
          })
          .join("");
        control = `<div class="form-seg" data-form-key="${esc(key)}">
        <input type="hidden" data-form-msg="${msgIdx}" data-form-key="${esc(key)}" value="${esc(def)}" />
        ${optsHtml}
      </div>`;
      } else {
        control = `<input type="text" data-form-msg="${msgIdx}" data-form-key="${esc(key)}" placeholder="${esc(ph)}" value="${esc(def)}" ${dis} />`;
      }
      const hintHtml = f.hint
        ? `<div class="form-hint">${esc(f.hint)}</div>`
        : "";
      return `<div class="form-field">
      <label>${esc(label)}${required}</label>
      ${hintHtml}
      ${control}
    </div>`;
    })
    .join("");
  // Live total-duration readout when the form paces by per-frame × frames.
  const hasPerFrame =
    fields.some((f) => f.key === "per_frame") &&
    fields.some((f) => f.key === "frame_count");
  const totalHtml =
    hasPerFrame && !submitted
      ? `<div class="form-total" id="form-total-${msgIdx}"></div>`
      : "";
  const dropHtml =
    allowAttachments && !submitted
      ? `
    <div class="form-attachments" data-form-msg="${msgIdx}">
      <div class="form-drop-hint">${esc(t("card.form_drop_hint"))}</div>
      <div class="form-attachment-list" id="form-att-${msgIdx}"></div>
      <input type="file" id="form-file-${msgIdx}" multiple style="display:none" />
      <button type="button" class="form-attach-btn" data-form-msg="${msgIdx}">${esc(t("card.form_attach"))}</button>
    </div>`
      : "";
  const actionsHtml = submitted
    ? ""
    : `
    <div class="form-actions">
      <button class="form-submit" data-form-msg="${msgIdx}">${esc(t("card.form_submit"))}${icon("cornerDownLeft", "ico-trail")}</button>
    </div>`;
  return `<div class="form-card${submitted ? " submitted" : ""}">
    <div class="form-title">${esc(title)}</div>
    <div class="form-fields">${fieldsHtml}</div>
    ${totalHtml}
    ${dropHtml}
    ${actionsHtml}
  </div>`;
}

// === hv-confirm render ===
function renderConfirmCard(confirm, resolved, msgIdx, pending) {
  const title = confirm.title || "Looks right?";
  const summary = confirm.summary || [];
  const actions = confirm.actions || ["generate", "edit"];
  const summaryHtml = summary
    .map((s) => {
      const label = s.label || s.key || "";
      const value = s.value !== undefined ? String(s.value) : "";
      return `<div class="confirm-row">
      <div class="confirm-label">${esc(label)}</div>
      <div class="confirm-value">${esc(value) || '<span class="muted">—</span>'}</div>
    </div>`;
    })
    .join("");
  // Locked = resolved (finished) OR pending (clicked, generation running).
  const locked = resolved || pending;
  const actionsHtml = locked
    ? ""
    : `
    <div class="confirm-actions">
      ${actions.includes("generate") ? `<button class="confirm-go" data-confirm-msg="${msgIdx}" data-action="generate">${iconL("check")}${esc(t("card.confirm_generate"))}</button>` : ""}
      ${actions.includes("edit") ? `<button class="confirm-edit" data-confirm-msg="${msgIdx}" data-action="edit">${iconL("edit")}${esc(t("card.confirm_edit"))}</button>` : ""}
    </div>`;
  const markHtml = resolved
    ? `<div class="confirm-resolved-mark">${resolved === t("card.confirm_edit") ? iconL("edit") : iconL("check")}${esc(resolved)}</div>`
    : pending
      ? `<div class="confirm-resolved-mark pending">⏳ Đang tạo…</div>`
      : "";
  return `<div class="confirm-card${locked ? " resolved" : ""}">
    <div class="confirm-title">${esc(title)}</div>
    <div class="confirm-summary">${summaryHtml}</div>
    ${actionsHtml}
    ${markHtml}
  </div>`;
}

// === hv-brief block parsing ===
//   ```hv-brief
//   { "meta": { "phase": "brief" }, "brief": "HOOK: …\n- …" }
// The content drafted before HTML generation; shown editable for review.
function parseHvBrief(text) {
  const m = /```hv-brief\s*\n([\s\S]*?)```/i.exec(text);
  if (!m) return { prose: text, brief: null };
  const prose = (
    text.slice(0, m.index) + text.slice(m.index + m[0].length)
  ).trim();
  let parsed;
  try {
    parsed = JSON.parse(m[1].trim());
  } catch {
    return { prose: text, brief: null };
  }
  if (!parsed || typeof parsed.brief !== "string") {
    return { prose: text, brief: null };
  }
  return { prose, brief: parsed.brief };
}

// === hv-brief render (editable content review) ===
// Reuses the form-card look. The textarea carries data-brief-msg (not
// data-form-key) so the hv-form submit wiring never picks it up.
function renderBriefCard(brief, approved, msgIdx) {
  if (approved) {
    return `<div class="form-card submitted">
      <div class="form-title">${iconL("check")}Đã duyệt nội dung</div>
      <pre class="brief-preview" style="white-space:pre-wrap;margin:0;font:inherit">${esc(brief)}</pre>
    </div>`;
  }
  return `<div class="form-card">
    <div class="form-title">Nội dung video — xem & sửa rồi bấm Tạo video</div>
    <div class="form-fields">
      <div class="form-field">
        <textarea class="brief-text" data-brief-msg="${msgIdx}" rows="12">${esc(brief)}</textarea>
      </div>
    </div>
    <div class="form-actions">
      <button class="form-submit brief-go" data-brief-msg="${msgIdx}">Tạo video từ nội dung này${icon("cornerDownLeft", "ico-trail")}</button>
    </div>
  </div>`;
}

function renderOptionCard(opts, picked, msgIdx) {
  const allowFreeform = opts.allow_freeform !== false;
  const optsHtml = (opts.options || [])
    .map((o, i) => {
      const label = o.label ?? String(o);
      const hint = o.hint ?? "";
      const isPicked = picked === label;
      const cls = `opt${isPicked ? " picked" : ""}`;
      // Once the user has picked anything on this card, ALL buttons lock —
      // including the picked one, so the same option can't fire twice.
      const disabled = picked ? "disabled" : "";
      return `<button class="${cls}" data-opt-msg="${msgIdx}" data-opt-i="${i}" ${disabled}>
      <span class="label">${esc(label)}</span>
      ${hint ? `<span class="hint">${esc(hint)}</span>` : ""}
    </button>`;
    })
    .join("");
  // Inline freeform input — saves a trip to the bottom composer when the
  // user just wants to type a custom answer to this card's question.
  const freeformHtml =
    allowFreeform && !picked
      ? `
    <div class="freeform-input">
      <textarea data-freeform-msg="${msgIdx}" rows="1"
        placeholder="${esc(t("card.freeform_placeholder"))}"></textarea>
      <button class="freeform-send" data-freeform-msg="${msgIdx}" disabled>${iconL("cornerDownLeft")}${esc(t("card.send"))}</button>
    </div>`
      : "";
  return `<div class="opt-card">
    <div class="question">${esc(opts.question)}</div>
    <div class="opts">${optsHtml}</div>
    ${freeformHtml}
  </div>`;
}

// ============== preview ==============
function renderPreview() {
  const stage = document.getElementById("preview-stage");
  if (!stage) return;
  const p = state.selected;
  if (!p) {
    stage.innerHTML = `<div class="preview-placeholder"><div><div class="ico">${icon("film")}</div>${t("preview.placeholder.pick_project")}</div></div>`;
    renderFramesStrip();
    return;
  }
  // No template + no prior preview → show "send a chat first" placeholder
  if (!p.templateId && !p.lastPreviewHtmlPath) {
    stage.innerHTML = `<div class="preview-placeholder"><div><div class="ico">${icon("film")}</div>${t("preview.placeholder.pick_template")}</div></div>`;
    renderFramesStrip();
    return;
  }
  // v0.8: if multi-frame, default-iframe shows the active frame (first by default).
  const frames = Array.isArray(p.frames) ? p.frames : [];
  const sortedFrames = [...frames].sort((a, b) => a.order - b.order);
  if (sortedFrames.length > 0 && !state.activeFrameId) {
    state.activeFrameId = sortedFrames[0].graphNodeId;
  }
  if (
    sortedFrames.length > 0 &&
    state.activeFrameId &&
    !sortedFrames.find((f) => f.graphNodeId === state.activeFrameId)
  ) {
    state.activeFrameId = sortedFrames[0].graphNodeId;
  }
  const iframeSrc =
    sortedFrames.length > 0 && state.activeFrameId
      ? `/preview/${p.id}/frame/${encodeURIComponent(state.activeFrameId)}?t=${Date.now()}`
      : `/preview/${p.id}?t=${Date.now()}`;
  const stamp =
    sortedFrames.length > 0 && state.activeFrameId
      ? state.activeFrameId
      : p.templateId || "";
  // Respect the project's chosen resolution so the preview box matches the real
  // export aspect (4:5 / 9:16 / 1:1), not a hardcoded 16:9. The iframe renders
  // at the design's native pixel size and is scaled to fit (scale set on resize).
  const res = p.preferences?.resolution ?? { width: 1920, height: 1080 };
  const vw = res.width || 1920;
  const vh = res.height || 1080;
  // Constrain the preview frame along the *long* axis so the whole frame stays
  // contained in the (bounded-height) stage. The base CSS only limits width
  // (width:100%; max-width:1280px) which is right for landscape, but for a
  // portrait frame (vh>vw) that lets it grow ~2275px tall and overflow — you'd
  // only see the top slice. For portrait, limit height instead and let width
  // follow the aspect-ratio. Square stays width-bound.
  const sizeStyle =
    vh > vw
      ? "width:auto;max-width:none;height:100%;max-height:100%"
      : "width:100%;max-width:1280px";
  // A native (enhanced) frame has no HTML — play its rendered preview MP4 and
  // hide the data-hv-text edit affordance (there's no HTML text to edit).
  const activeFrame = sortedFrames.find(
    (f) => f.graphNodeId === state.activeFrameId,
  );
  const activeEnhanced = activeFrame?.engine === "remotion";
  if (activeEnhanced) {
    const videoSrc = `/preview/${p.id}/frame/${encodeURIComponent(state.activeFrameId)}.mp4?t=${Date.now()}`;
    stage.innerHTML = `<div class="preview-frame" style="aspect-ratio:${vw}/${vh};${sizeStyle}">
      <video id="preview-iframe" src="${videoSrc}" autoplay muted loop controls playsinline style="width:${vw}px;height:${vh}px"></video>
      ${stamp ? `<div class="stamp">${esc(stamp)} · ${icon("zap")}</div>` : ""}
    </div>`;
    attachPreviewScaler();
    renderFramesStrip();
    return;
  }
  // sandbox now grants same-origin so we can attach a text-edit overlay
  // from the parent window. allow-scripts keeps the page's own animations
  // running. forms / popups / top-navigation stay blocked.
  stage.innerHTML = `<div class="preview-frame ${state.editTextMode ? "editing" : ""}" style="aspect-ratio:${vw}/${vh};${sizeStyle}">
    <iframe id="preview-iframe" sandbox="allow-scripts allow-same-origin" src="${iframeSrc}" style="width:${vw}px;height:${vh}px"></iframe>
    ${stamp ? `<div class="stamp">${esc(stamp)}</div>` : ""}
    <button class="edit-toggle" id="btn-edit-text"
      title="${state.editTextMode ? t("preview.edit_text_done_title") : t("preview.edit_text_title")}">
      ${state.editTextMode ? iconL("check") + t("preview.edit_text_on") : iconL("edit") + t("preview.edit_text_off")}
    </button>
  </div>`;
  attachPreviewScaler();
  const editBtn = document.getElementById("btn-edit-text");
  if (editBtn) editBtn.onclick = togglePreviewEdit;
  // If the user just toggled into edit mode, attach the overlay once the
  // iframe loads. If already in edit mode and we re-rendered, attach now
  // (iframe might already be loaded when reusing a cached preview).
  const iframe = document.getElementById("preview-iframe");
  if (iframe && state.editTextMode) {
    if (
      iframe.contentDocument &&
      iframe.contentDocument.readyState === "complete"
    ) {
      attachTextEditOverlay(iframe);
    } else {
      iframe.addEventListener("load", () => attachTextEditOverlay(iframe), {
        once: true,
      });
    }
  }
  renderFramesStrip();
  // Convergence point for every frame/preview change → keep soundtrack buttons
  // (draft / fit) and the per-frame narration line in sync, regardless of which
  // path triggered the change.
  if (typeof window.__hvSyncNarration === "function")
    window.__hvSyncNarration();
}

function togglePreviewEdit() {
  state.editTextMode = !state.editTextMode;
  // When leaving edit mode, force-reload preview so any in-iframe styling
  // is dropped cleanly.
  renderPreview();
}

// Inject hover highlight + click-to-edit on every [data-hv-text] node in
// the preview iframe. On commit we replace text content in the iframe DOM,
// serialize it, and PUT to the right endpoint (frame-specific or whole-
// project preview).
function attachTextEditOverlay(iframe) {
  let doc;
  try {
    doc = iframe.contentDocument;
  } catch (err) {
    console.warn("[hv-edit] iframe.contentDocument blocked:", err);
    return;
  }
  if (!doc) {
    console.warn(
      "[hv-edit] iframe.contentDocument is null (still loading? sandbox blocking?)",
    );
    return;
  }
  if (!doc.body) {
    console.warn(
      "[hv-edit] iframe document has no body yet — re-attaching on next load tick",
    );
    iframe.addEventListener("load", () => attachTextEditOverlay(iframe), {
      once: true,
    });
    return;
  }
  const tagged = doc.querySelectorAll("[data-hv-text]");
  console.log(
    `[hv-edit] attached overlay; found ${tagged.length} [data-hv-text] elements`,
  );
  if (tagged.length === 0) {
    toast(t("preview.no_hv_text"), "warn");
  }
  // Idempotent: tear down any prior overlay first.
  doc.querySelectorAll("[data-hv-edit-style]").forEach((el) => el.remove());
  const style = doc.createElement("style");
  style.setAttribute("data-hv-edit-style", "");
  style.textContent = `
    [data-hv-text] { outline: 1px dashed rgba(201, 100, 66, .6) !important;
      outline-offset: 3px !important; cursor: text !important;
      transition: outline-color .12s, background .12s; }
    [data-hv-text]:hover { outline: 2px solid rgb(201, 100, 66) !important;
      background: rgba(201, 100, 66, .08) !important; }
    [data-hv-text][contenteditable="true"] { outline: 2px solid rgb(201, 100, 66) !important;
      outline-offset: 3px !important; background: rgba(201, 100, 66, .12) !important; }
  `;
  (doc.head || doc.documentElement).appendChild(style);

  let dirty = false;
  const enableEdit = (el) => {
    if (el.getAttribute("contenteditable") === "true") return;
    el.setAttribute("contenteditable", "true");
    el.focus();
    // Place caret at end
    const range = doc.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = doc.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };
  const finishEdit = async (el) => {
    if (el.getAttribute("contenteditable") !== "true") return;
    el.removeAttribute("contenteditable");
    if (!dirty) return;
    dirty = false;
    await commitInlineTextEdits(iframe);
  };

  doc.addEventListener(
    "click",
    (e) => {
      const target = e.target.closest("[data-hv-text]");
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      enableEdit(target);
    },
    true,
  );
  doc.addEventListener("input", (e) => {
    if (e.target.closest && e.target.closest("[data-hv-text]")) {
      dirty = true;
    }
  });
  doc.addEventListener("keydown", (e) => {
    const target =
      e.target.closest &&
      e.target.closest('[data-hv-text][contenteditable="true"]');
    if (!target) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      target.blur();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      target.blur();
    }
  });
  doc.addEventListener(
    "focusout",
    (e) => {
      const t = e.target;
      if (
        t &&
        t.matches &&
        t.matches('[data-hv-text][contenteditable="true"]')
      ) {
        finishEdit(t);
      }
    },
    true,
  );
}

async function commitInlineTextEdits(iframe) {
  if (!state.selected) return;
  const projectId = state.selected.id;
  const fid = state.activeFrameId;
  const url = fid
    ? `/api/projects/${projectId}/frames/${encodeURIComponent(fid)}/raw-html`
    : `/api/projects/${projectId}/raw-html`;
  // Read the current frame HTML from disk, walk its [data-hv-text] nodes,
  // sync each one's text from the iframe DOM. We do server-side merging
  // on the client to keep it simple.
  let serverHtml;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`fetch failed ${r.status}`);
    serverHtml = await r.text();
  } catch (e) {
    toast(t("toast.save_failed", { message: e.message }), "error");
    return;
  }
  const parser = new DOMParser();
  const target = parser.parseFromString(serverHtml, "text/html");
  const live = iframe.contentDocument;
  const liveByKey = new Map();
  if (live) {
    live.querySelectorAll("[data-hv-text]").forEach((el) => {
      const k = el.getAttribute("data-hv-text");
      if (k) liveByKey.set(k, el.textContent ?? "");
    });
  }
  let changed = 0;
  target.querySelectorAll("[data-hv-text]").forEach((el) => {
    const k = el.getAttribute("data-hv-text");
    if (!k || !liveByKey.has(k)) return;
    const newText = liveByKey.get(k);
    if (el.textContent !== newText) {
      el.textContent = newText;
      changed += 1;
    }
  });
  if (changed === 0) return;
  // Serialize the doc + ship it back.
  const out = `<!doctype html>\n${target.documentElement.outerHTML}`;
  try {
    const r = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ html: out }),
    });
    if (!r.ok) throw new Error(`save failed ${r.status}`);
    toast(t("toast.saved_changes", { count: changed }), "success");
    // Refresh local project state so frames-strip thumbnails cache-bust.
    if (fid) {
      const pr = await API.getProject(projectId);
      state.selected = pr.project;
      renderFramesStrip();
    }
  } catch (e) {
    toast(t("toast.save_failed", { message: e.message }), "error");
  }
}

// Keep --preview-scale on .preview-frame in sync with its rendered width
// so the 1920×1080 iframe shrinks proportionally rather than getting
// cropped by a smaller viewport.
let _previewResizeObserver = null;
function attachPreviewScaler() {
  const frame = document.querySelector(".preview-frame");
  if (!frame) return;
  const apply = () => {
    const w = frame.clientWidth;
    if (!w) return;
    // Scale by the inner element's native design width (not a hardcoded 1920)
    // so non-16:9 aspects (1080-wide) shrink correctly too. A native (enhanced)
    // frame uses a <video> instead of an <iframe> — scale it the same way, else
    // the 1920×1080 MP4 overflows and the frame gets cropped.
    const inner = frame.querySelector("iframe, video");
    const nativeW = inner ? Number.parseFloat(inner.style.width) || 1920 : 1920;
    frame.style.setProperty("--preview-scale", (w / nativeW).toFixed(4));
  };
  apply();
  if (_previewResizeObserver) _previewResizeObserver.disconnect();
  _previewResizeObserver = new ResizeObserver(apply);
  _previewResizeObserver.observe(frame);
}

function reloadPreview() {
  const iframe = document.getElementById("preview-iframe");
  if (!iframe || !state.selected) return;
  const p = state.selected;
  const frames = Array.isArray(p.frames) ? p.frames : [];
  if (frames.length > 0 && state.activeFrameId) {
    iframe.src = `/preview/${p.id}/frame/${encodeURIComponent(state.activeFrameId)}?t=${Date.now()}`;
  } else {
    iframe.src = `/preview/${p.id}?t=${Date.now()}`;
  }
}

// ============== v0.8: frames timeline + graph modal ==============
function renderFramesStrip() {
  const strip = document.getElementById("frames-strip");
  if (!strip) return;
  const p = state.selected;
  const frames =
    p && Array.isArray(p.frames)
      ? [...p.frames].sort((a, b) => a.order - b.order)
      : [];
  if (frames.length === 0) {
    strip.classList.remove("has-frames");
    strip.innerHTML = "";
    return;
  }
  strip.classList.add("has-frames");
  // Each chip = label + mini iframe of the frame's actual HTML, transform-
  // scaled so the 1920×1080 page fits in a ~180×100 thumb. sandbox blocks
  // navigation; allow-scripts so any opening animation runs.
  // Bust cache when frame content changes (re-renders point to a new
  // versioned URL via `?v=<timestamp>` derived from project.updatedAt).
  const ver = p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now();
  const tabs = frames
    .map((f) => {
      const isActive = f.graphNodeId === state.activeFrameId;
      const isFocus = f.graphNodeId === state.iterateFocusFrameId;
      const cls = ["frame-tab", isActive && "active", isFocus && "focus"]
        .filter(Boolean)
        .join(" ");
      // A native (enhanced) frame has no HTML — play its rendered preview MP4.
      const enhanced = f.engine === "remotion";
      const thumbInner = enhanced
        ? `<video src="/preview/${p.id}/frame/${encodeURIComponent(f.graphNodeId)}.mp4?v=${ver}" autoplay muted loop playsinline tabindex="-1"></video>`
        : `<iframe sandbox="allow-scripts" src="/preview/${p.id}/frame/${encodeURIComponent(f.graphNodeId)}?thumb=1&v=${ver}" tabindex="-1" loading="lazy"></iframe>`;
      // The "⚡ Enhance" control shows only on data frames (kind==='data'). It's an
      // overlay badge ON the thumbnail (top area) so it's obvious + always visible.
      const isData = state.frameKinds[f.graphNodeId] === "data";
      const busy = state.enhancing && state.enhancing.nodeId === f.graphNodeId;
      let enhanceCtl = "";
      if (isData) {
        if (busy) {
          enhanceCtl = `<span class="frame-enhance busy" data-fid="${esc(f.graphNodeId)}">${t("frames.enhancing", { pct: state.enhancing.pct ?? 0 })}</span>`;
        } else if (enhanced) {
          enhanceCtl = `<span class="frame-enhance on" data-fid="${esc(f.graphNodeId)}" data-act="unenhance" title="${esc(t("frames.enhanced_revert"))}">${iconL("zap")}${t("frames.enhanced_revert")}</span>`;
        } else {
          enhanceCtl = `<span class="frame-enhance" data-fid="${esc(f.graphNodeId)}" data-act="enhance" title="${esc(t("frames.enhance_hint"))}">${iconL("zap")}${t("frames.enhance")}</span>`;
        }
      }
      return `<button class="${cls}${isData ? " is-data" : ""}" data-fid="${esc(f.graphNodeId)}">
      <div class="frame-thumb">
        ${thumbInner}
        ${enhanceCtl}
        ${isFocus ? `<div class="focus-mark" title="${esc(t("frame.editing_this"))}">${icon("edit")}</div>` : ""}
      </div>
      <div class="frame-tab-label">
        <span class="order">${String(f.order + 1).padStart(2, "0")}</span>
        <span class="fid">${esc(f.graphNodeId)}</span>
      </div>
    </button>`;
    })
    .join("");
  strip.innerHTML = `<span class="label">${t("frames.label")}</span>${tabs}
    <button class="frame-graph-btn" id="btn-show-graph">${t("frames.view_graph")}</button>`;
  // Single-click: switch which frame is shown in the centre preview.
  // Double-click: pin this frame as the iteration target so subsequent
  // chat messages only rewrite this frame. Click another / dbl-click the
  // same one to clear.
  strip.querySelectorAll("button.frame-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fid = btn.dataset.fid;
      state.activeFrameId = fid;
      // First click also pins focus so the user doesn't have to dbl-click —
      // but only when nothing else is focused, or they're switching to a new
      // frame. Clicking the already-focused frame again clears focus.
      if (state.iterateFocusFrameId === fid) {
        state.iterateFocusFrameId = null;
      } else {
        state.iterateFocusFrameId = fid;
      }
      renderPreview();
      renderComposer();
      // Refresh the right-pane Frame text editor to point at the newly
      // active frame's data-hv-text values.
      refreshTextFields();
      // Soundtrack narration is per-frame — point the textarea at this frame.
      if (typeof window.__hvSyncNarration === "function")
        window.__hvSyncNarration();
    });
  });
  // Per-frame enhance / revert toggle (data frames only). stopPropagation so
  // clicking it doesn't also fire the parent tab's frame-switch handler.
  strip.querySelectorAll(".frame-enhance").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.enhancing) return; // single in-flight; ignore double-clicks
      const fid = el.dataset.fid;
      if (el.dataset.act === "unenhance") unenhanceFrameAction(fid);
      else if (el.dataset.act === "enhance") startEnhanceStream(fid);
    });
  });
  const gbtn = document.getElementById("btn-show-graph");
  if (gbtn) gbtn.addEventListener("click", openGraphModal);
}

async function openGraphModal() {
  if (!state.selected) return;
  const modal = document.getElementById("graph-modal");
  const pre = document.getElementById("graph-json");
  if (!modal || !pre) return;
  try {
    const r = await fetch(`/api/projects/${state.selected.id}/content-graph`);
    if (!r.ok) {
      pre.textContent = "(no graph for this project)";
    } else {
      const { graph } = await r.json();
      pre.textContent = JSON.stringify(graph, null, 2);
      state.lastGraph = graph;
    }
  } catch (e) {
    pre.textContent = `error loading graph: ${e.message}`;
  }
  modal.classList.add("open");
  const close = document.getElementById("graph-close");
  const dl = document.getElementById("graph-download");
  if (close) close.onclick = () => modal.classList.remove("open");
  if (dl)
    dl.onclick = () => {
      if (!state.lastGraph) return;
      const blob = new Blob([JSON.stringify(state.lastGraph, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `content-graph-${state.selected.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
  modal.addEventListener(
    "click",
    (e) => {
      if (e.target === modal) modal.classList.remove("open");
    },
    { once: true },
  );
}

// ============== text fields (data-hv-text editor) ==============
/**
 * Source the HTML the right-side editor reads. For multi-frame projects
 * we follow `state.activeFrameId` so clicking a frame in the strip swaps
 * the editor over to that frame; otherwise fall back to the whole-project
 * preview HTML.
 */
async function fetchActiveFrameHtml() {
  if (!state.selected) return null;
  const fid = state.activeFrameId;
  const url = fid
    ? `/api/projects/${state.selected.id}/frames/${encodeURIComponent(fid)}/raw-html`
    : `/api/projects/${state.selected.id}/raw-html`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

async function refreshTextFields() {
  if (!state.selected) {
    state.textFields = [];
    renderTextFields();
    return;
  }
  // We used to gate this on a templateId, but frames-mode projects are
  // template-free and still have hv-text fields worth showing.
  const html = await fetchActiveFrameHtml();
  if (!html) {
    state.textFields = [];
    renderTextFields();
    return;
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const nodes = doc.querySelectorAll("[data-hv-text]");
  const seen = new Set();
  const fields = [];
  for (const el of nodes) {
    const key = el.getAttribute("data-hv-text");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const text = el.textContent ?? "";
    fields.push({ key, original: text, current: text });
  }
  state.textFields = fields;
  renderTextFields();
}

function renderTextFields() {
  const wrap = document.getElementById("text-fields");
  if (!wrap) return;
  if (!state.selected) {
    wrap.innerHTML = `<div class="text-empty">${t("text_pane.no_project")}</div>`;
    return;
  }
  if (state.textFields.length === 0) {
    const hasFrames = (state.selected.frames?.length ?? 0) > 0;
    const hint = hasFrames
      ? t("text_pane.empty_with_frames")
      : t("text_pane.empty_no_frames");
    wrap.innerHTML = `<div class="text-empty">${hint}</div>`;
    return;
  }
  // Always render as textarea — agent decides text length, no hard cap.
  wrap.innerHTML = state.textFields
    .map((f, i) => {
      const labelKey = humanizeKey(f.key);
      return `<div class="text-field">
      <div class="key">${esc(labelKey)}<span class="badge">${esc(f.key)}</span></div>
      <textarea data-i="${i}" rows="1" placeholder="(empty)">${esc(f.current)}</textarea>
    </div>`;
    })
    .join("");
  wrap.querySelectorAll("textarea[data-i]").forEach((el) => {
    autoResize(el);
    el.addEventListener("input", (e) => {
      const i = Number(e.target.dataset.i);
      state.textFields[i].current = e.target.value;
      autoResize(el);
      scheduleTextSave();
    });
  });
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight + 2, 320)}px`;
}

function humanizeKey(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scheduleTextSave() {
  clearTimeout(state.textSaveTimer);
  setSaveState("typing…");
  state.textSaveTimer = setTimeout(commitTextEdits, 500);
}

function setSaveState(text, kind = "") {
  const el = document.getElementById("text-save-state");
  if (el) {
    el.textContent = text;
    el.className = `save-state ${kind}`;
  }
}

async function commitTextEdits() {
  if (!state.selected) return;
  const dirty = state.textFields.filter((f) => f.current !== f.original);
  if (dirty.length === 0) {
    setSaveState("—");
    return;
  }
  setSaveState("saving…", "saving");
  // Read the SAME source we'll write back to — the active frame's HTML
  // when there is one, otherwise the whole-project preview.
  const html = await fetchActiveFrameHtml();
  if (!html) {
    setSaveState("error", "error");
    return;
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const f of state.textFields) {
    const nodes = doc.querySelectorAll(`[data-hv-text="${cssEscape(f.key)}"]`);
    nodes.forEach((n) => {
      n.textContent = f.current;
    });
    f.original = f.current;
  }
  // Serialize back: include doctype because DOMParser drops it
  const serialized = `<!doctype html>\n${doc.documentElement.outerHTML}`;
  const fid = state.activeFrameId;
  const url = fid
    ? `/api/projects/${state.selected.id}/frames/${encodeURIComponent(fid)}/raw-html`
    : `/api/projects/${state.selected.id}/raw-html`;
  let r;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ html: serialized }),
    });
    r = await res.json();
  } catch (e) {
    setSaveState(`error: ${e?.message ?? e}`, "error");
    return;
  }
  if (r?.error) {
    setSaveState(`error: ${r.error}`, "error");
    return;
  }
  // Refresh project so frames-strip thumbnails cache-bust.
  if (fid) {
    try {
      const pr = await API.getProject(state.selected.id);
      state.selected = pr.project;
      renderFramesStrip();
    } catch {}
  } else if (r?.project) {
    state.selected = r.project;
  }
  setSaveState("saved", "saved");
  reloadPreview();
}

function cssEscape(s) {
  return String(s).replace(/["\\]/g, "\\$&");
}

// ============== send message ==============
async function sendMessage() {
  if (state.composing || !state.selected) return;
  const ta = document.getElementById("composer-input");
  const text = ta.value.trim();
  const hasAttachments = state.pendingAttachments.length > 0;
  if (!text && !hasAttachments) return;

  // Intent shortcut: if the message is a clear "export to MP4" command
  // and there's something to export, run the export flow directly
  // instead of routing through the agent. The agent has nothing useful
  // to add for a deterministic export action.
  const p = state.selected;
  const canExport = !!(p && (p.templateId || (p.frames?.length ?? 0) > 0));
  if (canExport && !hasAttachments && isExportIntent(text)) {
    ta.value = "";
    state.messages.push({ role: "user", content: text, ts: Date.now() });
    renderChatLog();
    startExportStream();
    return;
  }

  ta.value = "";
  state.composing = true;
  // The project this send belongs to — used to ignore late events / not clobber
  // a different project if the user switches away mid-generation.
  const genProjectId = state.selectedId;
  renderComposer();

  // Iterate scope: when the user has selected a specific frame in the
  // strip, the iterate-phase server route should only rewrite that frame.
  // We pass the focus along on every send (server uses it only for iterate).
  const focusFrame = state.iterateFocusFrameId || "";

  // User message includes attachment summary + focus chip
  const attSummary = hasAttachments
    ? `\n\n📎 ${state.pendingAttachments.length} attachment(s): ${state.pendingAttachments.map((a) => a.name).join(", ")}`
    : "";
  const focusSummary = focusFrame ? `\n\n🎯 focus: frame ${focusFrame}` : "";
  state.messages.push({
    role: "user",
    content: text + attSummary + focusSummary,
    ts: Date.now(),
    ...(focusFrame ? { focusFrameId: focusFrame } : {}),
  });
  state.messages.push({
    role: "thinking",
    content: t("chat.thinking"),
    ts: Date.now(),
  });
  const thinkingIdx = state.messages.length - 1;
  renderChatLog();

  let assistantIdx = -1;

  try {
    let res;
    if (hasAttachments) {
      const fd = new FormData();
      fd.append("content", text);
      if (focusFrame) fd.append("focus_frame_id", focusFrame);
      for (const a of state.pendingAttachments)
        fd.append("file", a.file, a.name);
      // Clear UI attachments before request so user sees them disappear
      state.pendingAttachments = [];
      renderAttachments();
      res = await fetch(`/api/projects/${state.selected.id}/messages`, {
        method: "POST",
        body: fd,
      });
    } else {
      res = await fetch(`/api/projects/${state.selected.id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content: text,
          ...(focusFrame ? { focus_frame_id: focusFrame } : {}),
        }),
      });
    }
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      state.messages[thinkingIdx] = {
        role: "system",
        content: `⚠️ ${err.error ?? "agent failed"}`,
        ts: Date.now(),
      };
      renderChatLog();
    } else {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      // If the user switches away mid-generation, stop rendering its events into
      // the (now different) active project — the backend keeps running and
      // persists the result, so it's there when they switch back.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (state.selectedId !== genProjectId) {
          try {
            await reader.cancel();
          } catch {}
          break;
        }
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let ev;
          try {
            ev = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (ev.type === "text") {
            if (assistantIdx === -1) {
              // Replace thinking with assistant message
              state.messages[thinkingIdx] = {
                role: "assistant",
                agent: state.selected.agentId ?? "claude",
                content: "",
                ts: Date.now(),
              };
              assistantIdx = thinkingIdx;
            }
            state.messages[assistantIdx].content += ev.chunk;
            renderChatLog();
          } else if (ev.type === "preview_ready") {
            const frameCount = ev.frames || 0;
            const focusedFrame = ev.focused_frame;
            const summary = focusedFrame
              ? `✓ frame ${focusedFrame} updated`
              : frameCount > 0
                ? `✓ ${frameCount}-frame storyboard generated`
                : "✓ HTML preview updated";
            const event = focusedFrame
              ? `🎞 frame ${focusedFrame} reloaded`
              : frameCount > 0
                ? `🎞 storyboard reloaded (${frameCount} frames)`
                : "🎞 preview reloaded";
            if (assistantIdx === -1) {
              state.messages[thinkingIdx] = {
                role: "assistant",
                agent: state.selected.agentId ?? "claude",
                content: summary,
                ts: Date.now(),
              };
              assistantIdx = thinkingIdx;
            } else {
              state.messages[assistantIdx].content = summary;
            }
            state.messages.push({
              role: "preview-event",
              content: event,
              ts: Date.now(),
            });
            renderChatLog();
            // Multi-frame turn replaces frames[]; reset active frame so the
            // first frame becomes the default again.
            if (frameCount > 0) state.activeFrameId = null;
            const pr = await API.getProject(state.selected.id);
            state.selected = pr.project;
            // Generating in-place writes a fresh content-graph, so the node→kind
            // map must be rebuilt — otherwise data frames don't get their ⚡
            // Remotion badge until the user switches projects and back.
            if (frameCount > 0) {
              state.frameKinds = {};
              try {
                const cg = await API.contentGraph(state.selected.id);
                if (cg?.graph?.nodes)
                  for (const n of cg.graph.nodes)
                    state.frameKinds[n.id] = n.kind;
              } catch {
                /* no graph — single-frame, fine */
              }
            }
            renderPreview(); // also re-syncs soundtrack buttons via __hvSyncNarration
            await refreshTextFields();
            renderToolbar();
            renderFooter();
          } else if (ev.type === "warning") {
            if (assistantIdx === -1) {
              state.messages[thinkingIdx] = {
                role: "assistant",
                agent: state.selected.agentId ?? "claude",
                content: "",
                ts: Date.now(),
              };
              assistantIdx = thinkingIdx;
            }
            state.messages[assistantIdx].content += `\n\n⚠️ ${ev.message}`;
            renderChatLog();
          } else if (ev.type === "error") {
            if (assistantIdx === -1) {
              state.messages[thinkingIdx] = {
                role: "system",
                content: `⚠️ ${ev.message}`,
                ts: Date.now(),
              };
            } else {
              state.messages[assistantIdx].content += `\n\n⚠️ ${ev.message}`;
            }
            renderChatLog();
          }
        }
      }
    }
  } catch (e) {
    // Only surface the error if we're still on the project that started this
    // send — otherwise it's just the user having navigated away.
    if (state.selectedId === genProjectId) {
      state.messages[thinkingIdx] = {
        role: "system",
        content: `⚠️ ${e.message ?? e}`,
        ts: Date.now(),
      };
      renderChatLog();
    }
  }
  // Don't clobber composing if the user already switched to another project
  // (which may have its own generation running).
  if (state.selectedId === genProjectId) {
    state.composing = false;
    renderComposer();
  }
}

// ============== gallery modal ==============
function openGallery() {
  if (!state.selected) return;
  document.getElementById("gallery-modal").classList.add("show");
  const grid = document.getElementById("gallery");

  // Each card's iframe loads the template's actual entry HTML (`index.html`,
  // dropped under templates/<id>/ so /template-asset/<id>/index.html serves
  // it). The 1920×1080 (or 1080×1920) source is transform-scaled to fit
  // the card via a CSS variable set per-card after layout.
  grid.innerHTML = state.templates
    .map((t) => {
      const sel = state.selected?.templateId === t.id ? " selected" : "";
      const tags = (t.tags || [])
        .slice(0, 4)
        .map((tg) => `<span class="tag">${esc(tg)}</span>`)
        .join("");
      const portrait = isPortraitTemplate(t);
      const entry = templateEntryPath(t);
      // Poster-mode templates (entry only stitches sub-comps via
      // data-composition-src) iframe-render blank until the HF player ships —
      // show the shipped poster instead. Falls back to the iframe when the
      // backend couldn't find a poster file (poster_url null).
      const inner =
        t.preview_mode === "poster" && t.poster_url
          ? `<img class="poster" src="${esc(t.poster_url)}" alt="${esc(t.name ?? t.id)}" loading="lazy" />`
          : `<iframe sandbox="allow-scripts allow-same-origin" src="/template-asset/${esc(t.id)}/${esc(entry)}" loading="lazy"></iframe>`;
      return `<div class="gallery-card${sel}" data-id="${t.id}">
      <div class="preview ${portrait ? "portrait" : ""}" data-portrait="${portrait}">
        ${inner}
      </div>
      <div class="meta">
        <div class="name">${esc(t.name)}</div>
        <div class="desc">${esc(t.description ?? "")}</div>
        <div class="tags">${tags}</div>
      </div>
    </div>`;
    })
    .join("");

  // Click → open the fullscreen preview modal so the user can confirm
  // before applying. Replaces the old "click immediately replaces template"
  // behaviour, which never let the user actually see the candidate first.
  grid.querySelectorAll(".gallery-card").forEach((card) => {
    card.onclick = () => {
      const tid = card.dataset.id;
      const tpl = state.templates.find((x) => x.id === tid);
      if (tpl) openTemplatePreviewModal(tpl);
    };
  });

  // Resize observer recomputes --gallery-scale per card so 1920×1080 fits
  // the actual rendered card width.
  setTimeout(() => applyGalleryScales(grid), 0);
  if (galleryResizeObserver) galleryResizeObserver.disconnect();
  galleryResizeObserver = new ResizeObserver(() => applyGalleryScales(grid));
  grid
    .querySelectorAll(".gallery-card .preview")
    .forEach((p) => galleryResizeObserver.observe(p));
}

let galleryResizeObserver = null;
function applyGalleryScales(grid) {
  grid.querySelectorAll(".gallery-card .preview").forEach((p) => {
    const w = p.clientWidth;
    if (!w) return;
    const portrait = p.dataset.portrait === "true";
    // Landscape fills the 16:9 box by width. Portrait keeps the same 16:9
    // box but is scaled to fit the box HEIGHT (1080×1920 → fit by height,
    // centred), so its card stays the same height as the rest of the grid.
    const scale = portrait ? p.clientHeight / 1920 : w / 1920;
    p.style.setProperty("--gallery-scale", scale.toFixed(4));
  });
}

function isPortraitTemplate(t) {
  const aspects = t?.output?.resolution?.supported_aspects ?? [];
  return aspects.includes("9:16") && !aspects.includes("16:9");
}

function templateEntryPath(t) {
  // The template's entry HTML is declared as `source_entry` in its
  // template.html-video.yaml — some templates use `source/index.html`,
  // others a top-level `index.html`. The /api/templates response now
  // surfaces this field; fall back to `index.html` only if it's missing.
  const entry = t?.source_entry;
  return typeof entry === "string" && entry ? entry : "index.html";
}

function closeGallery() {
  document.getElementById("gallery-modal").classList.remove("show");
  if (galleryResizeObserver) {
    galleryResizeObserver.disconnect();
    galleryResizeObserver = null;
  }
}

// ============== Template fullscreen preview ==============
let _tplPreviewResizeObserver = null;
let _tplPreviewCurrent = null;
function openTemplatePreviewModal(tpl) {
  _tplPreviewCurrent = tpl;
  const modal = document.getElementById("tpl-preview-modal");
  if (!modal) return;
  modal.classList.add("show");

  document.getElementById("tpl-preview-name").textContent = tpl.name ?? tpl.id;
  document.getElementById("tpl-preview-desc").textContent =
    tpl.description ?? "";
  const dur =
    tpl?.output?.duration?.default_sec ?? tpl?.output?.duration?.max_sec ?? "?";
  const fps = tpl?.output?.fps?.default ?? "?";
  const aspect =
    (tpl?.output?.resolution?.supported_aspects ?? [])[0] ?? "16:9";
  document.getElementById("tpl-preview-meta").textContent = t(
    "tpl_preview.fps_dur",
    {
      fps,
      duration: dur,
      aspect,
    },
  );

  renderTemplateSource(tpl);

  const frame = document.getElementById("tpl-preview-frame");
  const portrait = isPortraitTemplate(tpl);
  frame.classList.toggle("portrait", portrait);

  const iframe = document.getElementById("tpl-preview-iframe");
  const poster = document.getElementById("tpl-preview-poster");
  const entry = templateEntryPath(tpl);
  // Poster-mode templates render blank in a live iframe (need the unbuilt HF
  // player) — show the shipped poster instead. Fall back to the iframe if the
  // backend reported no poster file (poster_url null).
  const usePoster = tpl.preview_mode === "poster" && tpl.poster_url;
  if (usePoster) {
    iframe.src = "about:blank";
    iframe.hidden = true;
    poster.src = `${tpl.poster_url}?t=${Date.now()}`;
    poster.hidden = false;
  } else {
    poster.src = "";
    poster.hidden = true;
    iframe.hidden = false;
    iframe.src = `/template-asset/${encodeURIComponent(tpl.id)}/${entry}?t=${Date.now()}`;
  }

  const apply = () => {
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    if (!w || !h) return;
    const baseW = portrait ? 1080 : 1920;
    const baseH = portrait ? 1920 : 1080;
    const s = Math.min(w / baseW, h / baseH);
    frame.style.setProperty("--tpl-preview-scale", s.toFixed(4));
  };
  apply();
  if (_tplPreviewResizeObserver) _tplPreviewResizeObserver.disconnect();
  _tplPreviewResizeObserver = new ResizeObserver(apply);
  _tplPreviewResizeObserver.observe(frame);

  const useBtn = document.getElementById("tpl-preview-use");
  const cancelBtn = document.getElementById("tpl-preview-cancel");
  const closeBtn = document.getElementById("tpl-preview-close");

  // If the project already has this template applied, downgrade the primary
  // action to a no-op "in use" label so the user doesn't reapply needlessly.
  const isCurrent = state.selected?.templateId === tpl.id;
  useBtn.textContent = isCurrent
    ? t("settings.agent.in_use")
    : t("tpl_preview.use");
  useBtn.disabled = isCurrent;

  useBtn.onclick = async () => {
    if (!state.selected) return;
    // If the project already has a different template applied, confirm
    // before replacing — the user may have been just exploring.
    const current = state.selected.templateId;
    if (current && current !== tpl.id) {
      if (
        !confirm(t("tpl_preview.replace_confirm", { name: tpl.name ?? tpl.id }))
      )
        return;
    }
    useBtn.disabled = true;
    try {
      await API.setTemplate(state.selected.id, tpl.id);
      closeTemplatePreviewModal();
      closeGallery();
      await selectProject(state.selected.id);
      toast(t("tpl_preview.applied", { name: tpl.name ?? tpl.id }), "success");
    } finally {
      useBtn.disabled = false;
    }
  };
  cancelBtn.onclick = closeTemplatePreviewModal;
  closeBtn.onclick = closeTemplatePreviewModal;
}

// Render the three-layer provenance (RFC-07) for the previewed template so the
// upstream skill, its real author + license, and the original design lineage
// are visible in the studio — not just buried in the template's yaml.
function renderTemplateSource(tpl) {
  const box = document.getElementById("tpl-preview-source");
  if (!box) return;
  const p = tpl.provenance;
  const lic = tpl.license?.spdx;
  if (!p && !lic) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  const rows = [];
  const via = p?.via_skill;
  if (via?.name) {
    // "Adapted from <skill link> · <author> · <license>"
    const skill = via.url
      ? `<a href="${esc(via.url)}" target="_blank" rel="noopener">${esc(via.name)}</a>`
      : esc(via.name);
    const bits = [skill];
    if (via.author) bits.push(esc(via.author));
    if (via.license) bits.push(`<span class="lic">${esc(via.license)}</span>`);
    rows.push(
      `<div class="row"><span class="lbl">${esc(t("tpl_preview.source_skill"))}</span><span class="val">${bits.join(" · ")}</span></div>`,
    );
  }
  const origin = p?.origin;
  if (origin?.name && origin.name.toLowerCase() !== "none") {
    rows.push(
      `<div class="row"><span class="lbl">${esc(t("tpl_preview.source_origin"))}</span><span class="val">${esc(origin.name)}</span></div>`,
    );
  }
  // License row only stands alone when it wasn't already shown next to the skill.
  if (lic && !via?.license) {
    rows.push(
      `<div class="row"><span class="lbl">${esc(t("tpl_preview.source_license"))}</span><span class="val"><span class="lic">${esc(lic)}</span></span></div>`,
    );
  }
  if (!rows.length) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  box.innerHTML = rows.join("");
  box.hidden = false;
}

function closeTemplatePreviewModal() {
  const modal = document.getElementById("tpl-preview-modal");
  if (modal) modal.classList.remove("show");
  if (_tplPreviewResizeObserver) {
    _tplPreviewResizeObserver.disconnect();
    _tplPreviewResizeObserver = null;
  }
  // Stop the iframe from continuing to play in the background.
  const iframe = document.getElementById("tpl-preview-iframe");
  if (iframe) iframe.src = "about:blank";
  const poster = document.getElementById("tpl-preview-poster");
  if (poster) {
    poster.src = "";
    poster.hidden = true;
  }
  _tplPreviewCurrent = null;
}

// ============== new-project modal ==============
function openNewModal() {
  document.getElementById("new-modal").classList.add("show");
  document.getElementById("new-name").focus();
}
function closeNewModal() {
  document.getElementById("new-modal").classList.remove("show");
  document.getElementById("new-name").value = "";
  document.getElementById("new-intent").value = "";
}

function wireModals() {
  document.getElementById("new-cancel").onclick = closeNewModal;
  document.getElementById("new-ok").onclick = async () => {
    const name = document.getElementById("new-name").value.trim();
    const intent = document.getElementById("new-intent").value.trim();
    if (!name) {
      toast(t("modal.new.name_required"), "error");
      return;
    }
    const r = await API.createProject({ name, ...(intent && { intent }) });
    closeNewModal();
    await refreshProjects();
    await selectProject(r.project.id);
    toast(t("modal.new.created", { name }), "success");
  };
  document.getElementById("new-modal").addEventListener("click", (e) => {
    if (e.target.id === "new-modal") closeNewModal();
  });
  document.getElementById("gallery-close").onclick = closeGallery;
  document.getElementById("gallery-modal").addEventListener("click", (e) => {
    if (e.target.id === "gallery-modal") closeGallery();
  });
  // Settings
  const settingsModal = document.getElementById("settings-modal");
  if (settingsModal) {
    document.getElementById("settings-close").onclick = closeSettingsModal;
    settingsModal.addEventListener("click", (e) => {
      if (e.target.id === "settings-modal") closeSettingsModal();
    });
    settingsModal.querySelectorAll(".settings-nav-item").forEach((btn) => {
      btn.onclick = () => {
        settingsModal
          .querySelectorAll(".settings-nav-item")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderSettingsPanel(btn.dataset.settingsTab);
      };
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeNewModal();
      closeGallery();
      closeSettingsModal();
    }
  });
}

// ============== Settings modal ==============
// Real brand logos (SVG, copied from open-design/agent-icons). Served from
// /agent-icons/<id>.svg. Agents without a brand logo fall back to a glyph.
const AGENT_LOGOS = {
  "anthropic-api": "/agent-icons/anthropic.svg",
  claude: "/agent-icons/claude.svg",
  "cursor-agent": "/agent-icons/cursor-agent.svg",
  codex: "/agent-icons/codex.svg",
  hermes: "/agent-icons/hermes.svg",
  amr: "/agent-icons/amr.svg",
  gemini: "/agent-icons/gemini.svg",
  grok: "/agent-icons/grok.svg",
  qwen: "/agent-icons/qwen.svg",
  opencode: "/agent-icons/opencode.svg",
  copilot: "/agent-icons/copilot.svg",
  aider: "/agent-icons/aider.png",
  "qoder-cli": "/agent-icons/qoder.svg",
};
const AGENT_ICON_FALLBACK = {
  "anthropic-api": "cloud",
};
function agentIconHtml(id) {
  const logo = AGENT_LOGOS[id];
  if (logo) return `<img src="${esc(logo)}" alt="" class="agent-logo" />`;
  return icon(AGENT_ICON_FALLBACK[id] || "settings");
}
const AGENT_DESC = {
  "anthropic-api": "Direct Messages API · streams reliably",
  claude: "Claude Code (claude --print)",
  "cursor-agent": "Cursor command line",
  codex: "Codex CLI (codex exec)",
  hermes: "Hermes ACP CLI",
  "qoder-cli": "Qoder CLI (qodercli -p)",
};

function openSettingsModal(tab = "agent") {
  const modal = document.getElementById("settings-modal");
  if (!modal) return;
  modal.classList.add("show");
  modal.querySelectorAll(".settings-nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.settingsTab === tab);
  });
  renderSettingsPanel(tab);
}
function closeSettingsModal() {
  const modal = document.getElementById("settings-modal");
  if (modal) modal.classList.remove("show");
}

function renderSettingsPanel(tab) {
  const panel = document.getElementById("settings-panel");
  if (!panel) return;
  if (tab === "general" || tab === "language")
    return renderSettingsGeneral(panel);
  if (tab === "about") return renderSettingsAbout(panel);
  return renderSettingsAgent(panel);
}

function renderSettingsAgent(panel) {
  // Default to local CLI mode; BYOK = anthropic-api which is itself an HTTP agent
  const mode = panel.dataset.mode || "local";
  const agents = state.agents ?? [];
  const localAgents = agents.filter((a) => a.id !== "anthropic-api");
  const httpAgents = agents.filter((a) => a.id === "anthropic-api");
  const list = mode === "byok" ? httpAgents : localAgents;
  const currentId =
    state.selected?.agentId ||
    (agents.find((a) => a.available)?.id ?? "anthropic-api");

  panel.innerHTML = `
    <h3>${esc(t("settings.agent.title"))}</h3>
    <div class="panel-sub">${esc(t("settings.agent.subtitle"))}</div>

    <div class="settings-mode-tabs">
      <button data-mode="local" class="${mode === "local" ? "active" : ""}">${esc(t("settings.agent.mode.local"))}</button>
      <button data-mode="byok" class="${mode === "byok" ? "active" : ""}">${esc(t("settings.agent.mode.byok"))}</button>
    </div>

    ${
      mode === "byok"
        ? `
      <div class="panel-sub" style="margin-bottom:14px">
        ${esc(t("settings.agent.byok.intro"))}
        <ul style="margin:6px 0 0 18px;padding:0;font-family:var(--font-mono);font-size:11.5px">
          <li>${esc(t("settings.agent.byok.env_key"))}</li>
          <li>${esc(t("settings.agent.byok.env_base"))}</li>
        </ul>
      </div>
    `
        : ""
    }

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);letter-spacing:.08em;text-transform:uppercase">
        ${esc(t("settings.agent.detected", { count: list.length }))}
      </div>
      <button class="btn-rescan" style="background:transparent;border:1px solid var(--border);color:var(--text-muted);padding:5px 10px;border-radius:var(--radius-sm);cursor:pointer;font-size:11px;font-family:var(--font-mono)">
        ${iconL("refresh")}${esc(t("settings.agent.rescan"))}
      </button>
    </div>

    <div class="agent-list">
      ${list
        .map((a) => {
          const isCurrent = a.id === currentId && a.available;
          const desc = AGENT_DESC[a.id] || (a.bin ?? "");
          const ver = a.version
            ? esc(a.version)
            : a.available
              ? ""
              : esc(t("settings.agent.unavailable"));
          const iconHtml = agentIconHtml(a.id);
          return `<div class="agent-card ${isCurrent ? "selected" : ""}" data-agent-id="${esc(a.id)}">
          <div class="agent-icon">${iconHtml}</div>
          <div class="agent-meta">
            <div class="agent-name">
              <span class="agent-status-dot ${a.available ? "ok" : "missing"}"></span>${esc(a.name)}
            </div>
            <div class="agent-desc">${esc(desc)}</div>
            ${ver ? `<div class="agent-version">${ver}</div>` : ""}
          </div>
          <div class="agent-actions">
            ${a.available ? `<button data-act="test">${esc(t("settings.agent.test"))}</button>` : ""}
            ${
              a.available
                ? isCurrent
                  ? `<span style="font-size:11px;color:var(--accent);font-family:var(--font-mono)">${esc(t("settings.agent.in_use"))}</span>`
                  : `<button data-act="use" class="primary-action" style="background:var(--accent);border-color:var(--accent);color:var(--accent-fg)">${esc(t("settings.agent.use"))}</button>`
                : a.installUrl
                  ? `<a href="${a.installUrl}" target="_blank" rel="noopener" style="font-size:11px;color:var(--text-faint)">install ${icon("externalLink")}</a>`
                  : ""
            }
          </div>
          <div class="agent-test-result" data-test-result="${esc(a.id)}" style="display:none;grid-column:1 / -1"></div>
        </div>`;
        })
        .join("")}
    </div>
  `;

  panel.querySelectorAll(".settings-mode-tabs button").forEach((btn) => {
    btn.onclick = () => {
      panel.dataset.mode = btn.dataset.mode;
      renderSettingsAgent(panel);
    };
  });
  panel.querySelectorAll(".btn-rescan").forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = "…";
      try {
        const r = await API.rescanAgents();
        state.agents = r.agents ?? state.agents;
        renderSettingsAgent(panel);
        toast(t("settings.agent.rescanned"), "success");
      } finally {
        btn.disabled = false;
      }
    };
  });
  panel.querySelectorAll(".agent-card [data-act]").forEach((btn) => {
    btn.onclick = async () => {
      const card = btn.closest(".agent-card");
      const aid = card.dataset.agentId;
      const act = btn.dataset.act;
      if (act === "use") {
        if (!state.selected) {
          toast(t("composer.placeholder.no_project"), "error");
          return;
        }
        await API.setAgent(state.selected.id, aid);
        state.selected = (await API.getProject(state.selected.id)).project;
        renderSettingsAgent(panel);
        toast(`✓ ${aid}`, "success");
      } else if (act === "test") {
        const result = panel.querySelector(`[data-test-result="${aid}"]`);
        result.style.display = "block";
        result.className = "agent-test-result";
        result.textContent = t("settings.agent.testing");
        btn.disabled = true;
        try {
          const r = await API.testAgent(aid);
          if (r.ok) {
            result.classList.add("ok");
            result.textContent =
              t("settings.agent.test_ok", { ms: r.ms, bytes: r.bytes }) +
              (r.stdout_head
                ? ` — ${r.stdout_head.slice(0, 60).replace(/\n/g, " ")}`
                : "");
          } else {
            result.classList.add("error");
            result.textContent = t("settings.agent.test_fail", {
              message: r.error || `exit ${r.exit_code}`,
            });
          }
        } catch (e) {
          result.classList.add("error");
          result.textContent = t("settings.agent.test_fail", {
            message: e?.message ?? String(e),
          });
        } finally {
          btn.disabled = false;
        }
      }
    };
  });
}

function renderSettingsGeneral(panel) {
  const curLang = getLocale();
  const curTheme = getTheme();
  const themeOpt = (key, ic) => `
    <button data-theme-opt="${key}" class="${curTheme === key ? "active" : ""}">
      <div class="opt-name">${iconL(ic)}${esc(t(`settings.theme.${key}`))}</div>
      <div class="opt-sub">${esc(t(`settings.theme.${key}_sub`))}</div>
    </button>`;
  const langOpt = (key) => `
    <button data-lang="${key}" class="${curLang === key ? "active" : ""}">
      <div class="opt-name">${esc(t(`settings.language.${key}`))}</div>
      <div class="opt-sub">${esc(t(`settings.language.${key}_sub`))}</div>
    </button>`;
  panel.innerHTML = `
    <h3>${esc(t("settings.tab.general"))}</h3>
    <div class="panel-sub">${esc(t("settings.general.subtitle"))}</div>

    <div class="settings-section">
      <h4>${esc(t("settings.theme.title"))}</h4>
      <div class="section-sub">${esc(t("settings.theme.subtitle"))}</div>
      <div class="opt-grid">
        ${themeOpt("auto", "monitor")}
        ${themeOpt("light", "sun")}
        ${themeOpt("dark", "moon")}
      </div>
    </div>

    <div class="settings-section">
      <h4>${esc(t("settings.language.title"))}</h4>
      <div class="section-sub">${esc(t("settings.language.subtitle"))}</div>
      <div class="opt-grid">
        ${langOpt("vi")}
        ${langOpt("en")}
      </div>
    </div>

    <div class="settings-section">
      <h4>${ytGlyph("ico-lead")}YouTube</h4>
      <div class="section-sub">Kết nối kênh của bạn để đăng Short thẳng từ studio (dùng tài khoản riêng).</div>
      <div id="yt-connect"><div class="section-sub">Đang kiểm tra…</div></div>
    </div>

    <div class="settings-section">
      <h4>${fbGlyph("ico-lead")}Facebook Reels</h4>
      <div class="section-sub">Kết nối 1 Trang (Page) để đăng Reels thẳng từ studio. Reels chỉ đăng được lên Trang, không lên trang cá nhân.</div>
      <div id="fb-connect"><div class="section-sub">Đang kiểm tra…</div></div>
    </div>
  `;
  renderYouTubeConnect(panel.querySelector("#yt-connect"));
  renderFacebookConnect(panel.querySelector("#fb-connect"));
  panel.querySelectorAll("[data-theme-opt]").forEach((btn) => {
    btn.onclick = () => {
      setTheme(btn.dataset.themeOpt);
      renderSettingsGeneral(panel);
    };
  });
  panel.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.onclick = () => {
      setLocale(btn.dataset.lang);
      // re-render this panel with the new locale (the global locale-change
      // handler re-renders the rest of the app but not this open panel)
      renderSettingsGeneral(panel);
    };
  });
}

// ── YouTube connect (Settings → General) ──────────────────────────────────
async function renderYouTubeConnect(el) {
  if (!el) return;
  let st;
  try {
    st = await (await fetch("/api/youtube/status")).json();
  } catch {
    el.innerHTML =
      '<div class="section-sub">Không tải được trạng thái YouTube.</div>';
    return;
  }
  if (!st.hasCreds) {
    renderYouTubeCreds(el);
    return;
  }
  const accounts = st.accounts || [];
  const accountsHtml = accounts.length
    ? `<div class="acct-list">${accounts
        .map(
          (a) => `
        <div class="acct-row"><span class="yt-ok">${iconL("check")}${esc(a.label)}</span>
          <button class="yt-btn acct-disc" data-acct="${esc(a.id)}">Ngắt</button></div>`,
        )
        .join("")}</div>`
    : "";
  el.innerHTML = `
    ${accountsHtml}
    <div class="yt-note">Thêm URI này vào <b>Authorized redirect URIs</b> (Google Cloud): <code class="yt-uri">${esc(st.redirectUri || "")}</code>${accounts.length ? " — muốn thêm kênh khác thì chọn tài khoản Google khác ở màn hình cho phép." : ""}</div>
    <div class="yt-row">
      <button class="yt-btn yt-primary" id="yt-conn">${iconL("externalLink")}${accounts.length ? "Kết nối thêm tài khoản" : "Kết nối"}</button>
      <button class="yt-btn" id="yt-recheck">Đã cho phép — kiểm tra</button>
      <button class="yt-btn" id="yt-edit">Sửa khóa</button>
    </div>`;
  el.querySelector("#yt-conn").onclick = async () => {
    try {
      const r = await (await fetch("/api/youtube/auth-url")).json();
      if (r.url) window.open(r.url, "_blank", "width=520,height=700");
      else throw new Error(r.error || "no url");
    } catch (e) {
      toast(`Lỗi: ${e?.message ?? e}`, "error");
    }
  };
  el.querySelector("#yt-recheck").onclick = () => renderYouTubeConnect(el);
  el.querySelector("#yt-edit").onclick = () => renderYouTubeCreds(el);
  el.querySelectorAll(".acct-disc").forEach((btn) => {
    btn.onclick = async () => {
      await fetch("/api/youtube/disconnect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accountId: btn.dataset.acct }),
      });
      renderYouTubeConnect(el);
    };
  });
}
function renderYouTubeCreds(el) {
  el.innerHTML = `
    <div class="yt-note">Dán OAuth <b>Client ID</b> & <b>Client Secret</b> (Google Cloud → APIs → Credentials).</div>
    <input class="yt-input" id="yt-cid" placeholder="Client ID" autocomplete="off" />
    <input class="yt-input" id="yt-csec" placeholder="Client Secret" type="password" autocomplete="off" />
    <div class="yt-row"><button class="yt-btn yt-primary" id="yt-save">Lưu khóa</button></div>`;
  el.querySelector("#yt-save").onclick = async () => {
    const clientId = el.querySelector("#yt-cid").value.trim();
    const clientSecret = el.querySelector("#yt-csec").value.trim();
    if (!clientId || !clientSecret) {
      toast("Nhập đủ Client ID + Secret", "error");
      return;
    }
    try {
      const r = await fetch("/api/youtube/credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      });
      if (!r.ok) throw new Error((await r.json()).error || r.status);
      renderYouTubeConnect(el);
    } catch (e) {
      toast(`Lỗi: ${e?.message ?? e}`, "error");
    }
  };
}

// AI-write a viral title + description for a social upload, fill the fields.
async function draftSocialCopy(platform, titleEl, descEl, btn) {
  if (!state.selected) return;
  const agentId =
    state.selected.agentId ??
    state.agents.find((a) => a.available && a.id !== "amr")?.id ??
    "anthropic-api";
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "AI đang viết…";
  try {
    const r = await fetch(`/api/projects/${state.selected.id}/draft-social`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId, platform }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    if (d.title && titleEl) titleEl.value = d.title;
    if (d.description && descEl) descEl.value = d.description;
    toast("AI đã viết tiêu đề & mô tả ✓", "success");
  } catch (e) {
    toast(`AI viết thất bại: ${e?.message ?? e}`, "error");
  } finally {
    btn.innerHTML = orig;
    btn.disabled = false;
  }
}

// ── Publish an exported MP4 to YouTube Shorts ─────────────────────────────
async function openYouTubeUpload(filename) {
  let st;
  try {
    st = await (await fetch("/api/youtube/status")).json();
  } catch {
    st = {};
  }
  const accounts = st.accounts || [];
  if (!accounts.length) {
    toast("Chưa kết nối YouTube — vào Cài đặt → YouTube.", "error");
    openSettingsModal("general");
    return;
  }
  const defTitle = (
    state.selected?.name || filename.replace(/\.mp4$/, "")
  ).slice(0, 90);
  // Show a channel picker only when there's more than one connected account.
  const acctPicker =
    accounts.length > 1
      ? `<label class="yt-flabel">Kênh</label>
       <select class="yt-input" id="ytm-account">${accounts.map((a) => `<option value="${esc(a.id)}">${esc(a.label)}</option>`).join("")}</select>`
      : `<input type="hidden" id="ytm-account" value="${esc(accounts[0].id)}" />`;
  const ov = document.createElement("div");
  ov.className = "modal-bg show";
  ov.innerHTML = `<div class="modal yt-modal">
    <div class="settings-head"><h2>${ytGlyph("ico-lead")}Đăng YouTube Short</h2>
      <button class="modal-close" id="ytm-x" aria-label="Close">${icon("x")}</button></div>
    <div class="yt-modal-body">
      <button class="yt-btn yt-ai" id="ytm-ai">${iconL("sparkles")}AI viết tiêu đề &amp; mô tả viral</button>
      ${acctPicker}
      <label class="yt-flabel">Tiêu đề</label>
      <input class="yt-input" id="ytm-title" value="${esc(defTitle)}" maxlength="100" />
      <label class="yt-flabel">Mô tả</label>
      <textarea class="yt-input" id="ytm-desc" rows="3" placeholder="Mô tả… (#Shorts sẽ được tự thêm)"></textarea>
      <label class="yt-flabel">Chế độ hiển thị</label>
      <select class="yt-input" id="ytm-priv">
        <option value="private">Riêng tư (private)</option>
        <option value="unlisted">Không công khai (unlisted)</option>
        <option value="public">Công khai (public)</option>
      </select>
      <div class="yt-modal-actions">
        <span class="yt-status" id="ytm-status"></span>
        <button class="yt-btn yt-primary" id="ytm-go">${ytGlyph("ico-lead")}Đăng</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.querySelector("#ytm-x").onclick = close;
  ov.addEventListener("click", (e) => {
    if (e.target === ov) close();
  });
  ov.querySelector("#ytm-ai").onclick = (e) =>
    draftSocialCopy(
      "youtube",
      ov.querySelector("#ytm-title"),
      ov.querySelector("#ytm-desc"),
      e.currentTarget,
    );
  const statusEl = ov.querySelector("#ytm-status");
  const goBtn = ov.querySelector("#ytm-go");
  goBtn.onclick = async () => {
    goBtn.disabled = true;
    statusEl.textContent = "Đang chuẩn bị…";
    const payload = {
      filename,
      title: ov.querySelector("#ytm-title").value.trim() || defTitle,
      description: ov.querySelector("#ytm-desc").value,
      privacy: ov.querySelector("#ytm-priv").value,
      accountId: ov.querySelector("#ytm-account")?.value,
    };
    try {
      const res = await fetch(
        `/api/projects/${state.selected.id}/youtube/upload`,
        {
          method: "POST",
          headers: {
            accept: "text/event-stream",
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const line of parts) {
          if (!line.startsWith("data: ")) continue;
          let ev;
          try {
            ev = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (ev.type === "yt_progress")
            statusEl.textContent =
              ev.stage === "auth" ? "Xác thực…" : "Đang tải lên…";
          else if (ev.type === "yt_done") {
            statusEl.innerHTML = `${iconL("check")}Đã đăng! <a href="${esc(ev.url)}" target="_blank" rel="noopener">Mở video</a>`;
            toast("Đã đăng YouTube Short ✓", "success");
            goBtn.textContent = "Đã đăng";
            if (state.rightTab === "exports") renderExportsPanel();
          } else if (ev.type === "yt_failed") {
            statusEl.textContent = `Lỗi: ${ev.message}`;
            toast(`Đăng thất bại: ${ev.message}`, "error");
            goBtn.disabled = false;
          }
        }
      }
    } catch (e) {
      statusEl.textContent = `Lỗi: ${e?.message ?? e}`;
      goBtn.disabled = false;
    }
  };
}

// ── Facebook connect (Settings → General) ─────────────────────────────────
async function renderFacebookConnect(el) {
  if (!el) return;
  let st;
  try {
    st = await (await fetch("/api/facebook/status")).json();
  } catch {
    el.innerHTML =
      '<div class="section-sub">Không tải được trạng thái Facebook.</div>';
    return;
  }
  if (st.pageSelected) {
    el.innerHTML = `<div class="yt-row"><span class="yt-ok">${iconL("check")}Đã kết nối Trang: <b>${esc(st.pageName || "")}</b></span>
      <button class="yt-btn" id="fb-disc">Ngắt kết nối</button></div>`;
    el.querySelector("#fb-disc").onclick = async () => {
      await fetch("/api/facebook/disconnect", { method: "POST" });
      renderFacebookConnect(el);
    };
    return;
  }
  if (st.connected) {
    // Logged in but no Page chosen yet — list the user's Pages to pick one.
    el.innerHTML = `<div class="yt-note">Đã đăng nhập. Chọn Trang để đăng Reels:</div><div id="fb-pages" class="yt-row"><span class="section-sub">Đang tải danh sách Trang…</span></div>`;
    const box = el.querySelector("#fb-pages");
    try {
      const r = await (await fetch("/api/facebook/pages")).json();
      const pages = r.pages || [];
      if (!pages.length) {
        box.innerHTML = `<span class="section-sub">Không thấy Trang nào bạn quản lý — hãy tạo 1 Facebook Page rồi thử lại.</span> <button class="yt-btn" id="fb-recheck">Kiểm tra lại</button> <button class="yt-btn" id="fb-disc2">Đăng xuất</button>`;
      } else {
        box.innerHTML = `<select class="yt-input" id="fb-page-sel" style="max-width:260px;margin:0">${pages.map((p) => `<option value="${esc(p.id)}"${p.id === r.selectedPageId ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
          <button class="yt-btn yt-primary" id="fb-page-save">Chọn Trang</button>
          <button class="yt-btn" id="fb-disc2">Đăng xuất</button>`;
        box.querySelector("#fb-page-save").onclick = async () => {
          const pageId = box.querySelector("#fb-page-sel").value;
          try {
            const res = await fetch("/api/facebook/select-page", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ pageId }),
            });
            if (!res.ok)
              throw new Error((await res.json()).error || res.status);
            renderFacebookConnect(el);
          } catch (e) {
            toast(`Lỗi chọn Trang: ${e?.message ?? e}`, "error");
          }
        };
      }
      box
        .querySelector("#fb-recheck")
        ?.addEventListener("click", () => renderFacebookConnect(el));
      box.querySelector("#fb-disc2")?.addEventListener("click", async () => {
        await fetch("/api/facebook/disconnect", { method: "POST" });
        renderFacebookConnect(el);
      });
    } catch (e) {
      box.innerHTML = `<span class="section-sub">Lỗi tải Trang: ${esc(e?.message ?? e)}</span> <button class="yt-btn" id="fb-recheck2">Thử lại</button>`;
      box.querySelector("#fb-recheck2").onclick = () =>
        renderFacebookConnect(el);
    }
    return;
  }
  if (st.hasCreds) {
    el.innerHTML = `
      <div class="yt-note">Thêm URI này vào <b>Valid OAuth Redirect URIs</b> (App → Facebook Login → Settings). Dùng <b>localhost</b> để mở studio khi kết nối:
        <code class="yt-uri">${esc(st.redirectUri || "")}</code></div>
      <div class="yt-row">
        <button class="yt-btn yt-primary" id="fb-conn">${iconL("externalLink")}Kết nối</button>
        <button class="yt-btn" id="fb-recheck">Đã cho phép — kiểm tra</button>
        <button class="yt-btn" id="fb-edit">Sửa khóa</button>
      </div>`;
    el.querySelector("#fb-conn").onclick = async () => {
      try {
        const r = await (await fetch("/api/facebook/auth-url")).json();
        if (r.url) window.open(r.url, "_blank", "width=560,height=720");
        else throw new Error(r.error || "no url");
      } catch (e) {
        toast(`Lỗi: ${e?.message ?? e}`, "error");
      }
    };
    el.querySelector("#fb-recheck").onclick = () => renderFacebookConnect(el);
    el.querySelector("#fb-edit").onclick = () => renderFacebookCreds(el);
    return;
  }
  renderFacebookCreds(el);
}
function renderFacebookCreds(el) {
  el.innerHTML = `
    <div class="yt-note">Dán <b>App ID</b> & <b>App Secret</b> (Meta for Developers → App → Settings → Basic).</div>
    <input class="yt-input" id="fb-aid" placeholder="App ID" autocomplete="off" />
    <input class="yt-input" id="fb-asec" placeholder="App Secret" type="password" autocomplete="off" />
    <div class="yt-row"><button class="yt-btn yt-primary" id="fb-save">Lưu khóa</button></div>`;
  el.querySelector("#fb-save").onclick = async () => {
    const appId = el.querySelector("#fb-aid").value.trim();
    const appSecret = el.querySelector("#fb-asec").value.trim();
    if (!appId || !appSecret) {
      toast("Nhập đủ App ID + Secret", "error");
      return;
    }
    try {
      const r = await fetch("/api/facebook/credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appId, appSecret }),
      });
      if (!r.ok) throw new Error((await r.json()).error || r.status);
      renderFacebookConnect(el);
    } catch (e) {
      toast(`Lỗi: ${e?.message ?? e}`, "error");
    }
  };
}

// ── Publish an exported MP4 to Facebook Reels ─────────────────────────────
async function openFacebookUpload(filename) {
  let st;
  try {
    st = await (await fetch("/api/facebook/status")).json();
  } catch {
    st = {};
  }
  if (!st.pageSelected) {
    toast("Chưa kết nối Facebook — vào Cài đặt → Facebook.", "error");
    openSettingsModal("general");
    return;
  }
  const ov = document.createElement("div");
  ov.className = "modal-bg show";
  ov.innerHTML = `<div class="modal yt-modal">
    <div class="settings-head"><h2>${fbGlyph("ico-lead")}Đăng Facebook Reel</h2>
      <button class="modal-close" id="fbm-x" aria-label="Close">${icon("x")}</button></div>
    <div class="yt-modal-body">
      <button class="yt-btn yt-ai" id="fbm-ai">${iconL("sparkles")}AI viết mô tả viral</button>
      <label class="yt-flabel">Trang</label>
      <div class="yt-note" style="margin:0 0 6px">Đăng lên: <b>${esc(st.pageName || "")}</b></div>
      <label class="yt-flabel">Mô tả</label>
      <textarea class="yt-input" id="fbm-desc" rows="3" placeholder="Mô tả Reel…"></textarea>
      <label class="yt-flabel">Trạng thái</label>
      <select class="yt-input" id="fbm-state">
        <option value="DRAFT">Nháp (draft — chỉ lưu, chưa công khai)</option>
        <option value="PUBLISHED">Đăng công khai (published)</option>
      </select>
      <div class="yt-modal-actions">
        <span class="yt-status" id="fbm-status"></span>
        <button class="yt-btn yt-primary" id="fbm-go">${fbGlyph("ico-lead")}Đăng Reel</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.querySelector("#fbm-x").onclick = close;
  ov.addEventListener("click", (e) => {
    if (e.target === ov) close();
  });
  ov.querySelector("#fbm-ai").onclick = (e) =>
    draftSocialCopy(
      "facebook",
      null,
      ov.querySelector("#fbm-desc"),
      e.currentTarget,
    );
  const statusEl = ov.querySelector("#fbm-status");
  const goBtn = ov.querySelector("#fbm-go");
  goBtn.onclick = async () => {
    goBtn.disabled = true;
    statusEl.textContent = "Đang tải lên…";
    const payload = {
      filename,
      description: ov.querySelector("#fbm-desc").value,
      state: ov.querySelector("#fbm-state").value,
    };
    try {
      const res = await fetch(
        `/api/projects/${state.selected.id}/facebook/upload`,
        {
          method: "POST",
          headers: {
            accept: "text/event-stream",
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const line of parts) {
          if (!line.startsWith("data: ")) continue;
          let ev;
          try {
            ev = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (ev.type === "fb_progress") statusEl.textContent = "Đang tải lên…";
          else if (ev.type === "fb_done") {
            statusEl.innerHTML =
              ev.state === "DRAFT"
                ? `${iconL("check")}Đã lưu nháp! Mở Meta Business Suite để xem/đăng.`
                : `${iconL("check")}Đã đăng! <a href="${esc(ev.url)}" target="_blank" rel="noopener">Mở Reel</a>`;
            toast("Đã đăng Facebook Reel ✓", "success");
            goBtn.textContent = "Đã đăng";
            if (state.rightTab === "exports") renderExportsPanel();
          } else if (ev.type === "fb_failed") {
            statusEl.textContent = `Lỗi: ${ev.message}`;
            toast(`Đăng thất bại: ${ev.message}`, "error");
            goBtn.disabled = false;
          }
        }
      }
    } catch (e) {
      statusEl.textContent = `Lỗi: ${e?.message ?? e}`;
      goBtn.disabled = false;
    }
  };
}

// ── Quick-upload: attach any video → post to YouTube/Facebook with AI copy ──
async function openQuickUpload() {
  let yt = {};
  let fb = {};
  try {
    yt = await (await fetch("/api/youtube/status")).json();
  } catch {
    /* offline */
  }
  try {
    fb = await (await fetch("/api/facebook/status")).json();
  } catch {
    /* offline */
  }
  const ytAccounts = yt.accounts || [];
  const ytOn = ytAccounts.length > 0;
  const fbOn = !!fb.pageSelected;
  if (!ytOn && !fbOn) {
    toast("Chưa kết nối YouTube/Facebook — vào Cài đặt để kết nối.", "error");
    openSettingsModal("general");
    return;
  }
  let platform = ytOn ? "youtube" : "facebook";

  const ov = document.createElement("div");
  ov.className = "modal-bg show";
  ov.innerHTML = `<div class="modal yt-modal">
    <div class="settings-head"><h2>${iconL("sparkles")}Đăng nhanh video</h2>
      <button class="modal-close" id="qu-x" aria-label="Close">${icon("x")}</button></div>
    <div class="yt-modal-body">
      <label class="yt-flabel">Nền tảng</label>
      <div class="qu-platforms">
        ${ytOn ? `<button type="button" class="qu-plat" data-plat="youtube">${ytGlyph()}<span>YouTube Short</span></button>` : ""}
        ${fbOn ? `<button type="button" class="qu-plat" data-plat="facebook">${fbGlyph()}<span>Facebook Reel</span></button>` : ""}
      </div>
      <label class="yt-flabel">Video (.mp4)</label>
      <input class="yt-input" type="file" id="qu-file" accept="video/mp4,video/*" />
      <label class="yt-flabel">Nội dung video (cho AI viết tiêu đề)</label>
      <textarea class="yt-input" id="qu-topic" rows="2" placeholder="Vd: hướng dẫn deploy Kubernetes bằng game 3D trên trình duyệt…"></textarea>
      <button class="yt-btn yt-ai" id="qu-ai">${iconL("sparkles")}AI viết tiêu đề &amp; mô tả viral</button>
      <div id="qu-platfields"></div>
      <div class="yt-modal-actions">
        <span class="yt-status" id="qu-status"></span>
        <button class="yt-btn yt-primary" id="qu-go">Đăng</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.querySelector("#qu-x").onclick = close;
  ov.addEventListener("click", (e) => {
    if (e.target === ov) close();
  });
  const statusEl = ov.querySelector("#qu-status");
  const platFields = ov.querySelector("#qu-platfields");

  const renderPlatFields = () => {
    ov.querySelectorAll(".qu-plat").forEach((b) =>
      b.classList.toggle("active", b.dataset.plat === platform),
    );
    if (platform === "youtube") {
      platFields.innerHTML = `
        ${
          ytAccounts.length > 1
            ? `<label class="yt-flabel">Kênh</label><select class="yt-input" id="qu-account">${ytAccounts.map((a) => `<option value="${esc(a.id)}">${esc(a.label)}</option>`).join("")}</select>`
            : `<input type="hidden" id="qu-account" value="${esc(ytAccounts[0]?.id || "")}" />`
        }
        <label class="yt-flabel">Tiêu đề</label>
        <input class="yt-input" id="qu-title" maxlength="100" placeholder="Tiêu đề video" />
        <label class="yt-flabel">Mô tả</label>
        <textarea class="yt-input" id="qu-desc" rows="3" placeholder="Mô tả… (#Shorts sẽ được tự thêm)"></textarea>
        <label class="yt-flabel">Chế độ hiển thị</label>
        <select class="yt-input" id="qu-priv"><option value="private">Riêng tư (private)</option><option value="unlisted">Không công khai (unlisted)</option><option value="public">Công khai (public)</option></select>`;
    } else {
      platFields.innerHTML = `
        <div class="yt-note" style="margin:0 0 6px">Đăng lên Trang: <b>${esc(fb.pageName || "")}</b></div>
        <label class="yt-flabel">Mô tả</label>
        <textarea class="yt-input" id="qu-desc" rows="3" placeholder="Mô tả Reel…"></textarea>
        <label class="yt-flabel">Trạng thái</label>
        <select class="yt-input" id="qu-state"><option value="DRAFT">Nháp (draft — chỉ lưu)</option><option value="PUBLISHED">Đăng công khai</option></select>`;
    }
  };
  renderPlatFields();
  ov.querySelectorAll(".qu-plat").forEach((b) => {
    b.onclick = () => {
      platform = b.dataset.plat;
      renderPlatFields();
    };
  });

  ov.querySelector("#qu-ai").onclick = async (e) => {
    const btn = e.currentTarget;
    const topic = ov.querySelector("#qu-topic").value.trim();
    if (!topic) {
      toast("Nhập nội dung video để AI viết", "error");
      return;
    }
    const agentId =
      state.selected?.agentId ??
      state.agents.find((a) => a.available && a.id !== "amr")?.id ??
      "anthropic-api";
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = "AI đang viết…";
    try {
      const r = await fetch("/api/draft-social-freeform", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId, platform, topic }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || r.status);
      const titleEl = ov.querySelector("#qu-title");
      const descEl = ov.querySelector("#qu-desc");
      if (d.title && titleEl) titleEl.value = d.title;
      if (d.description && descEl) descEl.value = d.description;
      toast("AI đã viết tiêu đề & mô tả ✓", "success");
    } catch (err) {
      toast(`AI viết thất bại: ${err?.message ?? err}`, "error");
    } finally {
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  };

  ov.querySelector("#qu-go").onclick = async () => {
    const goBtn = ov.querySelector("#qu-go");
    const file = ov.querySelector("#qu-file").files?.[0];
    if (!file) {
      toast("Chọn file video trước", "error");
      return;
    }
    goBtn.disabled = true;
    statusEl.textContent = "Đang tải lên…";
    const fd = new FormData();
    fd.append("description", ov.querySelector("#qu-desc")?.value || "");
    if (platform === "youtube") {
      fd.append("title", ov.querySelector("#qu-title")?.value || file.name);
      fd.append("privacy", ov.querySelector("#qu-priv")?.value || "private");
      fd.append("accountId", ov.querySelector("#qu-account")?.value || "");
    } else {
      fd.append("state", ov.querySelector("#qu-state")?.value || "DRAFT");
    }
    fd.append("video", file, file.name);
    try {
      const res = await fetch(`/api/quick-upload/${platform}`, {
        method: "POST",
        headers: { accept: "text/event-stream" },
        body: fd,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const evs = buf.split("\n\n");
        buf = evs.pop() ?? "";
        for (const line of evs) {
          if (!line.startsWith("data: ")) continue;
          let ev;
          try {
            ev = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (ev.type === "yt_progress" || ev.type === "fb_progress")
            statusEl.textContent =
              ev.stage === "auth" ? "Xác thực…" : "Đang tải lên…";
          else if (ev.type === "yt_done") {
            statusEl.innerHTML = `${iconL("check")}Đã đăng! <a href="${esc(ev.url)}" target="_blank" rel="noopener">Mở video</a>`;
            toast("Đã đăng YouTube ✓", "success");
            goBtn.textContent = "Đã đăng";
          } else if (ev.type === "fb_done") {
            statusEl.innerHTML =
              ev.state === "DRAFT"
                ? `${iconL("check")}Đã lưu nháp! Mở Meta Business Suite để đăng.`
                : `${iconL("check")}Đã đăng! <a href="${esc(ev.url)}" target="_blank" rel="noopener">Mở Reel</a>`;
            toast("Đã đăng Facebook ✓", "success");
            goBtn.textContent = "Đã đăng";
          } else if (ev.type === "yt_failed" || ev.type === "fb_failed") {
            statusEl.textContent = `Lỗi: ${ev.message}`;
            toast(`Đăng thất bại: ${ev.message}`, "error");
            goBtn.disabled = false;
          }
        }
      }
    } catch (e) {
      statusEl.textContent = `Lỗi: ${e?.message ?? e}`;
      goBtn.disabled = false;
    }
  };
}

function renderSettingsAbout(panel) {
  panel.innerHTML = `
    <h3>${esc(t("settings.about.title"))}</h3>
    <div class="panel-sub">${esc(t("settings.about.subtitle"))}</div>
    <div class="about-block">
      <div class="about-line"><span class="k">${esc(t("settings.about.version"))}</span><span class="v">studio · v0.7</span></div>
      <div class="about-line"><span class="k">${esc(t("settings.about.repo"))}</span><span class="v"><a href="https://github.com/nexu-io/html-video" target="_blank" rel="noopener">github.com/nexu-io/html-video</a></span></div>
      <div class="about-line"><span class="k">${esc(t("settings.about.discord"))}</span><span class="v"><a href="https://discord.com/invite/keeVPMrueT" target="_blank" rel="noopener">discord.com/invite/keeVPMrueT</a></span></div>
      <div class="about-line"><span class="k">${esc(t("settings.about.license"))}</span><span class="v">Apache-2.0</span></div>
      <div class="about-line"><span class="k">${esc(t("settings.about.related"))}</span><span class="v"><a href="https://github.com/nexu-io/open-design" target="_blank" rel="noopener">Open Design</a></span></div>
    </div>
  `;
}

// ============== utils ==============
function toast(msg, kind = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${kind}`;
  setTimeout(() => t.classList.remove("show"), 2500);
}
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

window.addEventListener("error", (e) => {
  console.error("[hv-studio] uncaught:", e.error || e.message);
  try {
    toast(
      t("toast.error", { message: e.error?.message || e.message }),
      "error",
    );
  } catch {}
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[hv-studio] unhandled rejection:", e.reason);
  try {
    toast(
      t("toast.error", { message: e.reason?.message || e.reason }),
      "error",
    );
  } catch {}
});
init().catch((e) => {
  console.error("[hv-studio] init failed:", e);
  try {
    toast(t("toast.init_failed", { message: e.message }), "error");
  } catch {}
});
