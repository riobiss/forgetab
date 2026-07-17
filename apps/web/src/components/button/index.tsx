import type { ButtonHTMLAttributes, ReactNode } from "react"
import styles from "./index.module.css"

export function Button({
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={styles.confirmButton} {...rest}>
      {children}
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode
  loading?: boolean
  loadingIcon?: ReactNode
  iconPosition?: "left" | "right"
}

export function IconButton({
  icon,
  loading = false,
  loadingIcon,
  iconPosition = "left",
  children,
  className,
  ...rest
}: IconButtonProps) {
  const rootClassName = [styles.iconButton, className].filter(Boolean).join(" ")
  const iconClassName =
    iconPosition === "right" ? styles.iconRight : styles.iconLeft

  return (
    <button className={rootClassName} {...rest}>
      {iconPosition === "left" ? (
        <span className={iconClassName}>
          {loading && loadingIcon ? loadingIcon : icon}
        </span>
      ) : null}
      <span className={styles.iconLabel}>{children}</span>
      {iconPosition === "right" ? (
        <span className={iconClassName}>
          {loading && loadingIcon ? loadingIcon : icon}
        </span>
      ) : null}
    </button>
  )
}
