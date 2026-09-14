import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

export function useUtmParams() {
  const [params] = useSearchParams()

  return useMemo(() => {
    const utm: Record<(typeof UTM_KEYS)[number], string> = {
      utm_source: params.get('utm_source') ?? '',
      utm_medium: params.get('utm_medium') ?? '',
      utm_campaign: params.get('utm_campaign') ?? '',
      utm_content: params.get('utm_content') ?? '',
      utm_term: params.get('utm_term') ?? '',
    }
    const next = new URLSearchParams()
    for (const key of UTM_KEYS) {
      const value = params.get(key)
      if (value) next.set(key, value)
    }
    const query = next.toString()
    return {
      utm,
      query,
      withQuery: (path: string) => (query ? `${path}?${query}` : path),
    }
  }, [params])
}
