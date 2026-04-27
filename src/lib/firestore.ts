/**
 * Firestore hierarchy (orders & licenses under user):
 *   admins/{adminId}
 *     ├── users/{email}                    <- user profile
 *     │   └── orders/{orderId}             <- order doc (order data + adminId)
 *     │       └── licenses/{licenseId}     <- license doc (licenseKey, orderId, adminId, ...)
 *     ├── products/{slug}
 *     │   └── performance_data/{docId}
 *     └── (no top-level orders or licenses)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  collectionGroup,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product, User, Order, License } from "@/types"
import { parseCSVToCandles, type TwelveDataCandle } from "@/lib/twelvedata"

const ADMINS_COLLECTION = "admins"
const USERS_SUBCOLLECTION = "users"
const PRODUCTS_SUBCOLLECTION = "products"
const ORDERS_SUBCOLLECTION = "orders"
const LICENSES_SUBCOLLECTION = "licenses"
const PERFORMANCE_SUBCOLLECTION = "performance_data"

/** Default admin email for this app (root of data). */
export const DEFAULT_ADMIN_EMAIL = "admin@alphaforge.io"

/** Sanitize admin email for use as Firestore document ID (no @ or .). */
export function toAdminId(email: string): string {
  return email.replace(/@/g, "_at_").replace(/\./g, "_")
}

/** Use email as users document ID (Firestore allows @ and . in doc IDs). */
export function toUserDocId(email: string): string {
  return email
}

/** Reference to the admin document: admins/{adminId} */
export function getAdminRef(adminEmail: string) {
  return doc(db, ADMINS_COLLECTION, toAdminId(adminEmail))
}

/** Reference to the users subcollection: admins/{adminId}/users -> info (each doc = user info) */
export function getUsersRef(adminEmail: string) {
  return collection(db, ADMINS_COLLECTION, toAdminId(adminEmail), USERS_SUBCOLLECTION)
}

/** Reference to a user info document: admins/{adminId}/users/{email} — doc id = sanitized email */
export function getUserRef(adminEmail: string, userEmail: string) {
  return doc(db, ADMINS_COLLECTION, toAdminId(adminEmail), USERS_SUBCOLLECTION, toUserDocId(userEmail))
}

/** Reference to the products subcollection: admins/{adminId}/products (each doc = product_name -> Bots details) */
export function getProductsRef(adminEmail: string) {
  return collection(db, ADMINS_COLLECTION, toAdminId(adminEmail), PRODUCTS_SUBCOLLECTION)
}

/** Reference to a product document: admins/{adminId}/products/{product_slug} — doc id = product slug (product name) */
export function getProductRef(adminEmail: string, productSlug: string) {
  return doc(db, ADMINS_COLLECTION, toAdminId(adminEmail), PRODUCTS_SUBCOLLECTION, productSlug)
}

/** Reference to performance_data subcollection: admins/{adminId}/products/{product_slug}/performance_data */
export function getPerformanceRef(adminEmail: string, productSlug: string) {
  return collection(
    db,
    ADMINS_COLLECTION,
    toAdminId(adminEmail),
    PRODUCTS_SUBCOLLECTION,
    productSlug,
    PERFORMANCE_SUBCOLLECTION
  )
}

/** Reference to a user's orders: admins/{adminId}/users/{userEmail}/orders */
export function getUserOrdersRef(adminEmail: string, userEmail: string) {
  return collection(
    db,
    ADMINS_COLLECTION,
    toAdminId(adminEmail),
    USERS_SUBCOLLECTION,
    toUserDocId(userEmail),
    ORDERS_SUBCOLLECTION
  )
}

/** Reference to one order under user: admins/{adminId}/users/{userEmail}/orders/{orderId} */
export function getOrderRefUnderUser(adminEmail: string, userEmail: string, orderId: string) {
  return doc(
    db,
    ADMINS_COLLECTION,
    toAdminId(adminEmail),
    USERS_SUBCOLLECTION,
    toUserDocId(userEmail),
    ORDERS_SUBCOLLECTION,
    orderId
  )
}

/** Reference to licenses under an order: admins/{adminId}/users/{userEmail}/orders/{orderId}/licenses */
export function getOrderLicensesRef(adminEmail: string, userEmail: string, orderId: string) {
  return collection(
    db,
    ADMINS_COLLECTION,
    toAdminId(adminEmail),
    USERS_SUBCOLLECTION,
    toUserDocId(userEmail),
    ORDERS_SUBCOLLECTION,
    orderId,
    LICENSES_SUBCOLLECTION
  )
}

/** Reference to one license under an order: .../orders/{orderId}/licenses/{licenseId} */
export function getOrderLicenseRef(
  adminEmail: string,
  userEmail: string,
  orderId: string,
  licenseId: string
) {
  return doc(
    db,
    ADMINS_COLLECTION,
    toAdminId(adminEmail),
    USERS_SUBCOLLECTION,
    toUserDocId(userEmail),
    ORDERS_SUBCOLLECTION,
    orderId,
    LICENSES_SUBCOLLECTION,
    licenseId
  )
}

/** Field name stored in order/license docs for collection-group filtering by admin */
const ADMIN_ID_FIELD = "adminId"

/** Legacy path: admins/{adminId}/licenses (before schema change to .../orders/.../licenses). */
function getLicensesRefLegacy(adminEmail: string) {
  return collection(db, ADMINS_COLLECTION, toAdminId(adminEmail), LICENSES_SUBCOLLECTION)
}

// ---------- Users -> info (each doc = user info) ----------

/** One order entry stored on the user doc: which products and which orderID */
export interface UserOrderEntry {
  orderId: string
  products: { productId: string; productName: string; quantity: number }[]
  createdAt: string
}

export interface UserRecord extends Pick<User, "id" | "email" | "name" | "role"> {
  avatar?: string
  createdAt?: string
  /** Orders placed by this user: orderId + products */
  orders?: UserOrderEntry[]
}

/** User info stored in Firestore (all fields for display/admin). */
export function userInfoToFirestore(u: UserRecord): DocumentData {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    ...(u.avatar != null && { avatar: u.avatar }),
    ...(u.createdAt != null && { createdAt: u.createdAt }),
  }
}

export async function getUsers(adminEmail: string): Promise<UserRecord[]> {
  const ref = getUsersRef(adminEmail)
  const snap = await getDocs(ref)
  return snap.docs.map((d) => d.data() as UserRecord)
}

export async function setUser(adminEmail: string, user: UserRecord): Promise<void> {
  const ref = getUserRef(adminEmail, user.email)
  await setDoc(ref, userInfoToFirestore(user), { merge: true })
}

/** Get one user's info by email. */
export async function getUserByEmail(adminEmail: string, email: string): Promise<UserRecord | null> {
  const ref = getUserRef(adminEmail, email)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { ...snap.data() } as UserRecord
}

/** Sync a signed-in user's info to the admin's users subcollection (creates users subcollection if needed). */
export async function syncUserInfo(adminEmail: string, user: User): Promise<void> {
  const record: UserRecord = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    ...(user.avatar != null && { avatar: user.avatar }),
    createdAt: new Date().toISOString(),
  }
  await setUser(adminEmail, record)
}

/** Append an order to the user's document (which products they ordered + orderID). */
export async function appendOrderToUser(
  adminEmail: string,
  userEmail: string,
  entry: UserOrderEntry
): Promise<void> {
  const ref = getUserRef(adminEmail, userEmail)
  await updateDoc(ref, { orders: arrayUnion(entry) })
}

// ---------- Products (Bots): products -> <product_name> -> Bots details & info ----------

/** Read all performance_data candles for a bot from Firestore. */
export async function getBotPerformanceCandles(
  adminEmail: string,
  productSlug: string
): Promise<TwelveDataCandle[]> {
  const ref = getPerformanceRef(adminEmail, productSlug)
  const snap = await getDocs(ref)
  const all: TwelveDataCandle[] = []

  for (const d of snap.docs) {
    const data = d.data() as {
      csv?: unknown
      candles?: Array<{
        t?: string
        o?: number
        h?: number
        l?: number
        c?: number
        tv?: number
        volume?: number
        signal?: string
        trade_signal?: string
        bot3_signal?: string
        buy?: string
        sell?: string
      }>
    }

    if (Array.isArray(data.candles) && data.candles.length > 0) {
      for (const row of data.candles) {
        const timeStr = String(row.t ?? "").trim()
        if (!timeStr) continue
        const open = Number(row.o)
        const high = Number(row.h)
        const low = Number(row.l)
        const close = Number(row.c)
        if (
          Number.isNaN(open) ||
          Number.isNaN(high) ||
          Number.isNaN(low) ||
          Number.isNaN(close)
        ) {
          continue
        }
        const timestamp =
          timeStr.length > 10
            ? Math.floor(
                new Date(timeStr + (timeStr.includes("Z") ? "" : "Z")).getTime() / 1000
              )
            : undefined
        const rawSignal =
          (typeof row.signal === "string" && row.signal.trim() !== ""
            ? row.signal
            : typeof row.trade_signal === "string" && row.trade_signal.trim() !== ""
              ? row.trade_signal
              : typeof row.bot3_signal === "string" && row.bot3_signal.trim() !== ""
                ? row.bot3_signal
                : undefined) ?? undefined
        const baseSignal = rawSignal != null ? rawSignal.trim().toLowerCase() : undefined
        const inferredSignal =
          baseSignal ??
          (row.buy && row.buy !== "" ? "buy" : row.sell && row.sell !== "" ? "sell" : undefined)

        all.push({
          time: timeStr.length > 10 ? timeStr : timeStr.slice(0, 10),
          open,
          high,
          low,
          close,
          volume:
            typeof row.tv === "number"
              ? row.tv
              : typeof row.volume === "number"
                ? row.volume
                : undefined,
          timestamp,
          ...(inferredSignal != null && { signal: inferredSignal }),
        })
      }
      continue
    }

    if (typeof data.csv === "string" && data.csv.trim()) {
      const parsed = parseCSVToCandles(data.csv)
      for (const c of parsed) {
        all.push(c)
      }
      continue
    }
  }

  all.sort((a, b) => {
    const ta = (a as TwelveDataCandle & { timestamp?: number }).timestamp
    const tb = (b as TwelveDataCandle & { timestamp?: number }).timestamp
    if (ta != null && tb != null) return ta - tb
    return a.time.localeCompare(b.time)
  })

  // Deduplicate candles with identical time (or timestamp) to satisfy chart library requirements.
  const deduped: TwelveDataCandle[] = []
  let lastKey: string | null = null
  for (const c of all) {
    const t = (c as TwelveDataCandle & { timestamp?: number }).timestamp
    const key = t != null ? `ts:${t}` : `time:${c.time}`
    if (key === lastKey) {
      // Overwrite the previous candle with the latest data for this time key.
      deduped[deduped.length - 1] = c
    } else {
      deduped.push(c)
      lastKey = key
    }
  }

  return deduped
}

export async function getProducts(adminEmail: string): Promise<Product[]> {
  const ref = getProductsRef(adminEmail)
  const snap = await getDocs(ref)
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return { id: (data.id as string) ?? d.id, slug: d.id, ...data } as Product
  })
}

export async function setProducts(adminEmail: string, products: Product[]): Promise<void> {
  const batch = writeBatch(db)
  for (const p of products) {
    const ref = getProductRef(adminEmail, p.slug)
    batch.set(ref, productToFirestore(p))
  }
  await batch.commit()
}

export async function addProduct(adminEmail: string, product: Omit<Product, "id">): Promise<Product> {
  const slug = product.slug || slugify(product.name)
  const id = slug
  const ref = getProductRef(adminEmail, slug)
  await setDoc(ref, productToFirestore({ ...product, id, slug } as Product))
  return { ...product, id, slug } as Product
}

export async function updateProduct(
  adminEmail: string,
  productSlug: string,
  updates: Partial<Product>
): Promise<void> {
  const ref = getProductRef(adminEmail, productSlug)
  const data: DocumentData = { ...updates }
  delete data.id
  delete data.slug
  await updateDoc(ref, data)
}

export async function deleteProduct(adminEmail: string, productSlug: string): Promise<void> {
  const ref = getProductRef(adminEmail, productSlug)
  await deleteDoc(ref)
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

/** Ensure admin document and products subcollection exist; if products are empty, seed with initial data. */
export async function seedProductsIfEmpty(
  adminEmail: string,
  seedProducts: Product[]
): Promise<Product[]> {
  const existing = await getProducts(adminEmail)
  if (existing.length > 0) return existing
  await setProducts(adminEmail, seedProducts)
  return seedProducts
}

// ---------- Orders: admins/{adminId}/users/{userEmail}/orders/{orderId} ----------

/** Get orders for one user from the new schema path only. */
export async function getOrdersForUser(
  adminEmail: string,
  userEmail: string
): Promise<Order[]> {
  const ref = getUserOrdersRef(adminEmail, userEmail)
  const q = query(ref, orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    delete data[ADMIN_ID_FIELD]
    return { id: d.id, ...data } as Order
  })
}

/** Get all orders (for admin). Uses collection group over new schema path. */
export async function getOrders(adminEmail: string): Promise<Order[]> {
  const adminId = toAdminId(adminEmail)
  try {
    const ref = collectionGroup(db, ORDERS_SUBCOLLECTION)
    const q = query(
      ref,
      where(ADMIN_ID_FIELD, "==", adminId),
      orderBy("createdAt", "desc")
    )
    const snap = await getDocs(q)
    const orders = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>
      delete data[ADMIN_ID_FIELD]
      return { id: d.id, ...data } as Order
    })
    if (orders.length > 0) return orders
  } catch {
    // Fallback below handles missing index or query constraints.
  }
  return getOrdersByAdminUsers(adminEmail)
}

/** Get one order from new schema path (no collection group). Use when you have userEmail. */
export async function getOrderForUser(
  adminEmail: string,
  userEmail: string,
  orderId: string
): Promise<Order | null> {
  const ref = getOrderRefUnderUser(adminEmail, userEmail, orderId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data() as Record<string, unknown>
  delete data[ADMIN_ID_FIELD]
  return { id: snap.id, ...data } as Order
}

/** Get one order by id (uses collection group). Returns null if not found. */
export async function getOrder(adminEmail: string, orderId: string): Promise<Order | null> {
  const adminId = toAdminId(adminEmail)
  try {
    const ref = collectionGroup(db, ORDERS_SUBCOLLECTION)
    const q = query(
      ref,
      where(ADMIN_ID_FIELD, "==", adminId),
      where("id", "==", orderId),
      limit(1)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      const data = snap.docs[0].data() as Record<string, unknown>
      delete data[ADMIN_ID_FIELD]
      return { id: snap.docs[0].id, ...data } as Order
    }
  } catch {
    // Fallback below handles missing index or query constraints.
  }
  return getOrderByAdminUsers(adminEmail, orderId)
}

export async function addOrder(adminEmail: string, order: Omit<Order, "id">): Promise<Order> {
  const id = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const userEmail = order.userEmail ?? ""
  const fullOrder: Order = { ...order, id }
  const ref = getOrderRefUnderUser(adminEmail, userEmail, id)
  await setDoc(ref, orderToFirestore(fullOrder, adminEmail))
  if (userEmail) {
    const entry: UserOrderEntry = {
      orderId: id,
      products: order.items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
      })),
      createdAt: fullOrder.createdAt,
    }
    await appendOrderToUser(adminEmail, userEmail, entry)
  }
  if (fullOrder.status === "paid") {
    await createLicensesForOrder(adminEmail, fullOrder)
  }
  return fullOrder
}

export async function updateOrderStatus(
  adminEmail: string,
  orderId: string,
  status: Order["status"]
): Promise<void> {
  const order = await getOrder(adminEmail, orderId)
  if (!order) return
  const userEmail = order.userEmail ?? ""
  const ref = getOrderRefUnderUser(adminEmail, userEmail, orderId)
  await updateDoc(ref, { status })
  if (status === "paid") {
    await createLicensesForOrder(adminEmail, { ...order, status })
  }
}

/** Generate a secure license key (for use in Python/GUI app). */
export function generateLicenseKey(): string {
  const segment = () => Math.random().toString(36).slice(2, 10)
  return `AF-${segment().toUpperCase()}-${segment().toUpperCase()}-${segment().toUpperCase()}`
}

// ---------- Licenses: under users/{userEmail}/orders/{orderId}/licenses ----------

function licenseToFirestore(l: License, adminEmail: string): DocumentData {
  return {
    [ADMIN_ID_FIELD]: toAdminId(adminEmail),
    id: l.id,
    licenseKey: l.licenseKey,
    userId: l.userId,
    userEmail: l.userEmail,
    productId: l.productId,
    productSlug: l.productSlug,
    productName: l.productName,
    orderId: l.orderId,
    status: l.status,
    createdAt: l.createdAt,
    ...(l.expiresAt != null && { expiresAt: l.expiresAt }),
    ...(l.downloadUrl != null && { downloadUrl: l.downloadUrl }),
    ...(l.deviceId != null && { deviceId: l.deviceId }),
    ...(l.deviceInfo != null && { deviceInfo: l.deviceInfo }),
    ...(l.firstActivatedAt != null && { firstActivatedAt: l.firstActivatedAt }),
  }
}

/** Create a license under the given user's order. */
export async function createLicense(
  adminEmail: string,
  userEmail: string,
  orderId: string,
  license: Omit<License, "id">
): Promise<License> {
  const id = `lic-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const full: License = { ...license, id }
  const ref = getOrderLicenseRef(adminEmail, userEmail, orderId, id)
  await setDoc(ref, licenseToFirestore(full, adminEmail))
  return full
}

/** Create one license per quantity for each item in a paid order. Idempotent: skips if licenses for this order already exist. */
export async function createLicensesForOrder(adminEmail: string, order: Order): Promise<License[]> {
  if (order.status !== "paid") return []
  const userEmail = order.userEmail ?? ""
  const ref = getOrderLicensesRef(adminEmail, userEmail, order.id)
  const snap = await getDocs(ref)
  if (snap.size > 0) return snap.docs.map((d) => ({ id: d.id, ...d.data() } as License))

  const created: License[] = []
  const now = new Date().toISOString()
  const userId = order.userId

  for (const item of order.items) {
    for (let qty = 0; qty < item.quantity; qty++) {
      const license: Omit<License, "id"> = {
        licenseKey: generateLicenseKey(),
        userId,
        userEmail,
        productId: item.product.id,
        productSlug: item.product.slug,
        productName: item.product.name,
        orderId: order.id,
        status: "active",
        createdAt: now,
      }
      const saved = await createLicense(adminEmail, userEmail, order.id, license)
      created.push(saved)
    }
  }
  return created
}

export async function getLicensesByUser(adminEmail: string, userId: string): Promise<License[]> {
  const adminId = toAdminId(adminEmail)
  const byId = new Map<string, License>()

  try {
    const ref = collectionGroup(db, LICENSES_SUBCOLLECTION)
    const q = query(
      ref,
      where(ADMIN_ID_FIELD, "==", adminId),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )
    const snap = await getDocs(q)
    snap.docs.forEach((d) => {
      const data = d.data() as Record<string, unknown>
      delete data[ADMIN_ID_FIELD]
      byId.set(d.id, { id: d.id, ...data } as License)
    })
  } catch {
    // Index may be missing
  }

  try {
    const legacyRef = getLicensesRefLegacy(adminEmail)
    const legacyQ = query(legacyRef, where("userId", "==", userId), orderBy("createdAt", "desc"))
    const legacySnap = await getDocs(legacyQ)
    legacySnap.docs.forEach((d) => {
      if (byId.has(d.id)) return
      byId.set(d.id, { id: d.id, ...d.data() } as License)
    })
  } catch {
    // Ignore
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/** Get licenses for one order from new schema path (no collection group). Use when you have userEmail. */
export async function getLicensesForOrderForUser(
  adminEmail: string,
  userEmail: string,
  orderId: string
): Promise<License[]> {
  const ref = getOrderLicensesRef(adminEmail, userEmail, orderId)
  const q = query(ref, orderBy("createdAt", "asc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    delete data[ADMIN_ID_FIELD]
    return { id: d.id, ...data } as License
  })
}

export async function getLicensesByOrder(adminEmail: string, orderId: string): Promise<License[]> {
  const adminId = toAdminId(adminEmail)
  const byId = new Map<string, License>()

  try {
    const ref = collectionGroup(db, LICENSES_SUBCOLLECTION)
    const q = query(
      ref,
      where(ADMIN_ID_FIELD, "==", adminId),
      where("orderId", "==", orderId),
      orderBy("createdAt", "asc")
    )
    const snap = await getDocs(q)
    snap.docs.forEach((d) => {
      const data = d.data() as Record<string, unknown>
      delete data[ADMIN_ID_FIELD]
      byId.set(d.id, { id: d.id, ...data } as License)
    })
  } catch {
    // Index may be missing
  }

  try {
    const legacyRef = getLicensesRefLegacy(adminEmail)
    const legacyQ = query(legacyRef, where("orderId", "==", orderId), orderBy("createdAt", "asc"))
    const legacySnap = await getDocs(legacyQ)
    legacySnap.docs.forEach((d) => {
      if (byId.has(d.id)) return
      byId.set(d.id, { id: d.id, ...d.data() } as License)
    })
  } catch {
    // Ignore
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

/** Validate license key (for Python/GUI app). Returns license if active and not expired. */
export async function validateLicenseKey(
  adminEmail: string,
  licenseKey: string
): Promise<{ valid: true; license: License } | { valid: false; reason: string }> {
  const key = licenseKey.trim()
  const adminId = toAdminId(adminEmail)

  let license: License | null = null
  try {
    const ref = collectionGroup(db, LICENSES_SUBCOLLECTION)
    const q = query(
      ref,
      where(ADMIN_ID_FIELD, "==", adminId),
      where("licenseKey", "==", key)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      const data = snap.docs[0].data() as Record<string, unknown>
      delete data[ADMIN_ID_FIELD]
      license = { id: snap.docs[0].id, ...data } as License
    }
  } catch {
    // Index may be missing
  }
  if (!license) {
    try {
      const legacyRef = getLicensesRefLegacy(adminEmail)
      const legacyQ = query(legacyRef, where("licenseKey", "==", key), limit(1))
      const legacySnap = await getDocs(legacyQ)
      if (!legacySnap.empty)
        license = { id: legacySnap.docs[0].id, ...legacySnap.docs[0].data() } as License
    } catch {
      // Ignore
    }
  }
  if (!license) return { valid: false, reason: "License not found" }
  if (license.status !== "active") return { valid: false, reason: `License is ${license.status}` }
  if (license.expiresAt && new Date(license.expiresAt) < new Date())
    return { valid: false, reason: "License expired" }
  return { valid: true, license }
}

function orderToFirestore(o: Order, adminEmail: string): DocumentData {
  return {
    [ADMIN_ID_FIELD]: toAdminId(adminEmail),
    id: o.id,
    userId: o.userId,
    ...(o.userEmail != null && { userEmail: o.userEmail }),
    ...(o.userName != null && { userName: o.userName }),
    items: o.items,
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt,
    shippingAddress: o.shippingAddress,
  }
}

/**
 * Fallback reader for databases where order docs don't include adminId.
 * Reads directly from admins/{adminId}/users/{userEmail}/orders.
 */
async function getOrdersByAdminUsers(adminEmail: string): Promise<Order[]> {
  const usersSnap = await getDocs(getUsersRef(adminEmail))
  const all: Order[] = []

  for (const userDoc of usersSnap.docs) {
    const userEmail = userDoc.id
    const ordersRef = getUserOrdersRef(adminEmail, userEmail)
    const ordersSnap = await getDocs(ordersRef)
    for (const orderDoc of ordersSnap.docs) {
      const data = orderDoc.data() as Record<string, unknown>
      delete data[ADMIN_ID_FIELD]
      all.push({ id: orderDoc.id, ...data } as Order)
    }
  }

  return all.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Fallback single-order lookup by scanning users/{userEmail}/orders/{orderId}.
 */
async function getOrderByAdminUsers(
  adminEmail: string,
  orderId: string
): Promise<Order | null> {
  const usersSnap = await getDocs(getUsersRef(adminEmail))

  for (const userDoc of usersSnap.docs) {
    const userEmail = userDoc.id
    const ref = getOrderRefUnderUser(adminEmail, userEmail, orderId)
    const snap = await getDoc(ref)
    if (!snap.exists()) continue
    const data = snap.data() as Record<string, unknown>
    delete data[ADMIN_ID_FIELD]
    return { id: snap.id, ...data } as Order
  }

  return null
}

function productToFirestore(p: Product | (Omit<Product, "id"> & { slug: string })): DocumentData {
  return {
    ...("id" in p && p.id != null && { id: p.id }),
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    image: p.image,
    category: p.category,
    categoryId: p.categoryId,
    inStock: p.inStock,
    ...("featured" in p && p.featured != null && { featured: p.featured }),
    ...("performanceBot" in p && p.performanceBot != null && { performanceBot: p.performanceBot }),
  }
}
