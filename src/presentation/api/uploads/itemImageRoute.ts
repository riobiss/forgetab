import { createScopedImageHandlers } from "@/presentation/api/uploads/createScopedImageHandlers"

const handlers = createScopedImageHandlers({
  folder: "items",
  defaultFileName: "item-image.jpg",
  allowDelete: true,
})

export const POST = handlers.POST
export const DELETE = handlers.DELETE!
