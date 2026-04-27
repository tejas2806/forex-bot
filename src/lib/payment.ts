/**
 * Payment gateway abstraction for bot purchases.
 * - Without backend: order is created with status "paid" and licenses are created by Firestore.
 * - With Stripe backend (VITE_PAYMENT_API_URL): order is created as "pending", then redirect to Stripe Checkout;
 *   webhook updates order to "paid" and creates licenses.
 */

export interface PaymentSessionRequest {
  orderId: string
  amountCents: number
  currency: string
  userEmail: string
  userId: string
  productNames: string[]
  successUrl: string
  cancelUrl: string
}

export interface PaymentSessionResponse {
  url?: string
  sessionId?: string
  error?: string
}

/** Get payment API base URL from env (e.g. Cloud Function URL). */
export function getPaymentApiUrl(): string | undefined {
  return typeof import.meta.env !== "undefined"
    ? (import.meta.env.VITE_PAYMENT_API_URL as string | undefined)
    : undefined
}

/**
 * Create a Stripe Checkout session via your backend.
 * Backend should create the session with metadata.orderId and return { url }.
 * If no backend is configured, returns undefined (use simulated flow).
 */
export async function createStripeCheckoutSession(
  req: PaymentSessionRequest
): Promise<PaymentSessionResponse | undefined> {
  const base = getPaymentApiUrl()
  if (!base) return undefined
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/createCheckoutSession`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { error: (err as { message?: string }).message || res.statusText }
    }
    return (await res.json()) as PaymentSessionResponse
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error" }
  }
}
