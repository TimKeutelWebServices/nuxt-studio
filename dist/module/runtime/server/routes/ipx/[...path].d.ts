/**
 * Serve optimized thumbnails for Studio media picker using IPX.
 * Falls back to serving original (unoptimized) images when IPX is unavailable
 * (e.g. on platforms like Cloudflare Workers where sharp is not supported).
 * URL format: /__nuxt_studio/ipx/<modifiers>/<source-path>
 */
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<string | Buffer<ArrayBufferLike> | undefined>>;
export default _default;
