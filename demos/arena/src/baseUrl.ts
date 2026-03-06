/** Returns the Vite base URL. Isolated for testability (import.meta is not available in Jest). */
export function getBaseUrl(): string {
    return import.meta.env.BASE_URL;
}
