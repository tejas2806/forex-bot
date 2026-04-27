import { useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProductsStore } from "@/stores/products-store"
import { categories } from "@/data/products"
import { formatPrice } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/types"

const DEFAULT_PLAN_PRICES = {
  "3m": 349,
  "6m": 549,
  "12m": 749,
  lifetime: 899,
}

function buildPlansFromForm(form: {
  plan3m: string
  plan6m: string
  plan12m: string
  planLifetime: string
}) {
  const parse = (value: string, fallback: number) => {
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? n : fallback
  }

  const p3 = parse(form.plan3m, DEFAULT_PLAN_PRICES["3m"])
  const p6 = parse(form.plan6m, DEFAULT_PLAN_PRICES["6m"])
  const p12 = parse(form.plan12m, DEFAULT_PLAN_PRICES["12m"])
  const pLife = parse(form.planLifetime, DEFAULT_PLAN_PRICES.lifetime)

  return [
    { id: "3m" as const, label: "3 Months", months: 3, price: p3 },
    { id: "6m" as const, label: "6 Months", months: 6, price: p6 },
    { id: "12m" as const, label: "12 Months", months: 12, price: p12 },
    { id: "lifetime" as const, label: "Lifetime", months: null, price: pLife },
  ]
}

export function AdminProducts() {
  const { products, updateProduct, deleteProduct, addProduct } = useProductsStore()
  const [editing, setEditing] = useState<Product | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    categoryId: categories[0]?.id ?? "1",
    inStock: true,
    featured: false,
    plan3m: String(DEFAULT_PLAN_PRICES["3m"]),
    plan6m: String(DEFAULT_PLAN_PRICES["6m"]),
    plan12m: String(DEFAULT_PLAN_PRICES["12m"]),
    planLifetime: String(DEFAULT_PLAN_PRICES.lifetime),
  })

  const openEdit = (p: Product) => {
    const byId = Object.fromEntries((p.plans ?? []).map((plan) => [plan.id, plan.price]))
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      image: p.image,
      categoryId: p.categoryId,
      inStock: p.inStock,
      featured: !!p.featured,
      plan3m: String(byId["3m"] ?? DEFAULT_PLAN_PRICES["3m"]),
      plan6m: String(byId["6m"] ?? DEFAULT_PLAN_PRICES["6m"]),
      plan12m: String(byId["12m"] ?? DEFAULT_PLAN_PRICES["12m"]),
      planLifetime: String(byId["lifetime"] ?? p.price ?? DEFAULT_PLAN_PRICES.lifetime),
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    const plans = buildPlansFromForm(form)
    const lifetimePlanPrice = plans.find((p) => p.id === "lifetime")?.price
    const fallbackPrice = Number(form.price) || 0
    const lifetime = lifetimePlanPrice ?? fallbackPrice
    await updateProduct(editing.id, {
      name: form.name,
      description: form.description,
      price: lifetime,
      image: form.image,
      categoryId: form.categoryId,
      category: categories.find((c) => c.id === form.categoryId)?.name ?? editing.category,
      inStock: form.inStock,
      featured: form.featured,
      plans,
    })
    setEditing(null)
  }

  const openAdd = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      categoryId: categories[0]?.id ?? "1",
      inStock: true,
      featured: false,
      plan3m: String(DEFAULT_PLAN_PRICES["3m"]),
      plan6m: String(DEFAULT_PLAN_PRICES["6m"]),
      plan12m: String(DEFAULT_PLAN_PRICES["12m"]),
      planLifetime: String(DEFAULT_PLAN_PRICES.lifetime),
    })
    setAdding(true)
  }

  const saveAdd = async () => {
    const plans = buildPlansFromForm(form)
    const lifetimePlanPrice = plans.find((p) => p.id === "lifetime")?.price
    const fallbackPrice = Number(form.price) || 0
    const lifetime = lifetimePlanPrice ?? fallbackPrice
    await addProduct({
      name: form.name,
      description: form.description,
      price: lifetime,
      image: form.image,
      category: categories.find((c) => c.id === form.categoryId)?.name ?? "Other",
      categoryId: form.categoryId,
      inStock: form.inStock,
      featured: form.featured,
      plans,
      slug: "",
    })
    setAdding(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-zinc-100">Products</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add product
        </Button>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <img src={p.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-100">{p.name}</p>
                <p className="text-sm text-zinc-500">{formatPrice(p.price)} · {p.category}</p>
                {p.plans?.length ? (
                  <p className="text-xs text-zinc-600 mt-0.5">
                    3m: {formatPrice(p.plans.find((plan) => plan.id === "3m")?.price ?? 0)} · 6m:{" "}
                    {formatPrice(p.plans.find((plan) => plan.id === "6m")?.price ?? 0)} · 12m:{" "}
                    {formatPrice(p.plans.find((plan) => plan.id === "12m")?.price ?? 0)} · lifetime:{" "}
                    {formatPrice(p.plans.find((plan) => plan.id === "lifetime")?.price ?? p.price)}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {p.featured && <Badge>Featured</Badge>}
                {!p.inStock && <Badge variant="destructive">Out of stock</Badge>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-300"
                onClick={() => void deleteProduct(p.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Legacy Price (fallback)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>3 Months Price</Label>
                <Input
                  type="number"
                  value={form.plan3m}
                  onChange={(e) => setForm((f) => ({ ...f, plan3m: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>6 Months Price</Label>
                <Input
                  type="number"
                  value={form.plan6m}
                  onChange={(e) => setForm((f) => ({ ...f, plan6m: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>12 Months Price</Label>
                <Input
                  type="number"
                  value={form.plan12m}
                  onChange={(e) => setForm((f) => ({ ...f, plan12m: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Lifetime Price</Label>
                <Input
                  type="number"
                  value={form.planLifetime}
                  onChange={(e) => setForm((f) => ({ ...f, planLifetime: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
                  className="rounded border-zinc-600"
                />
                In stock
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  className="rounded border-zinc-600"
                />
                Featured
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Legacy Price (fallback)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>3 Months Price</Label>
                <Input
                  type="number"
                  value={form.plan3m}
                  onChange={(e) => setForm((f) => ({ ...f, plan3m: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>6 Months Price</Label>
                <Input
                  type="number"
                  value={form.plan6m}
                  onChange={(e) => setForm((f) => ({ ...f, plan6m: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>12 Months Price</Label>
                <Input
                  type="number"
                  value={form.plan12m}
                  onChange={(e) => setForm((f) => ({ ...f, plan12m: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Lifetime Price</Label>
                <Input
                  type="number"
                  value={form.planLifetime}
                  onChange={(e) => setForm((f) => ({ ...f, planLifetime: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Category</Label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="mt-2 flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
                  className="rounded border-zinc-600"
                />
                In stock
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  className="rounded border-zinc-600"
                />
                Featured
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={saveAdd}>Add product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
