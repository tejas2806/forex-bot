import { useParams } from "react-router-dom"
import { BotCsvPerformanceChart } from "@/components/analytics/BotCsvPerformanceChart"

export function Performance() {
  const { botId } = useParams<{ botId?: string }>()
  const bot = botId === "2" ? "2" : botId === "3" ? "3" : "1"

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-zinc-100 mb-6">
        Bot performance
      </h1>
      <BotCsvPerformanceChart initialBot={bot} />
    </div>
  )
}
