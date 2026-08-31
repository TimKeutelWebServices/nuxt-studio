/**
 * AI utilities - Re-exports for backward compatibility
 */
export { ContentType } from '../../types/ai.js';
export type { ContentSample, CollectionMetadata, CollectionArchitecture } from '../../types/ai.js';
export { buildLocationContext, buildMetadataContext, buildHintContext, buildCollectionSummaryContext, buildAIContext, calculateMaxTokens, getSystem, getFixSystem, getImproveSystem, getSimplifySystem, getTranslateSystem, getContinueSystem, } from './generate.js';
export { detectContentType, buildFileTree, analyzeArchitecture, buildProjectInfoContext, buildAnalysisPrompt, getAnalyzeSystem, } from './analyze.js';
