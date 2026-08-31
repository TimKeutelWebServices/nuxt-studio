export interface SSOUser {
    sub: string;
    name: string;
    email: string;
    picture?: string;
    github_token?: string;
    git_provider?: 'github' | 'gitlab';
}
export interface SSOServerConfig {
    /**
     * SSO Server URL (e.g., 'https://auth.example.com')
     * @default NUXT_STUDIO_AUTH_SSO_SERVER_URL
     */
    serverUrl?: string;
    /**
     * SSO Client ID
     * @default NUXT_STUDIO_AUTH_SSO_CLIENT_ID
     */
    clientId?: string;
    /**
     * SSO Client Secret
     * @default NUXT_STUDIO_AUTH_SSO_CLIENT_SECRET
     */
    clientSecret?: string;
    /**
     * Redirect URL to allow overriding for situations like prod failing to determine public hostname
     * @default is ${hostname}/__nuxt_studio/auth/sso
     */
    redirectURL?: string;
}
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<void>>;
export default _default;
