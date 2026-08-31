import type { ComponentMeta as VueComponentMeta } from 'vue-component-meta';
import type { ComponentMeta } from 'nuxt-studio/app';
export interface NuxtComponentMeta {
    pascalName: string;
    filePath: string;
    meta: VueComponentMeta;
    global: boolean;
}
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<{
    markdownConfig: object;
    highlightTheme: object;
    components: {
        list: ComponentMeta[];
        groups?: Array<{
            label: string;
            include: string[];
        }>;
        ungrouped?: "include" | "omit";
    };
}>>;
export default _default;
