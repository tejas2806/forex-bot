import { useParams } from "react-router-dom"
import { XauUsdCsvChart } from "@/components/analytics/XauUsdCsvChart"
import { Bot2PerformanceChart } from "@/components/analytics/Bot2PerformanceChart"

export function Performance() {
  const { botId } = useParams<{ botId?: string }>()
  const bot = botId === "2" ? "2" : "1"

  return (
    <div className="container mx-auto px-4 py-8">
      {bot === "1" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-zinc-100 mb-6">Bot1 performance</h1>
          <XauUsdCsvChart />
        </>
      )}
      {bot === "2" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-zinc-100 mb-6">Bot2 performance</h1>
          <Bot2PerformanceChart />
        </>
      )}
    </div>
  )
}
