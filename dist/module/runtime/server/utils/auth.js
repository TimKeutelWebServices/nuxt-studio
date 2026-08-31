import { getRandomValues } from "uncrypto";
import { getCookie, deleteCookie, setCookie, useSession, getRequestProtocol, createError } from "h3";
import { FetchError } from "ofetch";
import { useRuntimeConfig } from "#imports";
export async function requireStudioAuth(event) {
  if (import.meta.dev) {
    return;
  }
  const config = useRuntimeConfig(event);
  const session = await useSession(event, {
    name: "studio-session",
    password: config.studio?.auth?.sessionSecret,
    cookie: {
      secure: getRequestProtocol(event) === "https",
      path: "/"
    }
  });
  if (!session?.data?.user) {
    throw createError({ statusCode: 404, message: "Not found" });
  }
}
export async function requestAccessToken(url, options) {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    ...options.headers
  };
  const body = headers["Content-Type"] === "application/x-www-form-urlencoded" ? new URLSearchParams(
    options.body || options.params || {}
  ).toString() : options.body;
  return $fetch(url, {
    method: "POST",
    headers,
    body
  }).catch((error) => {
    if (error instanceof FetchError && error.status === 401) {
      return error.data;
    }
    throw error;
  });
}
export async function generateOAuthState(event) {
  const newState = getRandomBytes(32);
  setCookie(event, "studio-oauth-state", newState, {
    path: "/",
    httpOnly: true,
    // Use secure cookies over HTTPS, required for locally testing purposes
    secure: getRequestProtocol(event) === "https",
    sameSite: "lax",
    maxAge: 60 * 15
    // 15 minutes
  });
  return newState;
}
export function validateOAuthState(event, receivedState) {
  const storedState = getCookie(event, "studio-oauth-state");
  if (!storedState) {
    throw createError({
      statusCode: 400,
      message: "OAuth state cookie not found. Please try logging in again.",
      data: {
        hint: "State cookie may have expired or been cleared"
      }
    });
  }
  if (receivedState !== storedState) {
    throw createError({
      statusCode: 400,
      message: "Invalid state - OAuth state mismatch",
      data: {
        hint: "This may be caused by browser refresh, navigation, or expired session"
      }
    });
  }
  deleteCookie(event, "studio-oauth-state");
}
export async function generatePKCECodeVerifier(event) {
  const codeVerifier = getRandomBytes(32);
  setCookie(event, "studio-oauth-pkce", codeVerifier, {
    path: "/",
    httpOnly: true,
    secure: getRequestProtocol(event) === "https",
    sameSite: "lax",
    maxAge: 60 * 15
    // 15 minutes
  });
  return codeVerifier;
}
export async function generateCodeChallenge(codeVerifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return encodeBase64Url(new Uint8Array(digest));
}
export function consumePKCECodeVerifier(event) {
  const codeVerifier = getCookie(event, "studio-oauth-pkce");
  if (!codeVerifier) {
    throw createError({
      statusCode: 400,
      message: "PKCE code verifier cookie not found. Please try logging in again.",
      data: {
        hint: "Code verifier cookie may have expired or been cleared"
      }
    });
  }
  deleteCookie(event, "studio-oauth-pkce");
  return codeVerifier;
}
function getRandomBytes(size = 32) {
  return encodeBase64Url(getRandomValues(new Uint8Array(size)));
}
function encodeBase64Url(input) {
  return btoa(String.fromCharCode.apply(null, Array.from(input))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
