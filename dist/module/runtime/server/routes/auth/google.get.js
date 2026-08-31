import { useRuntimeConfig } from "#imports";
import { consola } from "consola";
import { createError, deleteCookie, eventHandler, getCookie, getQuery, getRequestURL, sendRedirect } from "h3";
import { withQuery } from "ufo";
import { generateOAuthState, requestAccessToken, validateOAuthState } from "../../utils/auth.js";
import { setInternalStudioUserSession } from "../../utils/session.js";
import { mergeConfig } from "../../utils/object.js";
const logger = consola.withTag("Nuxt Studio");
export default eventHandler(async (event) => {
  const studioConfig = useRuntimeConfig(event).studio;
  const config = mergeConfig(studioConfig?.auth?.google, {
    authorizationURL: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenURL: "https://oauth2.googleapis.com/token",
    userURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    authorizationParams: {},
    emailRequired: true
  });
  const query = getQuery(event);
  if (query.error) {
    throw createError({
      statusCode: 401,
      message: `Google login failed: ${query.error || "Unknown error"}`,
      data: query
    });
  }
  if (!config.clientId || !config.clientSecret) {
    throw createError({
      statusCode: 500,
      message: "Missing Google client ID or secret",
      data: config
    });
  }
  const requestURL = getRequestURL(event);
  config.redirectURL = config.redirectURL || `${requestURL.protocol}//${requestURL.host}${requestURL.pathname}`;
  if (!query.code) {
    const state = await generateOAuthState(event);
    config.scope = config.scope || ["email", "profile"];
    return sendRedirect(
      event,
      withQuery(config.authorizationURL, {
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: config.redirectURL,
        scope: config.scope.join(" "),
        state,
        ...config.authorizationParams
      })
    );
  }
  validateOAuthState(event, query.state);
  const provider = studioConfig?.repository.provider;
  const repositoryToken = provider === "github" ? studioConfig?.git?.githubToken : studioConfig?.git?.gitlabToken;
  if (provider === "github" && !repositoryToken) {
    throw createError({
      statusCode: 500,
      message: "`NUXT_STUDIO_GIT_GITHUB_TOKEN` is not set. Google authenticated users cannot push changes to the repository without a valid GitHub token."
    });
  }
  if (provider === "gitlab" && !repositoryToken) {
    throw createError({
      statusCode: 500,
      message: "`NUXT_STUDIO_GIT_GITLAB_TOKEN` is not set. Google authenticated users cannot push changes to the repository without a valid GitLab token."
    });
  }
  const token = await requestAccessToken(config.tokenURL, {
    body: {
      grant_type: "authorization_code",
      code: query.code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectURL
    }
  });
  if (token.error || !token.access_token) {
    throw createError({
      statusCode: 500,
      message: "Failed to get access token",
      data: token
    });
  }
  const accessToken = token.access_token;
  const user = await $fetch(
    config.userURL,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  if (!user.email && config.emailRequired) {
    throw createError({
      statusCode: 500,
      message: "Could not get Google user email",
      data: user
    });
  }
  const moderators = studioConfig?.auth?.google?.moderators?.split(",").filter(Boolean) || [];
  if (!moderators.includes(user.email)) {
    if (import.meta.dev && moderators.length === 0) {
      logger.warn([
        "No moderators defined. Moderators are required for Google authentication.",
        "Please set the `NUXT_STUDIO_AUTH_GOOGLE_MODERATORS` environment variable to a comma-separated list of email addresses of the moderators."
      ].join("\n"));
    }
    throw createError({
      statusCode: 403,
      message: "You are not authorized to access the studio"
    });
  }
  await setInternalStudioUserSession(event, {
    providerId: String(user.sub).toString(),
    accessToken: repositoryToken,
    name: user.name || `${user.given_name || ""} ${user.family_name || ""}`.trim(),
    avatar: user.picture,
    email: user.email,
    provider: "google"
  });
  const redirect = decodeURIComponent(getCookie(event, "studio-redirect") || "");
  deleteCookie(event, "studio-redirect");
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return sendRedirect(event, redirect);
  }
  return sendRedirect(event, "/");
});
