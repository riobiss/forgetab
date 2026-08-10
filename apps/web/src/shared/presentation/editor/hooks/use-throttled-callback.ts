import throttle from "lodash.throttle"
import { useEffect, useMemo, useRef } from "react"

interface ThrottleSettings {
  leading?: boolean | undefined
  trailing?: boolean | undefined
}

const defaultOptions: ThrottleSettings = {
  leading: false,
  trailing: true
}

/**
 * Returns a stable throttled function that always calls the latest callback.
 */
export function useThrottledCallback<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  wait = 250,
  options: ThrottleSettings = defaultOptions
) {
  const callbackRef = useRef(fn)
  callbackRef.current = fn
  const leading = options.leading ?? defaultOptions.leading
  const trailing = options.trailing ?? defaultOptions.trailing

  const handler = useMemo(
    () =>
      throttle((...args: TArgs) => callbackRef.current(...args), wait, {
        leading,
        trailing
      }),
    [leading, trailing, wait]
  )

  useEffect(() => () => handler.cancel(), [handler])

  return handler
}

export default useThrottledCallback
