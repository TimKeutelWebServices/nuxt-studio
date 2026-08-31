export function detectRepositoryFromCI() {
  if (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG && ["github", "gitlab"].includes(process.env.VERCEL_GIT_PROVIDER)) {
    return {
      provider: process.env.VERCEL_GIT_PROVIDER,
      owner: process.env.VERCEL_GIT_REPO_OWNER,
      repo: process.env.VERCEL_GIT_REPO_SLUG,
      branch: process.env.VERCEL_GIT_COMMIT_REF
    };
  }
  if (process.env.NETLIFY && process.env.REPOSITORY_URL) {
    const match = process.env.REPOSITORY_URL.match(/(?:github\.com|gitlab\.com)[:/]([^/]+)\/([^/.]+)/);
    if (match?.[1] && match[2]) {
      const isGitLab = process.env.REPOSITORY_URL.includes("gitlab.com");
      return {
        provider: isGitLab ? "gitlab" : "github",
        owner: match[1],
        repo: match[2],
        branch: process.env.BRANCH
      };
    }
  }
  if (process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY?.includes("/")) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    return {
      provider: "github",
      owner,
      repo,
      branch: process.env.GITHUB_REF_NAME
    };
  }
  if (process.env.GITLAB_CI && process.env.CI_PROJECT_NAMESPACE && process.env.CI_PROJECT_NAME) {
    return {
      provider: "gitlab",
      owner: process.env.CI_PROJECT_NAMESPACE,
      repo: process.env.CI_PROJECT_NAME,
      branch: process.env.CI_COMMIT_BRANCH,
      instanceUrl: process.env.CI_SERVER_URL
    };
  }
  return void 0;
}
