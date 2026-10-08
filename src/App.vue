<script setup>
import { computed, watchEffect } from 'vue'
import { holidays } from './data/holidays'
import { useNow } from './composables/useNow'
import { useStoredRef } from './composables/useStoredRef'

const now = useNow()

// 記在瀏覽器：同事手動選的倒數目標（null = 自動選下一個連假）、主題
const pinnedId = useStoredRef('holiday-countdown:pinned', null)
const theme = useStoredRef('holiday-countdown:theme', 'auto')

watchEffect(() => {
  const root = document.documentElement
  if (theme.value === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme.value)
})

const WEEK = ['日', '一', '二', '三', '四', '五', '六']
const DAY = 86400000

const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}（${WEEK[d.getDay()]}）`

// 補上開始、結束（隔天 00:00）時間與天數
const list = computed(() =>
  holidays.map((h) => {
    const start = parse(h.start)
    const end = parse(h.end)
    const endAt = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)
    return {
      ...h,
      startAt: start.getTime(),
      endAt: endAt.getTime(),
      length: Math.round((endAt - start) / DAY),
      range: `${fmt(start)} – ${fmt(end)}`,
      year: start.getFullYear(),
    }
  }),
)

const remaining = computed(() => list.value.filter((h) => h.endAt > now.value))
const hasData = computed(() => remaining.value.length > 0)

const current = computed(() => {
  const pinned = remaining.value.find((h) => h.id === pinnedId.value)
  return pinned ?? remaining.value[0] ?? null
})
const isAuto = computed(() => !remaining.value.some((h) => h.id === pinnedId.value))

const ongoing = computed(() => current.value && now.value >= current.value.startAt)

const diff = computed(() => {
  if (!current.value) return null
  const target = ongoing.value ? current.value.endAt : current.value.startAt
  const total = Math.max(0, Math.floor((target - now.value) / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
})

const units = computed(() =>
  diff.value
    ? [
        ['天', diff.value.days],
        ['時', diff.value.hours],
        ['分', diff.value.minutes],
        ['秒', diff.value.seconds],
      ]
    : [],
)

// 距離放假還要上幾天班（以「平日」粗估，不含補班，因為近年皆為補假不補班）
const workdaysLeft = computed(() => {
  if (!current.value || ongoing.value) return 0
  let count = 0
  const d = new Date(now.value)
  d.setHours(0, 0, 0, 0)
  while (d.getTime() < current.value.startAt) {
    const wd = d.getDay()
    const isHoliday = list.value.some((h) => d.getTime() >= h.startAt && d.getTime() < h.endAt)
    if (wd !== 0 && wd !== 6 && !isHoliday) count++
    d.setDate(d.getDate() + 1)
  }
  return count
})

const daysUntil = (h) => {
  if (now.value >= h.startAt) return '進行中'
  return `還有 ${Math.ceil((h.startAt - now.value) / DAY)} 天`
}

const pin = (h) => {
  pinnedId.value = h.id
}
const cycleTheme = () => {
  const order = ['auto', 'light', 'dark']
  theme.value = order[(order.indexOf(theme.value) + 1) % order.length]
}
const themeLabel = computed(() => ({ auto: '跟隨系統', light: '淺色', dark: '深色' })[theme.value])

const pad = (n) => String(n).padStart(2, '0')
</script>

<template>
  <main class="page">
    <header class="top">
      <h1>連假倒數</h1>
      <button class="ghost" type="button" @click="cycleTheme">主題：{{ themeLabel }}</button>
    </header>

    <section v-if="current" class="hero" :class="{ on: ongoing }" aria-live="polite">
      <p class="eyebrow">
        {{ ongoing ? '連假進行中，距離收假還有' : isAuto ? '下一個連假' : '你選的連假' }}
      </p>
      <h2>{{ current.name }}</h2>
      <p class="range">{{ current.range }} · 共 {{ current.length }} 天</p>

      <div class="clock" role="timer">
        <div v-for="[label, value] in units" :key="label" class="cell">
          <span class="num">{{ label === '天' ? value : pad(value) }}</span>
          <span class="unit">{{ label }}</span>
        </div>
      </div>

      <p v-if="!ongoing" class="hint">
        還要上 <strong>{{ workdaysLeft }}</strong> 天班
      </p>
      <p v-else class="hint">好好享受假期 🎉</p>

      <button v-if="!isAuto" class="ghost small" type="button" @click="pinnedId = null">
        改回自動顯示下一個連假
      </button>
    </section>

    <section v-else class="hero">
      <h2>目前清單內的連假都過完了</h2>
      <p class="hint">請更新 <code>src/data/holidays.js</code> 加入新的連假日期。</p>
    </section>

    <section v-if="hasData" class="upcoming">
      <h3>接下來的連假</h3>
      <ul>
        <li v-for="h in remaining" :key="h.id">
          <button
            type="button"
            class="row"
            :class="{ active: current && h.id === current.id }"
            @click="pin(h)"
          >
            <span class="info">
              <strong>{{ h.name }}</strong>
              <small>{{ h.range }} · {{ h.length }} 天</small>
            </span>
            <span class="when">{{ daysUntil(h) }}</span>
          </button>
        </li>
      </ul>
      <p class="note">點一下連假就可以改成倒數它，選擇會記在這台電腦的瀏覽器裡。</p>
    </section>

    <footer>
      日期依行政院人事行政總處公布之辦公日曆表整理，實際放假請以公司公告為準。
    </footer>
  </main>
</template>
