"use client"

import { useMemo } from "react"
import LibraryBookEditorClient from "./LibraryBookEditorClient"
import { createLibraryDependencies, type LibraryGatewayFactory } from "../dependencies"

type Props = {
  rpgId: string
  sectionId: string
  mode: "create" | "edit"
  bookId?: string
  forceReadOnly?: boolean
  gatewayFactory?: LibraryGatewayFactory
}

export default function LibraryBookEditorFeature({
  rpgId,
  sectionId,
  mode,
  bookId,
  forceReadOnly = false,
  gatewayFactory = "http",
}: Props) {
  const deps = useMemo(() => createLibraryDependencies(gatewayFactory), [gatewayFactory])
  return (
    <LibraryBookEditorClient
      rpgId={rpgId}
      sectionId={sectionId}
      mode={mode}
      bookId={bookId}
      forceReadOnly={forceReadOnly}
      deps={deps}
    />
  )
}
