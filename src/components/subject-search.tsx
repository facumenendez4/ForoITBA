"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type Result = { code: string; name: string; slug: string }

export function SubjectSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase.rpc("search_subjects", {
        p_query: query,
      })
      setResults(data ?? [])
      setOpen(true)
      setActiveIndex(-1)
    }, 250)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  function navigate(slug: string) {
    setOpen(false)
    setQuery("")
    router.push(`/materias/${slug}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      navigate(results[activeIndex].slug)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar materia por nombre o código..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="pl-10"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="py-1">
            {results.map((r, i) => (
              <li key={r.code}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    i === activeIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => navigate(r.slug)}
                >
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    {r.code}
                  </span>
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-center text-sm text-muted-foreground shadow-lg">
          No se encontraron materias
        </div>
      )}
    </div>
  )
}
