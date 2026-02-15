"use client"

type TemplateItem = {
  key: string
  label: string
}

type Props = {
  items: TemplateItem[]
  values: Record<string, number | "">
  onChange: (key: string, value: string) => void
  gridClassName: string
  fieldClassName: string
  keyPrefix: string
  min?: number
  disabled?: boolean
  required?: boolean
}

export default function NumericTemplateGrid({
  items,
  values,
  onChange,
  gridClassName,
  fieldClassName,
  keyPrefix,
  min,
  disabled = false,
  required = false,
}: Props) {
  return (
    <div className={gridClassName}>
      {items.map((item) => (
        <label className={fieldClassName} key={`${keyPrefix}-${item.key}`}>
          <span>{item.label}</span>
          <input
            type="number"
            min={min}
            value={values[item.key] ?? ""}
            onChange={(event) => onChange(item.key, event.target.value)}
            disabled={disabled}
            required={required}
          />
        </label>
      ))}
    </div>
  )
}
