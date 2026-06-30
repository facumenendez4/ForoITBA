import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCareerBySlug, getCareerSubjects } from "@/lib/queries"
import { CareerPlan } from "./career-plan"
import { ArrowLeft, BookOpen } from "lucide-react"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const career = await getCareerBySlug(slug)
  if (!career) return { title: "Carrera no encontrada" }
  return {
    title: career.name,
    description: `Plan de estudios y reseñas de materias de ${career.name} en el ITBA.`,
  }
}

export default async function CareerPage({ params }: Props) {
  const { slug } = await params
  const career = await getCareerBySlug(slug)
  if (!career) notFound()

  const subjects = await getCareerSubjects(career.id)

  const obligatory = subjects.filter((s) => !s.is_elective)
  const electives = subjects.filter((s) => s.is_elective)

  const termGroups = new Map<string, typeof subjects>()
  for (const s of obligatory) {
    const list = termGroups.get(s.term) ?? []
    list.push(s)
    termGroups.set(s.term, list)
  }

  const sortedTerms = [...termGroups.keys()].sort()

  const electiveGroups = new Map<string, typeof subjects>()
  for (const s of electives) {
    const group = s.elective_group ?? "Electivas"
    const list = electiveGroups.get(group) ?? []
    list.push(s)
    electiveGroups.set(group, list)
  }

  return (
    <main className="flex-1">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Inicio
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {career.name}
          </h1>
          <p className="text-muted-foreground">
            {subjects.length} materias &middot;{" "}
            {obligatory.length} obligatorias &middot;{" "}
            {electives.length} electivas
          </p>
        </div>

        <CareerPlan
          sortedTerms={sortedTerms}
          termGroups={Object.fromEntries(termGroups)}
          electiveGroups={Object.fromEntries(electiveGroups)}
          hasElectives={electives.length > 0}
        />
      </div>
    </main>
  )
}
