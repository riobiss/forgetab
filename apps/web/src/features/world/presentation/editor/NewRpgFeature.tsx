"use client"

import { useMemo } from "react"
import NewRpgForm from "./NewRpgForm"
import { createRpgEditorDependencies, type RpgEditorGatewayFactory } from "./dependencies"

type NewRpgFeatureProps = {
  gatewayFactory?: RpgEditorGatewayFactory
}

export default function NewRpgFeature({
  gatewayFactory = "http",
}: NewRpgFeatureProps) {
  const deps = useMemo(
    () => createRpgEditorDependencies(gatewayFactory),
    [gatewayFactory],
  )

  return <NewRpgForm deps={deps} />
}
