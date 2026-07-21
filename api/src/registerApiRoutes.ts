import type { FastifyInstance } from "fastify"
import { itemRoutes } from "./features/world/item/presentation/routes/routes"
import { skillRoutes } from "./features/world/skill/presentation/routes/routes"
import { profileRoutes } from "./features/profile/presentation/routes/routes"
import { locationRoutes } from "./features/world/location/presentation/routes/routes"
import { libraryRoutes } from "./features/world/library/presentation/routes/routes"
import { worldRoutes } from "./features/world/presentation/routes/routes"
import { characterRoutes } from "./features/world/character/presentation/routes/routes"
import { memberShipRoutes } from "./features/world/member-ship/presentation/routes/routes"
import { catalogRoutes } from "./features/world/catalog/presentation/routes/routes"
import { uploadsRoutes } from "./features/uploads/presentation/routes/routes"
import { authRoutes } from "./features/auth/presentation/routes/routes"
import { dicesRoutes } from "./features/dices/presentation/routes/routes"

export function registerApiRoutes(app: FastifyInstance) {
  uploadsRoutes(app)
  authRoutes(app)
  dicesRoutes(app)
  profileRoutes(app)
  worldRoutes(app)
  characterRoutes(app)
  itemRoutes(app)
  skillRoutes(app)
  locationRoutes(app)
  libraryRoutes(app)
  memberShipRoutes(app)
  catalogRoutes(app)
}
