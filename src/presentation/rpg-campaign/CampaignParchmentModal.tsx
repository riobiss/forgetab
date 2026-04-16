"use client"

import { useMemo, useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react"
import { ImagePlus, X } from "lucide-react"
import Image from "next/image"
import { ReactSelectField, type ReactSelectOption } from "@/components/select/ReactSelectField"
import controlStyles from "./CampaignActionControls.module.css"
import styles from "./RpgCampaignRoomPage.module.css"
import parchmentStyles from "./CampaignParchmentModal.module.css"

export const parchmentFontOptions: ReactSelectOption[] = [
  { value: "cinzel", label: "Cinzel" },
  { value: "cinzel-decorative", label: "Cinzel Decorative" },
  { value: "playfair-display", label: "Playfair Display" },
  { value: "im-fell-english", label: "IM Fell English" },
  { value: "cormorant-garamond", label: "Cormorant Garamond" },
  { value: "merriweather", label: "Merriweather" },
]

export const parchmentTemplateOptions: ReactSelectOption[] = [
  { value: "classic", label: "Pergaminho antigo" },
  { value: "pure", label: "Pure CSS Parchment" },
  { value: "scroll", label: "Pergaminho com rolo" },
]

const PARCHMENT_TEXT_MAX_LENGTH = 4000

const parchmentFontFamilyByValue: Record<string, string> = {
  cinzel: '"Cinzel", Georgia, serif',
  "cinzel-decorative": '"Cinzel Decorative", "Cinzel", Georgia, serif',
  "playfair-display": '"Playfair Display", Georgia, serif',
  "im-fell-english": '"IM Fell English", Georgia, serif',
  "cormorant-garamond": '"Cormorant Garamond", Georgia, serif',
  merriweather: '"Merriweather", Georgia, serif',
  "pure-default": '"UnifrakturMaguntia", cursive',
  georgia: 'Georgia, "Times New Roman", serif',
}

export type CampaignParchmentDraft = {
  template: string
  title: string
  font: string
  crestImage: string
  text: string
  signature: string
  signatureImage: string
}

export type CampaignParchmentPreviewData = CampaignParchmentDraft

type Props = {
  isBusy: boolean
  isUploading: boolean
  onClose: () => void
  onUploadImage: (file: File) => Promise<string | null>
  onSubmit: (draft: CampaignParchmentDraft) => void
}

const emptyDraft: CampaignParchmentDraft = {
  template: parchmentTemplateOptions[0]?.value ?? "classic",
  title: "",
  font: parchmentFontOptions[0]?.value ?? "cinzel",
  crestImage: "",
  text: "",
  signature: "",
  signatureImage: "",
}

function canPreviewImage(src: string) {
  const value = src.trim()
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")
}

export function getParchmentFontFamily(font: string) {
  return parchmentFontFamilyByValue[font] ?? parchmentFontFamilyByValue.cinzel
}

export function CampaignParchmentPreview({
  parchment,
  compact = false,
}: {
  parchment: CampaignParchmentPreviewData
  compact?: boolean
}) {
  const title = parchment.title.trim()
  const isScrollTemplate = parchment.template === "scroll"
  const isPureTemplate = parchment.template === "pure"
  const isClassicTemplate = parchment.template === "classic"
  const previewStyle = {
    "--parchment-font-family": isPureTemplate
      ? getParchmentFontFamily("pure-default")
      : isClassicTemplate
        ? '"Bilbo Swash Caps", cursive'
        : getParchmentFontFamily(parchment.font),
  } as CSSProperties
  const textParagraphs = parchment.text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <div
      className={[
        parchmentStyles.previewPanel,
        compact ? parchmentStyles.previewPanelCompact : "",
        isScrollTemplate ? parchmentStyles.previewPanelScroll : parchmentStyles.previewPanelClassic,
        isPureTemplate ? parchmentStyles.previewPanelPure : "",
      ].filter(Boolean).join(" ")}
      style={previewStyle}
      aria-label="Pergaminho"
    >
      <div className={parchmentStyles.parchmentBack} />
      <article className={parchmentStyles.parchmentContent}>
        {isScrollTemplate ? (
          <div className={parchmentStyles.scrollHeaderContent}>
            {canPreviewImage(parchment.crestImage) ? (
              <div className={parchmentStyles.senderMark}>
                <Image src={parchment.crestImage.trim()} alt="" width={96} height={96} unoptimized />
              </div>
            ) : null}
            {title ? <h3>{title}</h3> : null}
          </div>
        ) : (
          <>
            {canPreviewImage(parchment.crestImage) ? (
              <div className={parchmentStyles.senderMark}>
                <Image src={parchment.crestImage.trim()} alt="" width={96} height={96} unoptimized />
              </div>
            ) : null}
            {title ? <h3>{title}</h3> : null}
          </>
        )}
        {textParagraphs.length > 0 ? (
          textParagraphs.map((paragraph, index) => <p key={`${paragraph}-${index}`}>{paragraph}</p>)
        ) : (
          <p className={parchmentStyles.placeholder}>A tinta ainda aguarda a ordem.</p>
        )}
        {!isScrollTemplate ? (
          <>
            {canPreviewImage(parchment.signatureImage) ? (
              <div className={parchmentStyles.signatureMark}>
                <Image src={parchment.signatureImage.trim()} alt="" width={112} height={112} unoptimized />
              </div>
            ) : null}
            {parchment.signature.trim() ? <p className={parchmentStyles.signature}>{parchment.signature.trim()}</p> : null}
          </>
        ) : null}
      </article>
    </div>
  )
}

export function CampaignParchmentModal({
  isBusy,
  isUploading,
  onClose,
  onUploadImage,
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState(emptyDraft)
  const selectedFontOption = useMemo(
    () => parchmentFontOptions.find((option) => option.value === draft.font) ?? parchmentFontOptions[0] ?? null,
    [draft.font],
  )
  const selectedTemplateOption = useMemo(
    () => parchmentTemplateOptions.find((option) => option.value === draft.template) ?? parchmentTemplateOptions[0] ?? null,
    [draft.template],
  )
  const isScrollTemplate = draft.template === "scroll"

  function updateField(field: keyof CampaignParchmentDraft, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }))
  }

  async function handleImageChange(field: "crestImage" | "signatureImage", event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null
    event.currentTarget.value = ""
    if (!file) {
      return
    }

    const uploadedUrl = await onUploadImage(file)
    if (uploadedUrl) {
      updateField(field, uploadedUrl)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(draft)
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={parchmentStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="parchment-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="parchment-title" className={styles.actionModalTitle}>
            Pergaminho
          </h2>
          <button type="button" className={styles.closeChatButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form className={parchmentStyles.layout} onSubmit={handleSubmit}>
          <div className={parchmentStyles.formPanel}>
            <ReactSelectField
              label="Pergaminhos"
              options={parchmentTemplateOptions}
              value={selectedTemplateOption}
              onChange={(option) =>
                updateField("template", option?.value ?? parchmentTemplateOptions[0]?.value ?? "classic")
              }
              placeholder="Escolha o modelo"
            />

            <label className={controlStyles.locationField}>
              <span>Titulo</span>
              <input
                value={draft.title}
                onChange={(event) => updateField("title", event.target.value)}
                maxLength={160}
                placeholder="Convocacao real"
              />
            </label>

            <fieldset className={parchmentStyles.imageGroup}>
              <legend>Brasao</legend>
              <label className={controlStyles.locationField}>
                <span>Url da imagem</span>
                <input
                  value={draft.crestImage}
                  onChange={(event) => updateField("crestImage", event.target.value)}
                  placeholder="Opcional"
                />
              </label>
              <label className={parchmentStyles.fileButton}>
                <ImagePlus size={16} />
                Enviar imagem
                <input type="file" accept="image/*" onChange={(event) => void handleImageChange("crestImage", event)} />
              </label>
            </fieldset>

            <label className={controlStyles.locationField}>
              <span>Texto</span>
              <textarea
                value={draft.text}
                onChange={(event) => updateField("text", event.target.value)}
                minLength={2}
                maxLength={PARCHMENT_TEXT_MAX_LENGTH}
                required
                placeholder="Escreva a mensagem do pergaminho"
              />
            </label>

            {!isScrollTemplate ? (
              <>
              <label className={controlStyles.locationField}>
                <span>Assinatura</span>
                <input
                  value={draft.signature}
                  onChange={(event) => updateField("signature", event.target.value)}
                  maxLength={140}
                  placeholder="Opcional"
                />
              </label>

              <fieldset className={parchmentStyles.imageGroup}>
              <legend>Imagem de Assinatura</legend>
              <label className={controlStyles.locationField}>
                <span>Url da imagem</span>
                <input
                  value={draft.signatureImage}
                  onChange={(event) => updateField("signatureImage", event.target.value)}
                  placeholder="Opcional"
                />
              </label>
              <label className={parchmentStyles.fileButton}>
                <ImagePlus size={16} />
                Enviar imagem
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleImageChange("signatureImage", event)}
                />
              </label>
            </fieldset>
              </>
            ) : null}

            <button type="submit" className={styles.rollSubmitButton} disabled={isBusy || isUploading}>
              {isUploading ? "Enviando imagem..." : isBusy ? "Criando..." : "Criar pergaminho"}
            </button>
          </div>

          <div className={parchmentStyles.previewColumn}>
            <ReactSelectField
              label="Font"
              options={parchmentFontOptions}
              value={selectedFontOption}
              onChange={(option) => updateField("font", option?.value ?? parchmentFontOptions[0]?.value ?? "cinzel")}
              placeholder="Escolha uma fonte"
            />
            <CampaignParchmentPreview parchment={draft} />
          </div>
        </form>

        <svg className={parchmentStyles.filterSvg} aria-hidden="true" focusable="false">
          <filter id="campaign-parchment-wavy">
            <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed="1" />
            <feDisplacementMap in="SourceGraphic" scale="16" />
          </filter>
          <filter id="campaign-parchment-fiber">
            <feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="8" seed="42" />
            <feDisplacementMap in="SourceGraphic" scale="10" />
          </filter>
          <filter id="campaign-parchment-shadow">
            <feTurbulence type="fractalNoise" baseFrequency=".01" numOctaves="10" seed="42" />
            <feDisplacementMap in="SourceGraphic" scale="80" />
          </filter>
        </svg>
      </section>
    </div>
  )
}
