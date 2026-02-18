"use client"

import Select from "react-select"
import type { ReactSelectOption } from "./ReactSelectField"

type ReactMultiSelectFieldProps = {
  options: ReactSelectOption[]
  value: ReactSelectOption[]
  onChange: (options: ReactSelectOption[]) => void
  placeholder?: string
  isDisabled?: boolean
}

export function ReactMultiSelectField({
  options,
  value,
  onChange,
  placeholder,
  isDisabled,
}: ReactMultiSelectFieldProps) {
  return (
    <Select
      isMulti
      options={options}
      value={value}
      isDisabled={isDisabled}
      placeholder={placeholder}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      onChange={(next) => onChange(next as ReactSelectOption[])}
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: 40,
          borderRadius: 8,
          borderColor: state.isFocused ? "var(--color-brand-primary)" : "var(--color-border-soft)",
          backgroundColor: "var(--color-bg-surface)",
          boxShadow: state.isFocused ? "var(--shadow-brand-glow)" : "none",
          ":hover": {
            borderColor: "var(--color-brand-primary)",
          },
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-soft)",
          zIndex: 50,
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? "var(--color-bg-hover)" : "var(--color-bg-surface)",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
        }),
        multiValue: (base) => ({
          ...base,
          backgroundColor: "var(--color-brand-soft)",
          border: "1px solid var(--color-border-soft)",
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: "var(--color-text-secondary)",
        }),
        multiValueRemove: (base) => ({
          ...base,
          color: "var(--color-text-secondary)",
          ":hover": {
            backgroundColor: "var(--color-status-danger-soft)",
            color: "var(--color-status-danger-contrast)",
          },
        }),
        input: (base) => ({
          ...base,
          color: "var(--color-text-secondary)",
        }),
        placeholder: (base) => ({
          ...base,
          color: "var(--color-text-muted)",
        }),
        singleValue: (base) => ({
          ...base,
          color: "var(--color-text-secondary)",
        }),
      }}
      theme={(theme) => ({
        ...theme,
        colors: {
          ...theme.colors,
          primary: "#ff6a00",
          primary25: "rgba(255, 106, 0, 0.2)",
          neutral0: "#16181c",
          neutral5: "#20242b",
          neutral10: "#2a2e36",
          neutral20: "#2a2e36",
          neutral30: "#ff6a00",
          neutral40: "#8b9099",
          neutral50: "#8b9099",
          neutral60: "#c9cdd3",
          neutral70: "#c9cdd3",
          neutral80: "#c9cdd3",
          neutral90: "#f5f5f5",
        },
      })}
    />
  )
}
