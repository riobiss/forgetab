import { createScopedImageHandlers } from "@/presentation/api/uploads/createScopedImageHandlers"

const handlers = createScopedImageHandlers({
  folder: "markers",
  defaultFileName: "marker-image.jpg",
  allowDelete: true,
})

export const POST = handlers.POST
export const DELETE = handlers.DELETE!
