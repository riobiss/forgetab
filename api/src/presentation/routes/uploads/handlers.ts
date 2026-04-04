import { createScopedImageHandlers } from "./createScopedImageHandlers"

export const characterImageHandlers = createScopedImageHandlers({
  folder: "characters",
  defaultFileName: "character-image.jpg",
  allowDelete: true,
})

export const itemImageHandlers = createScopedImageHandlers({
  folder: "items",
  defaultFileName: "item-image.jpg",
  allowDelete: true,
})

export const libraryImageHandlers = createScopedImageHandlers({
  folder: "library",
  defaultFileName: "library-image.jpg",
  allowDelete: false,
})

export const mapImageHandlers = createScopedImageHandlers({
  folder: "maps",
  defaultFileName: "map-image.jpg",
  allowDelete: true,
})

export const markerImageHandlers = createScopedImageHandlers({
  folder: "markers",
  defaultFileName: "marker-image.jpg",
  allowDelete: true,
})

export const rpgImageHandlers = createScopedImageHandlers({
  folder: "rpgs",
  defaultFileName: "rpg-image.jpg",
  allowDelete: true,
})

export const sectionImageHandlers = createScopedImageHandlers({
  folder: "sections",
  defaultFileName: "section-image.jpg",
  allowDelete: true,
})
