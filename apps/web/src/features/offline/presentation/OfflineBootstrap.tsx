"use client"

import { useEffect } from "react"
import { synchronizeOfflineSnapshotUseCase } from "@/features/offline/application/use-cases/offlineSnapshot"
import { offlineDependencies } from "./dependencies"

function collectImageUrls(
  snapshot: Awaited<ReturnType<typeof synchronizeOfflineSnapshotUseCase>>
) {
  return snapshot.campaigns
    .flatMap((campaign) => [
      campaign.image,
      ...campaign.characters.flatMap((character) => [
        character.image,
        ...character.inventory.map((item) => item.itemImage)
      ])
    ])
    .filter((url): url is string => Boolean(url))
}

export default function OfflineBootstrap() {
  useEffect(() => {
    let disposed = false

    const prepareOfflineMode = async () => {
      if (!("serviceWorker" in navigator)) return

      const registration = await navigator.serviceWorker.register("/sw.js")
      if (!navigator.onLine || disposed) return

      const snapshot =
        await synchronizeOfflineSnapshotUseCase(offlineDependencies)
      const worker =
        registration.active ?? registration.waiting ?? registration.installing
      worker?.postMessage({
        type: "CACHE_URLS",
        urls: collectImageUrls(snapshot)
      })
    }

    const synchronize = () => {
      void prepareOfflineMode().catch(() => undefined)
    }

    synchronize()
    window.addEventListener("online", synchronize)

    return () => {
      disposed = true
      window.removeEventListener("online", synchronize)
    }
  }, [])

  return null
}
