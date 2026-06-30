"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { voteContribution } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { ThumbsUp, ThumbsDown } from "lucide-react"

type Props = {
  contributionId: string
  slug: string
  upvotes: number
  downvotes: number
  myVote: 0 | 1 | -1
  isAuthed: boolean
}

export function VoteButtons({
  contributionId,
  slug,
  upvotes,
  downvotes,
  myVote,
  isAuthed,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // downvotes llega como número negativo desde la vista (suma de -1).
  const [up, setUp] = useState(upvotes)
  const [down, setDown] = useState(Math.abs(downvotes))
  const [vote, setVote] = useState<0 | 1 | -1>(myVote)

  function applyOptimistic(value: 1 | -1) {
    // Revertir el voto previo
    if (vote === 1) setUp((n) => n - 1)
    if (vote === -1) setDown((n) => n - 1)

    if (vote === value) {
      // toggle off
      setVote(0)
    } else {
      if (value === 1) setUp((n) => n + 1)
      else setDown((n) => n + 1)
      setVote(value)
    }
  }

  function handleVote(value: 1 | -1) {
    if (!isAuthed) {
      router.push("/login")
      return
    }
    applyOptimistic(value)
    startTransition(async () => {
      const res = await voteContribution(contributionId, value, slug)
      if (!res.ok) router.refresh() // resync si falló
    })
  }

  return (
    <div className="flex items-center gap-1 text-xs shrink-0">
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={pending}
        aria-label="Útil"
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-accent disabled:opacity-50",
          vote === 1 ? "text-rating-1" : "text-muted-foreground"
        )}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span>{up}</span>
      </button>
      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={pending}
        aria-label="No útil"
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-accent disabled:opacity-50",
          vote === -1 ? "text-rating-5" : "text-muted-foreground"
        )}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        <span>{down}</span>
      </button>
    </div>
  )
}
