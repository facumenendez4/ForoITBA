"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { submitReport } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Flag, Loader2, Check } from "lucide-react"

type Props = {
  targetType: "review" | "contribution"
  targetId: string
  slug: string
  isAuthed: boolean
}

export function ReportButton({ targetType, targetId, slug, isAuthed }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5" />
        Reportado
      </span>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          if (!isAuthed) {
            router.push("/login")
            return
          }
          setOpen(true)
        }}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        <Flag className="h-3.5 w-3.5" />
        Reportar
      </button>
    )
  }

  function handleSend() {
    setError("")
    startTransition(async () => {
      const res = await submitReport(targetType, targetId, reason, slug)
      if (res.ok) {
        setDone(true)
        setOpen(false)
      } else {
        setError(res.error ?? "No se pudo reportar.")
      }
    })
  }

  return (
    <div className="mt-2 w-full space-y-2 rounded-lg border border-dashed p-3">
      <p className="text-xs font-medium">¿Por qué lo reportás? (opcional)</p>
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Spam, contenido ofensivo, información falsa…"
        maxLength={500}
        className="min-h-16 text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="destructive" onClick={handleSend} disabled={pending}>
          {pending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Enviar reporte
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
