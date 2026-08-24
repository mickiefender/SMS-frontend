"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getErrorMessage } from "@/lib/api"

/**
 * Small data-fetching hook for Super Admin pages.
 * Handles loading/error state and exposes a stable `reload`.
 */
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const reload = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await fetcherRef.current()
      setData(result)
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load data."))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    reload()
  }, [reload])

  return { data, loading, error, reload, setData }
}
