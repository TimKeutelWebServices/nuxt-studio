import { CollectionType } from '@nuxt/content';
import { ComponentData } from 'nuxt-component-meta';
import { Nodes } from 'mdast';

export declare interface AIGenerateOptions {
    prompt?: string;
    previousContext?: string;
    nextContext?: string;
    mode?: AIMode;
    language?: string;
    selectionLength?: number;
    fsPath?: string;
    collectionName?: string;
    hintOptions?: AIHintOptions;
}

export declare interface AIHintOptions {
    cursor: CursorContext;
    previousNodeType?: string;
    headingText?: string;
    currentComponent?: string;
    currentSlot?: string;
}

/**
 * Shared AI types used across frontend and backend
 */
declare type AIMode = 'continue' | 'fix' | 'improve' | 'simplify' | 'translate';

/**
 * Callbacks for AI transform accept/decline actions
 */
export declare interface AITransformCallbacks {
    onAccept: () => void;
    onDecline: () => void;
}

declare const COMMAND_KEYS: readonly ["style", "insert", "paragraph", "heading1", "heading2", "heading3", "heading4", "bulletList", "orderedList", "blockquote", "codeBlock", "bold", "italic", "strike", "code", "image", "video", "horizontalRule", "table"];

export declare interface CommandConfig {
    exclude?: CommandKey[];
}

export declare type CommandKey = typeof COMMAND_KEYS[number];

export declare interface ComponentMeta {
    name: string;
    path: string;
    nuxtUI?: boolean;
    meta: {
        props: ComponentData['meta']['props'];
        slots: ComponentData['meta']['slots'];
        events: ComponentData['meta']['events'];
    };
}

export declare type CursorContext = 'heading-new' | 'heading-continue' | 'heading-middle' | 'paragraph-new' | 'paragraph-continue' | 'paragraph-middle' | 'sentence-new';

/**
 * Diff part for AI transform highlighting
 */
export declare interface DiffPart {
    type: 'added' | 'removed' | 'unchanged';
    text: string;
}

export declare const EMOJI_REGEXP: RegExp;

export declare interface EmojiItem {
    name: string;
    shortcodes: string[];
    group: string;
    version: number;
    emoticons?: string[];
}

export declare const emojiList: Record<string, EmojiItem>;

export declare const emojiNameToUnicodeMap: Map<string, string>;

export declare function getEmojiName(unicode: string): string;

export declare function getEmojiUnicode(name: string): string;

export declare type GitProviderType = 'github' | 'gitlab';

export declare interface MarkdownParsingOptions {
    compress?: boolean;
    collectionType?: CollectionType;
    preserveLinkAttributes?: boolean;
}

export declare function remarkEmojiPlugin(): (tree: Nodes) => void;

export { }


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        aiTransform: {
            transformSelection: (mode: string, transformFn: () => Promise<string>) => ReturnType;
            acceptTransform: () => ReturnType;
            declineTransform: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        completion: {
            /**
             * Trigger AI completion manually
             */
            triggerCompletion: () => ReturnType;
            /**
             * Accept the current completion
             */
            acceptCompletion: () => ReturnType;
            /**
             * Dismiss the current completion
             */
            dismissCompletion: () => ReturnType;
        };
    }
    interface Storage {
        aiCompletion: CompletionStorage;
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        Slot: {
            /**
             * Override backspace command
             */
            handleSlotBackspace: () => ReturnType;
            /**
             * Move empty trailing block out of slot on double-Enter.
             */
            exitEmptyTextblockFromSlot: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        Binding: {
            /**
             * Insert a binding node
             */
            setBinding: (attrs: BindingAttrs) => ReturnType;
            /**
             * Update the current binding node attributes
             */
            updateBinding: (attrs: BindingAttrs) => ReturnType;
            /**
             * Remove current binding node
             */
            unsetBinding: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        SpanStyle: {
            /**
             * Wrap selection (or insert empty) with span-style node
             */
            setSpanStyle: (attributes?: SpanStyleAttrs) => ReturnType;
            /**
             * Update attributes on current span-style node
             */
            updateSpanStyle: (attributes?: SpanStyleAttrs) => ReturnType;
            /**
             * Remove the current span-style node (unwrap content)
             */
            unsetSpanStyle: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        callout: {
            setCallout: (tag: string, slot?: string) => ReturnType;
        };
    }
}


declare module '@tiptap/vue-3' {
    interface Commands<ReturnType> {
        videoPicker: {
            insertVideoPicker: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        Element: {
            setElement: (tag: string, slot?: string) => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        Frontmatter: {
            handleFrontmatterBackspace: () => ReturnType;
        };
    }
}


declare module '@tiptap/vue-3' {
    interface Commands<ReturnType> {
        imagePicker: {
            insertImagePicker: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        InlineElement: {
            /**
             * Toggle a InlineElement
             */
            setInlineElement: (tag: string) => ReturnType;
        };
    }
}
