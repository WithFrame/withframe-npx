export class CliHttpError extends Error {
  // Captures HTTP error details for registry/API requests.
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'CliHttpError';
  }
}
