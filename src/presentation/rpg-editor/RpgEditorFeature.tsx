"use client"

import { useMemo } from "react"
import NewRpgForm from "@/presentation/rpg-editor/NewRpgForm"
import { createRpgEditorDependencies, type RpgEditorGatewayFactory } from "@/presentation/rpg-editor/dependencies"
import EditRpgFeature from "@/presentation/rpg-editor/edit/EditRpgFeature"

type RpgEditorFeatureProps =
  | {
      mode: "create"
      gatewayFactory?: RpgEditorGatewayFactory
      presentation?: "standalone" | "embedded"
      onCancel?: () => void
      onCompleted?: () => void
    }
  | {
      mode: "edit"
      gatewayFactory?: RpgEditorGatewayFactory
      presentation?: "standalone" | "embedded"
      onClose?: () => void
      onSaved?: () => void
      onDeleted?: () => void
    }

export default function RpgEditorFeature(props: RpgEditorFeatureProps) {
  const deps = useMemo(
    () => createRpgEditorDependencies(props.gatewayFactory ?? "http"),
    [props.gatewayFactory],
  )

  if (props.mode === "create") {
    return (
      <NewRpgForm
        deps={deps}
        presentation={props.presentation}
        onCancel={props.onCancel}
        onCompleted={props.onCompleted}
      />
    )
  }

  return (
    <EditRpgFeature
      deps={deps}
      presentation={props.presentation}
      onClose={props.onClose}
      onSaved={props.onSaved}
      onDeleted={props.onDeleted}
    />
  )
}
