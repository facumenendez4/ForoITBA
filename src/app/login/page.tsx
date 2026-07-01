"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

type Mode = "login" | "register" | "forgot"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.37l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.63l4.01 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(
    searchParams.get("error") === "auth"
      ? "No pudimos verificar tu cuenta. Ingresá con tu mail @itba.edu.ar."
      : ""
  )
  const [infoMsg, setInfoMsg] = useState("")

  function switchMode(next: Mode) {
    setMode(next)
    setErrorMsg("")
    setInfoMsg("")
  }

  async function handleGoogleLogin() {
    setErrorMsg("")
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: "itba.edu.ar" },
      },
    })
    if (error) {
      setErrorMsg(error.message)
      setGoogleLoading(false)
    }
    // Si no hay error, el navegador redirige a Google — no hace falta más acá.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")
    setInfoMsg("")

    const trimmed = email.trim().toLowerCase()
    if (!trimmed.endsWith("@itba.edu.ar")) {
      setErrorMsg("Solo se permiten emails @itba.edu.ar")
      return
    }

    if (mode === "forgot") {
      setLoading(true)
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      // Mensaje neutro: no revelamos si el email existe (anti-enumeración).
      setInfoMsg(
        "Si el email está registrado, te enviamos un enlace para recuperar tu contraseña. Revisá tu casilla."
      )
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (mode === "register" && password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    const supabase = createClient()

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email: trimmed,
        password,
      })
      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      })
      if (error) {
        setErrorMsg(
          error.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : error.message
        )
        setLoading(false)
        return
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("career_id")
        .eq("id", user.id)
        .single()

      if (!profile?.career_id) {
        router.push("/onboarding")
      } else {
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Foro<span className="text-primary font-extrabold">ITBA</span>
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Ingresá con tu cuenta"
                : mode === "register"
                ? "Creá tu cuenta con email del ITBA"
                : "Te enviamos un enlace para recuperar tu contraseña"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {mode !== "forgot" && (
              <div className="space-y-4 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                >
                  {googleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span className="ml-2">Continuar con Google</span>
                </Button>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">o</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email institucional</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="legajo@itba.edu.ar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => switchMode("forgot")}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmar contraseña
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              {errorMsg && (
                <p className="text-sm text-destructive">{errorMsg}</p>
              )}

              {infoMsg && (
                <p className="text-sm text-muted-foreground">{infoMsg}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "login"
                      ? "Ingresando..."
                      : mode === "register"
                      ? "Creando cuenta..."
                      : "Enviando..."}
                  </>
                ) : mode === "login" ? (
                  "Ingresar"
                ) : mode === "register" ? (
                  "Crear cuenta"
                ) : (
                  "Enviar enlace"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>
                    ¿No tenés cuenta?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => switchMode("register")}
                    >
                      Registrate
                    </button>
                  </>
                ) : mode === "register" ? (
                  <>
                    ¿Ya tenés cuenta?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => switchMode("login")}
                    >
                      Ingresá
                    </button>
                  </>
                ) : (
                  <>
                    ¿Te acordaste?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => switchMode("login")}
                    >
                      Volver a ingresar
                    </button>
                  </>
                )}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
