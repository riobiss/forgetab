"use client"

import { Filter, Plus, Search } from "lucide-react"
import styles from "./SkillsDashboardClient.module.css"
import {
  actionTypeValues,
  skillTagValues,
  skillTypeValues,
  type ActionType,
  type SkillCategory,
  type SkillTag,
  type SkillType,
} from "@/types/skillBuilder"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import { ReactSelectField } from "@/components/select/ReactSelectField"
import { actionTypeLabel, skillTagLabel, skillTypeLabel } from "./constants"
import { SkillDeleteButton } from "./SkillDeleteButton"
import type { SkillsDashboardProps } from "./types"
import {
  createInitialLevel,
  createInitialMeta,
  getLevelCostPoints,
  normalizeObsList,
  resolveCategoryLabel,
  toggleId,
} from "./utils"
import { useSkillsDashboardState } from "./useSkillsDashboardState"

export default function SkillsDashboardClient({
  ownedRpgs,
  initialRpgId,
  hideRpgSelector = false,
  title = "Construtor de Habilidades",
}: SkillsDashboardProps) {
  void hideRpgSelector
  void title

  const {
    classes,
    races,
    skills,
    skillSearchOpen,
    setSkillSearchOpen,
    skillSearch,
    setSkillSearch,
    skillDisplayNameById,
    filtersOpen,
    setFiltersOpen,
    selectedCategoryFilters,
    setSelectedCategoryFilters,
    selectedTypeFilters,
    setSelectedTypeFilters,
    selectedActionTypeFilters,
    setSelectedActionTypeFilters,
    selectedTagFilters,
    setSelectedTagFilters,
    selectedSkillId,
    setSelectedSkillId,
    activeSkill,
    selectedLevelId,
    setSelectedLevelId,
    metaForm,
    setMetaForm,
    levelForm,
    setLevelForm,
    costResourceName,
    abilityCategoriesEnabled,
    enabledAbilityCategories,
    createOpen,
    setCreateOpen,
    customFieldModalOpen,
    setCustomFieldModalOpen,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    editOpen,
    setEditOpen,
    createStep,
    setCreateStep,
    editStep,
    setEditStep,
    setEditReloadKey,
    loading,
    saving,
    error,
    success,
    selectedLevel,
    createCategoryOptions,
    editCategoryOptions,
    tagOptions,
    selectedRpgTitle,
    categoryFilterOptions,
    typeFilterOptions,
    actionTypeFilterOptions,
    tagFilterOptions,
    filteredSkills,
    addCustomField,
    createSkill,
    createSnapshotLevel,
    saveAll,
    deleteSelectedLevel,
    deleteActiveSkill,
  } = useSkillsDashboardState({ ownedRpgs, initialRpgId })
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Habilidades</p>
          <h1 className={styles.title}>{selectedRpgTitle}</h1>
        </div>
      </div>
      <section className={styles.section}>
      <section className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Habilidades</h2>
            <div className={styles.sidebarTools}>
              <button
                type="button"
                className={skillSearchOpen ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
                aria-label="Pesquisar habilidades"
                title="Pesquisar habilidades"
                onClick={() => {
                  setSkillSearchOpen((prev) => !prev)
                  if (skillSearchOpen) setSkillSearch("")
                }}
              >
                <Search size={18} />
              </button>
              <button
                type="button"
                className={filtersOpen ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
                aria-label="Filtrar habilidades"
                title="Filtrar habilidades"
                onClick={() => setFiltersOpen(true)}
              >
                <Filter size={18} />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Criar habilidade"
                title="Criar habilidade"
                onClick={() => {
                  setCreateOpen(true)
                  setEditOpen(false)
                  setCreateStep(1)
                  setMetaForm(createInitialMeta())
                  setLevelForm(createInitialLevel())
                }}
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
                onChange={(event) => setSkillSearch(event.target.value)}
              />
            </label>
          ) : null}
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className={selectedSkillId === skill.id ? styles.skillCardActive : styles.skillCard}
            >
              <strong>{skillDisplayNameById[skill.id] ?? skill.slug}</strong>
              <small>{new Date(skill.updatedAt).toLocaleString("pt-BR")}</small>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => {
                    setCreateOpen(false)
                    setEditOpen(true)
                    setEditStep(1)
                    setSelectedSkillId(skill.id)
                    setEditReloadKey((prev) => prev + 1)
                  }}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
          {filteredSkills.length === 0 ? <p className={styles.muted}>Nenhuma habilidade encontrada.</p> : null}
        </aside>

        <div className={styles.editor}>
          {loading ? <p className={styles.muted}>Carregando...</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {success ? <p className={styles.success}>{success}</p> : null}

          {filtersOpen ? (
            <>
              <button
                type="button"
                className={styles.drawerBackdrop}
                aria-label="Fechar filtros"
                onClick={() => setFiltersOpen(false)}
              />
              <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Filtros de habilidades">
                <div className={styles.drawerHeader}>
                  <h3 className={styles.drawerTitle}>Filtros</h3>
                  <button type="button" className={styles.drawerClose} onClick={() => setFiltersOpen(false)}>
                    Fechar
                  </button>
                </div>
                <div className={styles.drawerTagsSection}>
                  <span className={styles.searchBarLabel}>Categoria</span>
                  <div className={styles.chipsRow}>
                    {categoryFilterOptions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={
                          selectedCategoryFilters.includes(item)
                            ? `${styles.chipButton} ${styles.chipButtonActive}`
                            : styles.chipButton
                        }
                        onClick={() =>
                          setSelectedCategoryFilters((prev) =>
                            prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
                          )
                        }
                      >
                        {resolveCategoryLabel(item)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.drawerTagsSection}>
                  <span className={styles.searchBarLabel}>Tipo</span>
                  <div className={styles.chipsRow}>
                    {typeFilterOptions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={
                          selectedTypeFilters.includes(item)
                            ? `${styles.chipButton} ${styles.chipButtonActive}`
                            : styles.chipButton
                        }
                        onClick={() =>
                          setSelectedTypeFilters((prev) =>
                            prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
                          )
                        }
                      >
                        {skillTypeLabel[item as SkillType] ?? item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.drawerTagsSection}>
                  <span className={styles.searchBarLabel}>Ação</span>
                  <div className={styles.chipsRow}>
                    {actionTypeFilterOptions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={
                          selectedActionTypeFilters.includes(item)
                            ? `${styles.chipButton} ${styles.chipButtonActive}`
                            : styles.chipButton
                        }
                        onClick={() =>
                          setSelectedActionTypeFilters((prev) =>
                            prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item],
                          )
                        }
                      >
                        {actionTypeLabel[item as ActionType] ?? item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.drawerTagsSection}>
                  <span className={styles.searchBarLabel}>Tags</span>
                  <div className={styles.chipsRow}>
                    {tagFilterOptions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={
                          selectedTagFilters.includes(tag)
                            ? `${styles.chipButton} ${styles.chipButtonActive}`
                            : styles.chipButton
                        }
                        onClick={() =>
                          setSelectedTagFilters((prev) =>
                            prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
                          )
                        }
                      >
                        {skillTagLabel[tag as SkillTag] ?? tag}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.drawerClear}
                  onClick={() => {
                    setSelectedCategoryFilters([])
                    setSelectedTypeFilters([])
                    setSelectedActionTypeFilters([])
                    setSelectedTagFilters([])
                  }}
                >
                  Limpar filtros
                </button>
              </aside>
            </>
          ) : null}

          {createOpen ? (
            <div
              className={styles.modalOverlay}
              role="dialog"
              aria-modal="true"
              aria-label="Criar habilidade"
              onClick={() => setCreateOpen(false)}
            >
            <section className={`${styles.card} ${styles.modalCard}`} onClick={(event) => event.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Criar</h2>
                <div className={styles.modalHeaderActions}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setCustomFieldModalOpen(true)}
                  >
                    novo campo
                  </button>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setCreateOpen(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
              <div className={styles.stepper}>
                {[1, 2].map((step) => (
                  <button
                    type="button"
                    key={step}
                    className={createStep === step ? styles.stepActive : styles.step}
                    onClick={() => setCreateStep(step)}
                  >
                    {step === 1 ? "Basico" : "Requerimentos"}
                  </button>
                ))}
              </div>

              {createStep === 1 ? (
                <div className={styles.grid}>
                  <label className={styles.field}>
                    <span>Nome</span>
                    <input
                      value={metaForm.name}
                      onChange={(event) => setMetaForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </label>
                  <label className={`${styles.field} ${styles.spanTwo}`}>
                    <span>Descricao</span>
                    <textarea
                      rows={5}
                      value={metaForm.description}
                      onChange={(event) =>
                        setMetaForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </label>
                  {abilityCategoriesEnabled ? (
                    <label className={styles.field}>
                      <span>Categoria</span>
                      <NativeSelectField
                        value={metaForm.category}
                        onChange={(event) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            category: event.target.value as SkillCategory | "",
                          }))
                        }
                      >
                        <option value="">Selecione</option>
                        {createCategoryOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </NativeSelectField>
                    </label>
                  ) : null}
                  <label className={styles.field}>
                    <span>Tipo</span>
                    <NativeSelectField
                      value={metaForm.type}
                      onChange={(event) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          type: event.target.value as SkillType | "",
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {skillTypeValues.map((option) => (
                        <option key={option} value={option}>
                          {skillTypeLabel[option]}
                        </option>
                      ))}
                    </NativeSelectField>
                  </label>
                  <label className={styles.field}>
                    <span>Ação</span>
                    <NativeSelectField
                      value={metaForm.actionType}
                      onChange={(event) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          actionType: event.target.value as ActionType | "",
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {actionTypeValues.map((option) => (
                        <option key={option} value={option}>
                          {actionTypeLabel[option]}
                        </option>
                        ))}
                      </NativeSelectField>
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Tags</span>
                      <ReactSelectField
                        classNames={{ container: () => styles.field }}
                        options={tagOptions}
                        value={tagOptions.find((option) => option.value === metaForm.tags[0]) ?? null}
                        onChange={(option) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            tags:
                              option && skillTagValues.includes(option.value as SkillTag)
                                ? [option.value as SkillTag]
                                : [],
                          }))
                        }
                        placeholder="Selecione as tags..."
                      />
                      <small className={styles.muted}>Selecione uma tag.</small>
                    </label>
                  <label className={styles.field}>
                    <span>Dano</span>
                    <input
                      value={levelForm.damage}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, damage: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Alcance</span>
                    <input
                      value={levelForm.range}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, range: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Duracao</span>
                    <input
                      value={levelForm.duration}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, duration: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Recarga</span>
                    <input
                      value={levelForm.cooldown}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, cooldown: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Tempo de conjuracao</span>
                    <input
                      value={levelForm.castTime}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, castTime: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Custo</span>
                    <input
                      value={levelForm.costCustom}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, costCustom: event.target.value }))
                      }
                    />
                  </label>
                  {abilityCategoriesEnabled && enabledAbilityCategories.length === 0 ? (
                    <p className={styles.error}>Ative pelo menos uma categoria</p>
                  ) : null}
                  {levelForm.customFields.map((field) => (
                    <label key={field.id} className={`${styles.field} ${styles.spanTwo}`}>
                      <span>{field.name}</span>
                      <input
                        value={field.value}
                        onChange={(event) =>
                          setLevelForm((prev) => ({
                            ...prev,
                            customFields: prev.customFields.map((item) =>
                              item.id === field.id ? { ...item, value: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              ) : null}

              {createStep === 2 ? (
                <div className={styles.bindingGrid}>
                  <div className={styles.bindBox}>
                    <h3>Classes permitidas</h3>
                    {classes.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={metaForm.classIds.includes(item.id)}
                          onChange={() =>
                            setMetaForm((prev) => ({
                              ...prev,
                              classIds: toggleId(prev.classIds, item.id),
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles.bindBox}>
                    <h3>Racas permitidas</h3>
                    {races.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={metaForm.raceIds.includes(item.id)}
                          onChange={() =>
                            setMetaForm((prev) => ({
                              ...prev,
                              raceIds: toggleId(prev.raceIds, item.id),
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <label className={styles.field}>
                    <span>Nivel minimo</span>
                    <input
                      type="number"
                      onWheel={(event) => event.currentTarget.blur()}
                      min={1}
                      value={levelForm.levelRequired}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, levelRequired: event.target.value }))
                      }
                    />
                  </label>
                  <label className={`${styles.field} ${styles.spanTwo}`}>
                    <span>Pre-requisito</span>
                    <textarea
                      rows={2}
                      value={levelForm.prerequisite}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, prerequisite: event.target.value }))
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Preço ({costResourceName})</span>
                    <input
                      type="number"
                      onWheel={(event) => event.currentTarget.blur()}
                      min={0}
                      step={1}
                      value={levelForm.costPoints}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, costPoints: event.target.value }))
                      }
                    />
                  </label>
                </div>
              ) : null}

              <div className={styles.actions}>
                {createStep > 1 ? (
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setCreateStep((prev) => prev - 1)}
                  >
                    Voltar
                  </button>
                ) : null}
                {createStep < 2 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setCreateStep((prev) => prev + 1)}
                  >
                    Proxima
                  </button>
                ) : null}
                <button type="button" className={styles.primaryButton} onClick={createSkill} disabled={saving}>
                  {saving ? "Criando..." : "Criar"}
                </button>
              </div>
              {customFieldModalOpen ? (
                <div
                  className={styles.nestedModalOverlay}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Novo campo"
                  onClick={() => setCustomFieldModalOpen(false)}
                >
                  <section
                    className={`${styles.card} ${styles.nestedModalCard}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <h3>Novo campo</h3>
                    <label className={styles.field}>
                      <span>Nome</span>
                      <input
                        value={newCustomFieldName}
                        onChange={(event) => setNewCustomFieldName(event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Valor</span>
                      <input
                        value={newCustomFieldValue}
                        onChange={(event) => setNewCustomFieldValue(event.target.value)}
                      />
                    </label>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => {
                          setCustomFieldModalOpen(false)
                          setNewCustomFieldName("")
                          setNewCustomFieldValue("")
                        }}
                      >
                        Cancelar
                      </button>
                      <button type="button" className={styles.primaryButton} onClick={addCustomField}>
                        Criar campo
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}
            </section>
            </div>
          ) : null}

          {!createOpen && editOpen && activeSkill ? (
            <div
              className={styles.modalOverlay}
              role="dialog"
              aria-modal="true"
              aria-label="Editar habilidade"
              onClick={() => setEditOpen(false)}
            >
            <section className={`${styles.card} ${styles.modalCard}`} onClick={(event) => event.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Editar</h2>
                <div className={styles.modalHeaderActions}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={createSnapshotLevel}
                    disabled={saving}
                  >Level +1</button>
                  <SkillDeleteButton
                    onDelete={deleteActiveSkill}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setEditOpen(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
              <div className={styles.levelHeader}>
                <div className={styles.levelHeaderActions}>
                  {activeSkill.levels.length > 1 ? (
                    <NativeSelectField
                      value={selectedLevelId}
                      onChange={(event) => setSelectedLevelId(event.target.value)}
                    >
                      {activeSkill.levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          Level {level.levelNumber}
                        </option>
                      ))}
                    </NativeSelectField>
                  ) : null}
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={deleteSelectedLevel}
                    disabled={saving || activeSkill.levels.length <= 1}
                  >
                    Deletar level
                  </button>
                </div>
              </div>
              <div className={styles.stepper}>
                {[1, 2].map((step) => (
                  <button
                    type="button"
                    key={step}
                    className={editStep === step ? styles.stepActive : styles.step}
                    onClick={() => setEditStep(step)}
                  >
                    {step === 1 ? "Basico" : "Requerimentos"}
                  </button>
                ))}
              </div>

              {editStep === 1 ? (
                <>
                  <div className={styles.grid}>
                    <label className={styles.field}>
                      <span>Nome</span>
                      <input
                        value={metaForm.name}
                        onChange={(event) => setMetaForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Descricao</span>
                      <textarea
                        rows={5}
                        value={metaForm.description}
                        onChange={(event) =>
                          setMetaForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                      />
                    </label>
                    {abilityCategoriesEnabled ? (
                      <label className={styles.field}>
                        <span>Categoria</span>
                        <NativeSelectField
                          value={metaForm.category}
                          onChange={(event) =>
                            setMetaForm((prev) => ({
                              ...prev,
                              category: event.target.value as SkillCategory | "",
                            }))
                          }
                        >
                          <option value="">Selecione</option>
                          {editCategoryOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </NativeSelectField>
                      </label>
                    ) : null}
                    <label className={styles.field}>
                      <span>Tipo</span>
                      <NativeSelectField
                        value={metaForm.type}
                        onChange={(event) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            type: event.target.value as SkillType | "",
                          }))
                        }
                      >
                        <option value="">Selecione</option>
                        {skillTypeValues.map((option) => (
                          <option key={option} value={option}>
                            {skillTypeLabel[option]}
                          </option>
                        ))}
                      </NativeSelectField>
                    </label>
                    <label className={styles.field}>
                      <span>Ação</span>
                      <NativeSelectField
                        value={metaForm.actionType}
                        onChange={(event) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            actionType: event.target.value as ActionType | "",
                          }))
                        }
                      >
                        <option value="">Selecione</option>
                        {actionTypeValues.map((option) => (
                          <option key={option} value={option}>
                            {actionTypeLabel[option]}
                          </option>
                        ))}
                      </NativeSelectField>
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Tags</span>
                      <ReactSelectField
                        classNames={{ container: () => styles.field }}
                        options={tagOptions}
                        value={tagOptions.find((option) => option.value === metaForm.tags[0]) ?? null}
                        onChange={(option) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            tags:
                              option && skillTagValues.includes(option.value as SkillTag)
                                ? [option.value as SkillTag]
                                : [],
                          }))
                        }
                        placeholder="Selecione as tags..."
                      />
                      <small className={styles.muted}>Selecione uma tag.</small>
                    </label>
                    <label className={styles.field}>
                      <span>Dano</span>
                      <input
                        value={levelForm.damage}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, damage: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Alcance</span>
                      <input
                        value={levelForm.range}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, range: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Duracao</span>
                      <input
                        value={levelForm.duration}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, duration: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Recarga</span>
                      <input
                        value={levelForm.cooldown}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, cooldown: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Tempo de conjuracao</span>
                      <input
                        value={levelForm.castTime}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, castTime: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Custo</span>
                      <input
                        value={levelForm.costCustom}
                        onChange={(event) =>
                          setLevelForm((prev) => ({ ...prev, costCustom: event.target.value }))
                        }
                      />
                    </label>
                    {abilityCategoriesEnabled && enabledAbilityCategories.length === 0 ? (
                      <p className={styles.error}>Ative pelo menos uma categoria</p>
                    ) : null}
                    {levelForm.customFields.map((field) => (
                      <label key={field.id} className={`${styles.field} ${styles.spanTwo}`}>
                        <span>{field.name}</span>
                        <input
                          value={field.value}
                          onChange={(event) =>
                            setLevelForm((prev) => ({
                              ...prev,
                              customFields: prev.customFields.map((item) =>
                                item.id === field.id ? { ...item, value: event.target.value } : item,
                              ),
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>

                </>
              ) : null}

              {editStep >= 2 ? (
                <div className={styles.levelHeader}>
                  <h3>Editor de Levels</h3>
                  <div className={styles.levelHeaderActions} />
                </div>
              ) : null}

              {editStep === 2 ? (
                <div className={styles.bindingGrid}>
                  <div className={styles.bindBox}>
                    <h3>Classes permitidas</h3>
                    {classes.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={metaForm.classIds.includes(item.id)}
                          onChange={() =>
                            setMetaForm((prev) => ({
                              ...prev,
                              classIds: toggleId(prev.classIds, item.id),
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles.bindBox}>
                    <h3>Racas permitidas</h3>
                    {races.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={metaForm.raceIds.includes(item.id)}
                          onChange={() =>
                            setMetaForm((prev) => ({
                              ...prev,
                              raceIds: toggleId(prev.raceIds, item.id),
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <label className={styles.field}>
                    <span>Nivel minimo</span>
                    <input
                      type="number"
                      onWheel={(event) => event.currentTarget.blur()}
                      min={1}
                      value={levelForm.levelRequired}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, levelRequired: event.target.value }))
                      }
                    />
                  </label>
                  <label className={`${styles.field} ${styles.spanTwo}`}>
                    <span>Pre-requisito</span>
                    <textarea
                      rows={2}
                      value={levelForm.prerequisite}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, prerequisite: event.target.value }))
                      }
                    />
                  </label>
                </div>
              ) : null}

              <div className={styles.actions}>
                {editStep > 1 ? (
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setEditStep((prev) => prev - 1)}
                  >
                    Voltar
                  </button>
                ) : null}
                {editStep < 2 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setEditStep((prev) => prev + 1)}
                  >
                    Proxima
                  </button>
                ) : null}
                <button type="button" className={styles.primaryButton} onClick={saveAll} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </section>
            </div>
          ) : null}

        </div>
      </section>
      </section>
    </main>
  )
}



