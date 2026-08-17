/**
 * Part 2.3 — Mock Vision Analysis Provider
 * 
 * Used for automated testing and deterministic validation without requiring
 * external network connectivity or paid API keys.
 */

import {
  IVisionAnalysisProvider,
  CompositionPromptPayload,
} from './composition-provider';
import { SubjectDetectionPromptPayload } from './subject-provider';
import { AnalysisSource, AnalysisError } from '../../types';
import { COMPOSITION_PROMPT_VERSION } from '../../features/analysis/prompts/composition.prompt';
import { SUBJECT_DETECTION_PROMPT_VERSION } from '../../features/analysis/prompts/subject-detection.prompt';

export class MockVisionAnalysisProvider implements IVisionAnalysisProvider {
  readonly providerId = 'mock-vision';
  readonly modelId = 'mock-model-v1';
  readonly promptVersion = COMPOSITION_PROMPT_VERSION;
  readonly subjectPromptVersion = SUBJECT_DETECTION_PROMPT_VERSION;

  private mockResponseGenerator?: (payload: CompositionPromptPayload) => Promise<unknown> | unknown;
  private mockSubjectResponseGenerator?: (payload: SubjectDetectionPromptPayload) => Promise<unknown> | unknown;
  private shouldFailWith?: AnalysisError;

  constructor(
    customResponseGenerator?: (payload: CompositionPromptPayload) => Promise<unknown> | unknown,
    shouldFailWith?: AnalysisError
  ) {
    this.mockResponseGenerator = customResponseGenerator;
    this.shouldFailWith = shouldFailWith;
  }

  setMockResponse(generator: (payload: CompositionPromptPayload) => Promise<unknown> | unknown) {
    this.mockResponseGenerator = generator;
    this.shouldFailWith = undefined;
  }

  setMockSubjectResponse(generator: (payload: SubjectDetectionPromptPayload) => Promise<unknown> | unknown) {
    this.mockSubjectResponseGenerator = generator;
    this.shouldFailWith = undefined;
  }

  setFailure(error: AnalysisError) {
    this.shouldFailWith = error;
  }

  async analyzePanelComposition(
    payload: CompositionPromptPayload,
    signal?: AbortSignal
  ): Promise<{
    raw: unknown;
    provenance: AnalysisSource;
  }> {
    if (signal?.aborted) {
      throw {
        code: 'ANALYSIS_CANCELLED',
        stage: 'composition',
        message: 'Analysis was cancelled',
        retryable: true,
        occurred_at: new Date().toISOString(),
      } as AnalysisError;
    }

    if (this.shouldFailWith) {
      throw this.shouldFailWith;
    }

    let raw: unknown;
    if (this.mockResponseGenerator) {
      raw = await this.mockResponseGenerator(payload);
    } else {
      // Default valid composition response
      raw = {
        shot_scale: 'medium-wide',
        framing: 'left-weighted',
        foreground_importance: 0.85,
        middleground_importance: 0.4,
        background_importance: 0.2,
        visual_density: 'dense',
        dominant_orientation: 'horizontal',
        visual_hierarchy: ['Primary Subject Figure', 'Background High-Rise Skyline', 'Foreground Shadow Layer'],
        dominant_regions: [
          {
            label: 'primary_subject',
            box: { x: 0.15, y: 0.2, width: 0.45, height: 0.7 },
            prominence: 'primary',
            weight: 0.85,
          },
          {
            label: 'negative_space_upper_right',
            box: { x: 0.65, y: 0.05, width: 0.3, height: 0.35 },
            prominence: 'supporting',
            weight: 0.3,
          },
        ],
        negative_space: 'moderate',
        dominant_colors: ['#1A202C', '#E2E8F0', '#3182CE'],
        lighting_mood: 'High-contrast dramatic twilight key lighting with cool ambient shadows',
        tonal_range: 'high_contrast',
        summary: 'A dynamic, left-weighted medium-wide shot with heavy foreground presence and open negative space in the upper right.',
        confidence: 0.92,
      };
    }

    const provenance: AnalysisSource = {
      provider: this.providerId,
      model: this.modelId,
      model_version: '1.0.0',
      prompt_version: this.promptVersion,
      source_type: 'ai',
      analyzed_at: new Date().toISOString(),
    };

    return { raw, provenance };
  }

  async analyzePanelSubjects(
    payload: SubjectDetectionPromptPayload,
    signal?: AbortSignal
  ): Promise<{
    raw: unknown;
    provenance: AnalysisSource;
  }> {
    if (signal?.aborted) {
      throw {
        code: 'ANALYSIS_CANCELLED',
        stage: 'subjects',
        message: 'Subject detection analysis was cancelled',
        retryable: true,
        occurred_at: new Date().toISOString(),
      } as AnalysisError;
    }

    if (this.shouldFailWith) {
      throw this.shouldFailWith;
    }

    let raw: unknown;
    if (this.mockSubjectResponseGenerator) {
      raw = await this.mockSubjectResponseGenerator(payload);
    } else {
      // Default valid subject & character detection response
      raw = {
        subjects: [
          {
            type: 'character',
            label: 'Main Figure in Dark Coat',
            bounding_box: { x: 0.2, y: 0.15, width: 0.45, height: 0.75 },
            visibility: 'fully_visible',
            importance: 'primary',
            confidence: 0.95,
          },
          {
            type: 'weapon',
            label: 'Glowing Runed Broadsword',
            bounding_box: { x: 0.55, y: 0.3, width: 0.18, height: 0.55 },
            visibility: 'fully_visible',
            importance: 'secondary',
            confidence: 0.91,
          },
          {
            type: 'effect',
            label: 'Azure Electric Sparks',
            bounding_box: { x: 0.5, y: 0.25, width: 0.35, height: 0.4 },
            visibility: 'partially_visible',
            importance: 'secondary',
            confidence: 0.88,
          },
        ],
        characters: [
          {
            label: 'Determined Swordsman',
            bounding_box: { x: 0.2, y: 0.15, width: 0.45, height: 0.75 },
            face_region: { x: 0.32, y: 0.18, width: 0.18, height: 0.15 },
            visibility: 'full_body',
            pose: 'fighting',
            expression: 'determined',
            action: 'gripping weapon with both hands',
            screen_position: 'center',
            confidence: 0.94,
          },
        ],
      };
    }

    const provenance: AnalysisSource = {
      provider: this.providerId,
      model: this.modelId,
      model_version: '1.0.0',
      prompt_version: this.subjectPromptVersion,
      source_type: 'ai',
      analyzed_at: new Date().toISOString(),
    };

    return { raw, provenance };
  }
}
