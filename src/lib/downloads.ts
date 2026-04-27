const DEFAULT_FOREX_BOT_DOWNLOAD_URL = "/bot-app/ForexBotsApp.exe"

export function getForexBotDownloadUrl() {
  const configured = import.meta.env.VITE_FOREX_BOT_DOWNLOAD_URL
  return configured && configured.trim().length > 0
    ? configured.trim()
    : DEFAULT_FOREX_BOT_DOWNLOAD_URL
}
