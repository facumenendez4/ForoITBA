import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/header"
import {
  getSubjectBySlug,
  getSubjectCareers,
  getSubjectReviews,
  getSubjectContributions,
  getViewer,
  getMyReview,
  getMyVotes,
} from "@/lib/queries"
import { SubjectContent } from "./subject-content"
import { ArrowLeft } from "lucide-react"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const subject = await getSubjectBySlug(slug)
  if (!subject) return { title: "Materia no encontrada" }
  return {
    title: `${subject.name} (${subject.code})`,
    description: `Reseñas, dificultad, carga y utilidad de ${subject.name} (${subject.code}) en el ITBA, según alumnos que la cursaron.`,
  }
}

export default async function SubjectPage({ params }: Props) {
  const { slug } = await params
  const subject = await getSubjectBySlug(slug)
  if (!subject) notFound()

  const [careerLinks, reviews, contributions, viewer, myReview] =
    await Promise.all([
      getSubjectCareers(subject.code),
      getSubjectReviews(subject.code),
      getSubjectContributions(subject.code),
      getViewer(),
      getMyReview(subject.code),
    ])

  const myVotes = await getMyVotes(contributions.map((c) => c.id))

  const careers = careerLinks.map((cl: any) => ({
    id: cl.careers.id as string,
    name: cl.careers.name as string,
    slug: cl.careers.slug as string,
    credits: cl.credits as number,
    term: cl.term as string,
    isElective: cl.is_elective as boolean,
    prerequisites: (cl.prerequisites ?? []) as string[],
  }))

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

        <div className="mb-2">
          <p className="text-sm font-mono text-muted-foreground mb-1">
            {subject.code}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {subject.name}
          </h1>
        </div>

        <div className="mb-6" />

        <SubjectContent
          subject={subject}
          slug={slug}
          careers={careers}
          reviews={reviews}
          contributions={contributions}
          viewer={viewer}
          myReview={myReview}
          myVotes={myVotes}
        />
      </div>
    </main>
  )
}
