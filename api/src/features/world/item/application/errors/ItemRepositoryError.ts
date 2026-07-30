export type ItemRepositoryErrorCode =
  | "schema_outdated"
  | "inventory_schema_missing"
  | "unknown"

export class ItemRepositoryError extends Error {
  constructor(
    readonly code: ItemRepositoryErrorCode,
    options?: ErrorOptions,
  ) {
    super("Falha ao acessar a persistencia de itens.", options)
    this.name = "ItemRepositoryError"
  }
}
