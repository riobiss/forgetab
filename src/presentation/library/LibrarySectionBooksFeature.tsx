"use client"

import { useMemo } from "react"
import LibrarySectionBooksPage from "./LibrarySectionBooksPage"
import { createLibraryDependencies, type LibraryGatewayFactory } from "./dependencies"

type Props = {
  rpgId: string
  sectionId: string
  gatewayFactory?: LibraryGatewayFactory
}

export default function LibrarySectionBooksFeature({
  rpgId,
  sectionId,
  gatewayFactory = "http",
}: Props) {
  const deps = useMemo(() => createLibraryDependencies(gatewayFactory), [gatewayFactory])
  return <LibrarySectionBooksPage rpgId={rpgId} sectionId={sectionId} deps={deps} />
}
