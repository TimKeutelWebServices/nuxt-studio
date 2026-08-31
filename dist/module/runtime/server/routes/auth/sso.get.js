import { useRuntimeConfig } from "#imports";
import { createError, deleteCookie, eventHandler, getCookie, getQuery, getRequestURL, sendRedirect } from "h3";
import { withQuery } from "ufo";
import { consumePKCECodeVerifier, generateCodeChallenge, generateOAuthState, generatePKCECodeVerifier, requestAccessToken, validateOAuthState } from "../../utils/auth.js";
import { setInternalStudioUserSession } from "../../utils/session.js";
import { mergeConfig } from "../../utils/object.js";
export default eventHandler(async (event) => {
  const studioConfig = useRuntimeConfig(event).studio;
  const config = mergeConfig(studioConfig?.auth?.sso, {});
  const query = getQuery(event);
  if (query.error) {
    throw createError({
      statusCode: 401,
      message: `SSO login failed: ${query.error_description || query.error || "Unknown error"}`,
      data: query
    });
  }
  if (!config.serverUrl || !config.clientId || !config.clientSecret) {
    throw createError({
      statusCode: 500,
      message: "Missing SSO server URL, client ID, or client secret. Set NUXT_STUDIO_AUTH_SSO_SERVER_URL, NUXT_STUDIO_AUTH_SSO_CLIENT_ID, and NUXT_STUDIO_AUTH_SSO_CLIENT_SECRET.",
      data: config
    });
  }
  const serverUrl = config.serverUrl.replace(/\/$/, "");
  const requestURL = getRequestURL(event);
  config.redirectURL = config.redirectURL || `${requestURL.protocol}//${requestURL.host}${requestURL.pathname}`;
  if (!query.code) {
    const state = await generateOAuthState(event);
    const codeVerifier2 = await generatePKCECodeVerifier(event);
    const codeChallenge = await generateCodeChallenge(codeVerifier2);
    return sendRedirect(
      event,
      withQuery(`${serverUrl}/oauth/authorize`, {
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: config.redirectURL,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256"
      })
    );
  }
  validateOAuthState(event, query.state);
  const codeVerifier = consumePKCECodeVerifier(event);
  const provider = studioConfig?.repository.provider;
  const token = await requestAccessToken(`${serverUrl}/oauth/token`, {
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      grant_type: "authorization_code",
      code: query.code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectURL,
      code_verifier: codeVerifier
    }
  });
  if (token.error || !token.access_token) {
    throw createError({
      statusCode: 500,
      message: `Failed to get access token: ${token.error_description || token.error || "Unknown error"}`,
      data: token
    });
  }
  const user = await $fetch(
    `${serverUrl}/oauth/userinfo`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    }
  );
  if (!user.email) {
    throw createError({
      statusCode: 500,
      message: "Could not get user email from SSO server",
      data: user
    });
  }
  let repositoryToken;
  if (provider === "github" && user.github_token) {
    repositoryToken = user.github_token;
  } else if (provider === "github") {
    repositoryToken = studioConfig?.git?.githubToken;
  } else if (provider === "gitlab") {
    repositoryToken = studioConfig?.git?.gitlabToken;
  }
  if (provider === "github" && !repositoryToken) {
    throw createError({
      statusCode: 500,
      message: "No GitHub token available. Make sure to login with GitHub on the SSO server."
    });
  }
  if (provider === "gitlab" && !repositoryToken) {
    throw createError({
      statusCode: 500,
      message: "`NUXT_STUDIO_GIT_GITLAB_TOKEN` is not set. SSO authenticated users cannot push changes to the repository without a valid GitLab token."
    });
  }
  await setInternalStudioUserSession(event, {
    providerId: user.sub,
    accessToken: repositoryToken,
    name: user.name,
    avatar: user.picture,
    email: user.email,
    provider: user.git_provider || "github"
    // Use the git provider from SSO, default to github
  });
  const redirect = decodeURIComponent(getCookie(event, "studio-redirect") || "");
  deleteCookie(event, "studio-redirect");
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return sendRedirect(event, redirect);
  }
  return sendRedirect(event, "/");
});
