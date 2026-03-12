"use client"

import type { ComponentProps } from "react"
import EntityDetailsPage from "@/presentation/entity-catalog/EntityDetailsPage"

type Props = ComponentProps<typeof EntityDetailsPage>

export default function EntityDetailsFeature(props: Props) {
  return <EntityDetailsPage {...props} />
}
