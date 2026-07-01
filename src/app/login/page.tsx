"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [infoMsg, setInfoMsg] = useState("")

  function switchMode(next: Mode) {
    setMode(next)
    setErrorMsg("")
    setInfoMsg("")
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
