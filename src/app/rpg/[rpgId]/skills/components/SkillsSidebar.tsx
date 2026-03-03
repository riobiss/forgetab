import { Filter, Plus, Search } from "lucide-react"
import styles from "./SkillsDashboardClient.module.css"

type SkillListItem = {
  id: string
  slug: string
  updatedAt: string
}

type SkillsSidebarProps = {
  filteredSkills: SkillListItem[]
  selectedSkillId: string
  skillDisplayNameById: Record<string, string>
  skillSearchOpen: boolean
  skillSearch: string
  filtersOpen: boolean
  onToggleSearch: () => void
  onSearchChange: (value: string) => void
  onOpenFilters: () => void
  onOpenCreate: () => void
  onEditSkill: (skillId: string) => void
}

export function SkillsSidebar({
  filteredSkills,
  selectedSkillId,
  skillDisplayNameById,
  skillSearchOpen,
  skillSearch,
  filtersOpen,
  onToggleSearch,
  onSearchChange,
  onOpenFilters,
  onOpenCreate,
  onEditSkill,
}: SkillsSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>Habilidades</h2>
        <div className={styles.sidebarTools}>
          <button
            type="button"
            className={skillSearchOpen ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
            aria-label="Pesquisar habilidades"
            title="Pesquisar habilidades"
            onClick={onToggleSearch}
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            className={filtersOpen ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
            aria-label="Filtrar habilidades"
            title="Filtrar habilidades"
            onClick={onOpenFilters}
          >
            <Filter size={18} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Criar habilidade"
            title="Criar habilidade"
            onClick={onOpenCreate}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
      {skillSearchOpen ? (
        <label className={styles.searchBar}>
          <span>Pesquisar</span>
          <input
            type="search"
            placeholder="Nome ou descrição..."
            value={skillSearch}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      ) : null}
      {filteredSkills.map((skill) => (
        <div key={skill.id} className={selectedSkillId === skill.id ? styles.skillCardActive : styles.skillCard}>
          <strong>{skillDisplayNameById[skill.id] ?? skill.slug}</strong>
          <small>{new Date(skill.updatedAt).toLocaleString("pt-BR")}</small>
          <div className={styles.actions}>
            <button type="button" className={styles.ghostButton} onClick={() => onEditSkill(skill.id)}>
              Editar
            </button>
          </div>
        </div>
      ))}
      {filteredSkills.length === 0 ? <p className={styles.muted}>Nenhuma habilidade encontrada.</p> : null}
    </aside>
  )
}
