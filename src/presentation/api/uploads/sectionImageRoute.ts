import { createScopedImageHandlers } from "@/presentation/api/uploads/createScopedImageHandlers"

const handlers = createScopedImageHandlers({
  folder: "sections",
  defaultFileName: "section-image.jpg",
  allowDelete: true,
})

export const POST = handlers.POST
export const DELETE = handlers.DELETE!
