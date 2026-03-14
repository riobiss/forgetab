"use client"

import { useMemo } from "react"
import LibrarySectionsPage from "./LibrarySectionsPage"
import { createLibraryDependencies, type LibraryGatewayFactory } from "./dependencies"

type Props = {
  rpgId: string
  rpgTitle: string
  gatewayFactory?: LibraryGatewayFactory
}

export default function LibrarySectionsFeature({
  rpgId,
  rpgTitle,
  gatewayFactory = "http",
}: Props) {
  const deps = useMemo(() => createLibraryDependencies(gatewayFactory), [gatewayFactory])
  return <LibrarySectionsPage rpgId={rpgId} rpgTitle={rpgTitle} deps={deps} />
}
