import type { ComponentProps } from "react"
import { createEntityCatalogDependencies, type EntityCatalogGatewayFactory } from "@/presentation/entity-catalog/dependencies"
import EntityDetailsPage from "@/presentation/entity-catalog/EntityDetailsPage"

type Props = Omit<ComponentProps<typeof EntityDetailsPage>, "deps"> & {
  gatewayFactory?: EntityCatalogGatewayFactory
}

export default function EntityDetailsFeature({
  gatewayFactory = "http",
  ...props
}: Props) {
  const deps = createEntityCatalogDependencies(gatewayFactory)
  return <EntityDetailsPage {...props} deps={deps} />
}
