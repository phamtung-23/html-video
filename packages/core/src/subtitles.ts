/**
 * @html-video/core — word-by-word caption (subtitle) generation.
 *
 * Edge-TTS emits SENTENCE-level timing (via `--write-subtitles`, an SRT), not
 * per-word boundaries (Microsoft's endpoint no longer returns WordBoundary for
 * most voices, incl. Vietnamese). So we take each sentence's [start, end] window
 * and distribute its words across it, weighted by word length — an approximation
 * that reads as "words appearing in time with the voice".
 *
 * The output is an ASS subtitle file (styled, burnable by ffmpeg's `ass` filter)
 * that reveals a sentence one word at a time, then clears for the next sentence.
 */

/** One timed caption cue — a sentence spoken from `start` to `end` (seconds). */
export interface CaptionCue {
  text: string;
  start: number;
  end: number;
}

/** Parse an SRT (as produced by `edge-tts --write-subtitles`) into cues. */
export function parseSrtCues(srt: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const toSec = (h: string, m: string, s: string, ms: string): number =>
    Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
  // Blocks separated by blank lines; each: index / "HH:MM:SS,mmm --> HH:MM:SS,mmm" / text…
  for (const block of srt.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    if (lines.length < 2) continue;
    const timeLine = lines.find((l) => /-->/g.test(l));
    if (!timeLine) continue;
    const m = timeLine.match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
    if (!m) continue;
    const start = toSec(m[1]!, m[2]!, m[3]!, m[4]!);
    const end = toSec(m[5]!, m[6]!, m[7]!, m[8]!);
    const text = lines.slice(lines.indexOf(timeLine) + 1).join(' ').trim();
    if (text) cues.push({ text, start, end: Math.max(end, start + 0.2) });
  }
  return cues;
}

/** Seconds → ASS timestamp `H:MM:SS.cc` (centiseconds). */
function assTime(sec: number): string {
  const cs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

/** Neutralize characters that would break an ASS Dialogue line. */
function assText(t: string): string {
  return t.replace(/\n/g, ' ').replace(/\{/g, '(').replace(/\}/g, ')').trim();
}

export interface CaptionStyleOpts {
  /** Video pixel dimensions (for PlayRes + font scaling). */
  width?: number;
  height?: number;
  /** Font size as a fraction of height (default 0.028 ≈ small). */
  fontScale?: number;
  /** Bottom margin as a fraction of height (default 0.07). */
  marginScale?: number;
  fontName?: string;
  /** Glow colour behind the text, ASS `&HBBGGRR` (default mint green). */
  glowColour?: string;
}

/**
 * Build an ASS subtitle that reveals each sentence one word at a time, timed to
 * the cue windows. Small text, centered near the bottom, white with a dark
 * outline so it stays legible over any frame.
 */
export function buildCaptionAss(cues: CaptionCue[], opts?: CaptionStyleOpts): string {
  const width = Math.max(16, Math.round(opts?.width ?? 1080));
  const height = Math.max(16, Math.round(opts?.height ?? 1080));
  const fontSize = Math.max(12, Math.round((opts?.fontScale ?? 0.028) * height));
  const marginV = Math.max(8, Math.round((opts?.marginScale ?? 0.07) * height));
  // Padding of the box around the text (BorderStyle 3).
  const boxPad = Math.max(4, Math.round(fontSize * 0.24));
  // Default to Geist (matches the studio UI; Vietnamese-capable). Falls back to
  // the system default if the font file isn't provided via fontsdir.
  const fontName = opts?.fontName ?? 'Geist';
  const glow = opts?.glowColour ?? '&H00FFFFFF'; // white (BBGGRR)
  const glowBlur = Math.max(2, Math.round(fontSize * 0.14));
  const glowBord = Math.max(2, Math.round(fontSize * 0.1));
  const ml = Math.round(width * 0.06);

  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    // Glow layer (behind): blurred coloured halo, no box.
    `Style: CapGlow,${fontName},${fontSize},${glow},${glow},${glow},&H00000000,1,0,0,0,100,100,0,0,1,${glowBord},0,2,${ml},${ml},${marginV},1`,
    // Text layer (front): white text on a translucent dark box (BorderStyle 3 →
    // OutlineColour IS the box fill; the alpha 0x40 lets the glow behind bleed
    // through). Align 2 = bottom-center.
    `Style: Cap,${fontName},${fontSize},&H00FFFFFF,&H00FFFFFF,&H40000000,&H00000000,1,0,0,0,100,100,0,0,3,${boxPad},0,2,${ml},${ml},${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  const events: string[] = [];
  for (const cue of cues) {
    const words = assText(cue.text).split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    const dur = Math.max(0.2, cue.end - cue.start);
    const weights = words.map((w) => Math.max(1, w.length));
    const total = weights.reduce((a, b) => a + b, 0);
    // Cumulative per-word START times, char-weighted across the cue window.
    let acc = 0;
    const starts = words.map((_, i) => {
      const s = cue.start + (acc / total) * dur;
      acc += weights[i]!;
      return s;
    });
    // Progressive reveal: at each step show the words up to i, until the next
    // word appears (or the cue ends). One more word lights up each step.
    for (let i = 0; i < words.length; i++) {
      const start = starts[i]!;
      const end = i + 1 < words.length ? starts[i + 1]! : cue.end;
      if (end <= start) continue;
      const shown = words.slice(0, i + 1).join(' ');
      // Layer 0: blurred glow halo behind. Layer 1: crisp text on its box.
      events.push(`Dialogue: 0,${assTime(start)},${assTime(end)},CapGlow,,0,0,0,,{\\blur${glowBlur}}${shown}`);
      events.push(`Dialogue: 1,${assTime(start)},${assTime(end)},Cap,,0,0,0,,${shown}`);
    }
  }
  return [...header, ...events].join('\n') + '\n';
}
