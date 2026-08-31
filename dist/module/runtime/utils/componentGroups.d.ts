import type { ComponentMeta } from 'nuxt-studio/app';
export interface ComponentGroupConfig {
    label: string;
    include: string[];
}
export interface ComponentGroup {
    label: string;
    components: ComponentMeta[];
}
/**
 * Assigns components to groups based on include patterns.
 * First-match wins when a component matches multiple groups.
 *
 * @param components - Flat list of components to group
 * @param groups - Group configs with label and include patterns
 * @param ungrouped - Whether unmatched components go in a fallback group
 * @param fallbackLabel - Label for the fallback group when ungrouped is 'include'
 * @returns Array of groups with their components (empty groups omitted)
 */
export declare function assignComponentsToGroups(components: ComponentMeta[], groups: ComponentGroupConfig[], ungrouped: 'include' | 'omit', fallbackLabel: string): ComponentGroup[];
