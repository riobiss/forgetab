"use client"

import ItemsDashboardClient from "./ItemsDashboardClient"

type ItemsDashboardFeatureProps = {
  rpgId: string
}

export default function ItemsDashboardFeature({ rpgId }: ItemsDashboardFeatureProps) {
  return <ItemsDashboardClient rpgId={rpgId} />
}
