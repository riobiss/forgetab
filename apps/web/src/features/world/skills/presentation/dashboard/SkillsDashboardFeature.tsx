"use client"

import { useMemo } from "react"
import SkillsDashboardClient from "./SkillsDashboardClient"
import { createSkillsDashboardDependencies, type SkillsDashboardGatewayFactory } from "./dependencies"
import type { SkillsDashboardProps } from "./types"

type SkillsDashboardFeatureProps = SkillsDashboardProps & {
  gatewayFactory?: SkillsDashboardGatewayFactory
}

export default function SkillsDashboardFeature({
  gatewayFactory = "http",
  ...props
}: SkillsDashboardFeatureProps) {
  const deps = useMemo(
    () => createSkillsDashboardDependencies(gatewayFactory),
    [gatewayFactory],
  )

  return <SkillsDashboardClient {...props} deps={deps} />
}
