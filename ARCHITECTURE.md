# Architecture

A function-level tour of the `html-video` monorepo. For the user-facing overview see
[README.md](README.md); for build/run/verify notes and gotchas see [CLAUDE.md](CLAUDE.md).

`html-video` is a local **HTML→video meta-layer**: a coding agent generates HTML "frames",
each frame is rendered to MP4 through a pluggable engine, the frames are concatenated, and
optional Edge-TTS narration + word-by-word captions are mixed in — after which the result
can be published to YouTube Shorts / Facebook Reels.

## System map

```
                    ┌─────────────────── UI ───────────────────┐
       project-studio (vanilla JS SPA, :3071)      studio-next (React spike, :3072, unused)
                    └──────────────── HTTP / SSE ───────────────┘
                                     │
                          cli  (studio-server + CLI)              ← orchestration + HTTP server
                                     │
             ┌───────────────────────┼───────────────────────┐
          runtime                  core                  adapter-hyperframes
      (spawn agent CLIs)     (orchestrator)              adapter-remotion       ← engines + agent runtime
                                     │
                              content-graph                                     ← foundation: storyboard IR
```

| Package               | Role                                                                         | Status                                   |
| --------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| `content-graph`       | Storyboard IR — node/edge schema, `validate`, `topoSort`, `totalDurationSec` | ✅ complete                              |
| `core`                | Orchestrator, registries, asset store, Edge-TTS, captions, ffmpeg concat/mux | ✅ complete                              |
| `adapter-hyperframes` | Default engine (Playwright + Chromium + ffmpeg)                              | ✅ real render; `renderToHtml` is a stub |
| `adapter-remotion`    | Enhancement engine (React/TSX) — bridge + native                             | ✅ real render                           |
| `runtime`             | Detect / spawn / stream 14 coding-agent backends                             | ✅ complete                              |
| `cli`                 | `html-video` CLI + studio HTTP server (largest package)                      | ✅ `studio-server.ts` ≈ 5300 lines       |
| `project-studio`      | Production studio UI (static SPA)                                            | ✅ what the CLI serves                   |
| `studio-next`         | React/Vite spike                                                             | ⚠️ not wired to the backend              |

## Data flow

**Multi-frame** (the main path): `create` → add assets → set template → agent emits a
**content-graph** (round 1) → agent emits **one HTML block per node** (round 2) →
`writeFrameHtml` (order = `topoSort`) → `exportMp4`: render each frame to MP4 →
**ffmpeg concat** → **mux narration + music + burn captions** → `output-<timestamp>.mp4` →
optional YouTube / Facebook upload.

**Single-frame** (fast path): no content-graph — one template, one HTML, one `render()`.

---

## `content-graph` — storyboard IR (RFC-06)

Entire package is one file (`src/index.ts`). This is the plan the agent emits in round 1 and
the renderer consumes in round 2.

**Nodes** (all extend `BaseNode`: `id`, `label?`, `frameIntent?`, `durationSec?`):

- `entity` — branding/assets (`props`: logo, brand color)
- `data` — quantities to visualize (`data: unknown`)
- `text` — copy (`text: string`)

**Edges** (each affects ordering differently — the crux of the schema):

- `dependency` — **hard** constraint; the only edge type that builds the Kahn graph and is cycle-checked
- `sequence` — **soft** preference; only breaks ties among ready nodes
- `contrast` — **ignored for ordering**; layout/semantic hint only

**Functions:**

- `validate(graph)` — collects _all_ errors in one pass (duplicate id, edge→unknown node, self-edge, cycle, empty, bad kind) so the agent fixes in one round-trip.
- `topoSort(graph)` — Kahn's algorithm; precedence **dependency (hard) > sequence (soft) > original array index**. Throws on a dependency cycle.
- `getNode(graph, id)`, `totalDurationSec(graph)` (sum of `durationSec ?? 3`), `DEFAULT_FRAME_DURATION_SEC = 3`.
- `findDependencyCycle` (internal, white/gray/black DFS).

---

## `core` — engine-agnostic heart

Holds no engine; adapters plug in via `EngineRegistry`. Public exports come from `src/index.ts`.

**`types/index.ts`** — all shared types (RFC-01/02/05/06/07/08/09). Notable: `EngineAdapter`
(the plugin contract: `validate` / `render` / optional `preview` / `renderToHtml` /
`listNativeTemplates`), `RenderConfig.durationMode: 'explicit' | 'auto'`, `FrameRecord`
(one multi-frame unit, 1:1 with a graph node, plus RFC-08 enhance fields), `ProjectSoundtrack`
(narration/music/captions/fades), `Project` (persisted doc, incl. `youtubePosts` / `facebookPosts`).

**`project.ts` — `ProjectOrchestrator`** (the central workflow class):

- CRUD: `create` (mints `proj_<uuid12>`), `list`, `load`, `remove`
- Assets: `addFileAsset`, `addInlineAsset`, `addBufferAsset` (stores generated MP3s without downgrading render status), `removeAsset`
- Template/vars/agent: `setTemplate` (resets vars), `setVariables`, `setVariable`, `setAgent`
- HTML/graph: `writePreviewHtmlRaw` (single-frame fast path), `writeContentGraph` (validate + create `frames/`; `preserveFrames` re-paces existing frames), `readContentGraph`, `writeFrameHtml` (write one frame, compute `order` via `topoSort`)
- Render/export: `renderPreviewHtml`, **`exportMp4`** (two paths — below), `resolveFrameTemplateRef` (per-frame engine choice: native Remotion vs Hyperframes HTML), `enhanceFrameNative` / `unenhanceFrame` (RFC-08 upgrade a data frame to native Remotion, non-destructive), `renderFrameNativePreview`, `applySoundtrack`
- ffmpeg module helpers: `concatFramesWithFfmpeg`, `muxAudioWithFfmpeg`, `normalizeRollupData`, `ffmpegSupportsAss`, `probeVideoDimensions`, `recordExport`

**`exportMp4` — two branches:**

- **Multi-frame** (`frames.length > 0`): render each frame with `durationMode='explicit'` (per-frame length is a hard cap) → `concatFramesWithFfmpeg`. Single engine → **concat demuxer `-c copy`** (fast, lossless). Mixed engines (`reencode`) → **concat filter + re-encode** — required because Hyperframes vs Remotion have incompatible timebase/PTS that the demuxer would mis-accumulate.
- **Single-frame**: one `adapter.render()` with `duration:'auto'`.

**Fork-specific modules:**

- `edge-tts.ts` — free, key-less narration via Microsoft's `edge-tts` CLI. `generateTtsEdge` (text via temp file, `--rate/--pitch/--volume`, `--write-subtitles` for caption timing, 120s timeout, abort-aware), `resolveEdgeTtsCommand` (4-tier: env → project venv → PATH → `python3 -m edge_tts`), `probeDurationSec`. `EDGE_TTS_DEFAULT_VOICE = vi-VN-HoaiMyNeural`.
- `subtitles.ts` — word-by-word captions. `parseSrtCues` (SRT→cues), `buildCaptionAss` (two-layer glow+box ASS, reveals one char-weighted word at a time), burned via ffmpeg's `ass` filter.
- `asset-store.ts` — content-addressed (sha1) per-project asset store; `AssetStore` with `addFileAsset` / `addInlineAsset` / `addBufferAsset` / `guessMime`.
- `registry.ts` — `EngineRegistry`, `TemplateRegistry` (`scan` for `template.html-video.yaml`, `search` ranks by intent), `ProjectStore` (JSON on disk).
- `errors.ts` (`HtmlVideoError` + 12 codes), `ffmpeg.ts` (`ffmpegBin`/`ffprobeBin` with env override).

> Note: `ajv`/`ajv-formats` are declared deps but unused — template input schemas aren't validated.

---

## `adapter-hyperframes` — default engine

Records one HTML frame in headless Chromium (Playwright `recordVideo`) → webm → ffmpeg MP4.
Implements `EngineAdapter`; `hyperframes` peer dep is optional and unused at runtime.

**`render.ts`:**

- `render()` — flow: launch Chromium → **freeze animations** (`addInitScript` injects `animation-play-state:paused` + pauses `gsap.globalTimeline` before any document script) → `goto(waitUntil:'domcontentloaded')` → **wait for fonts** (stylesheet links load + `face.load()` each + `fonts.ready`) → **probe animation length** (computed `animationDuration` + finite GSAP tweens) → unfreeze + compute `leadInMs` → record loop → ffmpeg `-ss` trims the dead lead-in, `tpad` holds the last frame to hit `durationMode='explicit'` exactly, `-t` trims overshoot, libx264 crf20. This is the FOUT / font-flash fix.
- `renderToHtml()` — **v0.1 stub**: writes `preview.html` + a hand-drawn SVG poster; no raster render.
- `prepareSourceHtml()` — inlines multi-composition templates (Chromium blocks `file://` fetch, so compositions are embedded into `window.__COMPOSITIONS__` + a player script).
- `capabilities` (`html-css-gsap`, mp4/webm/alpha, `free-osi`), `validate`.

---

## `adapter-remotion` — enhancement engine

Deterministic frame-by-frame Remotion rendering, two modes. Remotion/React are optional peer
deps (loaded via `createRequire`); missing → soft `validate` warning + clear `render` error.

- **Bridge mode** — wraps an existing HTML/CSS/GSAP frame onto Remotion's timeline via iframe `srcdoc`. `bridge/HtmlFrameDriver.tsx` is the time-driver: opens a fresh `delayRender` per frame, waits for `docReady` (body populated + fonts settled), `seek(tMs)` (sets `currentTime` on every Web Animation + `gsap.globalTimeline.time()`), then screenshots.
- **Native mode** — renders a native React `.tsx` template directly, passing `data` as `inputProps` (used when a data frame is "enhanced").

**`render.ts`:**

- `render()` — dispatches native vs bridge; `renderComposition()` (select → override metadata → `renderMedia` → atomic rename with cross-device copy fallback).
- `bundleCache: Map<entryPath, serveUrl>` — webpack-bundles each entry once, reused across all frames in the process.
- `neutralizeBlockingResources(html)` — rewrites external `<link rel=stylesheet>` to `media=print onload` so they never block paint (otherwise the offline render screenshots a **black frame**).
- `bridge/Root.tsx` (generic `HtmlFrame` composition; `calculateMetadata` honors `inputProps.width/height`), `bridge/entry.ts` (`registerRoot`), `validate`, `remotionInstalled`, `capabilities` (`commercial-restricted` — deliberately, so the agent steers free jobs to Hyperframes).

---

## `runtime` — agent runtime

Detects + spawns locally-installed coding-agent CLIs, streams their output as normalized
`AgentEvent`s. Registers **14 agents** (`registry.ts`, order = default priority): `amr`,
`anthropic-api`, `trae-cli`, `claude`, `cursor-agent`, `codex`, `hermes`, `gemini`, `grok`,
`qwen`, `opencode`, `copilot`, `aider`, `qoder-cli`.

**Three transports:**

- `acp-json-rpc` (bidirectional JSON-RPC over stdio, `acp-client.ts`): **amr** (`vela agent run --runtime opencode`), **trae-cli** (`traecli acp serve --yolo`). Per-stage 120s watchdog; auto-answers `session/request_permission` (picks allow) so non-interactive runs don't hang.
- `http` (`httpHandler`, no child process): **anthropic-api** (Messages API / OpenRouter, parses SSE; supports `ANTHROPIC_BASE_URL`).
- `plain` (spawn CLI, stream stdout as text): the other 11. Prompt delivered via **stdin** (claude/codex/gemini/qwen/opencode/copilot/cursor-agent/qoder) or **argv** (hermes/grok/aider).

**Functions:** `spawnAgent` (3-branch dispatch; Windows spawns with `shell:true` for `.cmd` shims), `detectAll`/`detectOne`/`resolveBin` (PATH → `binFallbacks` → async resolver; 5-min TTL cache), `findAgent`, `listAmrModels` (`vela model list`), `runAcpAgent`.

> The plain-CLI path decodes stdout with `StringDecoder("utf8")` to survive multi-byte
> characters split across chunks (issue #9). The **ACP path uses `chunk.toString('utf8')`
> and lacks this protection** — a known gap for CJK/Vietnamese diacritics.

---

## `cli` — CLI + studio server (largest package)

**`bin.ts`** — 17 `cac` subcommands: `doctor`, `list-engines`, `search-templates`,
`inspect-template`, the `project-*` family (create/list/show/delete/add-asset/remove-asset/
set-template/set-var(s)/preview/render/**narrate**), and `studio` (opens the server on :3071).

**`studio-server.ts` (≈5300 lines)** — one `node:http` server, ~50 endpoints. Areas:

| Area                    | Representative endpoints                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Projects / templates    | `GET/POST/PATCH/DELETE /api/projects[...]`, `GET /api/templates`                                                                         |
| Assets                  | `POST/DELETE /api/projects/:id/assets`                                                                                                   |
| Template / agent / vars | `PUT .../template` (auto-seeds preview), `PUT .../agent`, `PUT .../variables`                                                            |
| HTML / frame            | `GET/PUT .../raw-html`, `GET/PUT .../frames/:nodeId/raw-html`                                                                            |
| Enhance (Remotion)      | `POST .../frames/:nodeId/enhance` \| `/unenhance` (SSE)                                                                                  |
| Export                  | `POST .../export` (SSE progress)                                                                                                         |
| **Narration**           | `POST .../generate-audio` (Edge-TTS, SSE), `POST .../draft-narration` (AI script), `POST .../fit-durations`, `DELETE .../soundtrack`     |
| **Social AI**           | `POST .../draft-social`, `POST /api/draft-social-freeform`                                                                               |
| **Exports mgmt**        | `GET .../exports`, `POST .../reveal`, `POST .../delete-export`                                                                           |
| **YouTube**             | `/api/youtube/{status,credentials,auth-url,disconnect}`, `/oauth/youtube/callback`, `POST .../youtube/upload` (SSE, multi-account)       |
| **Facebook**            | `/api/facebook/{status,credentials,auth-url,pages,select-page,disconnect}`, `/oauth/facebook/callback`, `POST .../facebook/upload` (SSE) |
| **Quick-upload**        | `POST /api/quick-upload/{youtube,facebook}` (attach an MP4, no project)                                                                  |
| Agents                  | `GET /api/agents`, `.../models`, `POST .../login`, `.../test`                                                                            |
| Chat                    | `GET/POST /api/projects/:id/messages` (the central ~600-line endpoint)                                                                   |
| Content-graph           | `GET .../content-graph`, `POST .../fit-durations`                                                                                        |
| File serving            | `/preview/:id/...`, `/asset?path=`, `/template-asset/:id/*` (all path-jailed)                                                            |

**Conversation state machine** (the studio agent's core):

- `ConvPhase`: `opener → content → style → need-template → format → confirm → generate → iterate`, plus the post-generation sub-flow `edit-menu → restyle | iterate-content | iterate-format`.
- `detectPhase(...)` — the router. Explicit markers win (`[hv-form:submit]`→confirm, `[hv-confirm:generate]`→generate). Free-text format answers are rescued via `parseFormatReply`. After generation, ambiguous messages default to the interactive edit-menu (not a silent single-frame rewrite).
- `buildHtmlGenerationPrompt(...)` — per-phase prompt factory; teaches the agent to emit `hv-options` / `hv-form` / `hv-confirm` cards or HTML.
- `parseFormatReply(text)` — extracts `{aspect, duration, frame_count}` from free text. Accepts Chinese aspect keywords (横屏/竖屏/方形/小红书) but returns Vietnamese labels (`Ngang`/`Dọc`/`Vuông`/`RedNote`). Unit-tested.
- `runSplitMultiFrameGenerate(...)` — the reliable multi-frame path (works around `claude --print` returning ~1 byte for graph + many pages at once): **step 1** generate the content-graph (one call), force `durationSec` to the confirmed length, `writeContentGraph`; **step 2** one agent call per node → one HTML block → `writeFrameHtml`; optional `enhanceFrameNative` for data nodes.

**Supporting files:** `youtube.ts` (OAuth resumable upload, auto `#Shorts`), `facebook.ts`
(Graph API 3-phase Reels upload), `media-config.ts` (TTS voice + multi-account tokens),
`fetch-source.ts` (URL/GitHub → Markdown asset for offline agents; **SSRF guard** blocks
localhost/private IPs), `task-registry.ts` (detached tasks with replay), `smoke.ts`
(end-to-end workflow test without the HTTP server), `context.ts` (`bootstrap` builds registries).

---

## `project-studio` — production UI (static, :3071)

Hand-rolled vanilla-JS SPA (`public/app.js`, no build step) served by the CLI. Bilingual
Vietnamese / English (`public/i18n.js`).

**Four-pane layout** (`renderMain`): Sidebar (projects) · Chat (composer + attach/paste/drag) ·
Preview (frame iframe + **frames-strip** storyboard) · Text pane with three tabs (**Text** —
click-to-edit `data-hv-text`; **Narration** — voiceover; **Exports** — MP4 management).

**Key functions:** `sendMessage` (reads SSE `text`/`preview_ready`/`warning`; file attachments;
mid-generation project-switch guard), `startExportStream` / `startEnhanceStream` (SSE),
`renderFramesStrip` (iframe/video thumbnails; click switches frame, second click pins for
iterate; `⚡ Enhance` overlay for data frames), `attachTextEditOverlay` + `commitInlineTextEdits`
(edit text directly on the preview → PUT `raw-html`), `wireSoundtrackPanel` (per-frame narration,
volume/speed sliders, caption toggle, "fit to narration", AI draft), the structured-card
parsers/renderers (`parseHvOptions/Form/Confirm` → `renderOptionCard/FormCard/ConfirmCard`),
`openGallery` / `openTemplatePreviewModal`, `openSettingsModal` (agent BYOK, theme, language,
YouTube/Facebook), `openYouTubeUpload` / `openFacebookUpload` / `openQuickUpload` (+
`draftSocialCopy` for AI titles/descriptions).

**Fork features here:** free Edge-TTS narration UI (per-frame model, `vi-VN` voices),
word-by-word caption toggle, YouTube (multi-channel) + Facebook (Page) publishing with AI
copy, quick-upload of arbitrary MP4s.

---

## `studio-next` — React spike (not production)

A Vite + React 19 research spike evaluating `@hyperframes/studio` as an editor. `src/` is just
`App.tsx` (a `SourceEditor` + `srcDoc` iframe over a hardcoded sample) and `main.tsx` — no
backend, no API client, no component tree. `SPIKE-REPORT.md` concludes "keep the vanilla
studio"; the CLI does not reference it. Intended future use: reuse a few React leaf-widgets
(SourceEditor, EaseCurveEditor) via an iframe portal, without migrating the main app.

---

## Cross-cutting: known gaps

- `adapter-hyperframes.renderToHtml` is a v0.1 stub (SVG placeholder poster).
- `core` declares `ajv` but doesn't use it — template `inputs` schemas aren't validated.
- The ACP client lacks the `StringDecoder` multi-byte protection the plain-CLI path has.
- `studio-next` is a dead spike (candidate for removal or freeze).
- `adapter-remotion/render.ts` header comment is stale (says `htmlSrc`/public dir; the real
  bridge uses iframe `srcdoc`).
