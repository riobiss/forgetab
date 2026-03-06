import { createScopedImageHandlers } from "@/presentation/api/uploads/createScopedImageHandlers"

export const { POST } = createScopedImageHandlers({
  folder: "library",
  defaultFileName: "library-image.jpg",
  allowDelete: false,
})
