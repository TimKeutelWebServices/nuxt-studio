import { createError } from "h3";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { hasProtocol, parseURL } from "ufo";
import { useRuntimeConfig } from "#imports";
export const IPX_PREFIX = "/__nuxt_studio/ipx";
export const DAY_IN_SECONDS = 60 * 60 * 24;
const mediaConfig = useRuntimeConfig().public.studio.media;
const studioConfig = useRuntimeConfig().public.studio;
const resolvedPublicUrl = mediaConfig.publicUrl || "";
export const publicDir = resolvedPublicUrl;
let cachedIpx;
let cachedIpxModule;
const ipxByOrigin = /* @__PURE__ */ new Map();
function createSameOriginStorage(origin) {
  return {
    name: "same-origin",
    async getMeta(id) {
      const url = `${origin}/${id.replace(/^\/+/, "")}`;
      const response = await fetch(url, { method: "HEAD" });
      if (!response.ok) return void 0;
      const lastModified = response.headers.get("last-modified");
      return {
        mtime: lastModified ? new Date(lastModified) : void 0,
        maxAge: DAY_IN_SECONDS
      };
    },
    async getData(id) {
      const url = `${origin}/${id.replace(/^\/+/, "")}`;
      const response = await fetch(url);
      if (!response.ok) return void 0;
      return response.arrayBuffer();
    }
  };
}
async function loadIpxModule() {
  if (!cachedIpxModule) {
    cachedIpxModule = (async () => {
      try {
        const ipxModuleId = "ipx";
        return await import(
          /* @vite-ignore */
          ipxModuleId
        );
      } catch {
        return null;
      }
    })();
  }
  return cachedIpxModule;
}
export function requireAllowedDomain(id) {
  if (!mediaConfig.external) return void 0;
  const configuredDomain = parseURL(resolvedPublicUrl).host;
  const requestDomain = parseURL(id).host;
  if (configuredDomain && requestDomain !== configuredDomain) {
    throw createError({ statusCode: 403, statusMessage: "IPX_FORBIDDEN_DOMAIN" });
  }
  return requestDomain || configuredDomain || void 0;
}
export async function getIpx(domain, originUrl) {
  const ipxModule = await loadIpxModule();
  if (!ipxModule) {
    cachedIpx = null;
    return null;
  }
  const { createIPX, ipxFSStorage, ipxHttpStorage } = ipxModule;
  if (mediaConfig.external) {
    if (cachedIpx === void 0) {
      cachedIpx = createIPX({
        storage: {},
        httpStorage: ipxHttpStorage({ domains: domain ? [domain] : [] }),
        maxAge: DAY_IN_SECONDS
      });
    }
    return cachedIpx;
  }
  if (originUrl && !studioConfig.dev) {
    const cached = ipxByOrigin.get(originUrl);
    if (cached) return cached;
    const ipx = createIPX({
      storage: createSameOriginStorage(originUrl),
      maxAge: DAY_IN_SECONDS
    });
    ipxByOrigin.set(originUrl, ipx);
    return ipx;
  }
  if (!cachedIpx) {
    cachedIpx = createIPX({
      storage: ipxFSStorage({ dir: publicDir }),
      maxAge: DAY_IN_SECONDS
    });
  }
  return cachedIpx;
}
const RASTER_EXTENSIONS = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"]);
export function isIpxProcessable(id) {
  return RASTER_EXTENSIONS.has(extname(id).toLowerCase());
}
export function getContentTypeFromPath(path) {
  const extension = extname(path).toLowerCase();
  if (extension === ".ico") return "image/x-icon";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  if (extension === ".avif") return "image/avif";
  return null;
}
export async function getOriginalImage(id, originUrl) {
  if (hasProtocol(id)) return getOriginalExternalImage(id);
  if (originUrl && !studioConfig.dev) return getOriginalHttpImage(id, originUrl);
  return getOriginalFsImage(id);
}
export async function getOriginalExternalImage(id) {
  try {
    const response = await fetch(id);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}
export async function getOriginalHttpImage(id, originUrl) {
  try {
    const url = `${originUrl}/${id.replace(/^\/+/, "")}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}
export async function getOriginalFsImage(id) {
  if (hasProtocol(id)) {
    return null;
  }
  const normalizedId = id.replace(/^\/+/, "");
  if (!normalizedId) {
    return null;
  }
  const absolutePath = resolve(publicDir, normalizedId);
  if (!absolutePath.startsWith(`${publicDir}/`) && absolutePath !== publicDir) {
    return null;
  }
  try {
    return await readFile(absolutePath);
  } catch {
    return null;
  }
}
export function parseIpxPath(pathname) {
  const relativePath = pathname.slice(IPX_PREFIX.length).replace(/^\/+/, "");
  if (!relativePath) {
    return null;
  }
  const [modifiersString, ...idSegments] = relativePath.split("/");
  if (!modifiersString) {
    throw createError({
      statusCode: 400,
      statusMessage: "IPX_MISSING_MODIFIERS",
      message: "IPX modifiers are required."
    });
  }
  const id = decodeURIComponent(idSegments.join("/")).replace(/^(https?:\/)([^/])/, "$1/$2");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "IPX_MISSING_ID",
      message: "IPX resource id is required."
    });
  }
  const modifiers = {};
  if (modifiersString !== "_") {
    for (const rawModifier of modifiersString.split(/[&,]/g)) {
      const [key, ...values] = rawModifier.split(/[:=_]/);
      if (!key) {
        continue;
      }
      modifiers[key] = values.map((value) => decodeURIComponent(value)).join("_");
    }
  }
  return { id, modifiers };
}
