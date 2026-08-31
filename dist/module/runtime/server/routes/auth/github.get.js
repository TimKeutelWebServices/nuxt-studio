import { useRuntimeConfig } from "#imports";
import { createError, deleteCookie, eventHandler, getCookie, getQuery, getRequestURL, sendRedirect } from "h3";
import { withQuery, withoutTrailingSlash } from "ufo";
import { generateOAuthState, requestAccessToken, validateOAuthState } from "../../utils/auth.js";
import { setInternalStudioUserSession } from "../../utils/session.js";
import { mergeConfig } from "../../utils/object.js";
export default eventHandler(async (event) => {
  const studioConfig = useRuntimeConfig(event).studio;
  const instanceUrl = withoutTrailingSlash(studioConfig?.auth?.github?.instanceUrl || studioConfig?.repository?.instanceUrl || "https://github.com");
  const isEnterprise = new URL(instanceUrl).hostname !== "github.com";
  const config = mergeConfig(studioConfig?.auth?.github, {
    instanceUrl,
    authorizationURL: `${instanceUrl}/login/oauth/authorize`,
    tokenURL: `${instanceUrl}/login/oauth/access_token`,
    apiURL: isEnterprise ? `${instanceUrl}/api/v3` : "https://api.github.com",
    authorizationParams: {},
    emailRequired: true
  });
  const query = getQuery(event);
  if (query.error) {
    throw createError({
      statusCode: 401,
      message: `GitHub login failed: ${query.error || "Unknown error"}`,
      data: query
    });
  }
  if (!config.clientId || !config.clientSecret) {
    throw createError({
      statusCode: 500,
      message: "Missing GitHub client ID or secret",
      data: config
    });
  }
  const requestURL = getRequestURL(event);
  config.redirectURL = config.redirectURL || `${requestURL.protocol}//${requestURL.host}${requestURL.pathname}`;
  if (!query.code) {
    const state = await generateOAuthState(event);
    config.scope = config.scope || [];
    if (config.emailRequired && !config.scope.includes("user:email")) {
      config.scope.push("user:email");
    }
    if (config.emailRequired && !config.scope.includes("repo") && !config.scope.includes("public_repo")) {
      config.scope.push(studioConfig.repository.private ? "repo" : "public_repo");
    }
    return sendRedirect(
      event,
      withQuery(config.authorizationURL, {
        client_id: config.clientId,
        redirect_uri: config.redirectURL,
        scope: config.scope.join(" "),
        state,
        ...config.authorizationParams
      })
    );
  }
  validateOAuthState(event, query.state);
  if (studioConfig.repository.provider !== "github") {
    throw createError({
      statusCode: 500,
      message: "GitHub Oauth provider only supports GitHub repository provider"
    });
  }
  const token = await requestAccessToken(config.tokenURL, {
    body: {
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectURL,
      code: query.code
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
  const user = await $fetch(`${config.apiURL}/user`, {
    headers: {
      "User-Agent": `Github-OAuth-${config.clientId}`,
      "Authorization": `token ${accessToken}`
    }
  });
  if (!user.email && config.emailRequired) {
    const emails = await $fetch(`${config.apiURL}/user/emails`, {
      headers: {
        "User-Agent": `Github-OAuth-${config.clientId}`,
        "Authorization": `token ${accessToken}`
      }
    });
    const primaryEmail = emails.find((email) => email.primary);
    if (!primaryEmail) {
      throw createError({
        statusCode: 500,
        message: "Could not get GitHub user email",
        data: token
      });
    }
    user.email = primaryEmail.email;
  }
  const moderators = studioConfig?.auth?.github?.moderators?.split(",").filter(Boolean) || [];
  if (moderators.length > 0 && !moderators.includes(String(user.email))) {
    throw createError({
      statusCode: 403,
      message: "You are not authorized to access the studio"
    });
  }
  await setInternalStudioUserSession(event, {
    providerId: user.id.toString(),
    accessToken: token.access_token,
    name: user.name || user.login,
    avatar: user.avatar_url,
    email: user.email,
    provider: "github"
  });
  const redirect = decodeURIComponent(getCookie(event, "studio-redirect") || "");
  deleteCookie(event, "studio-redirect");
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return sendRedirect(event, redirect);
  }
  return sendRedirect(event, "/");
});
