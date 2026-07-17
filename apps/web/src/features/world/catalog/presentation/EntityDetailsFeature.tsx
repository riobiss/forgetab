"use client"

import type { ComponentProps } from "react"
import EntityDetailsPage from "@/features/world/catalog/presentation/EntityDetailsPage"

type Props = ComponentProps<typeof EntityDetailsPage>

export default function EntityDetailsFeature(props: Props) {
  return <EntityDetailsPage {...props} />
}
