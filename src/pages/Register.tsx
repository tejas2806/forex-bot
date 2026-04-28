import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth-store"
import { GoogleIcon } from "@/components/icons/GoogleIcon"

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists."
    case "auth/invalid-email":
      return "Invalid email address."
    case "auth/weak-password":
      return "Password should be at least 6 characters."
    case "auth/operation-not-allowed":
      return "Email sign-up is not enabled. Contact support."
    default:
      return "Sign-up failed. Please try again."
  }
}

function getGoogleAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Google sign-up popup was closed."
    case "auth/popup-blocked":
      return "Popup blocked by browser. Please allow popups and try again."
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Authentication settings."
    case "auth/operation-not-allowed":
      return "Google sign-in provider is disabled in Firebase Authentication."
    case "auth/network-request-failed":
      return "Network error during Google sign-up. Please try again."
    default:
      return "Google sign-up failed. Try again."
  }
}

export function Register() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(email, name, password)
      navigate("/")
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
      navigate("/")
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : ""
      if (code === "auth/popup-closed-by-user") return
      setError(
        code === "auth/account-exists-with-different-credential"
          ? "An account already exists with this email. Try logging in instead."
          : getGoogleAuthErrorMessage(code)
      )
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
            AlphaForge Exchange · join network
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-zinc-100 md:text-5xl">
            Build your edge
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Create your account to access bot products, strategy analytics, and execution-ready signal workflows.
          </p>
          <div className="mt-8 space-y-3 text-sm text-zinc-400">
            <p className="flex items-center gap-2">
              <Circle className="h-2 w-2 fill-violet-400 text-violet-400" />
              Fast onboarding for traders, developers, and automation-first teams.
            </p>
            <p className="flex items-center gap-2">
              <Circle className="h-2 w-2 fill-violet-400 text-violet-400" />
              Centralized access to bots, reports, and order-linked license keys.
            </p>
          </div>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/70 backdrop-blur lg:min-h-[500px]">
          <CardHeader className="space-y-3">
            <CardTitle className="text-zinc-100">Create account</CardTitle>
            <CardDescription>Sign up with email or continue with Google.</CardDescription>
            <div className="grid grid-cols-2 rounded-full border border-zinc-800 bg-zinc-900/70 p-1">
              <Link
                to="/login"
                className="rounded-full px-3 py-1.5 text-center text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-zinc-100 px-3 py-1.5 text-center text-sm font-medium text-zinc-900"
              >
                Sign up
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="uppercase tracking-wide text-zinc-500">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2 h-11 rounded-xl border-zinc-800 bg-zinc-950/70"
                  disabled={loading}
                />
              </div>
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
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                {loading ? "Creating account..." : "Continue"}
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
