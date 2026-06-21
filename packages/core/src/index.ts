/**
 * @html-video/core — Public API surface.
 */

export * from './types/index.js';
export { HtmlVideoError } from './errors.js';
export type { ErrorCode } from './errors.js';
export { AssetStore } from './asset-store.js';
export type { AssetStoreOptions } from './asset-store.js';
export { EngineRegistry, TemplateRegistry, ProjectStore } from './registry.js';
export { ProjectOrchestrator } from './project.js';
export type {
  CreateProjectInput,
  ProjectOrchestratorDeps,
} from './project.js';
export {
  generateTtsEdge,
  resolveEdgeTtsCommand,
  edgeTtsVenvBin,
  EDGE_TTS_VIETNAMESE_VOICES,
  EDGE_TTS_DEFAULT_VOICE,
} from './edge-tts.js';
export type { EdgeTtsCommand, TtsAudioResult } from './edge-tts.js';
