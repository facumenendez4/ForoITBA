"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronRight } from "lucide-react"

type SubjectEntry = {
  id: string
  subject_code: string
  credits: number
  term: string
  elective_group: string | null
  is_elective: boolean
  prerequisites: string[]
  subjects: { code: string; name: string; slug: string }
}

type Props = {
  sortedTerms: string[]
  termGroups: Record<string, SubjectEntry[]>
  electiveGroups: Record<string, SubjectEntry[]>
  hasElectives: boolean
}

function parseTerm(term: string) {
  const match = term.match(/Año (\d+) - Cuatrimestre (\d+)/)
  if (!match) return term
  return `${match[1]}° Año — ${match[2]}° Cuatrimestre`
}

export function CareerPlan({
  sortedTerms,
  termGroups,
  electiveGroups,
  hasElectives,
}: Props) {
  const [showElectives, setShowElectives] = useState(false)

  return (
    <div className="space-y-8">
      {sortedTerms.map((term) => (
        <section key={term}>
          <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            {parseTerm(term)}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {termGroups[term].map((cs) => (
              <SubjectCard key={cs.id} cs={cs} />
            ))}
          </div>
        </section>
      ))}

      {hasElectives && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowElectives(!showElectives)}
            >
              {showElectives ? "Ocultar electivas" : "Ver electivas"}
            </Button>
            <div className="h-px flex-1 bg-border" />
          </div>

          {showElectives &&
            Object.entries(electiveGroups).map(([group, subjects]) => (
              <section key={group}>
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {group}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {subjects.map((cs) => (
                    <SubjectCard key={cs.id} cs={cs} />
                  ))}
                </div>
              </section>
            ))}
        </>
      )}
    </div>
  )
}

function SubjectCard({ cs }: { cs: SubjectEntry }) {
  return (
    <Link
      href={`/materias/${cs.subjects.slug}`}
      className="group flex items-center gap-4 rounded-lg border p-5 transition-colors hover:bg-accent/50"
    >
      <BookOpen className="h-6 w-6 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-lg font-bold text-primary shrink-0">
            {cs.subjects.code}
          </span>
          <span className="text-lg font-semibold truncate">
            {cs.subjects.name}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {cs.credits} créditos
        </p>
      </div>
      {cs.is_elective && (
        <Badge variant="secondary" className="text-sm shrink-0">
          Electiva
        </Badge>
      )}
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
