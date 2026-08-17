/**
 * Part 2.3 — Gemini Vision Analysis Provider
 * 
 * Communicates with the server-side `/api/analysis/composition` endpoint,
 * keeping API keys strictly on the server-side while providing structured
 * analysis data and error propagation to the client.
 */

import {
  IVisionAnalysisProvider,
  CompositionPromptPayload,
} from './composition-provider';
import { SubjectDetectionPromptPayload } from './subject-provider';
import { AnalysisSource, AnalysisError } from '../../types';
import { COMPOSITION_PROMPT_VERSION } from '../../features/analysis/prompts/composition.prompt';
import { SUBJECT_DETECTION_PROMPT_VERSION } from '../../features/analysis/prompts/subject-detection.prompt';

export class GeminiVisionProvider implements IVisionAnalysisProvider {
  readonly providerId = 'gemini';
  readonly modelId = 'gemini-3.7-flash';
  readonly promptVersion = COMPOSITION_PROMPT_VERSION;
  readonly subjectPromptVersion = SUBJECT_DETECTION_PROMPT_VERSION;

  async analyzePanelComposition(
    payload: CompositionPromptPayload,
    signal?: AbortSignal
  ): Promise<{
    raw: unknown;
    provenance: AnalysisSource;
  }> {
    // 1. Convert blob to Base64 for transit
    const arrayBuffer = await payload.imageBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);

    const requestBody = {
      panelId: payload.panelId,
      mimeType: payload.mimeType || 'image/jpeg',
      imageBase64: base64Data,
      promptVersion: this.promptVersion,
      context: payload.context,
    };

    try {
      const response = await fetch('/api/analysis/composition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }

        const structuredError: AnalysisError = {
          code: errorData.code || (response.status === 401 || response.status === 403 ? 'PROVIDER_AUTH_MISSING' : 'API_ERROR'),
          stage: 'composition',
          message: errorData.message || `Vision provider error (${response.status})`,
          retryable: response.status >= 500 || response.status === 429,
          details: errorData.details,
          occurred_at: new Date().toISOString(),
        };
        throw structuredError;
      }

      const resultJson = await response.json();

      const provenance: AnalysisSource = {
        provider: this.providerId,
        model: resultJson.model || this.modelId,
        model_version: resultJson.model_version || '2026-03',
        prompt_version: this.promptVersion,
        source_type: 'ai',
        analyzed_at: new Date().toISOString(),
      };

      return {
        raw: resultJson.composition || resultJson,
        provenance,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw {
          code: 'ANALYSIS_CANCELLED',
          stage: 'composition',
          message: 'Composition analysis was cancelled by user',
          retryable: true,
          occurred_at: new Date().toISOString(),
        } as AnalysisError;
      }

      if (err.code && err.stage) {
        throw err;
      }

      throw {
        code: 'NETWORK_ERROR',
        stage: 'composition',
        message: err.message || 'Failed to communicate with composition analysis backend',
        retryable: true,
        occurred_at: new Date().toISOString(),
      } as AnalysisError;
    }
  }

  async analyzePanelSubjects(
    payload: SubjectDetectionPromptPayload,
    signal?: AbortSignal
  ): Promise<{
    raw: unknown;
    provenance: AnalysisSource;
  }> {
    // 1. Convert blob to Base64 for transit
    const arrayBuffer = await payload.imageBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);

    const requestBody = {
      panelId: payload.panelId,
      mimeType: payload.mimeType || 'image/jpeg',
      imageBase64: base64Data,
      promptVersion: this.subjectPromptVersion,
      context: payload.context,
    };

    try {
      const response = await fetch('/api/analysis/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }

        const structuredError: AnalysisError = {
          code: errorData.code || (response.status === 401 || response.status === 403 ? 'PROVIDER_AUTH_MISSING' : 'API_ERROR'),
          stage: 'subjects',
          message: errorData.message || `Subject detection provider error (${response.status})`,
          retryable: response.status >= 500 || response.status === 429,
          details: errorData.details,
          occurred_at: new Date().toISOString(),
        };
        throw structuredError;
      }

      const resultJson = await response.json();

      const provenance: AnalysisSource = {
        provider: this.providerId,
        model: resultJson.model || this.modelId,
        model_version: resultJson.model_version || '2026-03',
        prompt_version: this.subjectPromptVersion,
        source_type: 'ai',
        analyzed_at: new Date().toISOString(),
      };

      return {
        raw: resultJson.detections || resultJson,
        provenance,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw {
          code: 'ANALYSIS_CANCELLED',
          stage: 'subjects',
          message: 'Subject detection analysis was cancelled by user',
          retryable: true,
          occurred_at: new Date().toISOString(),
        } as AnalysisError;
      }

      if (err.code && err.stage) {
        throw err;
      }

      throw {
        code: 'NETWORK_ERROR',
        stage: 'subjects',
        message: err.message || 'Failed to communicate with subject detection backend',
        retryable: true,
        occurred_at: new Date().toISOString(),
      } as AnalysisError;
    }
  }
}
