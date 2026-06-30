"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  MessageSquare,
  BookOpen,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import type {
  Subject,
  SubjectMetrics,
  PublicReview,
  PublicContribution,
} from "@/lib/queries"

type CareerInfo = {
  id: string
  name: string
  slug: string
  credits: number
  term: string
  isElective: boolean
  prerequisites: string[]
}

type Props = {
  subject: Subject
  careers: CareerInfo[]
  metrics: SubjectMetrics[]
  reviews: PublicReview[]
  contributions: PublicContribution[]
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Baja",
  2: "Media-baja",
  3: "Media",
  4: "Media-alta",
  5: "Alta",
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "bg-rating-1",
  2: "bg-rating-2",
  3: "bg-rating-3",
  4: "bg-rating-4",
  5: "bg-rating-5",
}

const DIFFICULTY_TEXT_COLORS: Record<number, string> = {
  1: "text-rating-1",
  2: "text-rating-2",
  3: "text-rating-3",
  4: "text-rating-4",
  5: "text-rating-5",
}

export function SubjectContent({
  subject,
  careers,
  metrics,
  reviews,
  contributions,
}: Props) {
  const [selectedCareerId, setSelectedCareerId] = useState(careers[0]?.id ?? "")

  const selectedCareer = careers.find((c) => c.id === selectedCareerId)
  const selectedMetrics = metrics.find((m) => m.career_id === selectedCareerId)

  const creditsByCareer = useMemo(() => {
    const unique = new Set(careers.map((c) => c.credits))
    if (unique.size === 1) return null
    return careers.map((c) => `${c.credits} en ${c.name}`).join(", ")
  }, [careers])

  const materials = contributions.filter((c) => c.type === "material")
  const tips = contributions.filter((c) => c.type === "consejo")

  return (
    <div className="space-y-8">
      {/* Career selector + metrics */}
      <section>
        {careers.length > 1 && (
          <div className="mb-4">
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">
              Métricas para
            </label>
            <Select
              value={selectedCareerId}
              onValueChange={(v) => v && setSelectedCareerId(v)}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Seleccionar carrera">
                  {selectedCareer?.name}
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

        {selectedMetrics && selectedMetrics.review_count > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Dificultad"
              value={
                selectedMetrics.difficulty_mode
                  ? DIFFICULTY_LABELS[selectedMetrics.difficulty_mode]
                  : "—"
              }
              colorClass={
                selectedMetrics.difficulty_mode
                  ? DIFFICULTY_TEXT_COLORS[selectedMetrics.difficulty_mode]
                  : ""
              }
            >
              {selectedMetrics.difficulty_distribution && (
                <DifficultyBar
                  distribution={selectedMetrics.difficulty_distribution}
                  total={selectedMetrics.review_count}
                />
              )}
            </MetricCard>

            <MetricCard
              label="Carga real"
              value={
                selectedMetrics.workload_mode != null
                  ? `${selectedMetrics.workload_mode}/${selectedMetrics.credits ?? selectedCareer?.credits ?? "?"}`
                  : "—"
              }
              subtitle="moda / créditos"
            />

            <MetricCard
              label="Utilidad"
              value={
                selectedMetrics.usefulness_avg != null
                  ? `${selectedMetrics.usefulness_avg}/5`
                  : "—"
              }
              subtitle={`${selectedMetrics.review_count} reseña${selectedMetrics.review_count !== 1 ? "s" : ""}`}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              {careers.length > 0
                ? `Sin reseñas para ${selectedCareer?.name ?? "esta carrera"} aún.`
                : "Sin reseñas aún."}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Subject info */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Créditos: </span>
            <span className="font-medium">
              {creditsByCareer ?? selectedCareer?.credits ?? "—"}
            </span>
          </div>
          {selectedCareer && (
            <div>
              <span className="text-muted-foreground">Ubicación: </span>
              <span className="font-medium">
                {selectedCareer.term}
                {selectedCareer.isElective && " (Electiva)"}
              </span>
            </div>
          )}
        </div>

        {selectedCareer && selectedCareer.prerequisites.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Correlativas: </span>
            <span className="font-medium">
              {selectedCareer.prerequisites.join(", ")}
            </span>
          </div>
        )}
      </section>

      <Separator />

      {/* Content tabs */}
      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Reseñas ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="material" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Material ({materials.length})
          </TabsTrigger>
          <TabsTrigger value="tips" className="gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" />
            Consejos ({tips.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4 space-y-3">
          {reviews.length === 0 ? (
            <EmptyState text="Todavía no hay reseñas. ¡Sé el primero en dejar una!" />
          ) : (
            reviews.map((r) => (
              <ReviewCard key={r.id} review={r} careers={careers} />
            ))
          )}
        </TabsContent>

        <TabsContent value="material" className="mt-4 space-y-3">
          {materials.length === 0 ? (
            <EmptyState text="Sin material compartido aún." />
          ) : (
            materials.map((c) => (
              <ContributionCard
                key={c.id}
                contribution={c}
                careers={careers}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="tips" className="mt-4 space-y-3">
          {tips.length === 0 ? (
            <EmptyState text="Sin consejos aún." />
          ) : (
            tips.map((c) => (
              <ContributionCard
                key={c.id}
                contribution={c}
                careers={careers}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({
  label,
  value,
  subtitle,
  colorClass,
  children,
}: {
  label: string
  value: string
  subtitle?: string
  colorClass?: string
  children?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={`text-2xl font-bold ${colorClass ?? ""}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

function DifficultyBar({
  distribution,
  total,
}: {
  distribution: Record<string, number>
  total: number
}) {
  return (
    <div className="mt-3 space-y-1">
      {[1, 2, 3, 4, 5].map((level) => {
        const count = distribution[String(level)] ?? 0
        const pct = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={level} className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted-foreground">
              {DIFFICULTY_LABELS[level]}
            </span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${DIFFICULTY_COLORS[level]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-right text-muted-foreground">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ReviewCard({
  review,
  careers,
}: {
  review: PublicReview
  careers: CareerInfo[]
}) {
  const career = careers.find((c) => c.id === review.career_id)

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className={DIFFICULTY_TEXT_COLORS[review.difficulty]}
          >
            {DIFFICULTY_LABELS[review.difficulty]}
          </Badge>
          <Badge variant="outline">Carga: {review.workload}</Badge>
          <Badge variant="outline">Utilidad: {review.usefulness}/5</Badge>
          {career && (
            <Badge variant="secondary" className="text-xs">
              {career.name}
            </Badge>
          )}
        </div>
        {review.comment && (
          <p className="text-sm leading-relaxed">{review.comment}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {review.term_taken && <span>Cursada: {review.term_taken}</span>}
          <span>
            {new Date(review.created_at).toLocaleDateString("es-AR", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ContributionCard({
  contribution,
  careers,
}: {
  contribution: PublicContribution
  careers: CareerInfo[]
}) {
  const career = careers.find((c) => c.id === contribution.career_id)

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {career && (
              <Badge variant="secondary" className="text-xs mb-2">
                {career.name}
              </Badge>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {contribution.body}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(contribution.created_at).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{contribution.upvotes}</span>
            <ThumbsDown className="h-3.5 w-3.5 ml-1" />
            <span>{Math.abs(contribution.downvotes)}</span>
          </div>
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
