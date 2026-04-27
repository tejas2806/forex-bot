import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth-store"
import { GoogleIcon } from "@/components/icons/GoogleIcon"

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address."
    case "auth/user-disabled":
      return "This account has been disabled."
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password."
    case "auth/too-many-requests":
      return "Too many attempts. Try again later."
    default:
      return "Sign-in failed. Please try again."
  }
}

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"
  const login = useAuthStore((s) => s.login)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      navigate(redirect)
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : ""
      setError(getAuthErrorMessage(code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError("")
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate(redirect)
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : ""
      if (code === "auth/popup-closed-by-user") return
      setError(code === "auth/account-exists-with-different-credential" ? "An account already exists with this email. Try signing in with email/password." : "Google sign-in failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden bg-void">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,rgba(124,58,237,0.15),transparent_40%),radial-gradient(circle_at_78%_34%,rgba(249,115,22,0.12),transparent_42%)]" />
      <div className="container relative mx-auto grid min-h-[calc(100vh-4rem)] items-center gap-6 px-4 py-12 lg:pr-28 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-10">
        <div className="max-w-xl">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
            AlphaForge Exchange · secure access
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-zinc-100 md:text-5xl">
            Settle on your terms
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            List limits, choose your automation path, and execute with verified signal workflows.
          </p>
          <div className="mt-8 space-y-3 text-sm text-zinc-400">
            <p className="flex items-center gap-2">
              <Circle className="h-2 w-2 fill-violet-400 text-violet-400" />
              INR limits, on-chain USDT, and globally tuned bot strategies.
            </p>
            <p className="flex items-center gap-2">
              <Circle className="h-2 w-2 fill-violet-400 text-violet-400" />
              No clutter - just your account, your rules, your edge.
            </p>
          </div>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/70 backdrop-blur lg:min-h-[500px]">
          <CardHeader className="space-y-3">
            <CardTitle className="text-zinc-100">Sign in</CardTitle>
            <CardDescription>Use your email or Google profile.</CardDescription>
            <div className="grid grid-cols-2 rounded-full border border-zinc-800 bg-zinc-900/70 p-1">
              <Link
                to="/login"
                className="rounded-full bg-zinc-100 px-3 py-1.5 text-center text-sm font-medium text-zinc-900"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full px-3 py-1.5 text-center text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Sign up
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="uppercase tracking-wide text-zinc-500">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 h-11 rounded-xl border-zinc-800 bg-zinc-950/70"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="password" className="uppercase tracking-wide text-zinc-500">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 h-11 rounded-xl border-zinc-800 bg-zinc-950/70"
                  disabled={loading}
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                {loading ? "Signing in..." : "Continue"}
              </Button>
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-zinc-700 bg-zinc-900/70 text-zinc-100 hover:bg-zinc-800"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <GoogleIcon className="h-5 w-5" />
                    Continue with Google
                  </span>
                </Button>
              </div>
            </form>
            <p className="mt-5 text-center text-xs text-zinc-500">
              By continuing you agree to our terms and privacy policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
