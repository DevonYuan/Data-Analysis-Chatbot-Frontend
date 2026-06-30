/**
 * Thrown by any API helper when the server responds with HTTP 429.
 * Callers can use `instanceof RateLimitError` to distinguish rate-limit
 * failures from generic network/server errors.
 */
export class RateLimitError extends Error {
    constructor(message) {
        super(message);
        this.name = "RateLimitError";
    }
}
