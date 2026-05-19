import type { FormEvent } from "react"
import { Dice5 } from "lucide-react"
import {
  DICE_ROLL_MAX_COUNT,
  DICE_ROLL_MAX_SIDES,
  PRESET_DICE_SIDES,
} from "@/application/dices/types"
import styles from "../DicesPage.module.css"

type DiceControlsProps = {
  currentFormula: string
  diceCount: string
  diceSides: string
  modifier: string
  customSides: number[]
  customDiceSidesDraft: string
  error: string | null
  isCustomDiceOpen: boolean
  isRolling: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onStartHold: (action: () => void) => void
  onStopHold: () => void
  onAdjustDiceCount: (delta: number) => void
  onUpdateDiceCount: (value: string) => void
  onAdjustModifier: (delta: number) => void
  onUpdateModifier: (value: string) => void
  onSelectDiceSides: (diceSides: number) => void
  onToggleCustomDice: () => void
  onUpdateCustomDiceSidesDraft: (value: string) => void
  onAddCustomDiceSides: () => void
  onRoll: () => void
}

export function DiceControls({
  currentFormula,
  diceCount,
  diceSides,
  modifier,
  customSides,
  customDiceSidesDraft,
  error,
  isCustomDiceOpen,
  isRolling,
  onSubmit,
  onStartHold,
  onStopHold,
  onAdjustDiceCount,
  onUpdateDiceCount,
  onAdjustModifier,
  onUpdateModifier,
  onSelectDiceSides,
  onToggleCustomDice,
  onUpdateCustomDiceSidesDraft,
  onAddCustomDiceSides,
  onRoll,
}: DiceControlsProps) {
  return (
    <>
      <div className={styles.formulaPreview} aria-label="Dados selecionados">
        {currentFormula}
      </div>

      <form className={styles.rollForm} onSubmit={onSubmit}>
        <div className={styles.stepperField}>
          <span>Quantidade</span>
          <div className={styles.stepperControl}>
            <button
              type="button"
              onPointerDown={() => onStartHold(() => onAdjustDiceCount(-1))}
              onPointerUp={onStopHold}
              onPointerLeave={onStopHold}
              onPointerCancel={onStopHold}
              aria-label="Diminuir quantidade"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={DICE_ROLL_MAX_COUNT}
              value={diceCount}
              onChange={(event) => onUpdateDiceCount(event.target.value)}
              aria-label="Quantidade de dados"
            />
            <button
              type="button"
              onPointerDown={() => onStartHold(() => onAdjustDiceCount(1))}
              onPointerUp={onStopHold}
              onPointerLeave={onStopHold}
              onPointerCancel={onStopHold}
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
        </div>

        <div className={styles.stepperField}>
          <span>Modificar</span>
          <div className={styles.stepperControl}>
            <button
              type="button"
              onPointerDown={() => onStartHold(() => onAdjustModifier(-1))}
              onPointerUp={onStopHold}
              onPointerLeave={onStopHold}
              onPointerCancel={onStopHold}
              aria-label="Diminuir modificador"
            >
              -
            </button>
            <input
              type="number"
              value={modifier}
              onChange={(event) => onUpdateModifier(event.target.value)}
              aria-label="Modificador"
            />
            <button
              type="button"
              onPointerDown={() => onStartHold(() => onAdjustModifier(1))}
              onPointerUp={onStopHold}
              onPointerLeave={onStopHold}
              onPointerCancel={onStopHold}
              aria-label="Aumentar modificador"
            >
              +
            </button>
          </div>
        </div>
      </form>

      <div className={styles.dicePicker} aria-label="Lados do dado">
        {PRESET_DICE_SIDES.map((side) => (
          <button
            key={side}
            type="button"
            className={`${styles.dicePresetButton} ${Number(diceSides) === side ? styles.dicePresetButtonActive : ""}`}
            onClick={() => onSelectDiceSides(side)}
          >
            d{side}
          </button>
        ))}
        <button
          type="button"
          className={`${styles.dicePresetButton} ${isCustomDiceOpen ? styles.dicePresetButtonActive : ""}`}
          onClick={onToggleCustomDice}
        >
          Customizavel
        </button>
      </div>

      {isCustomDiceOpen ? (
        <div className={styles.customDicePanel}>
          <div className={styles.customDiceControls}>
            <label className={styles.diceField}>
              <span>Lados custom</span>
              <input
                type="number"
                min={2}
                max={DICE_ROLL_MAX_SIDES}
                value={customDiceSidesDraft}
                onChange={(event) => onUpdateCustomDiceSidesDraft(event.target.value)}
              />
            </label>
            <button type="button" className={styles.customDiceAddButton} onClick={onAddCustomDiceSides}>
              Adicionar
            </button>
          </div>

          {customSides.length > 0 ? (
            <div className={styles.customDiceList}>
              {customSides.map((side) => (
                <button
                  key={side}
                  type="button"
                  className={`${styles.dicePresetButton} ${Number(diceSides) === side ? styles.dicePresetButtonActive : ""}`}
                  onClick={() => onSelectDiceSides(side)}
                >
                  d{side}
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.customDiceEmpty}>Nenhum dado customizado criado.</p>
          )}
        </div>
      ) : null}

      <button type="button" className={styles.rollButton} disabled={isRolling} onClick={onRoll}>
        <Dice5 size={18} />
        {isRolling ? "Girando..." : "Girar"}
      </button>

      {error ? <p className={styles.errorMessage}>{error}</p> : null}
    </>
  )
}
