"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { submitReview, type ActionState } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Loader2, PenLine, X } from "lucide-react"
import { AnonymityToggle } from "@/components/anonymity-toggle"

type CareerOption = { id: string; name: string; credits: number }

export type MyReview = {
  career_id: string
  difficulty: number
  workload: number
  usefulness: number
  comment: string | null
  term_taken: string | null
  is_anonymous: boolean
}

type Props = {
  subjectCode: string
  slug: string
  careers: CareerOption[]
  defaultCareerId: string
  existing: MyReview | null
  viewerDisplayName: string | null
}

const DIFFICULTY = [
  { v: 1, label: "Baja" },
  { v: 2, label: "Media-baja" },
  { v: 3, label: "Media" },
  { v: 4, label: "Media-alta" },
  { v: 5, label: "Alta" },
]

// La carga real se expresa en créditos de trabajo, comparable a los créditos
// que vale la materia (la métrica se muestra como carga/créditos, ej: 9/3).
const WORKLOAD = [1, 3, 6, 9]

const initialState: ActionState = { ok: false }

export function ReviewForm({
  subjectCode,
  slug,
  careers,
  defaultCareerId,
  existing,
  viewerDisplayName,
}: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(submitReview, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  const [careerId, setCareerId] = useState(existing?.career_id ?? defaultCareerId)
  const [difficulty, setDifficulty] = useState<number | null>(
    existing?.difficulty ?? null
  )
  const [workload, setWorkload] = useState<number | null>(
    existing?.workload ?? null
  )
  const [usefulness, setUsefulness] = useState<number | null>(
    existing?.usefulness ?? null
  )
  const [isAnonymous, setIsAnonymous] = useState(existing?.is_anonymous ?? true)

  // Cerrar el form cuando el guardado fue exitoso (la página ya se revalidó).
  useEffect(() => {
    if (state.ok) setOpen(false)
  }, [state.ok])

  const selectedCredits = careers.find((c) => c.id === careerId)?.credits ?? null
  const ready = difficulty != null && workload != null && usefulness != null

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <PenLine className="h-4 w-4" />
        {existing ? "Editar mi reseña" : "Dejar reseña"}
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
          <h3 className="font-semibold">
            {existing ? "Editá tu reseña" : "Reseñá esta materia"}
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="space-y-5">
          <input type="hidden" name="subject_code" value={subjectCode} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="career_id" value={careerId} />
          <input type="hidden" name="difficulty" value={difficulty ?? ""} />
          <input type="hidden" name="workload" value={workload ?? ""} />
          <input type="hidden" name="usefulness" value={usefulness ?? ""} />
          <input
            type="hidden"
            name="is_anonymous"
            value={isAnonymous ? "true" : "false"}
          />

          {careers.length > 1 && (
            <div className="space-y-1.5">
              <Label>¿En qué carrera la cursaste?</Label>
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

          {/* Dificultad — escala funcional verde→rojo */}
          <div className="space-y-1.5">
            <Label>Dificultad</Label>
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTY.map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDifficulty(v)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    difficulty === v
                      ? `bg-rating-${v} border-transparent text-white`
                      : "border-input hover:bg-accent"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Carga real — en créditos de trabajo */}
          <div className="space-y-1.5">
            <Label>Carga real</Label>
            <p className="text-xs text-muted-foreground">
              ¿A cuántos créditos de trabajo real equivale?
              {selectedCredits != null && (
                <> La materia vale <strong>{selectedCredits}</strong> créd.</>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WORKLOAD.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setWorkload(v)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    workload === v
                      ? "bg-primary border-transparent text-primary-foreground"
                      : "border-input hover:bg-accent"
                  )}
                >
                  {v} créd.
                </button>
              ))}
            </div>
          </div>

          {/* Utilidad */}
          <div className="space-y-1.5">
            <Label>Utilidad (1 a 5)</Label>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setUsefulness(v)}
                  className={cn(
                    "h-9 w-9 rounded-lg border text-sm transition-colors",
                    usefulness === v
                      ? "bg-primary border-transparent text-primary-foreground"
                      : "border-input hover:bg-accent"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Cuatri */}
          <div className="space-y-1.5">
            <Label htmlFor="term_taken">Cuatrimestre cursado (opcional)</Label>
            <Input
              id="term_taken"
              name="term_taken"
              placeholder="ej: 2C 2024"
              defaultValue={existing?.term_taken ?? ""}
              maxLength={40}
              className="max-w-[12rem]"
            />
          </div>

          {/* Comentario */}
          <div className="space-y-1.5">
            <Label htmlFor="comment">Comentario (opcional)</Label>
            <Textarea
              id="comment"
              name="comment"
              placeholder="¿Cómo te fue? ¿Qué tener en cuenta?"
              defaultValue={existing?.comment ?? ""}
              maxLength={2000}
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
            <Button type="submit" disabled={!ready || pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existing ? "Guardar cambios" : "Publicar reseña"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </motion.div>
  )
}
