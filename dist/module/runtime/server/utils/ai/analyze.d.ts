/**
 * AI analysis utilities for content collection analysis and style guide generation
 */
import type { DatabasePageItem } from 'nuxt-studio/app';
import type { ModuleOptions } from '../../../../module.js';
import { ContentType } from '../../types/ai.js';
import type { ContentSample, CollectionMetadata, CollectionArchitecture } from '../../types/ai.js';
/**
 * Detect content type based on patterns in titles, paths, and structure
 */
export declare function detectContentType(items: DatabasePageItem[]): ContentType;
/**
 * Build a file tree structure for visualization
 */
export declare function buildFileTree(items: DatabasePageItem[]): string;
/**
 * Analyze folder structure and architecture
 */
export declare function analyzeArchitecture(items: DatabasePageItem[]): CollectionArchitecture;
/**
 * Build project information context for analysis
 */
export declare function buildProjectInfoContext(projectContext?: NonNullable<ModuleOptions['ai']>['context']): string;
/**
 * Build analysis prompt based on content samples and collection metadata
 * Note: Assumes contentSamples always has content. Caller should validate before calling.
 */
export declare function buildAnalysisPrompt(contentSamples: ContentSample[], collectionMetadata: CollectionMetadata, projectInfo: string): string;
/**
 * Generate system prompt for "analyze" mode
 */
export declare function getAnalyzeSystem(): string;
