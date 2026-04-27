const cors = require("cors")
const crypto = require("node:crypto")
const Razorpay = require("razorpay")
const { onRequest } = require("firebase-functions/v2/https")
const { initializeApp } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")

initializeApp()
const db = getFirestore()
const corsHandler = cors({ origin: true })

const DEFAULT_ADMIN_EMAIL = "admin@alphaforge.io"
const ADMIN_ID_FIELD = "adminId"

function toAdminId(email) {
  return email.replace(/@/g, "_at_").replace(/\./g, "_")
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env: ${name}`)
  return value
}

function calculateLicenseExpiry(createdAtIso, planId) {
  const monthsByPlan = { "3m": 3, "6m": 6, "12m": 12 }
  if (!planId || !monthsByPlan[planId]) return undefined
  const base = new Date(createdAtIso)
  if (Number.isNaN(base.getTime())) return undefined
  const expiry = new Date(base)
  expiry.setMonth(expiry.getMonth() + monthsByPlan[planId])
  return expiry.toISOString()
}

function generateLicenseKey() {
  const segment = () => Math.random().toString(36).slice(2, 10).toUpperCase()
  return `AF-${segment()}-${segment()}-${segment()}`
}

async function getOrderDocById(adminEmail, orderId) {
  const adminId = toAdminId(adminEmail)
  const snap = await db
    .collectionGroup("orders")
    .where(ADMIN_ID_FIELD, "==", adminId)
    .where("id", "==", orderId)
    .limit(1)
    .get()
  return snap.empty ? null : snap.docs[0]
}

exports.api = onRequest({ region: "us-central1" }, (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "POST") {
        res.status(405).json({ message: "Method not allowed" })
        return
      }

      const path = req.path.replace(/\/+$/, "")

      if (path.endsWith("/createRazorpayOrder")) {
        const { orderId, amountPaise, currency = "INR", userEmail, userId, productNames = [] } =
          req.body || {}

        if (!orderId || !amountPaise || amountPaise <= 0) {
          res.status(400).json({ message: "Invalid payment order payload." })
          return
        }

        const razorpay = new Razorpay({
          key_id: requireEnv("RAZORPAY_KEY_ID"),
          key_secret: requireEnv("RAZORPAY_KEY_SECRET"),
        })

        const razorpayOrder = await razorpay.orders.create({
          amount: amountPaise,
          currency,
          receipt: String(orderId).slice(0, 40),
          notes: {
            appOrderId: orderId,
            userEmail: userEmail || "",
            userId: userId || "",
            products: Array.isArray(productNames) ? productNames.join(", ").slice(0, 255) : "",
          },
        })

        res.json({
          keyId: requireEnv("RAZORPAY_KEY_ID"),
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        })
        return
      }

      if (path.endsWith("/verifyRazorpayPayment")) {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {}
        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
          res.status(400).json({ message: "Missing Razorpay verification payload." })
          return
        }

        const generated = crypto
          .createHmac("sha256", requireEnv("RAZORPAY_KEY_SECRET"))
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest("hex")

        if (generated !== razorpaySignature) {
          res.status(400).json({ success: false, message: "Invalid Razorpay signature." })
          return
        }

        const orderDoc = await getOrderDocById(DEFAULT_ADMIN_EMAIL, orderId)
        if (!orderDoc) {
          res.status(404).json({ success: false, message: "Order not found." })
          return
        }

        const orderData = orderDoc.data()
        await orderDoc.ref.update({
          status: "paid",
          razorpayOrderId,
          razorpayPaymentId,
        })

        const userEmail = orderData.userEmail || ""
        const licensesRef = orderDoc.ref.collection("licenses")
        const existingLicenses = await licensesRef.limit(1).get()
        if (existingLicenses.empty) {
          const now = new Date().toISOString()
          for (const item of orderData.items || []) {
            const expiresAt = calculateLicenseExpiry(orderData.createdAt, item.planId)
            for (let i = 0; i < (item.quantity || 0); i++) {
              const licenseRef = licensesRef.doc()
              await licenseRef.set({
                [ADMIN_ID_FIELD]: toAdminId(DEFAULT_ADMIN_EMAIL),
                id: licenseRef.id,
                licenseKey: generateLicenseKey(),
                userId: orderData.userId,
                userEmail,
                productId: item.product.id,
                productSlug: item.product.slug,
                productName: item.product.name,
                orderId: orderData.id,
                status: "active",
                createdAt: now,
                ...(expiresAt ? { expiresAt } : {}),
              })
            }
          }
        }

        res.json({ success: true })
        return
      }

      res.status(404).json({ message: "Unknown endpoint." })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error"
      res.status(500).json({ message })
    }
  })
})
