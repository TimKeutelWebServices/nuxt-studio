/**
 * LEGACY COMPATIBILITY LAYER
 *
 * These utilities exist solely to bridge the gap between the current @nuxt/content
 * storage format (MarkdownRoot / minimark) and the upcoming native ComarkTree format.
 *
 * When @nuxt/content releases native ComarkTree body support:
 *   1. Delete this file
 *   2. Fix TypeScript errors at call sites:
 *      - host.ts      → remove the ensureComarkBody import + all db.get/list/create calls to it,
 *                       remove markdownRootFromComarkTree usage in db.upsert
 *      - compare.ts   → drop the comarkBody helper and compare ComarkTrees directly
 *      - generate.ts  → remove unbindComarkTree usage in contentFromMarkdownDocument
 *      - index.ts     → remove re-exports of ensureComarkBody, comarkTreeFromLegacyDocument and markdownRootFromComarkTree
 *      - useDraftBase.ts → remove upgradeLegacyBodies + its host.document.utils.ensureComarkBody call
 */
import type { MarkdownRoot } from '@nuxt/content';
import type { DatabaseItem } from 'nuxt-studio/app';
import type { ComarkTree } from 'comark';
/**
 * Strip @nuxtjs/mdc ':key' JSON-binding artifacts from array/object attrs in a
 * comark-shaped body read straight from the dump (no MDC→Comark bridge). Without
 * this, comark renders such a prop as an inline `{:bar="[...]"}` literal instead of
 * a YAML block, producing a permanent phantom conflict. Scalar bindings are left
 * alone — comark round-trips those itself; stripping the colon would drop them.
 */
export declare function unbindComarkTree(tree: ComarkTree): ComarkTree;
/**
 * Convert a legacy stored document's body (MarkdownRoot/minimark) to a ComarkTree.
 * Used at DB read boundaries (db.get, db.list, db.create) to transparently upgrade
 * legacy documents to the new format before they reach the app.
 */
export declare function comarkTreeFromLegacyDocument(document: DatabaseItem): ComarkTree | null;
export declare function ensureComarkBody(document: DatabaseItem): DatabaseItem;
/**
 * Convert a ComarkTree body back to the legacy compressed MarkdownRoot format for DB storage.
 * Used at the DB write boundary (db.upsert) to store documents in the current @nuxt/content format.
 */
export declare function markdownRootFromComarkTree(tree: ComarkTree): MarkdownRoot;
