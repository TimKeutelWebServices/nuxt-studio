import { createError, eventHandler, getRequestHeader, readRawBody, setResponseHeader } from "h3";
import { useStorage } from "#imports";
import { VIRTUAL_MEDIA_COLLECTION_NAME } from "../../../../utils/constants.js";
import { mediaItemFieldsFromKey } from "../../../../utils/media.js";
export default eventHandler(async (event) => {
  const path = event.path.replace("/__nuxt_studio/dev/public/", "");
  const key = path.replace(/\//g, ":").replace(new RegExp(`^${VIRTUAL_MEDIA_COLLECTION_NAME}:`), "");
  const storage = useStorage("nuxt_studio_public_assets");
  if (event.method === "GET") {
    const lastChar = key[key.length - 1];
    const isBaseKey = lastChar === "/" || lastChar === ":";
    if (isBaseKey) {
      const keys = await storage.getKeys(key);
      return keys.map((key2) => key2.replace(/:/g, "/"));
    }
    const item = await storage.getMeta(key);
    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: "KV value not found"
      });
    }
    return {
      ...mediaItemFieldsFromKey(key),
      version: new Date(item.mtime || /* @__PURE__ */ new Date()).getTime()
    };
  }
  if (event.method === "PUT") {
    if (getRequestHeader(event, "content-type") === "application/octet-stream") {
      const value = await readRawBody(event, false);
      await storage.setItemRaw(key, value);
    } else if (getRequestHeader(event, "content-type") === "text/plain") {
      const value = await readRawBody(event, "utf8");
      await storage.setItem(key, value);
    } else {
      const value = await readRawBody(event, "utf8");
      const json = JSON.parse(value || "{}");
      if (json.raw) {
        const data = json.raw.split(";base64,")[1];
        await storage.setItemRaw(key, Buffer.from(data, "base64"));
      } else {
        await storage.setItemRaw(key, Buffer.alloc(0));
      }
    }
    return "OK";
  }
  if (event.method === "DELETE") {
    await storage.removeItem(key);
    return "OK";
  }
});
function setMetaHeaders(event, meta) {
  if (meta.mtime) {
    setResponseHeader(
      event,
      "last-modified",
      new Date(meta.mtime).toUTCString()
    );
  }
  if (meta.ttl) {
    setResponseHeader(event, "x-ttl", `${meta.ttl}`);
    setResponseHeader(event, "cache-control", `max-age=${meta.ttl}`);
  }
}
