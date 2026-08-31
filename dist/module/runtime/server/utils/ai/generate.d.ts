/**
 * AI generation utilities for text completion and transformation
 */
import type { H3Event } from 'h3';
import type { AIHintOptions } from 'nuxt-studio/app';
import type { ModuleOptions } from '../../../../module.js';
/**
 * Build file location context
 */
export declare function buildLocationContext(fsPath?: string, collectionName?: string): string | null;
/**
 * Build project metadata context
 */
export declare function buildMetadataContext(projectContext?: NonNullable<ModuleOptions['ai']>['context']): string | null;
/**
 * Build cursor position hint context
 */
export declare function buildHintContext(hintOptions?: AIHintOptions): string | null;
/**
 * Load collection-specific writing guidelines from context file
 * EXPERIMENTAL: Requires experimental.collectionContext flag and studio collection setup
 */
export declare function buildCollectionSummaryContext(event: H3Event, collectionName?: string, projectContext?: NonNullable<ModuleOptions['ai']>['context']): Promise<string | null>;
/**
 * Build complete AI context from file location, project metadata, and writing guidelines
 */
export declare function buildAIContext(event: H3Event, options: {
    fsPath?: string;
    collectionName?: string;
    mode?: string;
    projectContext?: NonNullable<ModuleOptions['ai']>['context'];
    hintOptions?: AIHintOptions;
    experimentalCollectionContext?: boolean;
}): Promise<string>;
/**
 * Calculate max output tokens based on selection length and mode
 * (1 token ≈ 4 characters)
 */
export declare function calculateMaxTokens(selectionLength: number | undefined, mode: string, hintOptions?: AIHintOptions): number;
/**
 * Generate system prompt for "fix" mode
 */
export declare function getFixSystem(context: string): string;
/**
 * Generate system prompt for "improve" mode
 */
export declare function getImproveSystem(context: string): string;
/**
 * Generate system prompt for "simplify" mode
 */
export declare function getSimplifySystem(context: string): string;
/**
 * Generate system prompt for "translate" mode
 */
export declare function getTranslateSystem(context: string, language?: string): string;
/**
 * Generate system prompt for "continue" mode
 */
export declare function getContinueSystem(context: string): string;
/**
 * Generate system prompt for "commit" mode
 */
export declare function getCommitSystem(messagePrefix?: string): string;
/**
 * Generate system prompt based on mode
 */
export declare function getSystem(mode: string, context: string, language?: string): string;
