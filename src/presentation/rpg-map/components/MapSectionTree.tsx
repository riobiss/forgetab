"use client"

import { ChevronDown, ChevronRight, Pencil, Plus, Search } from "lucide-react"
import { useState } from "react"
import type { RpgMapSectionDto, RpgMapSectionTreeNodeDto } from "@/application/rpgMap/types"
import styles from "../RpgMapPage.module.css"

type MapTreeNodeProps = {
  node: RpgMapSectionTreeNodeDto
  selectedId: string | null
  onSelect: (sectionId: string) => void
  onEdit: (section: RpgMapSectionDto) => void
  isRoot?: boolean
}

function MapTreeNode({ node, selectedId, onSelect, onEdit, isRoot = false }: MapTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = node.children.length > 0

  if (isRoot) {
    return (
      <li className={`${styles.treeNode} ${styles.treeRootNode}`}>
        <div className={`${styles.treeLine} ${styles.treeRootLine} ${selectedId === node.id ? styles.treeLineActive : ""}`}>
          <div className={styles.rootSectionHeaderMain}>
            <button
              type="button"
              className={styles.treeToggle}
              onClick={() => setIsOpen((current) => !current)}
              disabled={!hasChildren}
              aria-label={hasChildren ? (isOpen ? "Recolher secoes" : "Expandir secoes") : "Sem filhos"}
            >
              {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span />}
            </button>
            <button type="button" className={styles.rootSectionName} onClick={() => onSelect(node.id)}>
              {node.name}
            </button>
          </div>
          <div className={styles.treeActions}>
            {node.canEdit ? (
              <button type="button" className={styles.iconButton} onClick={() => onEdit(node)} title="Editar">
                <Pencil size={14} />
              </button>
            ) : null}
          </div>
        </div>
        {hasChildren && isOpen ? (
          <ul className={styles.treeChildren}>
            {node.children.map((child) => (
              <MapTreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} onEdit={onEdit} />
            ))}
          </ul>
        ) : null}
      </li>
    )
  }

  return (
    <li className={styles.treeNode}>
      <div className={`${styles.treeLine} ${selectedId === node.id ? styles.treeLineActive : ""}`}>
        <button
          type="button"
          className={styles.treeToggle}
          onClick={() => setIsOpen((current) => !current)}
          disabled={!hasChildren}
          aria-label={hasChildren ? (isOpen ? "Recolher secoes" : "Expandir secoes") : "Sem filhos"}
        >
          {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span />}
        </button>
        <button type="button" className={styles.treeName} onClick={() => onSelect(node.id)}>
          {node.name}
        </button>
        <div className={styles.treeActions}>
          {node.canEdit ? (
            <button type="button" className={styles.iconButton} onClick={() => onEdit(node)} title="Editar">
              <Pencil size={14} />
            </button>
          ) : null}
        </div>
      </div>
      {hasChildren && isOpen ? (
        <ul className={styles.treeChildren}>
          {node.children.map((child) => (
            <MapTreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} onEdit={onEdit} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

type Props = {
  canCreate: boolean
  filteredTree: RpgMapSectionTreeNodeDto[]
  sectionSearch: string
  onChangeSearch: (value: string) => void
  onCreate: () => void
  onSelect: (sectionId: string) => void
  onEdit: (section: RpgMapSectionDto) => void
  selectedSectionId: string | null
}

export function MapSectionTree({
  canCreate,
  filteredTree,
  sectionSearch,
  onChangeSearch,
  onCreate,
  onSelect,
  onEdit,
  selectedSectionId,
}: Props) {
  return (
    <section className={styles.sectionsTreeWrap}>
      <div className={styles.sectionsTreeHeader}>
        <label className={styles.searchField}>
          <Search size={16} />
          <input
            type="search"
            value={sectionSearch}
            onChange={(event) => onChangeSearch(event.target.value)}
            placeholder="Buscar secoes..."
          />
        </label>
        {canCreate ? (
          <button type="button" className={styles.secondaryButton} onClick={onCreate}>
            <Plus size={14} />
            <span>Criar</span>
          </button>
        ) : null}
      </div>
      {filteredTree.length === 0 ? (
        <p className={styles.feedback}>Nenhuma secao encontrada.</p>
      ) : (
        <div className={styles.treeContainer}>
          <ul className={styles.treeRootList}>
            {filteredTree.map((node) => (
              <MapTreeNode
                key={node.id}
                node={node}
                selectedId={selectedSectionId}
                onSelect={onSelect}
                onEdit={onEdit}
                isRoot
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
