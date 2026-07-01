"use client"

import Link from "next/link"

type Props = {
  isAnonymous: boolean
  onChange: (isAnonymous: boolean) => void
  displayName: string | null
}

export function AnonymityToggle({ isAnonymous, onChange, displayName }: Props) {
  const canShowName = !!displayName

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!isAnonymous}
          disabled={!canShowName}
          onChange={(e) => onChange(!e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary disabled:cursor-not-allowed"
        />
        <span className={canShowName ? "" : "text-muted-foreground"}>
          Publicar con mi nombre
          {canShowName ? ` (${displayName})` : ""}
        </span>
      </label>
      {!canShowName && (
        <p className="text-xs text-muted-foreground pl-6">
          Configurá un nombre en tu{" "}
          <Link href="/perfil" className="underline hover:text-foreground">
            perfil
          </Link>{" "}
          para poder publicar sin anonimato.
        </p>
      )}
    </div>
  )
}
