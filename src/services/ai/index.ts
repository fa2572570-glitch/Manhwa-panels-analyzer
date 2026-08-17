/**
 * Service: AI Bridge
 */

export * from './composition-provider';
export * from './subject-provider';
export * from './gemini-provider';
export * from './mock-provider';

import { IVisionAnalysisProvider } from './composition-provider';
import { GeminiVisionProvider } from './gemini-provider';

let defaultVisionProvider: IVisionAnalysisProvider = new GeminiVisionProvider();

export function getVisionAnalysisProvider(): IVisionAnalysisProvider {
  return defaultVisionProvider;
}

export function setVisionAnalysisProvider(provider: IVisionAnalysisProvider): void {
  defaultVisionProvider = provider;
}
