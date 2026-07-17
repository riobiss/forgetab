import { useEffect, useMemo, useState } from "react"
import type { SkillListItem } from "./types"

type UseSkillsFiltersParams = {
  skills: SkillListItem[]
  skillSearchIndex: Record<string, string>
  skillFilterMetaById: Record<
    string,
    { categories: string[]; types: string[]; actionTypes: string[]; tags: string[] }
  >
}

export function useSkillsFilters({
  skills,
  skillSearchIndex,
  skillFilterMetaById,
}: UseSkillsFiltersParams) {
  const [skillSearchOpen, setSkillSearchOpen] = useState(false)
  const [skillSearch, setSkillSearch] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([])
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([])
  const [selectedActionTypeFilters, setSelectedActionTypeFilters] = useState<string[]>([])
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.innerWidth > 760) {
      setSkillSearchOpen(true)
    }
  }, [])

  const filteredSkills = useMemo(() => {
    const query = skillSearch.trim().toLowerCase()

    return skills.filter((skill) => {
      const meta = skillFilterMetaById[skill.id] ?? {
        categories: [],
        types: [],
        actionTypes: [],
        tags: [],
      }
      if (
        selectedCategoryFilters.length > 0 &&
        !selectedCategoryFilters.some((item) => meta.categories.includes(item))
      ) {
        return false
      }
      if (
        selectedTypeFilters.length > 0 &&
        !selectedTypeFilters.some((item) => meta.types.includes(item))
      ) {
        return false
      }
      if (
        selectedActionTypeFilters.length > 0 &&
        !selectedActionTypeFilters.some((item) => meta.actionTypes.includes(item))
      ) {
        return false
      }
      if (
        selectedTagFilters.length > 0 &&
        !selectedTagFilters.some((tag) => meta.tags.includes(tag))
      ) {
        return false
      }
      if (!query) return true
      const searchBlob = skillSearchIndex[skill.id] ?? ""
      return searchBlob.includes(query)
    })
  }, [
    selectedActionTypeFilters,
    selectedCategoryFilters,
    selectedTagFilters,
    selectedTypeFilters,
    skillSearch,
    skillSearchIndex,
    skills,
    skillFilterMetaById,
  ])

  function toggleSkillSearch() {
    setSkillSearchOpen((prev) => {
      const next = !prev
      if (!next) {
        setSkillSearch("")
      }
      return next
    })
  }

  function openFilters() {
    setFiltersOpen(true)
  }

  function closeFilters() {
    setFiltersOpen(false)
  }

  function clearFilters() {
    setSelectedCategoryFilters([])
    setSelectedTypeFilters([])
    setSelectedActionTypeFilters([])
    setSelectedTagFilters([])
  }

  function toggleCategoryFilter(item: string) {
    setSelectedCategoryFilters((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
    )
  }

  function toggleTypeFilter(item: string) {
    setSelectedTypeFilters((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
    )
  }

  function toggleActionTypeFilter(item: string) {
    setSelectedActionTypeFilters((prev) =>
      prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
    )
  }

  function toggleTagFilter(tag: string) {
    setSelectedTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    )
  }

  return {
    skillSearchOpen,
    skillSearch,
    setSkillSearch,
    filtersOpen,
    selectedCategoryFilters,
    selectedTypeFilters,
    selectedActionTypeFilters,
    selectedTagFilters,
    filteredSkills,
    toggleSkillSearch,
    openFilters,
    closeFilters,
    clearFilters,
    toggleCategoryFilter,
    toggleTypeFilter,
    toggleActionTypeFilter,
    toggleTagFilter,
  }
}
