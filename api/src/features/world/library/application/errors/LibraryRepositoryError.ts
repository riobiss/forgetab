export type LibraryRepositoryErrorCode = "schema_outdated" | "unknown"

export class LibraryRepositoryError extends Error {
  constructor(
    readonly code: LibraryRepositoryErrorCode,
    options?: ErrorOptions,
  ) {
    super("Falha ao acessar a persistencia da biblioteca.", options)
    this.name = "LibraryRepositoryError"
  }
}
