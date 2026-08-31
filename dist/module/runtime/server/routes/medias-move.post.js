import { createError, eventHandler, readBody } from "h3";
import { useNitroApp, useRuntimeConfig } from "#imports";
import { requireStudioAuth } from "../utils/auth.js";
import { blob } from "hub:blob";
function blobPathname(input, prefix) {
  const segments = [];
  for (const segment of input.split("/")) {
    if (!segment || segment === ".")
      continue;
    if (segment === "..") {
      throw createError({ statusCode: 400, message: `Invalid media path: ${input}` });
    }
    segments.push(segment);
  }
  if (!segments.length) {
    throw createError({ statusCode: 400, message: `Invalid media path: ${input}` });
  }
  const path = segments.join("/");
  return prefix ? `${prefix}/${path}` : path;
}
export default eventHandler(async (event) => {
  await requireStudioAuth(event);
  const { prefix } = useRuntimeConfig(event).public.studio.media;
  const body = await readBody(event);
  if (!body?.from || !body?.to) {
    throw createError({ statusCode: 400, message: 'Both "from" and "to" are required.' });
  }
  const from = blobPathname(body.from, prefix);
  const to = blobPathname(body.to, prefix);
  if (from === to) {
    return "OK";
  }
  const payload = { from, to, event, handled: false };
  await useNitroApp().hooks.callHook("studio:media:move", payload);
  if (payload.handled) {
    return "OK";
  }
  if (await blob.head(to)) {
    throw createError({ statusCode: 409, message: `A media file already exists at ${body.to}.` });
  }
  const data = await blob.get(from);
  if (!data) {
    throw createError({ statusCode: 404, message: `No media file at ${body.from}.` });
  }
  await blob.put(to, data, { contentType: data.type });
  await blob.del(from);
  return "OK";
});
