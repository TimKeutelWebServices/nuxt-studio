import { createError, eventHandler, readBody } from 'h3'
import { useNitroApp, useRuntimeConfig } from '#imports'
import { requireStudioAuth } from '../utils/auth'
import { blob } from 'hub:blob'

// Renaming a media file in external storage.
//
// The editor talks to external media through an unstorage HTTP driver, and that
// driver knows exactly three verbs: GET, PUT and DELETE (`/__nuxt_studio/medias/**`).
// A move cannot be expressed with them, and the obvious client-side substitute —
// read, write under the new name, delete the old one — is not open to the editor
// either: for external media it holds only the *metadata* of a file and never the
// bytes, so its own PUT would write a JSON document where the image used to be.
//
// Hence a verb of its own, server-side, where the bytes actually are.

/**
 * Reduce a path the client sent (`/portraits/anna.jpg`, `portraits/anna.jpg`) to
 * the storage pathname, and refuse anything that would escape the configured
 * prefix. The values come from a browser, so this is the only guard.
 */
function blobPathname(input: string, prefix: string): string {
  const segments: string[] = []

  for (const segment of input.split('/')) {
    if (!segment || segment === '.')
      continue

    if (segment === '..') {
      throw createError({ statusCode: 400, message: `Invalid media path: ${input}` })
    }

    segments.push(segment)
  }

  if (!segments.length) {
    throw createError({ statusCode: 400, message: `Invalid media path: ${input}` })
  }

  const path = segments.join('/')

  return prefix ? `${prefix}/${path}` : path
}

export default eventHandler(async (event) => {
  await requireStudioAuth(event)

  const { prefix } = useRuntimeConfig(event).public.studio.media
  const body = await readBody<{ from?: string, to?: string }>(event)

  if (!body?.from || !body?.to) {
    throw createError({ statusCode: 400, message: 'Both "from" and "to" are required.' })
  }

  const from = blobPathname(body.from, prefix)
  const to = blobPathname(body.to, prefix)

  if (from === to) {
    return 'OK'
  }

  // The host application gets to see the move first — to refuse it (throw), or
  // to carry it out itself and say so by setting `handled`. A site that stores
  // the media key in its content needs that: there, a rename is two operations
  // in two places, and only the application knows about the second one.
  const payload = { from, to, event, handled: false }
  await useNitroApp().hooks.callHook('studio:media:move', payload)

  if (payload.handled) {
    return 'OK'
  }

  if (await blob.head(to)) {
    throw createError({ statusCode: 409, message: `A media file already exists at ${body.to}.` })
  }

  const data = await blob.get(from)
  if (!data) {
    throw createError({ statusCode: 404, message: `No media file at ${body.from}.` })
  }

  // Copy first, delete second: a failure in between costs a spare copy, whereas
  // the other order costs the file. The content type is taken from the object
  // rather than guessed from the extension.
  await blob.put(to, data, { contentType: data.type })
  await blob.del(from)

  return 'OK'
})
