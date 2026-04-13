/**
 * useCo2Stats.ts  —  hooks/useCo2Stats.ts
 *
 * Fetches and memoises CO2 savings data from Firestore.
 * Re-fetches whenever `enabled` changes (e.g. when the Sustainability tab
 * becomes active) to avoid unnecessary reads on page load.
 */

import { useState, useEffect } from "react"
import { getCo2Stats, type Co2Stats } from "@/lib/firestore/services/co2"

interface UseCo2StatsResult {
  data: Co2Stats | null
  loading: boolean
  error: string | null
  /** Call to manually re-trigger the fetch (e.g. a refresh button). */
  refetch: () => void
}

/**
 * @param enabled  When false the hook skips the Firestore fetch entirely.
 *                 Defaults to true. Pass `false` until the Sustainability
 *                 tab is selected to defer the query.
 */
export function useCo2Stats(enabled = true): UseCo2StatsResult {
  const [data, setData] = useState<Co2Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)
      try {
        const stats = await getCo2Stats()
        if (!cancelled) setData(stats)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load CO2 data. Check Firestore permissions."
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [enabled, fetchKey])

  return {
    data,
    loading,
    error,
    refetch: () => setFetchKey((k) => k + 1),
  }
}
