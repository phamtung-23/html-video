/**
 * Project-centric CLI commands per RFC-05.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CliContext } from '../context.js';
import { fail, ok, progress } from '../output.js';
import { generateTtsEdge } from '@html-video/core';

export async function projectCreate(
  ctx: CliContext,
  opts: { name: string; intent?: string; aspect?: string; commercial?: boolean },
): Promise<void> {
  if (!opts.name) fail('invalid-input', '--name required');
  const project = await ctx.orchestrator.create({
    name: opts.name,
    ...(opts.intent !== undefined && { intent: opts.intent }),
    preferences: {
      ...(opts.aspect !== undefined && { aspect: opts.aspect }),
      ...(opts.commercial !== undefined && { commercial: opts.commercial }),
    },
  });
  ok({ project_id: project.id, name: project.name, status: project.status });
}

export async function projectList(ctx: CliContext): Promise<void> {
  const projects = await ctx.orchestrator.list();
  ok({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      template_id: p.templateId,
      asset_count: p.assets.length,
      status: p.status,
      updated_at: p.updatedAt,
    })),
  });
}

export async function projectShow(ctx: CliContext, id: string): Promise<void> {
  const project = await ctx.orchestrator.load(id);
  ok({ project });
}

export async function projectDelete(ctx: CliContext, id: string): Promise<void> {
  await ctx.orchestrator.remove(id);
  ok({ project_id: id, deleted: true });
}

export async function projectAddAsset(
  ctx: CliContext,
  id: string,
  opts: {
    file?: string;
    inlineText?: string;
    inlineDataFile?: string;
    caption?: string;
  },
): Promise<void> {
  let project;
  if (opts.file) {
    const f = resolve(opts.file);
    if (!existsSync(f)) fail('asset-not-found', `File not found: ${f}`);
    project = await ctx.orchestrator.addFileAsset(id, f, opts.caption);
  } else if (opts.inlineText) {
    project = await ctx.orchestrator.addInlineAsset(id, opts.inlineText, 'text', opts.caption);
  } else if (opts.inlineDataFile) {
    const f = resolve(opts.inlineDataFile);
    if (!existsSync(f)) fail('asset-not-found', `Data file not found: ${f}`);
    const content = await readFile(f, 'utf8');
    project = await ctx.orchestrator.addInlineAsset(id, content, 'data', opts.caption);
  } else {
    fail('invalid-input', 'Provide one of --file, --inline-text, --inline-data-file');
  }
  ok({
    project_id: project!.id,
    asset_count: project!.assets.length,
    last_added: project!.assets[project!.assets.length - 1],
  });
}

export async function projectRemoveAsset(
  ctx: CliContext,
  id: string,
  assetId: string,
): Promise<void> {
  const project = await ctx.orchestrator.removeAsset(id, assetId);
  ok({ project_id: project.id, asset_count: project.assets.length });
}

export async function projectSetTemplate(
  ctx: CliContext,
  id: string,
  templateId: string,
): Promise<void> {
  const project = await ctx.orchestrator.setTemplate(id, templateId);
  ok({
    project_id: project.id,
    template_id: project.templateId,
    variables: project.variables,
  });
}

export async function projectSetVar(
  ctx: CliContext,
  id: string,
  key: string,
  valueJson: string,
): Promise<void> {
  let value: unknown;
  try {
    value = JSON.parse(valueJson);
  } catch {
    // not JSON → keep raw string
    value = valueJson;
  }
  const project = await ctx.orchestrator.setVariable(id, key, value);
  ok({ project_id: project.id, variables: project.variables });
}

export async function projectSetVars(
  ctx: CliContext,
  id: string,
  varsFile: string,
): Promise<void> {
  const f = resolve(varsFile);
  if (!existsSync(f)) fail('invalid-input', `vars file not found: ${f}`);
  const vars = JSON.parse(await readFile(f, 'utf8')) as Record<string, unknown>;
  const project = await ctx.orchestrator.setVariables(id, vars);
  ok({ project_id: project.id, variables: project.variables });
}

export async function projectPreview(ctx: CliContext, id: string): Promise<void> {
  const { project, htmlPath } = await ctx.orchestrator.renderPreviewHtml(id);
  ok({
    project_id: project.id,
    html_path: htmlPath,
    poster_path: project.lastPreviewPosterPath,
    note: 'Open html_path in a browser to preview, or use `html-video studio` for full UI.',
  });
}

export async function projectRender(
  ctx: CliContext,
  id: string,
  opts: { output?: string; streamProgress?: boolean },
): Promise<void> {
  const { project, outputPath } = await ctx.orchestrator.exportMp4({
    projectId: id,
    ...(opts.output !== undefined && { outputPath: resolve(opts.output) }),
    onProgress: opts.streamProgress ? (pct, stage) => progress(stage, pct) : undefined,
  });
  ok({ project_id: project.id, output_path: outputPath, status: project.status });
}

/**
 * Generate narration for a project and attach it as the soundtrack voiceover,
 * using the free, key-less Edge-TTS engine. The next `project-render` mixes the
 * narration into the MP4.
 */
export async function projectNarrate(
  ctx: CliContext,
  id: string,
  opts: {
    text?: string;
    textFile?: string;
    voice?: string;
    volumeDb?: number;
  },
): Promise<void> {
  let text = opts.text ?? '';
  if (!text && opts.textFile) {
    const p = resolve(opts.textFile);
    if (!existsSync(p)) fail('invalid-input', `--text-file not found: ${p}`);
    text = await readFile(p, 'utf8');
  }
  text = text.trim();
  if (!text) fail('invalid-input', 'provide narration text via --text or --text-file');

  if (!ctx.mediaConfig.edgeAvailable()) {
    fail(
      'render-failed',
      'Edge-TTS not found. Install it (free, no key): `pipx install edge-tts` or `python3 -m pip install edge-tts`.',
    );
  }

  const nar = await generateTtsEdge({
    text,
    voiceId: opts.voice ?? ctx.mediaConfig.getEdgeVoice(),
    projectRoot: ctx.projectRoot,
  });

  const { asset } = await ctx.orchestrator.addBufferAsset(
    id,
    nar.bytes,
    nar.ext,
    `narration · ${text.slice(0, 60)}`,
  );

  // Reload (addBufferAsset persisted the asset) and attach the soundtrack.
  const project = await ctx.projects.load(id);
  const soundtrack = { ...(project.soundtrack ?? {}) };
  soundtrack.narrationAssetId = asset.id;
  soundtrack.narrationText = text;
  if (opts.volumeDb !== undefined) soundtrack.narrationVolumeDb = opts.volumeDb;
  project.soundtrack = soundtrack;
  await ctx.projects.save(project);

  ok({
    project_id: id,
    provider: 'edge',
    asset_id: asset.id,
    duration_sec: nar.durationSec ?? null,
    provider_note: nar.providerNote,
    note: 'Narration attached. Run project-render to mux it into the MP4.',
  });
}
