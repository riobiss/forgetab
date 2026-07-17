"use client"

import * as Switch from "@radix-ui/react-switch"
import styles from "./RadixSwitchField.module.css"

type Props = {
  id?: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export default function RadixSwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: Props) {
  return (
    <div className={styles.switchRow}>
      <div className={styles.switchText}>
        <label htmlFor={id} className={styles.switchLabel}>
          {label}
        </label>
        {description ? <span className={styles.switchDescription}>{description}</span> : null}
      </div>
      <Switch.Root
        id={id}
        className={styles.root}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      >
        <Switch.Thumb className={styles.thumb} />
      </Switch.Root>
    </div>
  )
}
