"use client"

import type { EntityCatalogSort } from "@/features/world/catalog/application/types"
import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import CategoryDrawer from "@/features/world/catalog/presentation/CategoryDrawer"
import CreateEntityCatalogModal from "@/features/world/catalog/presentation/CreateEntityCatalogModal"
import EntityCatalogSortModal from "@/features/world/catalog/presentation/EntityCatalogSortModal"
import ManageEntityCatalogCategoryModal from "@/features/world/catalog/presentation/ManageEntityCatalogCategoryModal"
import type { EntityCatalogManagement } from "@/features/world/catalog/presentation/useEntityCatalogManagement"

type Props = {
  entityType: CatalogEntityType
  categoryOptions: string[]
  selectedCategory: string
  onSelectCategory(category: string): void
  categoryDrawerOpen: boolean
  onCategoryDrawerChange(open: boolean): void
  selectedSort: EntityCatalogSort
  onSelectSort(sort: EntityCatalogSort): void
  sortModalOpen: boolean
  onSortModalChange(open: boolean): void
  management: EntityCatalogManagement
}

export default function EntityCatalogOverlays(props: Props) {
  return (
    <>
      <CreateEntityCatalogModal
        entityType={props.entityType}
        categoryOptions={props.categoryOptions}
        state={props.management.create}
      />
      <CategoryDrawer
        open={props.categoryDrawerOpen}
        categoryOptions={props.categoryOptions}
        selectedCategory={props.selectedCategory}
        onSelectCategory={props.onSelectCategory}
        onOpenChange={props.onCategoryDrawerChange}
      />
      <EntityCatalogSortModal
        open={props.sortModalOpen}
        selectedSort={props.selectedSort}
        onSelectSort={props.onSelectSort}
        onOpenChange={props.onSortModalChange}
      />
      <ManageEntityCatalogCategoryModal state={props.management.category} />
    </>
  )
}
