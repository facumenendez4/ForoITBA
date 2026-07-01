"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import type { ActionState } from "@/lib/actions"

type Props = {
  onDelete: () => Promise<ActionState>
  onDeleted: () => void
  label?: string
}

export function DeleteButton({ onDelete, onDeleted, label = "Borrar" }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleConfirm() {
    setError("")
    startTransition(async () => {
      const res = await onDelete()
      if (res.ok) onDeleted()
      else setError(res.error ?? "No se pudo borrar.")
    })
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        {error && <span className="text-destructive">{error}</span>}
        <Button
          size="sm"
          variant="destructive"
          onClick={handleConfirm}
          disabled={pending}
        >
          {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Confirmar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
