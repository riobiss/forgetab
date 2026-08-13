/* eslint-disable no-restricted-globals */

const SHELL_CACHE = "forgetab-shell-v2"
const USER_ASSET_CACHE = "forgetab-user-assets-v1"
const OFFLINE_URL = "/offline"

function isShellAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/favicon/") ||
      url.pathname.startsWith("/fonts/"))
  )
}

async function cacheOfflineShell() {
  const cache = await caches.open(SHELL_CACHE)
  const response = await fetch(OFFLINE_URL, { cache: "reload" })

  if (!response.ok) return

  await cache.put(OFFLINE_URL, response.clone())
  const html = await response.text()
  const assetUrls = Array.from(
    html.matchAll(/(?:src|href)=["']([^"']+)["']/g),
    (match) => match[1]
  ).filter(
    (url) =>
      url.startsWith("/_next/") ||
      url.startsWith("/favicon/") ||
      url.startsWith("/fonts/")
  )

  await Promise.allSettled(
    [...new Set(assetUrls)].map(async (url) => {
      const assetResponse = await fetch(url, { cache: "reload" })
      if (assetResponse.ok) await cache.put(url, assetResponse)
    })
  )
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheOfflineShell().then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== SHELL_CACHE && key !== USER_ASSET_CACHE)
              .map((key) => caches.delete(key))
          )
        )
    ])
  )
})

async function offlineNavigationResponse(request) {
  try {
    const response = await fetch(request)
    if (new URL(request.url).pathname === OFFLINE_URL && response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      await cache.put(OFFLINE_URL, response.clone())
    }
    return response
  } catch {
    if (new URL(request.url).pathname !== OFFLINE_URL) {
      return Response.redirect(OFFLINE_URL, 302)
    }

    return (
      (await caches.match(OFFLINE_URL)) ??
      new Response("ForgeTab indisponivel offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      })
    )
  }
}

async function shellAssetResponse(request) {
  const cached =
    (await caches.match(request)) ??
    (await caches.match(request, { ignoreSearch: true }))

  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response(null, {
      status: 504,
      statusText: "Offline shell asset unavailable"
    })
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.mode === "navigate") {
    event.respondWith(offlineNavigationResponse(request))
    return
  }

  if (isShellAsset(url)) {
    event.respondWith(shellAssetResponse(request))
    return
  }

  if (request.destination === "image") {
    event.respondWith(
      caches.open(USER_ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached

        try {
          const response = await fetch(request)
          await cache.put(request, response.clone())
          return response
        } catch {
          return new Response(null, {
            status: 504,
            statusText: "Offline image unavailable"
          })
        }
      })
    )
  }
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_USER_DATA") {
    event.waitUntil(caches.delete(USER_ASSET_CACHE))
    return
  }

  if (event.data?.type !== "CACHE_URLS" || !Array.isArray(event.data.urls)) {
    return
  }

  event.waitUntil(
    caches.open(USER_ASSET_CACHE).then((cache) =>
      Promise.allSettled(
        event.data.urls.map(async (url) => {
          if (
            typeof url !== "string" ||
            (!/^https?:\/\//.test(url) && !url.startsWith("/"))
          ) {
            return
          }

          const absoluteUrl = new URL(url, self.location.origin)
          const request = new Request(absoluteUrl, {
            mode:
              absoluteUrl.origin === self.location.origin
                ? "same-origin"
                : "no-cors"
          })
          const response = await fetch(request)
          await cache.put(request, response)
        })
      )
    )
  )
})
