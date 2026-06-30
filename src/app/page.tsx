import Link from "next/link"
import { Header } from "@/components/header"
import { SubjectSearch } from "@/components/subject-search"
import { getCareers } from "@/lib/queries"
import { GraduationCap, ChevronRight } from "lucide-react"

export default async function Home() {
  const careers = await getCareers()

  return (
    <main className="flex-1">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-12">
        <section className="text-center mb-12">
          <h2 className="mb-3 text-4xl font-bold tracking-tight">
            Reseñas de materias del <span className="text-primary">ITBA</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
            Elegí tus materias con data real de la comunidad. Dificultad, carga,
            utilidad y consejos de quienes ya las cursaron.
          </p>
          <SubjectSearch />
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">Carreras</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {careers.map((career) => (
              <Link
                key={career.id}
                href={`/carreras/${career.slug}`}
                className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
                <span className="flex-1 text-sm font-medium">{career.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
