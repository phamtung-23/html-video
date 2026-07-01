# html-video — quick project tasks.
# Usage:  make            # start the studio (default)
#         make dev        # build everything, then start the studio
#         make studio PORT=3080
#
# Recipe lines are TAB-indented (Make requirement).

CLI  := node packages/cli/dist/bin.js
PORT ?= 3071
# Prefer a bundled full-featured ffmpeg (with libass, for burned captions) if
# present under .html-video/bin — falls back to system ffmpeg otherwise.
FFMPEG_BIN  := $(abspath .html-video/bin/ffmpeg)
FFPROBE_BIN := $(abspath .html-video/bin/ffprobe)

.DEFAULT_GOAL := studio
.PHONY: studio dev build install smoke doctor clean help

## studio: Launch the project studio at http://localhost:$(PORT)
studio:
	@test -f packages/cli/dist/bin.js || { echo "→ Not built yet. Run 'make build' (or 'make dev') first."; exit 1; }
	@if [ -x "$(FFMPEG_BIN)" ]; then \
	  echo "→ using bundled ffmpeg (libass) at $(FFMPEG_BIN)"; \
	  HV_FFMPEG_BIN="$(FFMPEG_BIN)" HV_FFPROBE_BIN="$(FFPROBE_BIN)" $(CLI) studio --port $(PORT); \
	else \
	  $(CLI) studio --port $(PORT); \
	fi

## dev: Build all packages, then launch the studio
dev: build studio

## build: Build every workspace package (tsc)
build:
	pnpm -r build

## install: Install workspace dependencies
install:
	pnpm install

## setup: Fresh checkout — install deps and build
setup: install build

## smoke: Run the CLI smoke test
smoke:
	pnpm --filter @html-video/cli smoke

## doctor: Check the local environment (engines, ffmpeg, agents)
doctor:
	$(CLI) doctor

## clean: Remove build output (dist/) from every package
clean:
	find packages -maxdepth 2 -name dist -type d -exec rm -rf {} +

## help: List available targets
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed -e 's/## /  /'
