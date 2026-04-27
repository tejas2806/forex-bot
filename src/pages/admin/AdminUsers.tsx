import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_ADMIN_EMAIL, getUsers, type UserRecord } from "@/lib/firestore"
import { useAuthStore } from "@/stores/auth-store"

export function AdminUsers() {
  const authReady = useAuthStore((s) => s.authReady)
  const user = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-zinc-100 mb-8">Users</h1>
      <p className="text-zinc-500 mb-6">Live users from Firestore under admin workspace.</p>

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
      ) : sortedUsers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-zinc-500">
            No users found in Firestore.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedUsers.map((u) => (
            <Card key={u.id || u.email}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-zinc-100">
                    {u.name || u.email.split("@")[0]}
                  </p>
                  <p className="text-sm text-zinc-500">{u.email}</p>
                </div>
                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                  {u.role}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
