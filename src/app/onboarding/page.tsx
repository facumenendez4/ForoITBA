"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

type Career = { id: string; name: string }

export default function OnboardingPage() {
  const router = useRouter()
  const [careers, setCareers] = useState<Career[]>([])
  const [selectedCareer, setSelectedCareer] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("career_id")
        .eq("id", user.id)
        .single()

      if (profile?.career_id) {
        router.replace("/")
        return
      }

      const { data: careerList } = await supabase
        .from("careers")
        .select("id, name")
        .order("name")

      setCareers(careerList ?? [])
      setLoading(false)
    }

    init()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCareer) return

    setSaving(true)
    setError("")

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace("/login")
      return
    }

    // upsert: un signup fresco puede no tener todavía fila en profiles.
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, career_id: selectedCareer })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
    } else {
      router.replace("/")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              ¡Bienvenido a <span className="text-primary">Foro</span>ITBA!
            </CardTitle>
            <CardDescription>
              Elegí tu carrera para personalizar tu experiencia
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="career">Carrera</Label>
                <Select
                  value={selectedCareer}
                  onValueChange={(v) => setSelectedCareer(v ?? "")}
                >
                  <SelectTrigger id="career">
                    <SelectValue placeholder="Seleccioná tu carrera">
                      {careers.find((c) => c.id === selectedCareer)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {careers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={!selectedCareer || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Podés cambiar tu carrera después desde tu perfil.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
