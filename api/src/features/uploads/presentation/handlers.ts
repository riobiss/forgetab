import { createScopedImageHandlers } from "./createScopedImageHandlers"
import { scopedImageHandlerDependencies } from "./dependencies"

export const characterImageHandlers = createScopedImageHandlers(
  {
    folder: "characters",
    defaultFileName: "character-image.jpg",
    allowDelete: true
  },
  scopedImageHandlerDependencies
)

export const itemImageHandlers = createScopedImageHandlers(
  {
    folder: "items",
    defaultFileName: "item-image.jpg",
    allowDelete: true
  },
  scopedImageHandlerDependencies
)

export const libraryImageHandlers = createScopedImageHandlers(
  {
    folder: "library",
    defaultFileName: "library-image.jpg",
    allowDelete: false
  },
  scopedImageHandlerDependencies
)

export const mapImageHandlers = createScopedImageHandlers(
  {
    folder: "maps",
    defaultFileName: "map-image.jpg",
    allowDelete: true
  },
  scopedImageHandlerDependencies
)

export const markerImageHandlers = createScopedImageHandlers(
  {
    folder: "markers",
    defaultFileName: "marker-image.jpg",
    allowDelete: true
  },
  scopedImageHandlerDependencies
)

export const profileImageHandlers = createScopedImageHandlers(
  {
    folder: "profiles",
    defaultFileName: "profile-image.png",
    allowDelete: true
  },
  scopedImageHandlerDependencies
)

export const rpgImageHandlers = createScopedImageHandlers(
  {
    folder: "rpgs",
    defaultFileName: "rpg-image.jpg",
    allowDelete: true
  },
  scopedImageHandlerDependencies
)

export const sectionImageHandlers = createScopedImageHandlers(
  {
    folder: "sections",
    defaultFileName: "section-image.jpg",
    allowDelete: true
  },
  scopedImageHandlerDependencies
)
