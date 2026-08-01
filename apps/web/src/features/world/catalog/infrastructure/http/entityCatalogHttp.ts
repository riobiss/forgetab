export class HttpEntityCatalogError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpEntityCatalogError"
  }
}

export async function parseEntityCatalogResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }

  if (!response.ok) {
    throw new HttpEntityCatalogError(
      payload.message ?? fallbackMessage,
      response.status,
    )
  }

  return payload
}
