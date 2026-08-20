import { useEffect, useState } from 'react'

export function useDataset(path, server, fallback) {
  const [state, setState] = useState({ data: fallback, meta: { status: 'loading' }, loading: true })

  useEffect(() => {
    const controller = new AbortController()
    setState((current) => ({ ...current, loading: true }))
    fetch(`${path}?server=${encodeURIComponent(server)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then((payload) => setState({ data: payload.data, meta: payload.meta, loading: false }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        setState({ data: fallback, meta: { status: 'demo', note: `接口不可用，使用本地回退：${error.message}` }, loading: false })
      })
    return () => controller.abort()
  }, [path, server])

  return state
}

export function sourceLabel(meta) {
  if (!meta || meta.status === 'loading') return '正在读取数据'
  if (meta.status === 'live') return `公开数据 · ${meta.sourceName || '已连接来源'}`
  if (meta.status === 'manual-verified') return '人工校验规则'
  if (meta.status === 'demo') return '演示数据'
  if (meta.status === 'unavailable') return '暂无已验证来源'
  return meta.sourceName || '数据来源待确认'
}
