"use client"

import { useActionState, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { submitContribution, type ActionState } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, X } from "lucide-react"
import { AnonymityToggle } from "@/components/anonymity-toggle"

type CareerOption = { id: string; name: string }

type Props = {
  type: "material" | "consejo"
  subjectCode: string
  slug: string
  careers: CareerOption[]
  defaultCareerId: string
  viewerDisplayName: string | null
}

const COPY = {
  material: {
    cta: "Compartir material",
    title: "Compartí material útil",
    placeholder: "Link a apuntes, parciales viejos, libros, repos…",
  },
  consejo: {
    cta: "Dejar un consejo",
    title: "Dejá un consejo",
    placeholder: "¿Qué le dirías a alguien que está por cursarla?",
  },
}

const initialState: ActionState = { ok: false }

export function ContributionForm({
  type,
  subjectCode,
  slug,
  careers,
  defaultCareerId,
  viewerDisplayName,
}: Props) {
  const [open, setOpen] = useState(false)
  const [careerId, setCareerId] = useState(defaultCareerId)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [state, formAction, pending] = useActionState(
    submitContribution,
    initialState
  )
  const copy = COPY[type]

  useEffect(() => {
    if (state.ok) setOpen(false)
  }, [state.ok])

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" />
        {copy.cta}
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
    <Card className="border-primary/30">
      <CardContent className="py-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{copy.title}</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="subject_code" value={subjectCode} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="career_id" value={careerId} />
          <input
            type="hidden"
            name="is_anonymous"
            value={isAnonymous ? "true" : "false"}
          />

          {careers.length > 1 && (
            <div className="space-y-1.5">
              <Label>Carrera</Label>
              <Select value={careerId} onValueChange={(v) => v && setCareerId(v)}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Elegí la carrera">
                    {careers.find((c) => c.id === careerId)?.name}
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
          )}

          <div className="space-y-1.5">
            <Label htmlFor={`body-${type}`}>{copy.title}</Label>
            <Textarea
              id={`body-${type}`}
              name="body"
              placeholder={copy.placeholder}
              maxLength={4000}
              required
            />
          </div>

          <AnonymityToggle
            isAnonymous={isAnonymous}
            onChange={setIsAnonymous}
            displayName={viewerDisplayName}
          />

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </motion.div>
  )
}
