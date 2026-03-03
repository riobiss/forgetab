"use client"

import styles from "./SkillsDashboardClient.module.css"
import { SkillCreateModal } from "./SkillCreateModal"
import { SkillEditModal } from "./SkillEditModal"
import { SkillFiltersDrawer } from "./SkillFiltersDrawer"
import { SkillsSidebar } from "./SkillsSidebar"
import type { SkillsDashboardProps } from "./types"
import { resolveCategoryLabel } from "./utils"
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
    skillSearchOpen,
    skillSearch,
    setSkillSearch,
    skillDisplayNameById,
    filtersOpen,
    selectedCategoryFilters,
    selectedTypeFilters,
    selectedActionTypeFilters,
    selectedTagFilters,
    toggleSkillSearch,
    openFilters,
    closeFilters,
    clearFilters,
    toggleCategoryFilter,
    toggleTypeFilter,
    toggleActionTypeFilter,
    toggleTagFilter,
    selectedSkillId,
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
    openCreateModal,
    closeCreateModal,
    customFieldModalOpen,
    openCustomFieldModal,
    closeCustomFieldModal,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    editOpen,
    openEditModal,
    closeEditModal,
    createStep,
    setCreateStep,
    editStep,
    setEditStep,
    loading,
    saving,
    error,
    success,
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
        <SkillsSidebar
          filteredSkills={filteredSkills}
          selectedSkillId={selectedSkillId}
          skillDisplayNameById={skillDisplayNameById}
          skillSearchOpen={skillSearchOpen}
          skillSearch={skillSearch}
          filtersOpen={filtersOpen}
          onToggleSearch={toggleSkillSearch}
          onSearchChange={setSkillSearch}
          onOpenFilters={openFilters}
          onOpenCreate={openCreateModal}
          onEditSkill={openEditModal}
        />

        <div className={styles.editor}>
          {loading ? <p className={styles.muted}>Carregando...</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {success ? <p className={styles.success}>{success}</p> : null}

          <SkillFiltersDrawer
            open={filtersOpen}
            categoryFilterOptions={categoryFilterOptions}
            typeFilterOptions={typeFilterOptions}
            actionTypeFilterOptions={actionTypeFilterOptions}
            tagFilterOptions={tagFilterOptions}
            selectedCategoryFilters={selectedCategoryFilters}
            selectedTypeFilters={selectedTypeFilters}
            selectedActionTypeFilters={selectedActionTypeFilters}
            selectedTagFilters={selectedTagFilters}
            onClose={closeFilters}
            onToggleCategory={toggleCategoryFilter}
            onToggleType={toggleTypeFilter}
            onToggleActionType={toggleActionTypeFilter}
            onToggleTag={toggleTagFilter}
            onClear={clearFilters}
            resolveCategoryLabel={resolveCategoryLabel}
          />

          <SkillCreateModal
            open={createOpen}
            saving={saving}
            createStep={createStep}
            setCreateStep={setCreateStep}
            onClose={closeCreateModal}
            onCreate={createSkill}
            onOpenCustomFieldModal={openCustomFieldModal}
            classes={classes}
            races={races}
            metaForm={metaForm}
            setMetaForm={setMetaForm}
            levelForm={levelForm}
            setLevelForm={setLevelForm}
            abilityCategoriesEnabled={abilityCategoriesEnabled}
            enabledAbilityCategories={enabledAbilityCategories}
            createCategoryOptions={createCategoryOptions}
            tagOptions={tagOptions}
            costResourceName={costResourceName}
            customFieldModalOpen={customFieldModalOpen}
            newCustomFieldName={newCustomFieldName}
            setNewCustomFieldName={setNewCustomFieldName}
            newCustomFieldValue={newCustomFieldValue}
            setNewCustomFieldValue={setNewCustomFieldValue}
            onAddCustomField={addCustomField}
            onCloseCustomFieldModal={closeCustomFieldModal}
          />

          {!createOpen && editOpen && activeSkill ? (
            <SkillEditModal
              open
              saving={saving}
              activeSkill={activeSkill}
              selectedLevelId={selectedLevelId}
              setSelectedLevelId={setSelectedLevelId}
              editStep={editStep}
              setEditStep={setEditStep}
              onClose={closeEditModal}
              onCreateSnapshotLevel={createSnapshotLevel}
              onDeleteSkill={deleteActiveSkill}
              onDeleteLevel={deleteSelectedLevel}
              onSaveAll={saveAll}
              classes={classes}
              races={races}
              metaForm={metaForm}
              setMetaForm={setMetaForm}
              levelForm={levelForm}
              setLevelForm={setLevelForm}
              abilityCategoriesEnabled={abilityCategoriesEnabled}
              enabledAbilityCategories={enabledAbilityCategories}
              editCategoryOptions={editCategoryOptions}
              tagOptions={tagOptions}
              costResourceName={costResourceName}
            />
          ) : null}

        </div>
      </section>
      </section>
    </main>
  )
}



