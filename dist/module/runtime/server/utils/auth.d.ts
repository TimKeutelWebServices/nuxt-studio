import { type H3Event } from 'h3';
export declare function requireStudioAuth(event: H3Event): Promise<void>;
export interface RequestAccessTokenResponse {
    access_token?: string;
    scope?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
    error_uri?: string;
}
export interface RequestAccessTokenOptions {
    headers?: Record<string, string>;
    body?: Record<string, string>;
    params?: Record<string, string>;
}
export declare function requestAccessToken(url: string, options: RequestAccessTokenOptions): Promise<RequestAccessTokenResponse>;
export declare function generateOAuthState(event: H3Event): Promise<string>;
export declare function validateOAuthState(event: H3Event, receivedState: string): void;
/**
 * PKCE (Proof Key for Code Exchange) helpers for OAuth flows (RFC 7636).
 * Generates a code_verifier, stores it in an HTTP-only cookie, and derives
 * the corresponding code_challenge using the S256 method.
 */
export declare function generatePKCECodeVerifier(event: H3Event): Promise<string>;
export declare function generateCodeChallenge(codeVerifier: string): Promise<string>;
export declare function consumePKCECodeVerifier(event: H3Event): string;
