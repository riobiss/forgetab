"use client"

import { useMemo } from "react"
import ItemEditorForm from "./ItemEditorForm"
import { createItemsEditorDependencies, type ItemsEditorGatewayFactory } from "./dependencies"

type ItemEditorFeatureProps = {
  rpgId: string
  mode: "create" | "edit"
  itemId?: string
  gatewayFactory?: ItemsEditorGatewayFactory
}

export default function ItemEditorFeature({
  rpgId,
  mode,
  itemId,
  gatewayFactory = "http",
}: ItemEditorFeatureProps) {
  const deps = useMemo(
    () => createItemsEditorDependencies(gatewayFactory),
    [gatewayFactory],
  )

  return <ItemEditorForm rpgId={rpgId} mode={mode} itemId={itemId} deps={deps} />
}
