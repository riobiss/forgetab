import { createScopedImageHandlers } from "@/presentation/api/uploads/createScopedImageHandlers"

export const { POST, DELETE } = createScopedImageHandlers({
  folder: "maps",
  defaultFileName: "map-image.jpg",
  allowDelete: true,
})
