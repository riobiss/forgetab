import { createScopedImageHandlers } from "@/presentation/api/uploads/createScopedImageHandlers"

export const { POST, DELETE } = createScopedImageHandlers({
  folder: "characters",
  defaultFileName: "character-image.jpg",
  allowDelete: true,
})
