import Link from "next/link"
import { Header } from "@/components/header"
import { SubjectSearch } from "@/components/subject-search"
import { getCareers } from "@/lib/queries"
import { GraduationCap, ChevronRight } from "lucide-react"

const careerColors: Record<string, string> = {
  "bioingenieria": "#22c55e",
  "ingenieria-civil": "#f59e0b",
  "ingenieria-electronica": "#eab308",
  "ingenieria-en-biotecnologia": "#84cc16",
  "ingenieria-en-informatica": "#3b82f6",
  "ingenieria-en-petroleo": "#b45309",
  "ingenieria-industrial": "#6366f1",
  "ingenieria-mecanica": "#64748b",
  "ingenieria-naval": "#0ea5e9",
  "ingenieria-quimica": "#8b5cf6",
  "licenciatura-en-analitica-empresarial-y-social": "#d946ef",
  "licenciatura-en-ciencias-del-comportamiento": "#f43f5e",
  "licenciatura-en-negocios": "#14b8a6",
}

const FALLBACK_COLOR = "#D97757"

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
            {careers.map((career) => {
              const color = careerColors[career.slug] ?? FALLBACK_COLOR
              return (
                <Link
                  key={career.id}
                  href={`/carreras/${career.slug}`}
                  style={{ borderLeftColor: color }}
                  className="group flex items-center gap-3 rounded-lg border border-l-[3px] p-4 transition-colors hover:bg-accent/50"
                >
                  <GraduationCap
                    className="h-5 w-5 shrink-0"
                    style={{ color }}
                  />
                  <span className="flex-1 text-sm font-medium">{career.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
