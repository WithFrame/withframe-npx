import { CliHttpError } from '@/lib/errors';
import { isString } from './type-guards';

// Parses response text as JSON when possible, otherwise returns raw text.
const parseResponsePayload = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

// Extracts a user-friendly error message from an API payload.
const resolveErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const message = (payload as { message?: unknown }).message;
  return isString(message) && message.trim() ? message : fallback;
};

// Sends an HTTP request and returns JSON or throws a structured HTTP error.
export const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new CliHttpError(
      resolveErrorMessage(payload, `Request failed with status ${response.status}`),
      response.status,
      payload,
    );
  }

  return payload as T;
};
