import { parseApiResponse } from "@/features/http/infrastructure/parseApiResponse"

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
  return parseApiResponse<T>(response, {
    fallbackMessage,
    errorFactory: (message, status) =>
      new HttpEntityCatalogError(message, status),
  })
}
