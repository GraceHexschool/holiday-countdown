import { onMounted, onUnmounted, ref } from 'vue'

// 每秒更新一次「現在時間」，供倒數計時使用。
export function useNow() {
  const now = ref(Date.now())
  let timer

  onMounted(() => {
    timer = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  })
  onUnmounted(() => clearInterval(timer))

  return now
}
