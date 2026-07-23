export type JsonPrimitive = string | number | boolean | null
export type JsonObject = Record<string, unknown>
export type JsonArray = unknown[]
export type JsonValue = JsonPrimitive | JsonObject | JsonArray
