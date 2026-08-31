interface ComponentGroupConfig {
    label: string;
    include: string[];
}
export declare const useHostMeta: () => {
    fetch: () => Promise<void>;
    components: {
        list: import("vue").ShallowRef<ComponentMeta[], ComponentMeta[]>;
        hasNuxtUI: import("vue").ComputedRef<boolean>;
        groups: import("vue").ShallowRef<ComponentGroupConfig[], ComponentGroupConfig[]>;
        ungrouped: import("vue").ShallowRef<"include" | "omit", "include" | "omit">;
    };
    highlightTheme: import("vue").ShallowRef<{
        default: string;
        dark?: string;
        light?: string;
    } | undefined, {
        default: string;
        dark?: string;
        light?: string;
    } | undefined>;
    markdownConfig: import("vue").ShallowRef<{
        contentHeading?: boolean;
    } | undefined, {
        contentHeading?: boolean;
    } | undefined>;
};
export {};
