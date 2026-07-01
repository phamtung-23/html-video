/**
 * @html-video/core — ffmpeg / ffprobe binary resolution.
 *
 * Defaults to `ffmpeg` / `ffprobe` on PATH, but honors env overrides so a user
 * can point the studio at a fuller build (e.g. a static ffmpeg WITH libass for
 * burned captions) without touching their system ffmpeg:
 *   HV_FFMPEG_BIN=/path/to/ffmpeg   HV_FFPROBE_BIN=/path/to/ffprobe
 */

export function ffmpegBin(): string {
  return (process.env.HV_FFMPEG_BIN || '').trim() || 'ffmpeg';
}

export function ffprobeBin(): string {
  return (process.env.HV_FFPROBE_BIN || '').trim() || 'ffprobe';
}
