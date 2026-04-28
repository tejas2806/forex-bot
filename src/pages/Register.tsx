import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AlertTriangle, ArrowLeft, Circle } from "lucide-react"
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
  const [touched, setTouched] = useState<{ name: boolean; email: boolean; password: boolean }>({
    name: false,
    email: false,
    password: false,
  })
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

  const validateName = (value: string) => {
    if (!value.trim()) return "Please fill in this field."
    if (value.trim().length < 2) return "Name should be at least 2 characters."
    return ""
  }

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
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setFieldErrors(nextErrors)
    return !nextErrors.name && !nextErrors.email && !nextErrors.password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setTouched({ name: true, email: true, password: true })
    if (!validateForm()) {
      setError("Please fix the highlighted fields.")
      return
    }
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
                  onChange={(e) => {
                    const value = e.target.value
                    setName(value)
                    if (touched.name) {
                      setFieldErrors((prev) => ({ ...prev, name: validateName(value) }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, name: true }))
                    setFieldErrors((prev) => ({ ...prev, name: validateName(name) }))
                  }}
                  className={`mt-2 h-11 rounded-xl bg-zinc-950/70 ${
                    touched.name && fieldErrors.name ? "border-red-500/60" : "border-zinc-800"
                  }`}
                  disabled={loading}
                />
                {touched.name && fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
                )}
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
                  disabled={loading}
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
                  disabled={loading}
                  placeholder="At least 6 characters"
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
                disabled={loading}
              >
                {loading ? "Creating account..." : "Continue"}
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
