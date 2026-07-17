"use client"

import { useMemo } from "react"
import ItemsDashboardClient from "./ItemsDashboardClient"
import { createItemsDashboardDependencies, type ItemsDashboardGatewayFactory } from "./dependencies"

type ItemsDashboardFeatureProps = {
  rpgId: string
  gatewayFactory?: ItemsDashboardGatewayFactory
}

export default function ItemsDashboardFeature({
  rpgId,
  gatewayFactory = "http",
}: ItemsDashboardFeatureProps) {
  const deps = useMemo(
    () => createItemsDashboardDependencies(gatewayFactory),
    [gatewayFactory],
  )
  return <ItemsDashboardClient rpgId={rpgId} deps={deps} />
}
