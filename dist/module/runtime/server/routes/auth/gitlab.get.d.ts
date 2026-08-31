export interface OAuthGitLabConfig {
    /**
     * GitLab OAuth Application ID
     * @default NUXT_STUDIO_AUTH_GITLAB_APPLICATION_ID
     */
    applicationId?: string;
    /**
     * GitLab OAuth Application Secret
     * @default NUXT_STUDIO_AUTH_GITLAB_APPLICATION_SECRET
     */
    applicationSecret?: string;
    /**
     * Comma-separated list of allowed email addresses.
     * @default NUXT_STUDIO_AUTH_GITLAB_MODERATORS
     */
    moderators?: string;
    /**
     * GitLab OAuth Scope
     * @default []
     * @see https://docs.gitlab.com/ee/integration/oauth_provider.html#authorized-applications
     */
    scope?: string[];
    /**
     * Require email from user
     * @default false
     */
    emailRequired?: boolean;
    /**
     * GitLab instance URL
     * @default 'https://gitlab.com'
     */
    instanceUrl?: string;
    /**
     * GitLab OAuth Authorization URL
     * @default '{instanceUrl}/oauth/authorize'
     */
    authorizationURL?: string;
    /**
     * GitLab OAuth Token URL
     * @default '{instanceUrl}/oauth/token'
     */
    tokenURL?: string;
    /**
     * GitLab API URL
     * @default '{instanceUrl}/api/v4'
     */
    apiURL?: string;
    /**
     * Extra authorization parameters to provide to the authorization URL
     */
    authorizationParams?: Record<string, string>;
    /**
     * Redirect URL to allow overriding for situations like prod failing to determine public hostname
     * Set via NUXT_STUDIO_AUTH_GITLAB_REDIRECT_URL environment variable.
     * @default is ${hostname}/__nuxt_studio/auth/gitlab
     */
    redirectURL?: string;
}
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<void>>;
export default _default;
