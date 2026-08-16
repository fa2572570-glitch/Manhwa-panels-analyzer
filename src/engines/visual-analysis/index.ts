/**
 * Engine Interface: Visual Analysis Engine
 */
import { Panel, VisualAnalysisExtension } from '../../types';

export interface VisualAnalysisEngine {
  analyzePanel(panel: Panel, imageBlob: Blob): Promise<VisualAnalysisExtension>;
}
