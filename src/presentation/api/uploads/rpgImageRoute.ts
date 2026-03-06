import { createScopedImageHandlers } from "@/presentation/api/uploads/createScopedImageHandlers"

export const { POST, DELETE } = createScopedImageHandlers({
  folder: "rpgs",
  defaultFileName: "rpg-image.jpg",
  allowDelete: true,
})
