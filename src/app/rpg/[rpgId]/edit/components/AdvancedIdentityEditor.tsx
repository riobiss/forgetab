import styles from "./AdvancedIdentityEditor.module.css"
import { createDefaultRaceLore, type RaceLore } from "@/lib/rpg/raceLore"
import type { AttributeTemplate } from "./shared/types"
import NumericTemplateGrid from "@/components/rpg/NumericTemplateGrid"

type IdentityType = "race" | "class"

export type IdentityTemplateDraft = {
  key: string
  label: string
  category?: string
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
  lore?: RaceLore
}

type SkillTemplate = {
  key: string
  label: string
}

type Props = {
  type: IdentityType
  mode: "create" | "edit"
  draft: IdentityTemplateDraft
  attributeTemplates: AttributeTemplate[]
  skillTemplates: SkillTemplate[]
  saving: boolean
  error: string
  success: string
  onChange: (next: IdentityTemplateDraft) => void
  onSave: () => Promise<void>
  onCancel: () => void
}

export default function AdvancedIdentityEditor({
  type,
  mode,
  draft,
  attributeTemplates,
  skillTemplates,
  saving,
  error,
  success,
  onChange,
  onSave,
  onCancel,
}: Props) {
  const typeLabel = type === "race" ? "Raca" : "Classe"
  const title = mode === "create" ? `Criar ${typeLabel}` : `Editar ${typeLabel}`
  const raceLore = type === "race" ? (draft.lore ?? createDefaultRaceLore(draft.label)) : null

  function updateLabel(value: string) {
    if (type === "race") {
      onChange({ ...draft, label: value, lore: draft.lore ?? createDefaultRaceLore(value) })
      return
    }

    onChange({ ...draft, label: value })
  }

  function updateBonus(
    scope: "attributeBonuses" | "skillBonuses",
    key: string,
    value: string,
  ) {
    onChange({
      ...draft,
      [scope]: {
        ...draft[scope],
        [key]: Number(value),
      },
    })
  }

  function parseLines(value: string) {
    return value.split("\n")
  }

  function linesToText(lines: string[]) {
    return lines.join("\n")
  }

  function updateRaceLore(nextLore: RaceLore) {
    onChange({ ...draft, lore: nextLore })
  }

  function updateRaceArrayField(
    field: "thoughts" | "notableFigures" | "racialTraits" | "commonClasses",
    value: string,
  ) {
    if (!raceLore) return
    updateRaceLore({ ...raceLore, [field]: parseLines(value) })
  }

  function addKingdom() {
    if (!raceLore) return
    updateRaceLore({
      ...raceLore,
      kingdoms: [
        ...raceLore.kingdoms,
        {
          name: "",
          description: "",
          culture: [],
          physicalTraits: [],
          clothing: [],
          commonNames: [],
        },
      ],
    })
  }

  function removeKingdom(index: number) {
    if (!raceLore) return
    updateRaceLore({
      ...raceLore,
      kingdoms: raceLore.kingdoms.filter((_, currentIndex) => currentIndex !== index),
    })
  }

  function updateKingdomField(
    index: number,
    field:
      | "name"
      | "description"
      | "culture"
      | "physicalTraits"
      | "clothing"
      | "commonNames",
    value: string,
  ) {
    if (!raceLore) return
    updateRaceLore({
      ...raceLore,
      kingdoms: raceLore.kingdoms.map((kingdom, currentIndex) => {
        if (currentIndex !== index) return kingdom
        if (field === "name" || field === "description") {
          return { ...kingdom, [field]: value }
        }
        return { ...kingdom, [field]: parseLines(value) }
      }),
    })
  }

  function addVariation() {
    if (!raceLore) return
    updateRaceLore({
      ...raceLore,
      variations: [...raceLore.variations, { name: "", description: "", traits: [] }],
    })
  }

  function removeVariation(index: number) {
    if (!raceLore) return
    updateRaceLore({
      ...raceLore,
      variations: raceLore.variations.filter((_, currentIndex) => currentIndex !== index),
    })
  }

  function updateVariationField(
    index: number,
    field: "name" | "description" | "traits",
    value: string,
  ) {
    if (!raceLore) return
    updateRaceLore({
      ...raceLore,
      variations: raceLore.variations.map((variation, currentIndex) => {
        if (currentIndex !== index) return variation
        if (field === "traits") {
          return { ...variation, traits: parseLines(value) }
        }
        return { ...variation, [field]: value }
      }),
    })
  }

  const attributeItems = attributeTemplates.map((item) => ({
    key: item.key,
    label: item.label,
  }))

  return (
    <section className={styles.panel}>
      <h1>{title}</h1>

      <label className={styles.field}>
        <span>Nome</span>
        <input
          type="text"
          value={draft.label}
          onChange={(event) => updateLabel(event.target.value)}
          placeholder={type === "race" ? "Nome da raca" : "Nome da classe"}
        />
      </label>

      {type === "race" && raceLore ? (
        <section className={styles.section}>
          <h2>Lore da raca</h2>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => updateRaceLore(createDefaultRaceLore(draft.label))}
            >
              Inserir estrutura padrao
            </button>
          </div>

          <label className={styles.field}>
            <span>Resumo</span>
            <textarea
              value={raceLore.summary}
              onChange={(event) =>
                updateRaceLore({ ...raceLore, summary: event.target.value })
              }
              rows={3}
            />
          </label>

          <label className={styles.field}>
            <span>Origem</span>
            <textarea
              value={raceLore.origin}
              onChange={(event) =>
                updateRaceLore({ ...raceLore, origin: event.target.value })
              }
              rows={5}
            />
          </label>

          <label className={styles.field}>
            <span>O que alguns pensam (1 linha por item)</span>
            <textarea
              value={linesToText(raceLore.thoughts)}
              onChange={(event) => updateRaceArrayField("thoughts", event.target.value)}
              rows={4}
            />
          </label>

          <section className={styles.subSection}>
            <div className={styles.inlineHeader}>
              <h3>Reinos</h3>
              <button type="button" className={styles.secondaryButton} onClick={addKingdom}>
                Adicionar reino
              </button>
            </div>
            {raceLore.kingdoms.length === 0 ? (
              <p className={styles.hint}>Nenhum reino cadastrado.</p>
            ) : null}
            {raceLore.kingdoms.map((kingdom, index) => (
              <article className={styles.itemCard} key={`kingdom-${index}`}>
                <div className={styles.inlineHeader}>
                  <h4>Reino {index + 1}</h4>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => removeKingdom(index)}
                  >
                    Remover
                  </button>
                </div>

                <label className={styles.field}>
                  <span>Nome do reino</span>
                  <input
                    type="text"
                    value={kingdom.name}
                    onChange={(event) => updateKingdomField(index, "name", event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>Descricao</span>
                  <textarea
                    rows={4}
                    value={kingdom.description}
                    onChange={(event) =>
                      updateKingdomField(index, "description", event.target.value)
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>Cultura (1 linha por item)</span>
                  <textarea
                    rows={3}
                    value={linesToText(kingdom.culture)}
                    onChange={(event) =>
                      updateKingdomField(index, "culture", event.target.value)
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>Caracteristicas fisicas (1 linha por item)</span>
                  <textarea
                    rows={3}
                    value={linesToText(kingdom.physicalTraits)}
                    onChange={(event) =>
                      updateKingdomField(index, "physicalTraits", event.target.value)
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>Vestuario (1 linha por item)</span>
                  <textarea
                    rows={3}
                    value={linesToText(kingdom.clothing)}
                    onChange={(event) =>
                      updateKingdomField(index, "clothing", event.target.value)
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>Nomes comuns (1 linha por item)</span>
                  <textarea
                    rows={3}
                    value={linesToText(kingdom.commonNames)}
                    onChange={(event) =>
                      updateKingdomField(index, "commonNames", event.target.value)
                    }
                  />
                </label>
              </article>
            ))}
          </section>

          <label className={styles.field}>
            <span>Figuras marcantes (1 linha por item)</span>
            <textarea
              value={linesToText(raceLore.notableFigures)}
              onChange={(event) =>
                updateRaceArrayField("notableFigures", event.target.value)
              }
              rows={4}
            />
          </label>

          <label className={styles.field}>
            <span>Tracos raciais (1 linha por item)</span>
            <textarea
              value={linesToText(raceLore.racialTraits)}
              onChange={(event) =>
                updateRaceArrayField("racialTraits", event.target.value)
              }
              rows={4}
            />
          </label>

          <label className={styles.field}>
            <span>Classes comuns (1 linha por item)</span>
            <textarea
              value={linesToText(raceLore.commonClasses)}
              onChange={(event) =>
                updateRaceArrayField("commonClasses", event.target.value)
              }
              rows={4}
            />
          </label>

          <section className={styles.subSection}>
            <div className={styles.inlineHeader}>
              <h3>Variacoes</h3>
              <button type="button" className={styles.secondaryButton} onClick={addVariation}>
                Adicionar variacao
              </button>
            </div>
            {raceLore.variations.length === 0 ? (
              <p className={styles.hint}>Nenhuma variacao cadastrada.</p>
            ) : null}
            {raceLore.variations.map((variation, index) => (
              <article className={styles.itemCard} key={`variation-${index}`}>
                <div className={styles.inlineHeader}>
                  <h4>Variacao {index + 1}</h4>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => removeVariation(index)}
                  >
                    Remover
                  </button>
                </div>

                <label className={styles.field}>
                  <span>Nome</span>
                  <input
                    type="text"
                    value={variation.name}
                    onChange={(event) =>
                      updateVariationField(index, "name", event.target.value)
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>Descricao</span>
                  <textarea
                    rows={4}
                    value={variation.description}
                    onChange={(event) =>
                      updateVariationField(index, "description", event.target.value)
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>Tracos (1 linha por item)</span>
                  <textarea
                    rows={3}
                    value={linesToText(variation.traits)}
                    onChange={(event) =>
                      updateVariationField(index, "traits", event.target.value)
                    }
                  />
                </label>
              </article>
            ))}
          </section>
        </section>
      ) : null}

      <section className={styles.section}>
        <h2>Bonus de atributos</h2>
        <NumericTemplateGrid
          items={attributeItems}
          values={draft.attributeBonuses}
          onChange={(key, value) => updateBonus("attributeBonuses", key, value)}
          gridClassName={styles.grid}
          fieldClassName={styles.field}
          keyPrefix={`${draft.key}-att`}
        />
      </section>

      <section className={styles.section}>
        <h2>Bonus de pericias</h2>
        <NumericTemplateGrid
          items={skillTemplates.map((skill) => ({
            key: skill.key,
            label: skill.label,
          }))}
          values={draft.skillBonuses}
          onChange={(key, value) => updateBonus("skillBonuses", key, value)}
          gridClassName={styles.grid}
          fieldClassName={styles.field}
          keyPrefix={`${draft.key}-skill`}
        />
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <div className={styles.actions}>
        <button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Voltar
        </button>
      </div>
    </section>
  )
}
