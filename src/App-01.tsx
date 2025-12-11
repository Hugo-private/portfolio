import { useMemo, useEffect, useRef, useState } from 'react'
import type React from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'

/**
 * 說明
 * 這份版本是為了修正「@ 路徑別名」在沙盒環境無法解析的問題。
 * 因此：
 * 1) 移除所有以 "@/" 開頭的 import（包含 assets 與 shadcn 路徑）。
 * 2) 以輕量的本地 UI 元件（SimpleButton / SimpleCard）替代。
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
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const solid = 'bg-foreground text-background hover:opacity-90'
  const outline =
    'border border-input bg-background hover:bg-muted/50 text-foreground'

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

function SimpleCard({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-border bg-background shadow-sm',
        className
      )}
      {...rest}
    />
  )
}

function SimpleCardContent({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('p-6', className)} {...rest} />
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">專案展示</p>
        <h3 className="text-xl font-semibold">網站數據爬取_demo</h3>
        <p className="text-xs text-muted-foreground">
          展示重點：JSON 端點優先、HTML 保底、此處以「居家清潔」第 1 頁前三筆做成果示意。
        </p>
      </div>

      {/* Run log（動態示範） */}
      <div className="rounded-xl border border-border bg-muted/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Run log</p>
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

        <div className="mt-3 rounded-lg border border-border bg-background p-3">
          <pre className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap min-h-[128px]">
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
                : 'border-border bg-background text-muted-foreground'
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
          <p className="text-sm text-muted-foreground">
            爬取結果（居家清潔｜第一頁前三筆｜示範資料）
          </p>
          <div className="mt-3 divide-y">
            {DEMO_DATA.map((row, idx) => (
              <div key={idx} className="py-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="font-medium">{row.廠商名稱}</p>
                  <p className="text-xs text-muted-foreground">{row.類別名稱}</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>瀏覽 {row.瀏覽次數 ?? '-'} 次</span>
                  <span>•</span>
                  <span>雇用 {row.雇用次數 ?? '-'} 次</span>
                </div>
                <div className="mt-1">
                  <a
                    href={row.服務網址}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
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

      <p className="text-xs text-muted-foreground">備註：此區塊為展示用 mock。</p>
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
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">專案展示</p>
        <h3 className="text-xl font-semibold">Power BI 整體毛利率監控_demo</h3>
      </div>

      <div className="rounded-xl border border-border bg-muted/10 p-4">
        <p className="text-sm text-muted-foreground">
          展示目標：以「毛利率最大/平均/最小」做高層摘要，
          透過賣場、規格、供應商、地區的切片，快速定位毛利異常與供給風險。
        </p>
      </div>

      {/* 成果摘要 + 旁邊卡片說明 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* 成果摘要：GIF */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">成果摘要</p>
            <span className="text-[11px] text-muted-foreground">示意動圖</span>
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-muted/20">
            <div className="aspect-[16/9] w-full flex items-center justify-center">
              <img
                src={POWER_BI_GIF_SRC}
                alt="Power BI demo"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <p className="text-xs text-muted-foreground px-4 text-center">
                尚未找到 GIF。請將 01.gif 放到 public/ 後重試。
              </p>
            </div>
          </div>

          {/* KPI 小卡（簡化版） */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PBI_KPI_MOCK.map((k) => (
              <div
                key={k.label}
                className="rounded-lg border border-border bg-background p-3"
              >
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
                <p className="mt-1 text-lg font-semibold">{k.value}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{k.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 右側：卡片說明 */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="font-medium">指標設計邏輯</p>
            <p className="mt-2 text-xs text-muted-foreground">
              以「最大/平均/最小」三層摘要對應不同管理視角：
              平均看整體表現、最小值看風險底線、最大值用於檢視高毛利組合與可複製策略。
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="font-medium">切片維度與定位</p>
            <p className="mt-2 text-xs text-muted-foreground">
              以賣場/規格/供應商/地區做交叉檢視，
              能快速回答「哪個服務」「哪個供應商」「在哪個城市」造成毛利異常。
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="font-medium">可落地的決策行動</p>
            <p className="mt-2 text-xs text-muted-foreground">
              當低毛利或波動區塊出現，可連動：
              價格策略調整、成本設定檢核、派單倍率/產能策略修正，
              將報表從「看見問題」推進到「可執行改善」。
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        備註：此區塊為展示用 mock，重點在於儀表板的敘事與決策結構。
      </p>
    </div>
  )
}

// --------------------------------------------
// App
// --------------------------------------------

export default function App() {
  // 目前採用沙盒友善寫法（不強依賴本地 assets）
  const aboutImg: string | null = null

  // Experience 圖片同理
  const exp1Img: string | null = null
  const exp2Img: string | null = null

  const skills = useMemo(() => ['爬蟲', 'vibecoding', 'power bi'], [])
  const [selectedSkill, setSelectedSkill] = useState('')

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 md:px-[140px] py-8 max-w-[1440px]">
        <div className="space-y-20 md:space-y-24">
          {/* 導覽列區塊 */}
          <header className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 md:gap-12 items-start">
            {/* 左側欄位：網站名稱 */}
            <div className="flex flex-col items-center md:items-start">
              <h1 className="text-2xl font-bold">網站名稱</h1>
            </div>

            {/* 右側欄位：導航列 */}
            <nav className="flex items-center justify-end gap-6">
              <a
                href="#about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                關於我
              </a>
              <a
                href="#portfolio"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                作品集
              </a>
            </nav>
          </header>

          {/* About Section */}
          <section id="about" className="space-y-8">
            <h2 className="text-3xl font-bold text-center">About</h2>

            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 md:gap-12 items-start">
              <div className="flex flex-col items-center md:items-start gap-6">
                <div className="w-64 h-64 rounded-full overflow-hidden border-2 border-border shadow-lg">
                  {aboutImg ? (
                    <img
                      src={aboutImg}
                      alt="About"
                      className="w-full h-full object-cover object-[50%_20%]"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">圖片</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold">標題</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Experience Section */}
          <section className="space-y-12">
            <h2 className="text-3xl font-bold text-center">經歷</h2>

            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-3">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-lg font-semibold">年份</span>
                    <div className="w-12 h-0.5 bg-foreground"></div>
                  </div>
                  <div className="space-y-2 text-muted-foreground">
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                  </div>
                </div>
                <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-border">
                  {exp1Img ? (
                    <img
                      src={exp1Img}
                      alt="Experience"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">圖片</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-border order-2 md:order-1">
                  {exp2Img ? (
                    <img
                      src={exp2Img}
                      alt="Experience"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">圖片</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3 order-1 md:order-2">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-lg font-semibold">年份</span>
                    <div className="w-12 h-0.5 bg-foreground"></div>
                  </div>
                  <div className="space-y-2 text-muted-foreground">
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                    <p>內文內文內文內文內文內文內文內文內文內文...</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Skills Selection Section */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-center">想看什麼技能呢？</h2>

            <SimpleCard>
              <SimpleCardContent className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <select
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value)}
                      className="flex h-12 w-full appearance-none rounded-lg border border-input bg-background px-4 pr-10 text-sm md:text-base ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">請選擇</option>
                      {skills.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>

                  {selectedSkill ? (
                    <p className="text-sm text-muted-foreground">
                      已選擇：{' '}
                      <span className="text-foreground font-medium">
                        {selectedSkill}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      請從清單中選擇想了解的技能
                    </p>
                  )}

                  {/* 選擇「爬蟲」時嵌入展示頁 */}
                  {selectedSkill === '爬蟲' && (
                    <div className="pt-2">
                      <Pro360ScrapeShowcase />
                    </div>
                  )}

                  {/* 選擇「power bi」時嵌入展示頁 */}
                  {selectedSkill === 'power bi' && (
                    <div className="pt-2">
                      <PowerBIDemoShowcase />
                    </div>
                  )}

                  {/* 其他技能的留白提示（可日後擴充） */}
                  {selectedSkill &&
                    selectedSkill !== '爬蟲' &&
                    selectedSkill !== 'power bi' && (
                      <div className="rounded-xl border border-border bg-muted/10 p-4">
                        <p className="text-sm text-muted-foreground">
                          這個技能展示頁尚在整理中，你可以先選擇「爬蟲」或「power bi」查看展示。
                        </p>
                      </div>
                    )}
                </div>
              </SimpleCardContent>
            </SimpleCard>

            {/*
              Manual test checklist
              1) Skills 下拉可正常展開/選取，右側箭頭圖示正確置中。
              2) 選擇「爬蟲」時：
                 - Run log 為動態逐行輸出。
                 - Run log 完成後才出現「爬取結果」。
                 - 不再顯示「輸出檔案」。
              3) 選擇「power bi」時：
                 - 不顯示 Run log。
                 - 成果摘要顯示 GIF（若 public/01.gif 存在）。
                 - 右側有三張說明卡片。
            */}
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto px-4 md:px-[140px] py-8 max-w-[1440px] mt-16 border-t">
        <div className="text-center text-sm text-muted-foreground">
          © 2025 • Powered by Cursor's Brain
        </div>
      </footer>
    </div>
  )
}
