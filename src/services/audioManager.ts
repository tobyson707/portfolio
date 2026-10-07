/**
 * TOBI XP — Audio Manager Compatibility Layer
 * Backed by the centralized, site-wide AudioEngine Web Audio API pipeline.
 */

import {
  audioEngine,
  AudioEngine,
  type AudioEngineState,
  type AudioEngineListener,
  type AudioSection,
  type AudioEffectParams,
} from './audioEngine'

export type AudioState = AudioEngineState
export type AudioListener = AudioEngineListener
export {
  audioEngine,
  AudioEngine,
  type AudioSection,
  type AudioEffectParams,
  type AudioEnvironment,
  SUBMERGED_PRESET,
  SUBMERGED_CATEGORIES,
  isSubmergedCategory,
}

export const audioManager = audioEngine
export default audioManager
