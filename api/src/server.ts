import { startApiServer } from "@api/app"

void startApiServer().catch((error) => {
  console.error("Failed to start Forgetab API", error)
  process.exit(1)
})
