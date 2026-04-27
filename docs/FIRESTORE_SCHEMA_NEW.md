# New Firestore Schema: Users → Orders → Order Data & Licenses

## 1. Current vs new (visual)

### Current schema
```
admins / {adminId}
├── users / {email}                    ← user profile only
│   └── id, email, name, role, orders[]
├── products / {slug}
│   └── performance_data / {docId}
├── orders / {orderId}                 ← all orders in one flat list
│   └── order data
└── licenses / {licenseId}             ← all licenses in one flat list (orderId field)
    └── license data
```

### New schema (what you asked for)
```
admins / {adminId}
├── users / {email}
│   ├── (user profile: id, email, name, role, avatar, createdAt)
│   └── orders / {orderId}              ← orders live under the user
│       ├── ORDER DOC: id, userId, userEmail, items, total, status, paymentMethod, createdAt, shippingAddress
│       └── licenses / {licenseId}      ← licenses live under the order
│           └── LICENSE DOC: licenseKey, userId, productSlug, orderId, status, createdAt, ...
├── products / {slug}
│   └── performance_data / {docId}
└── (no top-level orders or licenses)
```

So: **users → orders → order data & licenses**  
Path: `admins/{adminId}/users/{userEmail}/orders/{orderId}` = order doc  
Path: `admins/{adminId}/users/{userEmail}/orders/{orderId}/licenses/{licenseId}` = license doc  

---

## 2. Path summary

| What | Old path | New path |
|------|----------|----------|
| Order doc | `admins/{adminId}/orders/{orderId}` | `admins/{adminId}/users/{userEmail}/orders/{orderId}` |
| License doc | `admins/{adminId}/licenses/{licenseId}` | `admins/{adminId}/users/{userEmail}/orders/{orderId}/licenses/{licenseId}` |

---

## 3. How we get data in the new schema

| Operation | How |
|-----------|-----|
| **All orders (admin)** | Collection group query on `orders` (same `adminId` in path). |
| **Orders for one user** | `admins/{adminId}/users/{userEmail}/orders` ordered by `createdAt` desc. |
| **Licenses for one order** | `admins/{adminId}/users/{userEmail}/orders/{orderId}/licenses`. |
| **Licenses for one user** | Collection group query on `licenses` filtered by `userId == x`. |
| **Validate license key** | Collection group query on `licenses` where `licenseKey == key`. |

---

## 4. Rules impact

- Add rules for `users/{userId}/orders/{orderId}` and `users/{userId}/orders/{orderId}/licenses/{licenseId}`.
- You will need a **collection group** index for `orders` (and optionally for `licenses`) when using collection group queries.

---

## 5. Required composite indexes (Firestore)

Collection group queries need composite indexes. Create these in Firebase Console (or add to `firestore.indexes.json` and deploy):

| Collection group | Fields (order matters) |
|------------------|-------------------------|
| `orders` | `adminId` (Asc), `createdAt` (Desc) |
| `orders` | `adminId` (Asc), `id` (Asc) |
| `licenses` | `adminId` (Asc), `orderId` (Asc), `createdAt` (Asc) |
| `licenses` | `adminId` (Asc), `userId` (Asc), `createdAt` (Desc) |
| `licenses` | `adminId` (Asc), `licenseKey` (Asc) |

Firestore will show a link in the console to create each index when you first run the query.

---

## 6. Visual tree (new schema only)

```
admins / admin_at_alphaforge_io
└── users / user@example.com
    ├── id, email, name, role, avatar, createdAt
    └── orders / ord-1739...
        ├── id, userId, userEmail, items[], total, status, paymentMethod, createdAt, shippingAddress
        └── licenses / lic-1739...
            ├── licenseKey, userId, productSlug, orderId, status, createdAt, ...
            └── licenses / lic-1739...
                └── ...
```

This keeps **order data and licenses** under the same **order path**: `users/orders/<order_ID>/` holds the order document and the `licenses` subcollection.
