import type {
  CatalogRichTextField,
  EntityCatalogMeta
} from "@/features/world/catalog/domain/types"
import { createDefaultRaceLore } from "@forgetab/world-contracts/rpg/raceLore"
import type { IdentityTemplateDraft } from "@/features/world/presentation/editor/edit/advanced/types"
import type { AttributeTemplate } from "./shared/types"
import NumericTemplateGrid from "@/features/world/presentation/components/NumericTemplateGrid"
import RaceLoreEditor from "./RaceLoreEditor"
import RichTextField from "./shared/RichTextField"
import styles from "./AdvancedIdentityEditor.module.css"

type IdentityType = "race" | "class"

type Props = {
  type: IdentityType
  mode: "create" | "edit"
  draft: IdentityTemplateDraft
  attributeTemplates: AttributeTemplate[]
  skillTemplates: Array<{ key: string; label: string }>
  saving: boolean
  error: string
  success: string
  onChange: (next: IdentityTemplateDraft) => void
  onSave: () => Promise<void>
  onCancel: () => void
}

const RICH_TEXT_FIELDS: Record<
  IdentityType,
  Array<{
    key: CatalogRichTextField
    label: string
    description: string
  }>
> = {
  race: [
    {
      key: "description",
      label: "Descricao",
      description: "Apresentacao principal da raca."
    },
    {
      key: "origin",
      label: "Origem",
      description: "Contexto de origem com editor rico."
    },
    {
      key: "kingdoms",
      label: "Reinos",
      description: "Texto rico para reinos, regioes e expansao politica."
    },
    {
      key: "lore",
      label: "Lore",
      description: "Lore livre para aprofundamento narrativo."
    },
    {
      key: "notes",
      label: "Observacoes",
      description: "Notas internas ou observacoes finais."
    }
  ],
  class: [
    {
      key: "description",
      label: "Descricao",
      description: "Apresentacao principal da classe."
    },
    {
      key: "lore",
      label: "Lore",
      description: "Lore, identidade e estilo narrativo da classe."
    },
    {
      key: "notes",
      label: "Observacoes",
      description: "Detalhes opcionais, restricoes e notas."
    }
  ]
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
  onCancel
}: Props) {
  const typeLabel = type === "race" ? "Raca" : "Classe"
  const updateCatalogMeta = (catalogMeta: EntityCatalogMeta) =>
    onChange({ ...draft, catalogMeta })
  const updateBonus = (
    scope: "attributeBonuses" | "skillBonuses",
    key: string,
    value: string
  ) =>
    onChange({
      ...draft,
      [scope]: { ...draft[scope], [key]: Number(value) }
    })

  return (
    <section className={styles.panel}>
      <h1>{`${mode === "create" ? "Criar" : "Editar"} ${typeLabel}`}</h1>

      <label className={styles.field}>
        <span>Nome</span>
        <input
          type="text"
          value={draft.label}
          onChange={(event) =>
            onChange({
              ...draft,
              label: event.target.value,
              ...(type === "race" && !draft.lore
                ? { lore: createDefaultRaceLore(event.target.value) }
                : {})
            })
          }
          placeholder={type === "race" ? "Nome da raca" : "Nome da classe"}
        />
      </label>

      <label className={styles.field}>
        <span>Categoria</span>
        <input
          type="text"
          value={draft.category ?? "geral"}
          onChange={(event) =>
            onChange({ ...draft, category: event.target.value })
          }
          placeholder={
            type === "race"
              ? "Ex.: ancestrais, humanoides..."
              : "Ex.: marcial, mistica..."
          }
        />
      </label>

      <label className={styles.field}>
        <span>Descricao curta</span>
        <textarea
          value={draft.catalogMeta.shortDescription ?? ""}
          onChange={(event) =>
            updateCatalogMeta({
              ...draft.catalogMeta,
              shortDescription: event.target.value.trim() || null
            })
          }
          rows={3}
          placeholder="Texto curto para cards, busca e catalogo."
        />
      </label>

      <section className={styles.section}>
        <h2>Conteudo rico</h2>
        {RICH_TEXT_FIELDS[type].map((field) => (
          <RichTextField
            key={field.key}
            label={field.label}
            description={field.description}
            value={
              draft.catalogMeta.richText[field.key] as
                | Record<string, unknown>
                | null
                | undefined
            }
            onChange={(value) =>
              updateCatalogMeta({
                ...draft.catalogMeta,
                richText: {
                  ...draft.catalogMeta.richText,
                  [field.key]: value as Record<string, unknown>
                }
              })
            }
          />
        ))}
      </section>

      {type === "race" ? (
        <RaceLoreEditor
          draft={draft}
          lore={draft.lore ?? createDefaultRaceLore(draft.label)}
          onChange={onChange}
        />
      ) : null}

      <section className={styles.section}>
        <h2>Bonus de atributos</h2>
        <NumericTemplateGrid
          items={attributeTemplates.map(({ key, label }) => ({ key, label }))}
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
          items={skillTemplates}
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
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onCancel}
        >
          Voltar
        </button>
      </div>
    </section>
  )
}
