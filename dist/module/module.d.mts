import * as _nuxt_schema from '@nuxt/schema';

declare const COMMAND_KEYS: readonly ["style", "insert", "paragraph", "heading1", "heading2", "heading3", "heading4", "bulletList", "orderedList", "blockquote", "codeBlock", "bold", "italic", "strike", "code", "image", "video", "horizontalRule", "table"];
type CommandKey = typeof COMMAND_KEYS[number];
interface CommandConfig {
    exclude?: CommandKey[];
}

interface EditorOptions {
    /**
     * Commands to exclude from the editor.
     * @example ['style', 'insert', 'blockquote'] will hide the Style and Insert sections and the blockquote command.
     */
    commands?: CommandConfig;
    /**
     * Component filtering options.
     */
    components?: {
        /**
         * Patterns to include components.
         * If a pattern contains a /, it will be treated as a path filter.
         * Otherwise, it will be treated as a name filter.
         */
        include?: string[];
        /**
         * Patterns to exclude components.
         * If a pattern contains a /, it will be treated as a path filter.
         * Otherwise, it will be treated as a name filter.
         */
        exclude?: string[];
        /**
         * Custom groups for the slash command menu.
         * When defined, components are organized into these groups instead of a single flat list.
         */
        groups?: Array<{
            /**
             * Label for the group.
             * @example 'Landing Page Components'
             */
            label: string;
            /**
             * Patterns to include components in the group.
             * @example ['content*', 'app/components/content/landing/**']
             */
            include: string[];
        }>;
        /**
         * Whether components not matching any group appear in a fallback "Components" group.
         * @default 'include'
         */
        ungrouped?: 'include' | 'omit';
    };
    /**
     * Restricts the Iconify collection prefixes available in every Studio icon picker
     * @example ['material-symbols', 'lucide']
     */
    iconLibraries?: string[];
}
interface MediaUploadOptions {
    /**
     * Enable external storage for media uploads.
     * When enabled, media files are uploaded to cloud storage (S3, Vercel Blob, Cloudflare R2, etc.)
     * instead of being committed to Git. NuxtHub auto-detects the driver from environment variables.
     *
     * @default false
     */
    external?: boolean;
    /**
     * The maximum file size for media uploads.
     * @default 10 * 1024 * 1024 (10MB)
     */
    maxFileSize?: number;
    /**
     * The allowed types for media uploads.
     * @default ['image/*', 'video/*', 'audio/*']
     */
    allowedTypes?: string[];
    /**
     * The public CDN URL for the media files.
     * Falls back to the blob URL returned by the storage provider if not set.
     * @default NUXT_PUBLIC_STUDIO_MEDIA_PUBLIC_URL
     */
    publicUrl?: string;
    /**
     * The prefix used for files stored in external storage.
     * Files are stored as `<prefix>/<path>` in the bucket.
     * @default 'studio'
     */
    prefix?: string;
}
interface RepositoryOptions {
    /**
     * The owner of the git repository.
     */
    owner?: string;
    /**
     * The repository name.
     */
    repo?: string;
    /**
     * The branch to use for the git repository.
     * @default 'main'
     */
    branch?: string;
    /**
     * The root directory to use for the git repository.
     * @default ''
     */
    rootDir?: string;
    /**
     * Whether the repository is private or public.
     * If set to false, the 'public_repo' scope will be used instead of the 'repo' scope.
     * @default true
     */
    private?: boolean;
}
interface GitHubRepositoryOptions extends RepositoryOptions {
    provider: 'github';
    /**
     * GitHub instance base web URL (for GitHub Enterprise Server).
     * Must be the web origin without a trailing slash and without `/api/v3`,
     * for example: `https://github.com` or `https://ghe.example.com`.
     * @default 'https://github.com'
     */
    instanceUrl?: string;
}
interface GitLabRepositoryOptions extends RepositoryOptions {
    provider: 'gitlab';
    /**
     * The GitLab instance URL (for self-hosted instances).
     * @default 'https://gitlab.com'
     */
    instanceUrl?: string;
}
interface ModuleOptions {
    /**
     * The route to access the studio login page.
     * @default '/_studio'
     */
    route?: string;
    /**
     * AI-powered content generation settings.
     */
    ai?: {
        /**
         * The Vercel AI Gateway key for AI features.
         * When set, AI-powered content generation will be enabled.
         *
         * Set via `NUXT_STUDIO_AI_API_KEY` environment variable at runtime.
         */
        apiKey?: string;
        /**
         * Contextual information to guide AI content generation.
         */
        context?: {
            /**
             * The title of the project.
             * @default Reads from package.json name field
             */
            title?: string;
            /**
             * The description of the project.
             * @default Reads from package.json description field
             */
            description?: string;
            /**
             * The writing style to use (e.g., "technical documentation", "blog post", "marketing copy").
             */
            style?: string;
            /**
             * The tone to use (e.g., "friendly and concise", "formal and professional", "casual").
             */
            tone?: string;
            /**
             * Collection configuration for storing AI context files.
             * Each collection can have its own CONTEXT.md file.
             */
            collection?: {
                /**
                 * The name of the collection storing AI context files.
                 * @default 'studio'
                 */
                name?: string;
                /**
                 * The folder where context files are stored.
                 * @default '.studio'
                 */
                folder?: string;
            };
        };
        /**
         * Experimental AI features.
         */
        experimental?: {
            /**
             * Enable loading collection-specific context files from the studio collection.
             * When enabled, AI will load writing guidelines from `.studio/{collection-name}.md`.
             * @default false
             */
            collectionContext?: boolean;
        };
    };
    /**
     * The authentication settings for studio.
     */
    auth?: {
        /**
         * The GitHub OAuth credentials.
         */
        github?: {
            /**
             * The GitHub OAuth client ID.
             * @default NUXT_STUDIO_AUTH_GITHUB_CLIENT_ID
             */
            clientId?: string;
            /**
             * The GitHub OAuth client secret.
             * @default NUXT_STUDIO_AUTH_GITHUB_CLIENT_SECRET
             */
            clientSecret?: string;
            /**
             * GitHub instance base web URL (for GitHub Enterprise Server).
             * Must be the web origin without a trailing slash and without `/api/v3`,
             * for example: `https://github.com` or `https://ghe.example.com`.
             * @default 'https://github.com'
             */
            instanceUrl?: string;
            /**
             * Comma-separated list of allowed email addresses.
             * @default NUXT_STUDIO_AUTH_GITHUB_MODERATORS
             */
            moderators?: string;
        };
        /**
         * The GitLab OAuth credentials.
         */
        gitlab?: {
            /**
             * The GitLab OAuth application ID.
             * @default NUXT_STUDIO_AUTH_GITLAB_APPLICATION_ID
             */
            applicationId?: string;
            /**
             * The GitLab OAuth application secret.
             * @default NUXT_STUDIO_AUTH_GITLAB_APPLICATION_SECRET
             */
            applicationSecret?: string;
            /**
             * The GitLab instance URL (for self-hosted instances).
             * @default 'https://gitlab.com'
             */
            instanceUrl?: string;
            /**
             * Comma-separated list of allowed email addresses.
             * @default NUXT_STUDIO_AUTH_GITLAB_MODERATORS
             */
            moderators?: string;
        };
        /**
         * The Google OAuth credentials.
         * Note: When using Google OAuth, you must set NUXT_STUDIO_AUTH_GOOGLE_MODERATORS to a comma-separated
         * list of authorized email addresses, and either NUXT_STUDIO_GIT_GITHUB_TOKEN or NUXT_STUDIO_GIT_GITLAB_TOKEN
         * to push changes to your repository.
         */
        google?: {
            /**
             * The Google OAuth client ID.
             * @default NUXT_STUDIO_AUTH_GOOGLE_CLIENT_ID
             */
            clientId?: string;
            /**
             * The Google OAuth client secret.
             * @default NUXT_STUDIO_AUTH_GOOGLE_CLIENT_SECRET
             */
            clientSecret?: string;
            /**
             * Comma-separated list of authorized email addresses.
             * Required when using Google OAuth.
             * @default NUXT_STUDIO_AUTH_GOOGLE_MODERATORS
             */
            moderators?: string;
        };
        /**
         * SSO server credentials for Single Sign-On across multiple Nuxt Studio sites.
         * This enables authentication via a centralized SSO server (like nuxt-studio-sso).
         * When users authenticate with GitHub on the SSO server, their GitHub token is
         * automatically passed through, eliminating the need for NUXT_STUDIO_GIT_GITHUB_TOKEN.
         */
        sso?: {
            /**
             * The SSO server URL (e.g., 'https://auth.example.com').
             * @default NUXT_STUDIO_AUTH_SSO_SERVER_URL
             */
            serverUrl?: string;
            /**
             * The SSO client ID.
             * @default NUXT_STUDIO_AUTH_SSO_CLIENT_ID
             */
            clientId?: string;
            /**
             * The SSO client secret.
             * @default NUXT_STUDIO_AUTH_SSO_CLIENT_SECRET
             */
            clientSecret?: string;
        };
    };
    /**
     * The git repository information to connect to.
     */
    repository?: GitHubRepositoryOptions | GitLabRepositoryOptions;
    /**
     * Enable Nuxt Studio to edit content and media files on your filesystem.
     */
    dev: boolean;
    /**
     * Enable Nuxt Studio to edit content and media files on your filesystem.
     *
     * @deprecated Use the 'dev' option instead.
     */
    development?: {
        sync?: boolean;
    };
    /**
     * i18n settings for the Studio.
     */
    i18n?: {
        /**
         * The default locale to use.
         * @default 'en'
         */
        defaultLocale?: string;
    };
    /**
     * Editor configuration options (components, commands, icon libraries).
     */
    editor?: EditorOptions;
    /**
     * @deprecated Use `editor` instead.
     */
    meta?: EditorOptions;
    /**
     * Git configuration options.
     */
    git?: {
        /**
         * Commit configuration for content editor publishes.
         */
        commit?: {
            /**
             * Prefix to prepend to all commit messages (e.g. 'feat:', 'docs:', 'content:').
             * Should include trailing colon for conventional commit format.
             * @default '' (no prefix)
             */
            messagePrefix?: string;
        };
    };
    /**
     * Media upload configuration for OSS (Object Storage Service) integration.
     * Allows uploading media files to external storage providers like S3, Cloudinary, etc.
     */
    media?: MediaUploadOptions;
}
declare const _default: _nuxt_schema.NuxtModule<ModuleOptions, ModuleOptions, false>;

export { _default as default };
export type { ModuleOptions };
