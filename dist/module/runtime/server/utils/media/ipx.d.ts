export declare const IPX_PREFIX = "/__nuxt_studio/ipx";
export declare const DAY_IN_SECONDS: number;
export declare const publicDir: string;
type IpxHandler = (id: string, modifiers?: Record<string, string>) => {
    process: () => Promise<{
        data: Buffer | string;
        format?: string;
    }>;
};
export declare function requireAllowedDomain(id: string): string | undefined;
/**
 * Returns an IPX instance for processing images.
 *
 * - External media: uses HTTP storage restricted to the configured CDN domain.
 * - Production (non-dev, non-external): uses HTTP storage fetching from the same
 *   server origin, which avoids filesystem path issues on serverless platforms
 *   (e.g. Vercel) where the build-time publicDir no longer exists at runtime.
 * - Dev mode: uses local filesystem storage for instant local edits.
 *
 * @param domain - Allowed CDN domain for external media mode.
 * @param originUrl - Current request origin (e.g. `https://mysite.com`). When
 *   provided in non-external mode, enables the same-origin HTTP storage path.
 * @returns An IPX handler when the optional dependency is available, otherwise `null`.
 * @example
 * await getIpx('cdn.example.com', 'https://example.com')
 */
export declare function getIpx(domain?: string, originUrl?: string): Promise<IpxHandler | null>;
export declare function isIpxProcessable(id: string): boolean;
export declare function getContentTypeFromPath(path: string): "image/svg+xml" | "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif" | "image/x-icon" | null;
export declare function getOriginalImage(id: string, originUrl?: string): Promise<Buffer | null>;
export declare function getOriginalExternalImage(id: string): Promise<Buffer | null>;
/**
 * Fetches a public asset by constructing an HTTP URL from the server origin.
 * Used as a fallback in production when the local filesystem path is unavailable
 * (e.g. serverless deployments where the build-time publicDir no longer exists).
 *
 * @param id - Relative file path (e.g. `images/photo.jpg`)
 * @param originUrl - Current request origin (e.g. `https://mysite.com`)
 * @returns The original file contents when found, otherwise `null`.
 * @example
 * await getOriginalHttpImage('images/photo.jpg', 'https://example.com')
 */
export declare function getOriginalHttpImage(id: string, originUrl: string): Promise<Buffer | null>;
export declare function getOriginalFsImage(id: string): Promise<NonSharedBuffer | null>;
export declare function parseIpxPath(pathname: string): {
    id: string;
    modifiers: Record<string, string>;
} | null;
export {};
