"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { MessageSquare, BookOpen, Lightbulb, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReviewForm } from "@/components/review-form"
import { ContributionForm } from "@/components/contribution-form"
import { VoteButtons } from "@/components/vote-buttons"
import { ReportButton } from "@/components/report-button"
import type {
  Subject,
  PublicReview,
  PublicContribution,
  Viewer,
  MyReview,
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
  slug: string
  careers: CareerInfo[]
  reviews: PublicReview[]
  contributions: PublicContribution[]
  viewer: Viewer | null
  myReview: MyReview | null
  myVotes: Record<string, 1 | -1>
}

type SortBy = "votes" | "recent"

/** Ordena por votos (score desc, desempata por más reciente) o por más reciente. */
function sortBySelected<T extends { score: number; created_at: string }>(
  items: T[],
  sortBy: SortBy
): T[] {
  const byRecent = (a: T, b: T) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  return [...items].sort((a, b) =>
    sortBy === "votes" ? b.score - a.score || byRecent(a, b) : byRecent(a, b)
  )
}

/** Moda de una lista; en empate gana el valor más alto (criterio del brief). */
function mode(nums: number[]): number | null {
  if (nums.length === 0) return null
  const counts = new Map<number, number>()
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1)
  let best: number | null = null
  let bestCount = -1
  for (const [val, cnt] of counts) {
    if (cnt > bestCount || (cnt === bestCount && val > (best ?? -Infinity))) {
      best = val
      bestCount = cnt
    }
  }
  return best
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
  slug,
  careers,
  reviews,
  contributions,
  viewer,
  myReview,
  myVotes,
}: Props) {
  const isAuthed = viewer != null
  const careerOptions = careers.map((c) => ({
    id: c.id,
    name: c.name,
    credits: c.credits,
  }))
  // Carrera por defecto al escribir: la del perfil si dicta esta materia, si no la primera.
  const defaultCareerId =
    careers.find((c) => c.id === viewer?.careerId)?.id ?? careers[0]?.id ?? ""

  // Selección de carreras a considerar en las métricas. Por defecto: todas (= general).
  const [included, setIncluded] = useState<Set<string>>(
    () => new Set(careers.map((c) => c.id))
  )

  function toggleCareer(id: string) {
    setIncluded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const reviewsByCareer = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of reviews) m.set(r.career_id, (m.get(r.career_id) ?? 0) + 1)
    return m
  }, [reviews])

  // Métricas agregadas sobre las carreras seleccionadas.
  const agg = useMemo(() => {
    const filtered = reviews.filter((r) => included.has(r.career_id))
    const count = filtered.length
    const diffDist: Record<string, number> = {}
    const workDist: Record<string, number> = {}
    const usefDist: Record<string, number> = {}
    for (const r of filtered) {
      diffDist[r.difficulty] = (diffDist[r.difficulty] ?? 0) + 1
      workDist[r.workload] = (workDist[r.workload] ?? 0) + 1
      usefDist[r.usefulness] = (usefDist[r.usefulness] ?? 0) + 1
    }
    const includedCareers = careers.filter((c) => included.has(c.id))
    return {
      count,
      difficultyMode: mode(filtered.map((r) => r.difficulty)),
      difficultyDist: diffDist,
      workloadMode: mode(filtered.map((r) => r.workload)),
      workloadDist: workDist,
      usefulnessAvg: count
        ? Math.round(
            (filtered.reduce((s, r) => s + r.usefulness, 0) / count) * 10
          ) / 10
        : null,
      usefulnessDist: usefDist,
      // Créditos de referencia: la moda de créditos entre las carreras elegidas.
      credits: mode(includedCareers.map((c) => c.credits)),
    }
  }, [reviews, included, careers])

  // Detalle del plan según la selección.
  const includedCareers = careers.filter((c) => included.has(c.id))
  const creditsDisplay = useMemo(() => {
    const unique = new Set(includedCareers.map((c) => c.credits))
    if (unique.size === 0) return "—"
    if (unique.size === 1) return String([...unique][0])
    return includedCareers.map((c) => `${c.credits} en ${c.name}`).join(", ")
  }, [includedCareers])
  const singleCareer = includedCareers.length === 1 ? includedCareers[0] : null

  const allIncluded = included.size === careers.length

  const [sortBy, setSortBy] = useState<SortBy>("votes")
  const materials = contributions.filter((c) => c.type === "material")
  const tips = contributions.filter((c) => c.type === "consejo")
  const sortedReviews = sortBySelected(reviews, sortBy)
  const sortedMaterials = sortBySelected(materials, sortBy)
  const sortedTips = sortBySelected(tips, sortBy)

  return (
    <div className="space-y-8">
      {/* Career multi-select + aggregated metrics */}
      <section>
        {careers.length > 1 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Métricas {allIncluded ? "generales" : "para las carreras elegidas"}
              </label>
              <button
                type="button"
                onClick={() =>
                  setIncluded(
                    allIncluded
                      ? new Set()
                      : new Set(careers.map((c) => c.id))
                  )
                }
                className="text-xs text-primary hover:underline"
              >
                {allIncluded ? "Limpiar" : "Todas"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {careers.map((c) => {
                const active = included.has(c.id)
                const n = reviewsByCareer.get(c.id) ?? 0
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCareer(c.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary border-transparent text-primary-foreground"
                        : "border-input text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {c.name}
                    {n > 0 && (
                      <span className={active ? "opacity-80" : "opacity-60"}>
                        {" "}
                        ({n})
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {agg.count > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Dificultad"
              value={
                agg.difficultyMode
                  ? DIFFICULTY_LABELS[agg.difficultyMode]
                  : "—"
              }
              colorClass={
                agg.difficultyMode
                  ? DIFFICULTY_TEXT_COLORS[agg.difficultyMode]
                  : ""
              }
            >
              <DistributionBar
                total={agg.count}
                rows={[1, 2, 3, 4, 5].map((l) => ({
                  label: DIFFICULTY_LABELS[l],
                  count: agg.difficultyDist[l] ?? 0,
                  colorClass: DIFFICULTY_COLORS[l],
                }))}
              />
            </MetricCard>

            <MetricCard
              label="Carga real"
              value={
                agg.workloadMode != null
                  ? `${agg.workloadMode}/${agg.credits ?? "?"}`
                  : "—"
              }
              subtitle="carga / créditos"
            >
              <DistributionBar
                total={agg.count}
                rows={[1, 3, 6, 9].map((w) => ({
                  label: `${w} créd.`,
                  count: agg.workloadDist[w] ?? 0,
                  colorClass: "bg-primary",
                }))}
              />
            </MetricCard>

            <MetricCard
              label="Utilidad"
              value={agg.usefulnessAvg != null ? `${agg.usefulnessAvg}/5` : "—"}
              subtitle={`${agg.count} reseña${agg.count !== 1 ? "s" : ""}`}
            >
              <DistributionBar
                total={agg.count}
                rows={[1, 2, 3, 4, 5].map((u) => ({
                  label: `${u}/5`,
                  count: agg.usefulnessDist[u] ?? 0,
                  colorClass: "bg-primary",
                }))}
              />
            </MetricCard>
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              {included.size === 0
                ? "Elegí al menos una carrera para ver métricas."
                : "Sin reseñas para la selección aún."}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Subject info (según la selección de carreras) */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Créditos: </span>
            <span className="font-medium">{creditsDisplay}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Ubicación: </span>
            <span className="font-medium">
              {singleCareer
                ? `${singleCareer.term}${singleCareer.isElective ? " (Electiva)" : ""}`
                : "Varía según carrera"}
            </span>
          </div>
        </div>

        {singleCareer && singleCareer.prerequisites.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Correlativas: </span>
            <span className="font-medium">
              {singleCareer.prerequisites.join(", ")}
            </span>
          </div>
        )}
      </section>

      <Separator />

      {/* Content tabs */}
      <Tabs defaultValue="reviews">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <SortControl sortBy={sortBy} onChange={setSortBy} />
        </div>

        <TabsContent value="reviews" className="mt-4 space-y-3">
          <div className="mb-1">
            {isAuthed ? (
              careers.length > 0 && (
                <ReviewForm
                  subjectCode={subject.code}
                  slug={slug}
                  careers={careerOptions}
                  defaultCareerId={defaultCareerId}
                  existing={myReview}
                />
              )
            ) : (
              <LoginCta text="Iniciá sesión con tu mail @itba.edu.ar para reseñar." />
            )}
          </div>
          {reviews.length === 0 ? (
            <EmptyState text="Todavía no hay reseñas. ¡Sé el primero en dejar una!" />
          ) : (
            sortedReviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                careers={careers}
                slug={slug}
                myVote={myVotes[r.id] ?? 0}
                isAuthed={isAuthed}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="material" className="mt-4 space-y-3">
          <div className="mb-1">
            {isAuthed ? (
              careers.length > 0 && (
                <ContributionForm
                  type="material"
                  subjectCode={subject.code}
                  slug={slug}
                  careers={careerOptions}
                  defaultCareerId={defaultCareerId}
                />
              )
            ) : (
              <LoginCta text="Iniciá sesión para compartir material." />
            )}
          </div>
          {materials.length === 0 ? (
            <EmptyState text="Sin material compartido aún." />
          ) : (
            sortedMaterials.map((c) => (
              <ContributionCard
                key={c.id}
                contribution={c}
                careers={careers}
                slug={slug}
                myVote={myVotes[c.id] ?? 0}
                isAuthed={isAuthed}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="tips" className="mt-4 space-y-3">
          <div className="mb-1">
            {isAuthed ? (
              careers.length > 0 && (
                <ContributionForm
                  type="consejo"
                  subjectCode={subject.code}
                  slug={slug}
                  careers={careerOptions}
                  defaultCareerId={defaultCareerId}
                />
              )
            ) : (
              <LoginCta text="Iniciá sesión para dejar un consejo." />
            )}
          </div>
          {tips.length === 0 ? (
            <EmptyState text="Sin consejos aún." />
          ) : (
            sortedTips.map((c) => (
              <ContributionCard
                key={c.id}
                contribution={c}
                careers={careers}
                slug={slug}
                myVote={myVotes[c.id] ?? 0}
                isAuthed={isAuthed}
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

function DistributionBar({
  rows,
  total,
}: {
  rows: { label: string; count: number; colorClass: string }[]
  total: number
}) {
  return (
    <div className="mt-3 space-y-1">
      {rows.map((row) => {
        const pct = total > 0 ? (row.count / total) * 100 : 0
        return (
          <div key={row.label} className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted-foreground">{row.label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full", row.colorClass)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-right text-muted-foreground">
              {row.count}
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
  slug,
  myVote,
  isAuthed,
}: {
  review: PublicReview
  careers: CareerInfo[]
  slug: string
  myVote: 0 | 1 | -1
  isAuthed: boolean
}) {
  const career = careers.find((c) => c.id === review.career_id)

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge
            className={cn(
              "border-transparent text-white",
              DIFFICULTY_COLORS[review.difficulty]
            )}
          >
            {DIFFICULTY_LABELS[review.difficulty]}
          </Badge>
          <Badge variant="secondary" className="font-medium">
            Carga real: {review.workload}/{career?.credits ?? "?"}
          </Badge>
          <Badge variant="secondary" className="font-medium">
            Utilidad: {review.usefulness}/5
          </Badge>
          {career && (
            <Badge variant="outline" className="text-xs">
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
          <div className="ml-auto flex items-center gap-3">
            <VoteButtons
              targetType="review"
              targetId={review.id}
              slug={slug}
              upvotes={review.upvotes}
              downvotes={review.downvotes}
              myVote={myVote}
              isAuthed={isAuthed}
            />
            <ReportButton
              targetType="review"
              targetId={review.id}
              slug={slug}
              isAuthed={isAuthed}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ContributionCard({
  contribution,
  careers,
  slug,
  myVote,
  isAuthed,
}: {
  contribution: PublicContribution
  careers: CareerInfo[]
  slug: string
  myVote: 0 | 1 | -1
  isAuthed: boolean
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
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>
                {new Date(contribution.created_at).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <ReportButton
                targetType="contribution"
                targetId={contribution.id}
                slug={slug}
                isAuthed={isAuthed}
              />
            </div>
          </div>
          <VoteButtons
            targetType="contribution"
            targetId={contribution.id}
            slug={slug}
            upvotes={contribution.upvotes}
            downvotes={contribution.downvotes}
            myVote={myVote}
            isAuthed={isAuthed}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SortControl({
  sortBy,
  onChange,
}: {
  sortBy: SortBy
  onChange: (s: SortBy) => void
}) {
  const opts: { value: SortBy; label: string }[] = [
    { value: "votes", label: "Más votados" },
    { value: "recent", label: "Más recientes" },
  ]
  return (
    <div className="inline-flex rounded-lg border p-0.5 text-xs">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 font-medium transition-colors",
            sortBy === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function LoginCta({ text }: { text: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      <span>{text}</span>
      <Link href="/login" className={buttonVariants({ size: "sm" })}>
        <LogIn className="mr-2 h-4 w-4" />
        Ingresar
      </Link>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
