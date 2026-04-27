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

export interface RazorpayOrderRequest {
  orderId: string
  amountPaise: number
  currency: string
  userEmail: string
  userId: string
  productNames: string[]
}

export interface RazorpayOrderResponse {
  keyId: string
  razorpayOrderId: string
  amount: number
  currency: string
}

export interface RazorpayVerifyRequest {
  orderId: string
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export interface RazorpayVerifyResponse {
  success: boolean
  message?: string
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

export function getRazorpayKeyId(): string | undefined {
  return typeof import.meta.env !== "undefined"
    ? (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined)
    : undefined
}

export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if ((window as Window & { Razorpay?: unknown }).Razorpay) return true

  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function createRazorpayOrder(
  req: RazorpayOrderRequest
): Promise<RazorpayOrderResponse | { error: string }> {
  const base = getPaymentApiUrl()
  if (!base) return { error: "Payment API URL not configured." }

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/createRazorpayOrder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { error: (err as { message?: string }).message || res.statusText }
    }
    return (await res.json()) as RazorpayOrderResponse
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error" }
  }
}

export async function verifyRazorpayPayment(
  req: RazorpayVerifyRequest
): Promise<RazorpayVerifyResponse | { error: string }> {
  const base = getPaymentApiUrl()
  if (!base) return { error: "Payment API URL not configured." }

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/verifyRazorpayPayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { error: (err as { message?: string }).message || res.statusText }
    }
    return (await res.json()) as RazorpayVerifyResponse
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error" }
  }
}
