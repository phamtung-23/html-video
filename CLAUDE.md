# CLAUDE.md — html-video (working notes for coding agents)

Internal guide for anyone (human or agent) working in this repo. For the user-facing
overview see [README.md](README.md); for a function-level tour of every package see
[ARCHITECTURE.md](ARCHITECTURE.md).

## What this project is

`html-video` is a local **HTML→video meta-layer**: a coding agent generates HTML "frames",
the system renders each frame to MP4 through a pluggable engine (Hyperframes or Remotion),
concatenates them, mixes in **free narration** (Edge-TTS online, or offline VieNeu-TTS
with 14 Vietnamese voices) + **word-by-word burned captions**,
and can **publish to YouTube Shorts / Facebook Reels**. It ships a local browser studio
(bilingual Vietnamese / English, Vietnamese-first) and a scriptable `html-video` CLI.

This repo is a **fork** of `nexu-io/html-video` (remote: `phamtung-23/html-video`). The
fork's own additions are the narration / captions / social-publishing layers — the base
meta-layer (engine adapters, content-graph, template registry) comes from upstream.

## Monorepo layout (pnpm workspace)

```
packages/
  content-graph/       Storyboard IR: node/edge schema + validate + topoSort + totalDurationSec
  core/                Orchestrator, registries, asset store, Edge-TTS + VieNeu-TTS, captions, ffmpeg concat/mux
  adapter-hyperframes/ Default engine: Playwright + headless Chromium → webm → ffmpeg mp4
  adapter-remotion/    Remotion engine: bridge (HTML→timeline) + native (.tsx data) modes
  runtime/             Detect / spawn / stream 14 coding-agent backends (plain CLI, ACP, HTTP)
  cli/                 `html-video` CLI + studio HTTP server (studio-server.ts ≈ 5300 lines) +
                       source fetch + youtube.ts / facebook.ts publishing
  project-studio/      THE production studio UI — static vanilla-JS SPA (public/app.js), served by CLI
  studio-next/         React/Vite spike — NOT wired to the backend; do not depend on it
templates/             23 license-clean templates (each a template.html-video.yaml manifest)
```

Dependency order: `content-graph` → `core` → adapters / `runtime` → `cli` → `project-studio`.

## Run / build / verify

```bash
pnpm install
pnpm -r build            # tsc every package + vite build studio-next
make studio              # start studio at http://127.0.0.1:3071  (or: node packages/cli/dist/bin.js studio)
make dev                 # build, then studio

pnpm -r --no-bail test   # runtime + adapter-remotion + cli have tests; core + adapter-hyperframes have none
pnpm --filter @html-video/cli smoke   # end-to-end workflow test, no HTTP server
node packages/cli/dist/bin.js doctor   # node / ffmpeg / chromium / adapters / templates / edge-tts
pnpm -r typecheck        # tsc --noEmit
pnpm lint                # biome (mostly stylistic; see "lint" below)
```

`make studio` prefers a bundled libass ffmpeg at `.html-video/bin/ffmpeg` (for burned
captions) and falls back to system ffmpeg. Per-user runtime state (projects, assets,
preview, MP4 outputs) lives under `.html-video/` (gitignored).

## Key engineering lessons (read before touching render / studio code)

- **Font flash (FOUT) only reproduces in the exported MP4**, never in the studio's live
  iframe preview (the iframe has a warm font cache). Verify font/animation fixes on the
  exported mp4, measuring early frames (t≈0.1s). The fix in `adapter-hyperframes/src/render.ts`
  freezes all animations via `addInitScript` (`animation-play-state:paused` + `gsap.globalTimeline.pause(0)`)
  *before* any document script runs, waits for stylesheet links + `fonts.load()` per face +
  `fonts.ready`, then unfreezes and trims the frozen lead-in (`leadInMs`) with ffmpeg `-ss`.
- **Mixed-engine concat must use the concat FILTER, not the concat demuxer.** A Hyperframes
  segment next to a Remotion segment has incompatible timebase/PTS; the demuxer mis-accumulates
  timestamps and balloons an 8s clip to ~35s (`-vsync cfr` won't save it). `core/project.ts`
  `concatFramesWithFfmpeg` re-encodes with `filter_complex …concat=n=N` when `reencode` is set
  (`enginesUsed.size > 1`); single-engine still uses the demuxer with `-c copy` (fast, lossless).
  Always verify concat output with `ffprobe` duration + `ffmpeg -f null -` full decode — not
  just "a file was produced".
- **`RenderConfig.durationMode`**: multi-frame export passes `'explicit'` — the confirmed
  per-frame length is a hard cap (ffmpeg `tpad=stop_mode=clone` pads the tail). Single-frame
  preview uses `'auto'` — the renderer probes animation length and may extend.
- **Audio mux** (`muxAudioWithFfmpeg`) uses `amix` + `apad` so audio is ≥ video length, which
  fixes the "last scene cut short" bug from `-shortest` against un-padded audio.
- **render / studio-intent fixes must be verified end-to-end**, not by "tsc passes + logic
  looks right". Studio phase-detection (`detectPhase` in studio-server.ts) inverts defaults:
  after generation, any ambiguous message defaults to the interactive edit-menu, not a silent
  single-frame rewrite. Don't gate intent on allowlist regexes.

## Environment gotchas (macOS)

- No `timeout` command. For a hard time budget, use a background process + poll, not `timeout`.
- PIL won't install (brew Python expat bug). Measure pixels with ImageMagick:
  `magick frame.png -threshold 1% -format '%[fx:100*mean]' info:`.
- Foreground `sleep` is blocked by the harness — poll a condition instead.

## Vietnamese localization

The studio UI and generated content are Vietnamese-first. Notably `parseFormatReply`
(studio-server.ts) still **accepts** Chinese aspect keywords (横屏/竖屏/方形/小红书) for
backward-compat but **returns Vietnamese labels** (`16:9 Ngang` / `9:16 Dọc` / `1:1 Vuông` /
`4:5 RedNote`). The unit tests in `cli/test/parse-format-reply.test.ts` assert the Vietnamese
outputs. Edge-TTS default voice is `vi-VN-HoaiMyNeural`.

**Narration engines.** Two free, key-less providers behind a shared `TtsAudioResult`
(bytes + optional `boundaries` caption cues): `core/edge-tts.ts` (online, 2 VN voices)
and `core/vieneu-tts.ts` (offline, 14 VN voices, ONNX/CPU via a persistent Python worker
in `.html-video/vieneu-venv`). **Routing is by voice-id namespace**: a `vieneu:<preset>`
id (studio-server + `project-narrate`) picks VieNeu; anything else is Edge. VieNeu has no
native rate control (speed → ffmpeg `atempo`) and no subtitle timing (caption cues are
synthesized by distributing the measured duration across sentences). The worker is warm
across a studio session (`stopAllVieNeuWorkers()` on shutdown) but stopped after each
one-shot CLI run so the process can exit. Install: `html-video tts install-vieneu`.

## Known gaps / tech debt

- `adapter-hyperframes` `renderToHtml()` is a **v0.1 stub** (SVG placeholder poster, no raster).
- `core` declares `ajv`/`ajv-formats` deps but does not import them — template `inputs`
  schemas are not validated (only content-graph structure is).
- The **ACP client** (`runtime/src/acp-client.ts`) reads stdout with `chunk.toString('utf8')`,
  so it lacks the split-multibyte `StringDecoder` protection the plain-CLI spawn path has —
  CJK/Vietnamese diacritics split across chunks could corrupt on the ACP path.
- `studio-next` is a dead React spike; the CLI serves `project-studio` only.
- Doc comment header in `adapter-remotion/src/render.ts` is stale (mentions `htmlSrc`/public
  dir; the real bridge uses iframe `srcdoc` + `inputProps.html`).

## Current state

- Build ✅, typecheck ✅. Tests ✅ after the test-suite fixes (cli parser expectations updated
  to Vietnamese labels; runtime test no longer reads a nonexistent `README.zh-CN.md`;
  `core` + `adapter-hyperframes` test scripts guard the missing `test/` dir). Smoke ✅, doctor ✅.
- `pnpm lint` (biome) still reports residual **style-only** findings (`useOptionalChain`,
  `noForEach`, `noDelete`, non-null assertions, `any`) — no correctness bugs. `noNonNullAssertion`
  and `noExplicitAny` are intentionally `warn` in `biome.json`.

## Write guidelines

- Don't `git commit` / `push` / open PRs unless asked. The default branch is `main`.
- `README.md` is the public face — keep it accurate to what actually ships (engines,
  agent list, template count, features). Don't reintroduce upstream marketing claims
  (Discord/X/"official Open Design team") — this is a personal fork.
- Publishing actions (uploading to YouTube/Facebook, pushing to the remote) are outward-facing
  — confirm before running.
- Attribution: template license provenance lives in each `template.html-video.yaml` `provenance`
  block and is indexed in `templates/NOTICE.md`. Preserve it when adding/forking templates.
