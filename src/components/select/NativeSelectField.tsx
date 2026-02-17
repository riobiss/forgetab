"use client"

import {
  Children,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
  isValidElement,
  useMemo,
  useState,
} from "react"
import { ReactSelectField, type ReactSelectOption } from "./ReactSelectField"

type NativeSelectFieldProps = {
  id?: string
  name?: string
  className?: string
  value?: string
  defaultValue?: string
  required?: boolean
  disabled?: boolean
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
}

function parseOptions(children: ReactNode): ReactSelectOption[] {
  const options: ReactSelectOption[] = []

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type !== "option") return

    const option = child as ReactElement<{
      value?: string
      disabled?: boolean
      children?: ReactNode
    }>

    const rawValue = option.props.value
    const value = typeof rawValue === "string" ? rawValue : String(rawValue ?? "")
    const labelText = Children.toArray(option.props.children).join("")

    options.push({
      value,
      label: labelText,
      isDisabled: Boolean(option.props.disabled),
    })
  })

  return options
}

export function NativeSelectField({
  id,
  name,
  className,
  value,
  defaultValue,
  required,
  disabled,
  onChange,
  children,
}: NativeSelectFieldProps) {
  const options = useMemo(() => parseOptions(children), [children])
  const [internalValue, setInternalValue] = useState(defaultValue ?? "")
  const selectedValue = value ?? internalValue
  const selectedOption = options.find((option) => option.value === selectedValue) ?? null

  return (
    <>
      <ReactSelectField
        inputId={id}
        classNames={{ container: () => className ?? "" }}
        options={options}
        value={selectedOption}
        onChange={(nextOption) => {
          const nextValue = nextOption?.value ?? ""

          if (value === undefined) {
            setInternalValue(nextValue)
          }

          if (onChange) {
            onChange({ target: { value: nextValue } } as ChangeEvent<HTMLSelectElement>)
          }
        }}
        isDisabled={disabled}
        isSearchable={false}
        isClearable={false}
        required={required}
      />
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
    </>
  )
}
