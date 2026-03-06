import { createScopedImageHandlers } from "@/presentation/api/uploads/createScopedImageHandlers"

const handlers = createScopedImageHandlers({
  folder: "rpgs",
  defaultFileName: "rpg-image.jpg",
  allowDelete: true,
})

export const POST = handlers.POST
export const DELETE = handlers.DELETE!
