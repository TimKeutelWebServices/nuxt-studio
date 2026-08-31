import { createError, deleteCookie, setCookie, useSession, getRequestProtocol } from "h3";
import { defu } from "defu";
import { useRuntimeConfig } from "#imports";
import { useNitroApp } from "nitropack/runtime";
const requiredUserFields = ["name", "email"];
export async function setStudioUserSession(event, userSession) {
  const config = useRuntimeConfig(event);
  const provider = config.public.studio.repository.provider;
  const accessToken = provider === "github" ? config.studio?.git?.githubToken : provider === "gitlab" ? config.studio?.git?.gitlabToken : null;
  if (!accessToken) {
    throw createError({
      statusCode: 500,
      statusMessage: `Missing access token for ${provider} Git provider`
    });
  }
  await setInternalStudioUserSession(event, {
    ...userSession,
    provider,
    accessToken
  });
}
export async function setInternalStudioUserSession(event, user) {
  const missingFields = requiredUserFields.filter((key) => !user[key]);
  if (missingFields.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required Studio user fields: ${missingFields.join(", ")}`
    });
  }
  const session = await useSession(event, {
    name: "studio-session",
    password: useRuntimeConfig(event).studio?.auth?.sessionSecret,
    cookie: {
      // Use secure cookies over HTTPS, required for locally testing purposes
      secure: getRequestProtocol(event) === "https",
      path: "/"
    }
  });
  const payload = defu({
    user: {
      ...user
    }
  }, session.data);
  await session.update(payload);
  setCookie(event, "studio-session-check", "true", {
    httpOnly: false,
    path: "/",
    // Keep behavior consistent with the session cookie and OAuth cookies
    secure: getRequestProtocol(event) === "https",
    sameSite: "lax"
  });
  await useNitroApp().hooks.callHook("studio:auth:login", { user, event });
  return {
    ...payload,
    id: session.id
  };
}
export async function clearStudioUserSession(event) {
  const session = await useSession(event, {
    name: "studio-session",
    password: useRuntimeConfig(event).studio?.auth?.sessionSecret,
    cookie: {
      // Use secure cookies over HTTPS, required for locally testing purposes
      secure: getRequestProtocol(event) === "https",
      path: "/"
    }
  });
  const user = session.data.user;
  await session.clear();
  deleteCookie(event, "studio-session-check", { path: "/" });
  if (user) {
    await useNitroApp().hooks.callHook("studio:auth:logout", { user, event });
  }
  return { loggedOut: true };
}
