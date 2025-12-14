import { useMemo, useEffect, useRef, useState } from 'react'
import type React from 'react'
import {
  ChevronDown,
  Mic,
  Moon,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Sun,
} from 'lucide-react'

/**
 * 說明
 * 這份版本是為了修正「@ 路徑別名」在沙盒環境無法解析的問題。
 * 因此：
 * 1) 移除所有以 "@/" 開頭的 import（包含 assets 與 shadcn 路徑）。
 * 2) 以輕量的本地 UI 元件（SimpleButton）替代。
 *
 * 目前展示規則（依你最新需求彙整）：
 * - 爬蟲：保留 Run log，且為「動態逐行輸出」展示版本。
 * - Power BI：不顯示 Run log。
 * - 輸出檔案區塊：已移除（兩個技能都不再呈現）。
 * - Power BI 成果摘要：以 GIF 呈現，旁邊搭配卡片說明。
 *
 * GIF 放置方式（建議）：
 * - 請將你提供的 GIF 檔（01.gif）放到 public/ 目錄。
 * - 這樣就能用 <img src="/01.gif" /> 直接引用。
 */

// --------------------------------------------
// Minimal UI (替代 shadcn/ui)
// --------------------------------------------

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type SimpleButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'outline'
  size?: 'default' | 'icon'
}

function SimpleButton({
  variant = 'solid',
  size = 'default',
  className,
  children,
  ...rest
}: SimpleButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const solid = 'bg-accent text-accent-foreground hover:bg-accent-hover'
  const outline =
    'border border-input bg-surface text-foreground hover:border-foreground/20 hover:bg-accent-soft hover:shadow-sm active:border-accent'

  const sizes: Record<NonNullable<SimpleButtonProps['size']>, string> = {
    default: 'h-10 px-4 py-2 gap-2',
    icon: 'h-10 w-10',
  }

  return (
    <button
      className={cx(
        base,
        variant === 'solid' ? solid : outline,
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

// --------------------------------------------
// Theme
// --------------------------------------------

type ThemeMode = 'light' | 'dark'

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function useThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    const initial = getInitialTheme()
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      applyTheme(next)
      return next
    })
  }

  return { theme, toggle }
}

// --------------------------------------------
// Scraping demo (展示用模擬)
// --------------------------------------------

const DEMO_DATA = [
  {
    類別名稱: '居家清潔',
    廠商名稱: '示範清潔團隊 A',
    瀏覽次數: 1280,
    雇用次數: 42,
    服務網址: 'https://www.xxx.com.tw/service/123456/cleaning',
  },
  {
    類別名稱: '居家清潔',
    廠商名稱: '示範清潔團隊 B',
    瀏覽次數: 860,
    雇用次數: 31,
    服務網址: 'https://www.xxx.com.tw/service/234567/cleaning',
  },
  {
    類別名稱: '居家清潔',
    廠商名稱: '示範清潔團隊 C',
    瀏覽次數: 540,
    雇用次數: 18,
    服務網址: 'https://www.xxx.com.tw/service/345678/cleaning',
  },
]

const SCRAPE_LOG_SCRIPT = [
      '$ python pro360_cleaning_demo.py',
      'booting crawler...',
      'loading config: category="居家清潔", page=1, topN=3',
      'try JSON endpoints (GET/POST)...',
      'fallback to HTML parser if needed...',
      'extracting listings (page 1)...',
      'fetching views for 3 services...',
      'normalizing fields...',
      'writing file: pro360_cleaning_demo_YYYYMMDD_HHMM.csv',
      '✅ 資料已爬取完成 (3 records)',
]

type RunLogState = {
  lines: string[]
  isRunning: boolean
  isDone: boolean
}

function useSimulatedRunLog(script: string[], speedMs = 220) {
  const [state, setState] = useState<RunLogState>({
    lines: [],
    isRunning: true,
    isDone: false,
  })
  const timerRef = useRef<number | null>(null)
  const indexRef = useRef(0)

  const stop = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const start = () => {
    stop()
    indexRef.current = 0
    setState({ lines: [], isRunning: true, isDone: false })

    timerRef.current = window.setInterval(() => {
      const i = indexRef.current
      if (i >= script.length) {
        stop()
        setState((s) => ({ ...s, isRunning: false, isDone: true }))
        return
      }

      const nextLine = script[i]
      indexRef.current += 1

      setState((s) => ({
        ...s,
        lines: [...s.lines, nextLine],
      }))
    }, speedMs)
  }

  useEffect(() => {
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script.join('||'), speedMs])

  return { ...state, restart: start }
}

function Pro360ScrapeShowcase() {
  const log = useSimulatedRunLog(SCRAPE_LOG_SCRIPT, 200)
  const logBoxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = logBoxRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [log.lines.length])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-secondary">專案展示</p>
        <h3 className="text-xl font-medium">網站數據爬取_demo</h3>
        <p className="text-sm text-secondary">
          展示重點：JSON 端點優先、HTML 保底、此處以「居家清潔」第 1 頁前三筆做成果示意。
        </p>
      </div>

      {/* Run log（動態示範） */}
      <div className="rounded-xl border border-border bg-muted/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-secondary">Run log</p>
          <SimpleButton
            type="button"
            variant="outline"
            size="default"
            onClick={log.restart}
            className="h-9 px-3"
            title="重新播放"
          >
            <RotateCcw className="h-4 w-4" />
            重新播放
          </SimpleButton>
        </div>

        <div
          ref={logBoxRef}
          className="mt-3 max-h-[220px] overflow-auto rounded-lg border border-border bg-surface p-3"
        >
          <pre
            className="min-h-[128px] whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground"
            aria-live="polite"
          >
{log.lines.join('\n')}
{log.isRunning ? '\n▍' : ''}
          </pre>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={cx(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border',
              log.isDone
                ? 'border-foreground/20 bg-foreground/5 text-foreground'
                : 'border-border bg-surface text-muted-foreground'
            )}
          >
            {log.isDone ? '已完成（示意）' : '執行中（示意）'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            這是作品集用的動態演示，不會真的發送網路請求。
          </span>
        </div>
      </div>

      {/* 爬取結果：等 log 跑完才顯示 */}
      {log.isDone && (
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-secondary">
            爬取結果（居家清潔｜第一頁前三筆｜示範資料）
          </p>
          <div className="mt-3 divide-y">
            {DEMO_DATA.map((row, idx) => (
              <div key={idx} className="py-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="font-medium">{row.廠商名稱}</p>
                  <p className="text-sm text-secondary">{row.類別名稱}</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
                  <span>瀏覽 {row.瀏覽次數 ?? '-'} 次</span>
                  <span>•</span>
                  <span>雇用 {row.雇用次數 ?? '-'} 次</span>
                </div>
                <div className="mt-1">
                  <a
                    href={row.服務網址}
                    className="text-sm text-secondary hover:text-foreground underline underline-offset-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.服務網址}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-secondary">備註：此區塊為展示用 mock。</p>
    </div>
  )
}

// --------------------------------------------
// Power BI demo (展示用模擬)
// --------------------------------------------

const PBI_KPI_MOCK = [
  { label: '毛利率 最大值', value: '40.0%', note: '依賣場/規格切片' },
  { label: '毛利率 平均', value: '25.9%', note: '整體概覽' },
  { label: '毛利率 最小值', value: '10.0%', note: '風險監控' },
]

const POWER_BI_GIF_SRC = '/01.gif'

function PowerBIDemoShowcase() {
  const [gifOk, setGifOk] = useState(true)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-secondary">專案展示</p>
        <h3 className="text-xl font-medium">Power BI 整體毛利率監控_demo</h3>
      </div>

      <div className="rounded-xl border border-border bg-muted/10 p-4">
        <p className="text-base leading-7 text-secondary">
          展示目標：以「毛利率最大/平均/最小」做高層摘要，
          透過賣場、規格、供應商、地區的切片，快速定位毛利異常與供給風險。
        </p>
      </div>

      {/* 成果摘要 + 旁邊卡片說明 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* 成果摘要：GIF */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary">成果摘要</p>
            <span className="text-sm text-secondary">示意動圖</span>
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-muted/20">
            <div className="aspect-[16/9] w-full">
              {gifOk ? (
                <img
                  src={POWER_BI_GIF_SRC}
                  alt="Power BI demo"
                  className="h-full w-full object-cover"
                  onError={() => setGifOk(false)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-4 text-center">
                  <p className="text-sm text-secondary">
                    尚未找到 GIF。請將 01.gif 放到 public/ 後重試。
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* KPI 小卡（簡化版） */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PBI_KPI_MOCK.map((k) => (
              <div
                key={k.label}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <p className="text-sm text-secondary">{k.label}</p>
                <p className="mt-1 text-lg font-semibold">{k.value}</p>
                <p className="mt-1 text-sm text-secondary">{k.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 右側：卡片說明 */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-medium">指標設計邏輯</p>
            <p className="mt-2 text-base leading-7 text-secondary">
              以「最大/平均/最小」三層摘要對應不同管理視角：
              平均看整體表現、最小值看風險底線、最大值用於檢視高毛利組合與可複製策略。
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-medium">切片維度與定位</p>
            <p className="mt-2 text-base leading-7 text-secondary">
              以賣場/規格/供應商/地區做交叉檢視，
              能快速回答「哪個服務」「哪個供應商」「在哪個城市」造成毛利異常。
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-medium">可落地的決策行動</p>
            <p className="mt-2 text-base leading-7 text-secondary">
              當低毛利或波動區塊出現，可連動：
              價格策略調整、成本設定檢核、派單倍率/產能策略修正，
              將報表從「看見問題」推進到「可執行改善」。
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-secondary">
        備註：此區塊為展示用 mock，重點在於儀表板的敘事與決策結構。
      </p>
    </div>
  )
}

// --------------------------------------------
// App
// --------------------------------------------

export default function App() {
  const { theme, toggle } = useThemeToggle()

  // 大頭照（建議放在 public/，用「/檔名」引用）
  // 例：把照片放到 public/avatar.jpg，這裡就填 '/avatar.jpg'
  const aboutImgSrc = '/IMG_1722.JPG'
  const [aboutImgOk, setAboutImgOk] = useState(true)

  const skills = useMemo(
    () =>
      [
        { id: '爬蟲', label: '爬蟲' },
        { id: 'power bi', label: 'Power BI' },
        { id: 'vibecoding', label: 'Vibe Coding' },
      ] as const,
    []
  )

  type SkillId = (typeof skills)[number]['id']
  const [selectedSkill, setSelectedSkill] = useState<SkillId | null>(null)
  const [isAboutExpanded, setIsAboutExpanded] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        跳到主要內容
      </a>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-[140px]">
          <a href="#top" className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">個人作品集</span>
            <span className="text-sm text-secondary">
              Data • BI • Automation
            </span>
          </a>

          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#about"
              className="rounded-md px-2 py-1 text-sm text-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              關於
            </a>
            <a
              href="#experience"
              className="rounded-md px-2 py-1 text-sm text-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              經歷
            </a>
            <a
              href="#portfolio"
              className="rounded-md px-2 py-1 text-sm text-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              作品集
            </a>

            <SimpleButton
              type="button"
              variant="outline"
              size="icon"
              onClick={toggle}
              aria-label={theme === 'dark' ? '切換為淺色模式' : '切換為深色模式'}
              title={theme === 'dark' ? '淺色模式' : '深色模式'}
              className="h-9 w-9"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </SimpleButton>
          </nav>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 md:px-[140px]"
      >
        <div className="space-y-16 md:space-y-20">
          {/* Hero */}
          <section id="top" className="relative">
            <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-xl shadow-black/5 backdrop-blur-xl md:p-16 dark:border-white/10 dark:bg-white/10 dark:shadow-black/25">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.2fr_0.7fr] md:items-center">
                <div className="space-y-5">
                  <h1 className="text-4xl md:text-5xl font-semibold">
                    謝佩蓁 | Hugo
                  </h1>                    
                  <h2 className="text-2xl md:text-3xl font-semibold">
                    把人生當作專案管理&nbsp;&nbsp;用系統化的方式推進每一步
                  </h2>                    
                  <div className="max-w-prose space-y-2 text-base leading-7 text-secondary">
                    <p>
                      對生活與創意充滿熱情，擅長將抽象概念分析拆解成可執行的任務。
                    </p>
                    <p>
                      同時熱愛研究各類軟體工具，如 Notion，透過工具與方法提升專案效率。
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <SimpleButton
                      type="button"
                      onClick={() => {
                        document
                          .getElementById('portfolio')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      看作品集
                    </SimpleButton>
                    <SimpleButton
                      type="button"
                      variant="outline"
                      onClick={() => {
                        document
                          .getElementById('about')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      先了解我
                    </SimpleButton>
                  </div>
                </div>

                <div className="mx-auto w-full max-w-[420px] md:mx-0 md:w-[60%] md:max-w-none md:justify-self-end">
                  <div className="aspect-square overflow-hidden rounded-full border border-border bg-surface shadow-2xl shadow-black/10 dark:shadow-black/40">
                    {aboutImgSrc && aboutImgOk ? (
                      <img
                        src={aboutImgSrc}
                        alt="About"
                        className="h-full w-full object-cover object-[50%_20%]"
                        onError={() => setAboutImgOk(false)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-sm text-secondary">
                          大頭照
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="scroll-mt-24 space-y-8">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl md:text-3xl font-semibold">關於我</h2>
              {/* <p className="text-sm text-muted-foreground">
                用 3～5 句話快速說明定位、成果與你在乎的事情。
              </p> */}
            </div>

            <div className="mx-auto max-w-4xl space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">
                  擅長從使用者與系統的角度出發，將複雜需求轉化為可執行的產品解法
                </h3>
                <div className="space-y-3 text-base leading-7 text-secondary">
                  <p>
                    對我而言，PM 不只是控管時程或任務，而是那個能夠串起人、流程與技術，讓想法真正被實現，並轉化為實際價值的人。我希望能在更成熟、專業的產品開發環境中持續磨練這樣的能力，拓展自己的視野，創造對使用者與組織都有意義的成果。
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent underline-offset-4 transition-colors hover:text-accent-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-expanded={isAboutExpanded}
                    aria-controls="about-more"
                    onClick={() => setIsAboutExpanded((v) => !v)}
                  >
                    {isAboutExpanded ? '收合' : '閱讀更多'}
                    <ChevronDown
                      className={cx(
                        'h-4 w-4 transition-transform duration-300',
                        isAboutExpanded && 'rotate-180'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    id="about-more"
                    className={cx(
                      'grid transition-[grid-template-rows] duration-300 ease-out',
                      isAboutExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    )}
                  >
                    <div className="overflow-hidden">
                      <div
                        className={cx(
                          'space-y-3 pt-1 transition-opacity duration-300',
                          isAboutExpanded ? 'opacity-100' : 'opacity-0'
                        )}
                      >
                        <p>
                          熱愛影像創作的我，大學選擇就讀大眾傳播學系，就學期間投入影像製作與內容企劃，學習如何將抽象想法轉化為具體畫面，並思考觀眾如何理解與接收訊息。這段訓練，讓我對「人如何與資訊互動」產生了興趣。
                        </p>
                        <p>
                          畢業後，我曾在農場打工。當時農場尚未有訂房系統，所有流程仰賴人工處理，在實際協助營運的過程中，我開始思考是否能透過系統改善現有流程，並主動建議老闆導入訂房工具。這是我第一次實際接觸到「系統、產品與使用者」之間的關係，也讓我意識到，一個好的設計不只影響畫面，而是能真正改變工作方式與使用體驗。
                        </p>
                        <p>
                          後來，一次偶然的機會接觸到介紹 UI/UX 職業的 podcast，這段內容替我補上了關鍵的一塊拼圖——原來我在意的，不只是創作本身，而是整體使用流程與體驗設計。這樣的好奇心，促使我開始自學 UI/UX，並逐步轉職進入產品規劃的領域。
                        </p>
                        <p>
                          這條路徑，對我而言並非突然的轉向，而是從內容與影像出發，延伸到系統、流程與價值實現的自然演進，也形塑了我現在看待產品與問題的方式。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-muted/10 p-4">
                    <p className="mt-1 text-base font-medium">好奇探索</p>
                    <p className="text-sm text-secondary">
                      勇於嘗試新事物，樂於在創新與實驗中累積經驗。
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/10 p-4">
                    <p className="mt-1 text-base font-medium">理性分析</p>
                    <p className="text-sm text-secondary">
                      善於運用邏輯與結構化思維，找出問題的根本原因。
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/10 p-4">
                    <p className="mt-1 text-base font-medium">同理傾聽</p>
                    <p className="text-sm text-secondary">
                      能感受並理解他人立場，善於傾聽並建立信任。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Experience Section */}
          <section id="experience" className="scroll-mt-24 space-y-10">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl md:text-3xl font-semibold">經歷</h2>
              {/* <p className="text-sm text-muted-foreground">
                以「時間 → 角色 → 成果」來描述，讀者會更快理解你做了什麼。
              </p> */}
            </div>

            <div className="mx-auto max-w-4xl rounded-2xl bg-[#F9F9F9] py-6 dark:bg-muted/10">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-medium">網站企劃專員</h3>
                  <p className="mt-1 truncate text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    HoHo好服務好生活
                  </p>
                  <p className="mt-0.5 text-sm text-secondary">
                    是一個提供生活服務的電商平台，致力於整合優質服務供應商，為消費者提供安心、透明且便利的到府服務體驗。
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted/30 px-3 py-1 text-sm text-secondary">
                  2023 — 2024
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 md:flex-1">
                  <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-secondary">
                    <li>
                      規劃官網與後台系統架構，產出 Wireframe / 流程圖，協助跨部門對齊需求。
                    </li>
                    <li>擬定專案上線時程，追蹤進度並控管交付品質。</li>
                    <li>
                      撰寫需求文件、執行專案測試與上線維運，確保平台穩定運作。
                    </li>
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      '需求分析',
                      'Wireframe',
                      '流程設計',
                      '跨部門協作',
                      '專案管理',
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Skills Selection Section */}
          <section id="portfolio" className="scroll-mt-24">
            <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-xl shadow-black/5 backdrop-blur-xl md:p-16 dark:border-white/10 dark:bg-white/10 dark:shadow-black/25">
              <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-secondary">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-sm">嗨，歡迎來到我的作品集</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                    你想從哪裡著手？
                  </h2>
                </div>

                {/* Chat-like input (mock UI) */}
                <div className="rounded-[28px] border border-border bg-surface/70 px-5 py-4 shadow-sm backdrop-blur md:px-6 md:py-5">
                  <div className="text-sm text-muted-foreground">
                    {selectedSkill
                      ? `想看「${skills.find((s) => s.id === selectedSkill)?.label ?? selectedSkill}」的作品嗎？`
                      : '問問 Gemini'}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label="新增"
                      >
                        <Plus className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-secondary transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label="工具"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        工具
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-secondary transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label="快捷"
                      >
                        快捷
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>

                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label="語音輸入"
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom navigation (skills) */}
                <div className="flex flex-wrap items-center gap-2">
                  {skills.map((s) => {
                    const active = selectedSkill === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSkill(s.id)}
                        aria-pressed={active}
                        className={cx(
                          'h-10 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                          active
                            ? 'border-foreground/15 bg-foreground/10 text-foreground'
                            : 'border-border bg-surface/50 text-secondary hover:border-foreground/20 hover:bg-foreground/5 hover:text-foreground'
                        )}
                      >
                        {s.label}
                      </button>
                    )
                  })}
                </div>

                {/* Content */}
                {selectedSkill === '爬蟲' && <Pro360ScrapeShowcase />}
                {selectedSkill === 'power bi' && <PowerBIDemoShowcase />}
                {selectedSkill === 'vibecoding' && (
                  <div className="rounded-xl border border-border bg-muted/10 p-4">
                    <p className="text-sm font-medium">Vibe Coding（整理中）</p>
                    <p className="mt-2 text-sm text-secondary">
                      會補上：從需求拆解 → 原型 → 迭代驗證的過程與關鍵決策。
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/*
              Manual test checklist
              1) 初始進入為「對話輸入框」樣式，未選技能不顯示內容。
              2) 點擊下方技能按鈕可切換內容。
              3) 選擇「爬蟲」時：
                 - Run log 為動態逐行輸出。
                 - Run log 完成後才出現「爬取結果」。
                 - 不再顯示「輸出檔案」。
              4) 選擇「power bi」時：
                 - 不顯示 Run log。
                 - 成果摘要顯示 GIF（若 public/01.gif 存在）。
                 - 右側有三張說明卡片。
            */}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-10 text-center md:px-[140px]">
          <p className="text-sm text-secondary">
            © {new Date().getFullYear()} • Portfolio
          </p>
        </div>
      </footer>
    </div>
  )
}
