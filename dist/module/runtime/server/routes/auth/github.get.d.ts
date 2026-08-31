export interface OAuthGitHubConfig {
    /**
     * GitHub OAuth Client ID
     * @default NUXT_STUDIO_AUTH_GITHUB_CLIENT_ID
     */
    clientId?: string;
    /**
     * GitHub OAuth Client Secret
     * @default NUXT_STUDIO_AUTH_GITHUB_CLIENT_SECRET
     */
    clientSecret?: string;
    /**
     * Comma-separated list of allowed email addresses.
     * @default NUXT_STUDIO_AUTH_GITHUB_MODERATORS
     */
    moderators?: string;
    /**
     * GitHub OAuth Scope
     * @default []
     * @see https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps
     * @example ['user:email']
     */
    scope?: string[];
    /**
     * Require email from user, adds the ['user:email'] scope if not present
     * @default false
     */
    emailRequired?: boolean;
    /**
     * GitHub instance base web URL (for GitHub Enterprise Server).
     * Must be the web origin without a trailing slash and without `/api/v3`,
     * for example: `https://github.com` or `https://ghe.example.com`.
     * @default 'https://github.com'
     */
    instanceUrl?: string;
    /**
     * GitHub OAuth Authorization URL
     * @default '{instanceUrl}/login/oauth/authorize'
     */
    authorizationURL?: string;
    /**
     * GitHub OAuth Token URL
     * @default '{instanceUrl}/login/oauth/access_token'
     */
    tokenURL?: string;
    /**
     * GitHub API URL
     * @default 'https://api.github.com' (or '{instanceUrl}/api/v3' for GitHub Enterprise Server)
     */
    apiURL?: string;
    /**
     * Extra authorization parameters to provide to the authorization URL
     * @see https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity
     * @example { allow_signup: 'true' }
     */
    authorizationParams?: Record<string, string>;
    /**
     * Redirect URL to allow overriding for situations like prod failing to determine public hostname
     * Set via NUXT_STUDIO_AUTH_GITHUB_REDIRECT_URL environment variable.
     * @default is ${hostname}/__nuxt_studio/auth/github
     */
    redirectURL?: string;
}
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<void>>;
export default _default;
