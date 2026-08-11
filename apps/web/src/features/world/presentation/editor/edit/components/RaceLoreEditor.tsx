import {
  createDefaultRaceLore,
  type RaceLore
} from "@forgetab/world-contracts/rpg/raceLore"
import type { IdentityTemplateDraft } from "@/features/world/presentation/editor/edit/advanced/types"
import styles from "./AdvancedIdentityEditor.module.css"

type Props = {
  draft: IdentityTemplateDraft
  lore: RaceLore
  onChange: (next: IdentityTemplateDraft) => void
}

const linesToText = (lines: string[]) => lines.join("\n")
const parseLines = (value: string) => value.split("\n")

export default function RaceLoreEditor({ draft, lore, onChange }: Props) {
  const updateLore = (nextLore: RaceLore) =>
    onChange({ ...draft, lore: nextLore })

  function updateArrayField(
    field: "thoughts" | "notableFigures" | "racialTraits" | "commonClasses",
    value: string
  ) {
    updateLore({ ...lore, [field]: parseLines(value) })
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
    value: string
  ) {
    updateLore({
      ...lore,
      kingdoms: lore.kingdoms.map((kingdom, currentIndex) => {
        if (currentIndex !== index) return kingdom
        if (field === "name" || field === "description") {
          return { ...kingdom, [field]: value }
        }
        return { ...kingdom, [field]: parseLines(value) }
      })
    })
  }

  function updateVariationField(
    index: number,
    field: "name" | "description" | "traits",
    value: string
  ) {
    updateLore({
      ...lore,
      variations: lore.variations.map((variation, currentIndex) => {
        if (currentIndex !== index) return variation
        return field === "traits"
          ? { ...variation, traits: parseLines(value) }
          : { ...variation, [field]: value }
      })
    })
  }

  return (
    <section className={styles.section}>
      <h2>Lore da raca</h2>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => updateLore(createDefaultRaceLore(draft.label))}
        >
          Inserir estrutura padrao
        </button>
      </div>

      <label className={styles.field}>
        <span>Resumo</span>
        <textarea
          value={lore.summary}
          onChange={(event) =>
            updateLore({ ...lore, summary: event.target.value })
          }
          rows={3}
        />
      </label>

      <label className={styles.field}>
        <span>Origem</span>
        <textarea
          value={lore.origin}
          onChange={(event) =>
            updateLore({ ...lore, origin: event.target.value })
          }
          rows={5}
        />
      </label>

      <label className={styles.field}>
        <span>O que alguns pensam (1 linha por item)</span>
        <textarea
          value={linesToText(lore.thoughts)}
          onChange={(event) => updateArrayField("thoughts", event.target.value)}
          rows={4}
        />
      </label>

      <section className={styles.subSection}>
        <div className={styles.inlineHeader}>
          <h3>Reinos</h3>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              updateLore({
                ...lore,
                kingdoms: [
                  ...lore.kingdoms,
                  {
                    name: "",
                    description: "",
                    culture: [],
                    physicalTraits: [],
                    clothing: [],
                    commonNames: []
                  }
                ]
              })
            }
          >
            Adicionar reino
          </button>
        </div>
        {lore.kingdoms.length === 0 ? (
          <p className={styles.hint}>Nenhum reino cadastrado.</p>
        ) : null}
        {lore.kingdoms.map((kingdom, index) => (
          <article className={styles.itemCard} key={`kingdom-${index}`}>
            <div className={styles.inlineHeader}>
              <h4>Reino {index + 1}</h4>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() =>
                  updateLore({
                    ...lore,
                    kingdoms: lore.kingdoms.filter(
                      (_, currentIndex) => currentIndex !== index
                    )
                  })
                }
              >
                Remover
              </button>
            </div>

            <label className={styles.field}>
              <span>Nome do reino</span>
              <input
                type="text"
                value={kingdom.name}
                onChange={(event) =>
                  updateKingdomField(index, "name", event.target.value)
                }
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
            {(
              [
                ["culture", "Cultura"],
                ["physicalTraits", "Caracteristicas fisicas"],
                ["clothing", "Vestuario"],
                ["commonNames", "Nomes comuns"]
              ] as const
            ).map(([field, label]) => (
              <label className={styles.field} key={field}>
                <span>{label} (1 linha por item)</span>
                <textarea
                  rows={3}
                  value={linesToText(kingdom[field])}
                  onChange={(event) =>
                    updateKingdomField(index, field, event.target.value)
                  }
                />
              </label>
            ))}
          </article>
        ))}
      </section>

      {(
        [
          ["notableFigures", "Figuras marcantes"],
          ["racialTraits", "Tracos raciais"],
          ["commonClasses", "Classes comuns"]
        ] as const
      ).map(([field, label]) => (
        <label className={styles.field} key={field}>
          <span>{label} (1 linha por item)</span>
          <textarea
            value={linesToText(lore[field])}
            onChange={(event) => updateArrayField(field, event.target.value)}
            rows={4}
          />
        </label>
      ))}

      <section className={styles.subSection}>
        <div className={styles.inlineHeader}>
          <h3>Variacoes</h3>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              updateLore({
                ...lore,
                variations: [
                  ...lore.variations,
                  { name: "", description: "", traits: [] }
                ]
              })
            }
          >
            Adicionar variacao
          </button>
        </div>
        {lore.variations.length === 0 ? (
          <p className={styles.hint}>Nenhuma variacao cadastrada.</p>
        ) : null}
        {lore.variations.map((variation, index) => (
          <article className={styles.itemCard} key={`variation-${index}`}>
            <div className={styles.inlineHeader}>
              <h4>Variacao {index + 1}</h4>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() =>
                  updateLore({
                    ...lore,
                    variations: lore.variations.filter(
                      (_, currentIndex) => currentIndex !== index
                    )
                  })
                }
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
  )
}
