/**
 * Detect repository information from CI / platform environment variables at runtime.
 * Supports Vercel, Netlify, GitHub Actions, and GitLab CI.
 *
 * Note: VERCEL_GIT_* and Netlify REPOSITORY_URL / BRANCH env vars are present in the
 * running server process, so they resolve at runtime.  GITHUB_ACTIONS and GITLAB_CI env
 * vars are typically only available during the CI build pipeline; for deployments that rely
 * on those, set explicit `repository` config in nuxt.config.ts or via
 * NUXT_PUBLIC_STUDIO_REPOSITORY_* environment variables instead.
 */
export interface RepositoryDetection {
    provider?: 'github' | 'gitlab';
    owner?: string;
    repo?: string;
    branch?: string;
    instanceUrl?: string;
}
export declare function detectRepositoryFromCI(): RepositoryDetection | undefined;
