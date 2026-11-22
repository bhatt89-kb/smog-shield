/**
 * Safely reads a response body as JSON without throwing on empty or invalid JSON.
 * Returns null instead of throwing, making error handling easier.
 * 
 * @template T - Expected response type
 * @param {Response} res - Fetch API Response object
 * @returns {Promise<T | null>} Parsed JSON or null if empty/invalid
 * 
 * @example
 * const response = await fetch('/api/data');
 * const data = await readJson<{ message: string }>(response);
 * if (data) {
 *   console.log(data.message);
 * }
 */
export async function readJson<T = unknown>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Safely stringifies JSON with error handling.
 * 
 * @param {unknown} data - Data to stringify
 * @returns {string | null} JSON string or null if serialization fails
 */
export function safeStringify(data: unknown): string | null {
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}