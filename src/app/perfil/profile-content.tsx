"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { DeleteButton } from "@/components/delete-button"
import { AnonymityToggle } from "@/components/anonymity-toggle"
import {
  updateProfileCareer,
  updateProfileDisplayName,
  deleteReview,
  deleteContribution,
  updateContribution,
} from "@/lib/actions"
import type { MyReviewListItem, MyContributionListItem, Career } from "@/lib/queries"
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Loader2, PenLine, Check, X } from "lucide-react"

type Props = {
  email: string
  careers: Career[]
  currentCareerId: string
  currentDisplayName: string
  initialReviews: MyReviewListItem[]
  initialContributions: MyContributionListItem[]
}

const TYPE_LABELS = { material: "Material", consejo: "Consejo" } as const

export function ProfileContent({
  email,
  careers,
  currentCareerId,
  currentDisplayName,
  initialReviews,
  initialContributions,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews)
  const [contributions, setContributions] = useState(initialContributions)
  const [displayName, setDisplayName] = useState(currentDisplayName)

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card>
          <CardContent className="py-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Email
              </p>
              <p className="text-sm font-medium">{email}</p>
            </div>

            <CareerSelector careers={careers} currentCareerId={currentCareerId} />

            <DisplayNameField
              value={displayName}
              onSaved={setDisplayName}
            />

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm font-medium">Tema</p>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Mis reseñas ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <EmptyState text="Todavía no dejaste ninguna reseña." />
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {reviews.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge
                          className={cn(
                            "border-transparent text-white",
                            DIFFICULTY_COLORS[r.difficulty]
                          )}
                        >
                          {DIFFICULTY_LABELS[r.difficulty]}
                        </Badge>
                        <Badge variant="secondary" className="font-medium">
                          Carga real: {r.workload}
                        </Badge>
                        <Badge variant="secondary" className="font-medium">
                          Utilidad: {r.usefulness}/5
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {r.careers.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs italic">
                          {r.is_anonymous ? "Anónimo" : "Con tu nombre"}
                        </Badge>
                      </div>
                      <Link
                        href={`/materias/${r.subjects.slug}`}
                        className="font-medium text-sm hover:underline"
                      >
                        {r.subjects.name}
                      </Link>
                      {r.comment && (
                        <p className="text-sm leading-relaxed mt-1.5">
                          {r.comment}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {r.term_taken && <span>Cursada: {r.term_taken}</span>}
                        <span>
                          {new Date(r.created_at).toLocaleDateString("es-AR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="ml-auto flex items-center gap-3">
                          <Link
                            href={`/materias/${r.subjects.slug}`}
                            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                            Editar
                          </Link>
                          <DeleteButton
                            onDelete={() => deleteReview(r.id, r.subjects.slug)}
                            onDeleted={() =>
                              setReviews((prev) => prev.filter((x) => x.id !== r.id))
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Mis aportes ({contributions.length})
        </h2>
        {contributions.length === 0 ? (
          <EmptyState text="Todavía no dejaste ningún aporte." />
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {contributions.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ContributionItem
                    contribution={c}
                    viewerDisplayName={displayName || null}
                    onDeleted={() =>
                      setContributions((prev) =>
                        prev.filter((x) => x.id !== c.id)
                      )
                    }
                    onUpdated={(body, isAnonymous) =>
                      setContributions((prev) =>
                        prev.map((x) =>
                          x.id === c.id
                            ? { ...x, body, is_anonymous: isAnonymous }
                            : x
                        )
                      )
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  )
}

function CareerSelector({
  careers,
  currentCareerId,
}: {
  careers: Career[]
  currentCareerId: string
}) {
  const [careerId, setCareerId] = useState(currentCareerId)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  function handleChange(v: string) {
    setCareerId(v)
    setSaved(false)
    setError("")
    startTransition(async () => {
      const res = await updateProfileCareer(v)
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(res.error ?? "No se pudo guardar.")
      }
    })
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
        Carrera
      </p>
      <div className="flex items-center gap-2">
        <Select value={careerId} onValueChange={(v) => v && handleChange(v)}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Elegí tu carrera">
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
        {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {saved && <Check className="h-4 w-4 text-rating-1" />}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}

function DisplayNameField({
  value,
  onSaved,
}: {
  value: string
  onSaved: (name: string) => void
}) {
  const [name, setName] = useState(value)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  function handleSave() {
    setSaved(false)
    setError("")
    startTransition(async () => {
      const res = await updateProfileDisplayName(name)
      if (res.ok) {
        onSaved(name.trim())
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(res.error ?? "No se pudo guardar.")
      }
    })
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
        Nombre para mostrar
      </p>
      <p className="text-xs text-muted-foreground mb-2">
        Se usa solo cuando elegís publicar una reseña o aporte sin anonimato.
      </p>
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ej: Juan Pérez"
          maxLength={60}
          className="max-w-xs"
        />
        <Button size="sm" variant="outline" onClick={handleSave} disabled={pending}>
          {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Guardar
        </Button>
        {saved && <Check className="h-4 w-4 text-rating-1" />}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}

function ContributionItem({
  contribution,
  viewerDisplayName,
  onDeleted,
  onUpdated,
}: {
  contribution: MyContributionListItem
  viewerDisplayName: string | null
  onDeleted: () => void
  onUpdated: (body: string, isAnonymous: boolean) => void
}) {
  const c = contribution
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(c.body)
  const [isAnonymous, setIsAnonymous] = useState(c.is_anonymous)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleSave() {
    setError("")
    startTransition(async () => {
      const res = await updateContribution(c.id, body, isAnonymous, c.subjects.slug)
      if (res.ok) {
        onUpdated(body, isAnonymous)
        setEditing(false)
      } else {
        setError(res.error ?? "No se pudo guardar.")
      }
    })
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {TYPE_LABELS[c.type]}
          </Badge>
          <Link
            href={`/materias/${c.subjects.slug}`}
            className="font-medium text-sm hover:underline"
          >
            {c.subjects.name}
          </Link>
          <Badge variant="outline" className="text-xs">
            {c.careers.name}
          </Badge>
          <Badge variant="outline" className="text-xs italic">
            {c.is_anonymous ? "Anónimo" : "Con tu nombre"}
          </Badge>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={4000}
              className="min-h-20"
            />
            <AnonymityToggle
              isAnonymous={isAnonymous}
              onChange={setIsAnonymous}
              displayName={viewerDisplayName}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={pending}>
                {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Guardar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setBody(c.body)
                  setIsAnonymous(c.is_anonymous)
                  setEditing(false)
                  setError("")
                }}
                disabled={pending}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>
            {new Date(c.created_at).toLocaleDateString("es-AR", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          {!editing && (
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <PenLine className="h-3.5 w-3.5" />
                Editar
              </button>
              <DeleteButton
                onDelete={() => deleteContribution(c.id, c.subjects.slug)}
                onDeleted={onDeleted}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
