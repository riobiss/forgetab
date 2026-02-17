"use client"

import { useId, useMemo } from "react"
import * as Select from "@radix-ui/react-select"
import styles from "./ReactSelectField.module.css"

export type ReactSelectOption = {
  value: string
  label: string
  isDisabled?: boolean
}

type ReactSelectFieldProps = {
  label?: string
  helpText?: string
  inputId?: string
  options: ReactSelectOption[]
  value?: ReactSelectOption | null
  onChange?: (option: ReactSelectOption | null) => void
  placeholder?: string
  required?: boolean
  isDisabled?: boolean
  isSearchable?: boolean
  isClearable?: boolean
  classNames?: {
    container?: () => string
  }
}

export function ReactSelectField({
  label,
  helpText,
  inputId,
  options,
  value,
  onChange,
  placeholder,
  required,
  isDisabled,
  classNames,
}: ReactSelectFieldProps) {
  const fallbackId = useId()
  const selectId = inputId ?? fallbackId
  const mappedOptions = useMemo(
    () =>
      options.map((option, index) => ({
        option,
        radixValue: option.value === "" ? `__radix_empty__${index}` : option.value,
      })),
    [options],
  )

  const selectedRadixValue =
    mappedOptions.find((entry) => entry.option.value === (value?.value ?? ""))?.radixValue ?? ""

  return (
    <div className={[styles.wrapper, classNames?.container?.()].filter(Boolean).join(" ")}>
      {label ? (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <Select.Root
        value={selectedRadixValue}
        disabled={isDisabled}
        required={required}
        onValueChange={(nextValue) => {
          const selected = mappedOptions.find((entry) => entry.radixValue === nextValue)?.option ?? null
          onChange?.(selected)
        }}
      >
        <Select.Trigger id={selectId} className={styles.control} aria-label={label}>
          <Select.Value
            className={styles.singleValue}
            placeholder={<span className={styles.placeholder}>{placeholder}</span>}
          />
          <Select.Icon className={styles.dropdownIndicator}>▾</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className={styles.menu} position="popper" sideOffset={4}>
            <Select.Viewport className={styles.menuList}>
              {mappedOptions.map(({ option, radixValue }) => (
                <Select.Item
                  key={`${radixValue}-${option.label}`}
                  value={radixValue}
                  disabled={option.isDisabled}
                  className={styles.option}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {helpText ? <p className={styles.helpText}>{helpText}</p> : null}
    </div>
  )
}
