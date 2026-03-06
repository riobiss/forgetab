import { createScopedImageHandlers } from "@/presentation/api/uploads/createScopedImageHandlers"

const handlers = createScopedImageHandlers({
  folder: "characters",
  defaultFileName: "character-image.jpg",
  allowDelete: true,
})

export const POST = handlers.POST
export const DELETE = handlers.DELETE!
