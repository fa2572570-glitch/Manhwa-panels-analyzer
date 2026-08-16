/**
 * Feature: AI Analysis Orchestration
 * Extension point for multi-stage vision and language model analysis
 */
import { AnalysisStatus, AnalysisStage } from '../../types';

export interface AnalysisPipelineRunner {
  runStage(stage: AnalysisStage, projectId: string): Promise<AnalysisStatus>;
  cancelAnalysis(projectId: string): Promise<void>;
}
