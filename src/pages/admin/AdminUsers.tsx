import { useEffect, useMemo, useState } from "react"
import { Search, ShieldCheck, Users2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DEFAULT_ADMIN_EMAIL, getUsers, setUser, type UserRecord } from "@/lib/firestore"
import { useAuthStore } from "@/stores/auth-store"

export function AdminUsers() {
  const authReady = useAuthStore((s) => s.authReady)
  const user = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<UserRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "customer" as UserRecord["role"],
  })

  useEffect(() => {
    if (!authReady || !user) return
    setLoading(true)
    setError(null)
    getUsers(DEFAULT_ADMIN_EMAIL)
      .then((list) => setUsers(list))
      .catch(() => setError("Failed to load users from Firestore."))
      .finally(() => setLoading(false))
  }, [authReady, user])

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        (a.createdAt ?? "").localeCompare(b.createdAt ?? "") * -1
      ),
    [users]
  )
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sortedUsers
    return sortedUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [sortedUsers, query])
  const totalUsers = sortedUsers.length
  const totalAdmins = sortedUsers.filter((u) => u.role === "admin").length
  const totalCustomers = totalUsers - totalAdmins

  const openEdit = (record: UserRecord) => {
    setEditing(record)
    setSaveMessage(null)
    setForm({
      name: record.name ?? "",
      email: record.email,
      role: record.role,
    })
  }

  const saveUser = async () => {
    if (!editing) return
    setSaving(true)
    setSaveMessage(null)
    const payload: UserRecord = {
      ...editing,
      name: form.name.trim() || editing.name || editing.email.split("@")[0],
      role: form.role,
      email: editing.email,
    }
    try {
      await setUser(DEFAULT_ADMIN_EMAIL, payload)
      setUsers((prev) =>
        prev.map((u) => (u.email === editing.email ? { ...u, ...payload } : u))
      )
      setSaveMessage("User details saved.")
      setEditing(null)
    } catch {
      setSaveMessage("Failed to save user details.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-100">Users</h1>
          <p className="text-zinc-500 mt-1">Manage live user profiles stored in Firestore.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, role..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Total users</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">{totalUsers}</p>
            </div>
            <Users2 className="h-5 w-5 text-zinc-400" />
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Admins</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">{totalAdmins}</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-orange-400" />
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Customers</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">{totalCustomers}</p>
            </div>
            <Users2 className="h-5 w-5 text-zinc-400" />
          </CardContent>
        </Card>
      </div>

      {saveMessage && (
        <p className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300">
          {saveMessage}
        </p>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-zinc-500">
            Loading users...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-red-300">
            {error}
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-zinc-500">
            No users match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((u) => (
            <Card
              key={u.id || u.email}
              className="border-zinc-800 bg-zinc-900/40 transition-colors hover:border-zinc-700"
            >
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-zinc-100">
                    {u.name || u.email.split("@")[0]}
                  </p>
                  <p className="truncate text-sm text-zinc-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                    {u.role}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                    Edit details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="edit-user-name">Name</Label>
              <Input
                id="edit-user-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-email">Email</Label>
              <Input
                id="edit-user-email"
                value={form.email}
                disabled
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-role">Role</Label>
              <select
                id="edit-user-role"
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value as UserRecord["role"],
                  }))
                }
                className="mt-2 flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100"
              >
                <option value="customer">customer</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveUser()} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
