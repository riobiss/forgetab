import type { FastifyInstance } from "fastify"
import { itemRoutes } from "./features/world/item/presentation/routes/routes"
import { skillRoutes } from "./features/world/skill/presentation/routes/routes"
import { profileRoutes } from "./features/profile/presentation/routes/routes"
import { locationRoutes } from "./features/world/location/presentation/routes/routes"
import { libraryRoutes } from "./features/world/library/presentation/routes/routes"
import { worldRoutes } from "./features/world/presentation/routes/routes"
import { configRoutes } from "./features/world/presentation/routes/config.routes"
import { characterRoutes } from "./features/world/character/presentation/routes/routes"
import { memberShipRoutes } from "./features/world/presentation/membership/routes/routes"
import { catalogRoutes } from "./features/world/catalog/presentation/routes/routes"
import { mediaRoutes } from "./features/media/presentation/routes/routes"
import { authRoutes } from "./features/auth/presentation/routes/routes"
import { dicesRoutes } from "./features/dices/presentation/routes/routes"
import { httpRoutes } from "./features/http/presentation/routes/routes"
import { offlineRoutes } from "./features/offline/presentation/routes/routes"
import { notesRoutes } from "./features/world/notes/presentation/routes/routes"

export function registerApiRoutes(app: FastifyInstance) {
  httpRoutes(app)
  mediaRoutes(app)
  authRoutes(app)
  dicesRoutes(app)
  profileRoutes(app)
  offlineRoutes(app)
  worldRoutes(app)
  configRoutes(app)
  characterRoutes(app)
  itemRoutes(app)
  skillRoutes(app)
  locationRoutes(app)
  libraryRoutes(app)
  notesRoutes(app)
  memberShipRoutes(app)
  catalogRoutes(app)
}
