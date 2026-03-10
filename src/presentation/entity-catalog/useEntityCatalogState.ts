"use client"

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  buildEntityCatalogGroups,
  getEntityCatalogCategoryOptions,
} from "@/application/entityCatalog/use-cases/entityCatalog"
import type { EntityCatalogFilters, EntityCatalogItem, EntityCatalogSort } from "@/application/entityCatalog/types"

type ViewMode = "grouped" | "list"

const DEFAULT_SORT: EntityCatalogSort = "name-asc"
const DEFAULT_VIEW: ViewMode = "grouped"

function normalizeSort(value: string | null): EntityCatalogSort {
  switch (value) {
    case "name-desc":
    case "slug-asc":
    case "slug-desc":
    case "category-asc":
      return value
    case "name-asc":
    default:
      return DEFAULT_SORT
  }
}

function normalizeView(value: string | null): ViewMode {
  return value === "list" ? "list" : DEFAULT_VIEW
}

export function useEntityCatalogState(items: EntityCatalogItem[]) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const currentSearchParams = searchParams.toString()

  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [category, setCategory] = useState(searchParams.get("category") ?? "all")
  const [sort, setSort] = useState<EntityCatalogSort>(normalizeSort(searchParams.get("sort")))
  const [view, setView] = useState<ViewMode>(normalizeView(searchParams.get("view")))
  const deferredSearch = useDeferredValue(search)

  const filters: EntityCatalogFilters = useMemo(
    () => ({
      search: deferredSearch,
      category,
      sort,
    }),
    [category, deferredSearch, sort],
  )

  const groups = useMemo(() => buildEntityCatalogGroups(items, filters), [filters, items])
  const categoryOptions = useMemo(() => getEntityCatalogCategoryOptions(items), [items])
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "")
    setCategory(searchParams.get("category") ?? "all")
    setSort(normalizeSort(searchParams.get("sort")))
    setView(normalizeView(searchParams.get("view")))
  }, [searchParams])

  useEffect(() => {
    setCollapsedGroups((current) =>
      groups.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.key] = current[group.key] ?? false
        return acc
      }, {}),
    )
  }, [groups])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (search.trim()) {
      params.set("q", search.trim())
    } else {
      params.delete("q")
    }

    if (category !== "all") {
      params.set("category", category)
    } else {
      params.delete("category")
    }

    if (sort !== DEFAULT_SORT) {
      params.set("sort", sort)
    } else {
      params.delete("sort")
    }

    if (view !== DEFAULT_VIEW) {
      params.set("view", view)
    } else {
      params.delete("view")
    }

    const next = params.toString()
    if (next === currentSearchParams) {
      return
    }

    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
    })
  }, [category, currentSearchParams, pathname, router, search, searchParams, sort, view])

  const visibleCount = groups.reduce((acc, group) => acc + group.items.length, 0)

  return {
    search,
    setSearch,
    category,
    setCategory,
    sort,
    setSort,
    view,
    setView,
    categoryOptions,
    groups,
    visibleCount,
    collapsedGroups,
    isPending,
    toggleGroup(groupKey: string) {
      setCollapsedGroups((current) => ({
        ...current,
        [groupKey]: !current[groupKey],
      }))
    },
    expandAllGroups() {
      setCollapsedGroups(
        groups.reduce<Record<string, boolean>>((acc, group) => {
          acc[group.key] = false
          return acc
        }, {}),
      )
    },
    collapseAllGroups() {
      setCollapsedGroups(
        groups.reduce<Record<string, boolean>>((acc, group) => {
          acc[group.key] = true
          return acc
        }, {}),
      )
    },
  }
}
