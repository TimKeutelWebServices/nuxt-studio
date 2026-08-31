import { createError, eventHandler, getRequestURL, setResponseHeader } from "h3";
import { requireStudioAuth } from "../../utils/auth.js";
import { DAY_IN_SECONDS, IPX_PREFIX, getContentTypeFromPath, getIpx, getOriginalImage, isIpxProcessable, parseIpxPath, requireAllowedDomain } from "../../utils/media/ipx.js";
export default eventHandler(async (event) => {
  await requireStudioAuth(event);
  const url = getRequestURL(event);
  if (!url.pathname.startsWith(`${IPX_PREFIX}/`)) {
    return;
  }
  const parsed = parseIpxPath(url.pathname);
  if (!parsed) {
    return;
  }
  const domain = requireAllowedDomain(parsed.id);
  const originUrl = url.origin;
  if (!isIpxProcessable(parsed.id)) {
    const originalData = await getOriginalImage(parsed.id, originUrl);
    if (!originalData) {
      throw createError({ message: "Image not found", statusCode: 404 });
    }
    const contentType = getContentTypeFromPath(parsed.id);
    if (contentType) {
      setResponseHeader(event, "content-type", contentType);
    }
    setResponseHeader(event, "cache-control", `public, max-age=${DAY_IN_SECONDS}, s-maxage=${DAY_IN_SECONDS}`);
    return originalData;
  }
  const ipx = await getIpx(domain, originUrl);
  let data;
  let format;
  if (ipx) {
    const image = ipx(parsed.id, parsed.modifiers);
    try {
      const result = await image.process();
      data = result.data;
      format = result.format;
    } catch (error) {
      const fallbackData = await getOriginalImage(parsed.id, originUrl);
      if (!fallbackData) {
        throw error;
      }
      data = fallbackData;
    }
  } else {
    const fallbackData = await getOriginalImage(parsed.id, originUrl);
    if (!fallbackData) {
      throw createError({ message: "Image not found", statusCode: 404 });
    }
    data = fallbackData;
  }
  if (format) {
    setResponseHeader(event, "content-type", `image/${format}`);
  } else {
    const contentType = getContentTypeFromPath(parsed.id);
    if (contentType) {
      setResponseHeader(event, "content-type", contentType);
    }
  }
  setResponseHeader(event, "cache-control", `public, max-age=${DAY_IN_SECONDS}, s-maxage=${DAY_IN_SECONDS}`);
  return data;
});
