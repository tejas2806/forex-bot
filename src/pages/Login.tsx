import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AlertTriangle, ArrowLeft, Circle } from "lucide-react"
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

function getGoogleAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed."
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled."
    case "auth/popup-blocked":
      return "Popup blocked by browser. Please allow popups and try again."
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Authentication settings."
    case "auth/operation-not-allowed":
      return "Google sign-in provider is disabled in Firebase Authentication."
    case "auth/network-request-failed":
      return "Network error during Google sign-in. Please try again."
    default:
      return "Google sign-in failed. Try again."
  }
}

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  })
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"
  const login = useAuthStore((s) => s.login)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

  const validateEmail = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return "Please fill in this field."
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) return "Please enter a valid email address."
    return ""
  }

  const validatePassword = (value: string) => {
    if (!value.trim()) return "Please fill in this field."
    if (value.length < 6) return "Password should be at least 6 characters."
    return ""
  }

  const validateForm = () => {
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setFieldErrors(nextErrors)
    return !nextErrors.email && !nextErrors.password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setTouched({ email: true, password: true })
    if (!validateForm()) {
      setError("Please fix the highlighted fields.")
      return
    }
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(redirect)
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : ""
      setError(getAuthErrorMessage(code))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError("")
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate(redirect)
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : ""
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return
      setError(
        code === "auth/account-exists-with-different-credential"
          ? "An account already exists with this email. Try signing in with email/password."
          : getGoogleAuthErrorMessage(code)
      )
    } finally {
      setGoogleLoading(false)
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
                  onChange={(e) => {
                    const value = e.target.value
                    setEmail(value)
                    if (touched.email) {
                      setFieldErrors((prev) => ({ ...prev, email: validateEmail(value) }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, email: true }))
                    setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }))
                  }}
                  className={`mt-2 h-11 rounded-xl bg-zinc-950/70 ${
                    touched.email && fieldErrors.email ? "border-red-500/60" : "border-zinc-800"
                  }`}
                  disabled={submitting}
                />
                {touched.email && fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password" className="uppercase tracking-wide text-zinc-500">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value
                    setPassword(value)
                    if (touched.password) {
                      setFieldErrors((prev) => ({ ...prev, password: validatePassword(value) }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, password: true }))
                    setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }))
                  }}
                  className={`mt-2 h-11 rounded-xl bg-zinc-950/70 ${
                    touched.password && fieldErrors.password ? "border-red-500/60" : "border-zinc-800"
                  }`}
                  disabled={submitting}
                />
                {touched.password && fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
                )}
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-orange-500 text-white hover:bg-orange-600"
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Continue"}
              </Button>
              <div className="relative py-1">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-800" />
                <p className="relative mx-auto w-fit bg-zinc-950/70 px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  OR
                </p>
              </div>
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-zinc-700 bg-zinc-900/70 text-zinc-100 hover:bg-zinc-800"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <GoogleIcon className="h-5 w-5" />
                    {googleLoading ? "Opening Google..." : "Continue with Google"}
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
