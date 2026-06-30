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

type Mode = "login" | "register"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")

    const trimmed = email.trim().toLowerCase()
    if (!trimmed.endsWith("@itba.edu.ar")) {
      setErrorMsg("Solo se permiten emails @itba.edu.ar")
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
                : "Creá tu cuenta con email del ITBA"}
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

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "login" ? "Ingresando..." : "Creando cuenta..."}
                  </>
                ) : mode === "login" ? (
                  "Ingresar"
                ) : (
                  "Crear cuenta"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>
                    ¿No tenés cuenta?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => {
                        setMode("register")
                        setErrorMsg("")
                      }}
                    >
                      Registrate
                    </button>
                  </>
                ) : (
                  <>
                    ¿Ya tenés cuenta?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => {
                        setMode("login")
                        setErrorMsg("")
                      }}
                    >
                      Ingresá
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
