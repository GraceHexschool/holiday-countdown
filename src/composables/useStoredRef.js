import { ref, watch } from 'vue'

// 會自動存進 localStorage 的 ref。localStorage 無法使用時（隱私模式等）就退回一般 ref。
export function useStoredRef(key, fallback) {
  let initial = fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) initial = JSON.parse(raw)
  } catch {
    // 忽略讀取錯誤，使用預設值
  }

  const state = ref(initial)
  watch(state, (value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 忽略寫入錯誤
    }
  })
  return state
}
