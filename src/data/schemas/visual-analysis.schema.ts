import { z } from 'zod';
import { BoundingBoxSchema, NormalizedNumberSchema } from './coordinates.schema';

/**
 * Normalized confidence validation between 0.0 and 1.0
 */
export const ConfidenceNumberSchema = z
  .number({ message: 'Confidence must be a valid number' })
  .min(0, { message: 'Confidence cannot be less than 0.0' })
  .max(1, { message: 'Confidence cannot be greater than 1.0' });

/**
 * Visual analysis lifecycle status enum schema
 */
export const VisualAnalysisStatusSchema = z.enum([
  'NOT_ANALYZED',
  'QUEUED',
  'ANALYZING',
  'COMPLETED',
  'FAILED',
  'STALE',
]);

/**
 * Analysis provenance and origin source schema
 */
export const AnalysisSourceTypeSchema = z.enum(['ai', 'ocr', 'vision', 'manual', 'derived']);

export const AnalysisSourceSchema = z.object({
  provider: z.string().min(1, 'Provider identifier is required'),
  model: z.string().optional(),
  model_version: z.string().optional(),
  prompt_version: z.string().optional(),
  source_type: AnalysisSourceTypeSchema.optional(),
  analyzed_at: z.string().datetime({ message: 'Invalid analyzed_at ISO datetime' }),
});

/**
 * Image preprocessing and proxy metadata schema (Part 2.2)
 */
export const PreprocessingInfoSchema = z.object({
  source_width: z.number().int().positive('source_width must be a positive integer'),
  source_height: z.number().int().positive('source_height must be a positive integer'),
  analysis_width: z.number().int().positive('analysis_width must be a positive integer'),
  analysis_height: z.number().int().positive('analysis_height must be a positive integer'),
  scale: z.number().positive('scale must be a positive number'),
  format: z.string().min(1, 'format is required'),
  preprocessing_version: z.string().optional(),
  max_dimension: z.number().int().positive().optional(),
  quality: z.number().min(0).max(1).optional(),
  source_byte_size: z.number().int().nonnegative().optional(),
  proxy_byte_size: z.number().int().nonnegative().optional(),
  cache_key: z.string().optional(),
  generation_duration_ms: z.number().nonnegative().optional(),
  generated_at: z.string().datetime({ message: 'Invalid generated_at ISO datetime' }),
});

/**
 * Composition analysis schema (Part 2.3)
 */
export const ShotScaleSchema = z.enum([
  'extreme-close-up',
  'close-up',
  'medium-close-up',
  'medium',
  'medium-wide',
  'wide',
  'long-shot',
  'extreme-long-shot',
  'macro',
  'overhead',
  'full',
  'unknown',
]);

export const CompositionFramingSchema = z.enum([
  'wide',
  'tight',
  'dynamic',
  'panoramic',
  'isolated',
  'rule_of_thirds',
  'centered',
  'left-weighted',
  'right-weighted',
  'top-weighted',
  'bottom-weighted',
  'symmetrical',
  'asymmetrical',
  'diagonal',
  'layered',
  'unknown',
]);

export const VisualDensitySchema = z.enum([
  'sparse',
  'balanced',
  'dense',
  'cluttered',
  'very_dense',
]);

export const DominantOrientationSchema = z.enum([
  'vertical',
  'horizontal',
  'diagonal',
  'radial',
  'centered',
  'mixed',
]);

export const NegativeSpaceLevelSchema = z.enum(['none', 'low', 'moderate', 'high']);

export const TonalRangeSchema = z.enum([
  'bright',
  'dark',
  'high_contrast',
  'low_contrast',
  'balanced',
  'monochrome',
]);

export const DominantRegionSchema = z.object({
  region_id: z.string().optional(),
  label: z.string().min(1, 'label is required'),
  box: BoundingBoxSchema,
  prominence: z.enum(['primary', 'secondary', 'supporting']).optional(),
  weight: ConfidenceNumberSchema.optional(),
});

export const CompositionAnalysisSchema = z.object({
  shot_scale: ShotScaleSchema.optional(),
  framing: CompositionFramingSchema.optional(),
  foreground_importance: ConfidenceNumberSchema.optional(),
  middleground_importance: ConfidenceNumberSchema.optional(),
  background_importance: ConfidenceNumberSchema.optional(),
  visual_density: VisualDensitySchema.optional(),
  dominant_orientation: DominantOrientationSchema.optional(),
  visual_hierarchy: z.array(z.string()).optional(),
  dominant_regions: z.array(DominantRegionSchema).optional(),
  negative_space: NegativeSpaceLevelSchema.optional(),
  dominant_colors: z.array(z.string()).optional(),
  lighting_mood: z.string().optional(),
  tonal_range: TonalRangeSchema.optional(),
  summary: z.string().max(500, 'Summary must be at most 500 characters').optional(),
  confidence: ConfidenceNumberSchema.optional(),
  source: AnalysisSourceSchema.optional(),
});

/**
 * Raw schema for AI response parsing & normalization
 */
export const AICompositionResponseSchema = z.object({
  shot_scale: z.string().optional(),
  framing: z.string().optional(),
  foreground_importance: z.number().min(0).max(1).optional(),
  middleground_importance: z.number().min(0).max(1).optional(),
  background_importance: z.number().min(0).max(1).optional(),
  visual_density: z.string().optional(),
  dominant_orientation: z.string().optional(),
  visual_hierarchy: z.array(z.string()).optional(),
  dominant_regions: z
    .array(
      z.object({
        label: z.string(),
        box: z.object({
          x: z.number().min(0).max(1),
          y: z.number().min(0).max(1),
          width: z.number().min(0).max(1),
          height: z.number().min(0).max(1),
        }),
        prominence: z.enum(['primary', 'secondary', 'supporting']).optional(),
        weight: z.number().min(0).max(1).optional(),
      })
    )
    .optional(),
  negative_space: z.string().optional(),
  dominant_colors: z.array(z.string()).optional(),
  lighting_mood: z.string().optional(),
  tonal_range: z.string().optional(),
  summary: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

/**
 * Subject detection schema (Foundation for Part 2.4)
 */
export const SubjectTypeSchema = z.enum([
  'character',
  'face',
  'creature',
  'object',
  'weapon',
  'vehicle',
  'environment',
  'effect',
  'other',
]);

export const SubjectVisibilitySchema = z.enum([
  'fully_visible',
  'partially_visible',
  'occluded',
  'silhouette',
  'cropped',
]);

export const SubjectImportanceSchema = z.enum([
  'primary',
  'secondary',
  'background',
  'incidental',
]);

export const SubjectSchema = z.object({
  subject_id: z.string().min(1, 'subject_id is required'),
  type: SubjectTypeSchema,
  label: z.string().min(1, 'label is required'),
  bounding_box: BoundingBoxSchema,
  visibility: SubjectVisibilitySchema.optional(),
  importance: SubjectImportanceSchema.optional(),
  confidence: ConfidenceNumberSchema,
  source: AnalysisSourceTypeSchema.optional(),
});

/**
 * Character detection schema (Foundation for Part 2.4)
 */
export const CharacterVisibilitySchema = z.enum([
  'full_body',
  'upper_body',
  'bust',
  'face_only',
  'partial',
  'obscured',
]);

export const CharacterScreenPositionSchema = z.enum([
  'left',
  'center',
  'right',
  'top',
  'bottom',
  'background',
]);

export const CharacterDetectionSchema = z.object({
  detection_id: z.string().min(1, 'detection_id is required'),
  character_id: z.string().optional(),
  label: z.string().optional(),
  bounding_box: BoundingBoxSchema,
  face_region: BoundingBoxSchema.optional(),
  visibility: CharacterVisibilitySchema.optional(),
  pose: z.string().optional(),
  expression: z.string().optional(),
  action: z.string().optional(),
  screen_position: CharacterScreenPositionSchema.optional(),
  confidence: ConfidenceNumberSchema,
  continuity_reference: z.string().optional(),
});

/**
 * Raw schema for AI subject & character detection response parsing & normalization
 */
export const AISubjectDetectionResponseSchema = z.object({
  subjects: z
    .array(
      z.object({
        type: z.string().optional(),
        label: z.string().optional(),
        bounding_box: z
          .object({
            x: z.number().min(0).max(1),
            y: z.number().min(0).max(1),
            width: z.number().min(0).max(1),
            height: z.number().min(0).max(1),
          })
          .optional(),
        visibility: z.string().optional(),
        importance: z.string().optional(),
        confidence: z.number().min(0).max(1).optional(),
      })
    )
    .optional(),
  characters: z
    .array(
      z.object({
        label: z.string().optional(),
        bounding_box: z
          .object({
            x: z.number().min(0).max(1),
            y: z.number().min(0).max(1),
            width: z.number().min(0).max(1),
            height: z.number().min(0).max(1),
          })
          .optional(),
        face_region: z
          .object({
            x: z.number().min(0).max(1),
            y: z.number().min(0).max(1),
            width: z.number().min(0).max(1),
            height: z.number().min(0).max(1),
          })
          .optional(),
        visibility: z.string().optional(),
        pose: z.string().optional(),
        expression: z.string().optional(),
        action: z.string().optional(),
        screen_position: z.string().optional(),
        confidence: z.number().min(0).max(1).optional(),
      })
    )
    .optional(),
});

/**
 * Text and dialogue element schema (Foundation for Part 2.5)
 */
export const TextElementTypeSchema = z.enum([
  'dialogue',
  'narration',
  'thought',
  'sfx',
  'sign',
  'system_ui',
  'whisper',
  'shout',
  'unknown',
]);

export const TextElementSchema = z.object({
  text_id: z.string().min(1, 'text_id is required'),
  type: TextElementTypeSchema,
  content: z.string(),
  bounding_box: BoundingBoxSchema,
  reading_order: z.number().int().nonnegative().optional(),
  speaker_reference: z.string().optional(),
  confidence: ConfidenceNumberSchema,
  source: AnalysisSourceTypeSchema.optional(),
});

/**
 * Scene context schema (Foundation for Part 2.6)
 */
export const SceneContextSchema = z.object({
  location: z.string().optional(),
  environment: z.string().optional(),
  indoor_outdoor: z.enum(['indoor', 'outdoor', 'unclear', 'abstract']).optional(),
  time_context: z.enum(['day', 'night', 'sunset', 'dawn', 'dusk', 'timeless']).optional(),
  weather: z.string().optional(),
  lighting: z.string().optional(),
  atmosphere: z.string().optional(),
  confidence: ConfidenceNumberSchema.optional(),
});

/**
 * Action observation schema (Foundation for Part 2.6)
 */
export const ActionIntensitySchema = z.enum(['subtle', 'moderate', 'high', 'explosive']);

export const ActionObservationSchema = z.object({
  action_id: z.string().min(1, 'action_id is required'),
  type: z.string().min(1, 'Action type is required'),
  description: z.string().optional(),
  actor_subject_id: z.string().optional(),
  target_subject_id: z.string().optional(),
  intensity: ActionIntensitySchema.optional(),
  direction: z.string().optional(),
  temporal_context: z.string().optional(),
  confidence: ConfidenceNumberSchema,
});

/**
 * Visual focus schema (Foundation for Part 2.7)
 */
export const FocusTargetTypeSchema = z.enum([
  'character',
  'face',
  'object',
  'action_area',
  'text',
  'environment',
]);

export const VisualFocusTargetSchema = z.object({
  type: FocusTargetTypeSchema,
  subject_id: z.string().optional(),
  region: BoundingBoxSchema.optional(),
  description: z.string().optional(),
});

export const VisualFocusSchema = z.object({
  primary_target: VisualFocusTargetSchema.optional(),
  secondary_targets: z.array(VisualFocusTargetSchema).optional(),
  focus_region: BoundingBoxSchema,
  importance: ConfidenceNumberSchema.optional(),
  confidence: ConfidenceNumberSchema,
  reason: z.string().optional(),
});

/**
 * Camera region and analysis foundation schema (Foundation for Part 2.7)
 */
export const CameraTargetTypeSchema = z.enum([
  'character',
  'focal_point',
  'full_action',
  'establishing',
  'text_safe',
]);

export const CameraRegionSchema = z.object({
  region_id: z.string().min(1, 'region_id is required'),
  region: BoundingBoxSchema,
  safe_margin: ConfidenceNumberSchema.optional(),
  target_type: CameraTargetTypeSchema,
  importance: ConfidenceNumberSchema,
  confidence: ConfidenceNumberSchema,
});

export const CameraAnalysisSchema = z.object({
  recommended_target: BoundingBoxSchema.optional(),
  safe_regions: z.array(CameraRegionSchema).optional(),
  shot_type: z.string().optional(),
  zoom_potential: z.enum(['low', 'medium', 'high']).optional(),
  pan_potential: z.enum(['static', 'vertical_down', 'vertical_up', 'horizontal', 'diagonal']).optional(),
  suggested_motion: z.string().optional(),
  duration_seconds: z.number().positive().optional(),
  constraints: z.array(z.string()).optional(),
  confidence: ConfidenceNumberSchema.optional(),
});

/**
 * Structured analysis error schema
 */
export const AnalysisErrorSchema = z.object({
  code: z.string().min(1, 'Error code is required'),
  stage: z.string().min(1, 'Error stage is required'),
  message: z.string().min(1, 'Error message is required'),
  retryable: z.boolean(),
  occurred_at: z.string().datetime({ message: 'Invalid occurred_at ISO datetime' }),
});

/**
 * Manual user corrections schema (Foundation for Part 2.9)
 */
export const VisualAnalysisCorrectionsSchema = z.object({
  focus_region_override: BoundingBoxSchema.optional(),
  shot_scale_override: ShotScaleSchema.optional(),
  scene_location_override: z.string().optional(),
  is_flagged: z.boolean().optional(),
  manual_notes: z.string().optional(),
  corrected_at: z.string().datetime().optional(),
});

/**
 * Granular stage completion tracking schema
 */
export const StageAnalysisStatusSchema = z.object({
  preprocessing: VisualAnalysisStatusSchema.optional(),
  composition: VisualAnalysisStatusSchema.optional(),
  subjects: VisualAnalysisStatusSchema.optional(),
  characters: VisualAnalysisStatusSchema.optional(),
  text: VisualAnalysisStatusSchema.optional(),
  scene: VisualAnalysisStatusSchema.optional(),
  action: VisualAnalysisStatusSchema.optional(),
  focus: VisualAnalysisStatusSchema.optional(),
  camera: VisualAnalysisStatusSchema.optional(),
});

/**
 * Canonical Root Visual Analysis Schema (Part 2.1)
 */
export const VisualAnalysisSchema = z.object({
  analysis_version: z.string().min(1, 'analysis_version is required'),
  status: VisualAnalysisStatusSchema,
  stages: StageAnalysisStatusSchema.optional(),
  source: AnalysisSourceSchema.optional(),
  preprocessing: PreprocessingInfoSchema.optional(),
  composition: CompositionAnalysisSchema.optional(),
  subjects: z.array(SubjectSchema).optional(),
  characters: z.array(CharacterDetectionSchema).optional(),
  text: z.array(TextElementSchema).optional(),
  scene: SceneContextSchema.optional(),
  action: z.array(ActionObservationSchema).optional(),
  visual_focus: VisualFocusSchema.optional(),
  camera: CameraAnalysisSchema.optional(),
  confidence: ConfidenceNumberSchema.optional(),
  error: AnalysisErrorSchema.optional(),
  manual_corrections: VisualAnalysisCorrectionsSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
