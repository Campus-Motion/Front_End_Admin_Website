import { useState, useCallback } from 'react'

/**
 * Manages the lifecycle of an async operation.
 * Returns { run, loading, error, data }.
 */
export function useAsync(asyncFn) {
  const [state, setState] = useState({ loading: false, error: null, data: null })

  const run = useCallback(
    async (...args) => {
      setState({ loading: true, error: null, data: null })
      try {
        const data = await asyncFn(...args)
        setState({ loading: false, error: null, data })
        return data
      } catch (err) {
        setState({ loading: false, error: err.message ?? 'Unknown error', data: null })
        throw err
      }
    },
    [asyncFn]
  )

  return { ...state, run }
}
