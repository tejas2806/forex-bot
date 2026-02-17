import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const DEMO_USERS = [
  { id: "admin-1", email: "admin@alphaforge.io", name: "Admin", role: "admin" as const },
  { id: "user-1", email: "trader@example.com", name: "Alex Trader", role: "customer" as const },
]

export function AdminUsers() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-zinc-100 mb-8">Users</h1>
      <p className="text-zinc-500 mb-6">
        Traders and admins. In production this would sync with your backend.
      </p>
      <div className="space-y-2">
        {DEMO_USERS.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-zinc-100">{u.name}</p>
                <p className="text-sm text-zinc-500">{u.email}</p>
              </div>
              <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                {u.role}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
