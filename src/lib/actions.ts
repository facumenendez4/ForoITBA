"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type ActionState = { ok: boolean; error?: string }

const UUID_RE = /^[0-9a-f-]{36}$/i
const MAX_REASON = 500

const VALID_DIFFICULTY = [1, 2, 3, 4, 5]
const VALID_WORKLOAD = [1, 3, 6, 9]
const VALID_USEFULNESS = [1, 2, 3, 4, 5]
const MAX_COMMENT = 2000
const MAX_BODY = 4000

function str(formData: FormData, key: string): string {
  const v = formData.get(key)
  return typeof v === "string" ? v.trim() : ""
}

/**
 * Crear o actualizar la reseña del usuario para una materia.
 * unique(user_id, subject_code) ⇒ un usuario tiene una sola reseña por materia.
 */
export async function submitReview(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Iniciá sesión para reseñar." }

  const slug = str(formData, "slug")
  const subjectCode = str(formData, "subject_code")
  const careerId = str(formData, "career_id")
  const difficulty = Number(formData.get("difficulty"))
  const workload = Number(formData.get("workload"))
  const usefulness = Number(formData.get("usefulness"))
  const comment = str(formData, "comment") || null
  const termTaken = str(formData, "term_taken") || null

  if (!subjectCode || !careerId) return { ok: false, error: "Faltan datos." }
  if (!careerId.match(/^[0-9a-f-]{36}$/i))
    return { ok: false, error: "Carrera inválida." }
  if (!VALID_DIFFICULTY.includes(difficulty))
    return { ok: false, error: "Elegí una dificultad." }
  if (!VALID_WORKLOAD.includes(workload))
    return { ok: false, error: "Elegí la carga real." }
  if (!VALID_USEFULNESS.includes(usefulness))
    return { ok: false, error: "Elegí la utilidad." }
  if (comment && comment.length > MAX_COMMENT)
    return { ok: false, error: `El comentario supera ${MAX_COMMENT} caracteres.` }

  // La carrera tiene que dictar realmente esta materia (anti metric-poisoning).
  const { data: pairing } = await supabase
    .from("career_subjects")
    .select("id")
    .eq("subject_code", subjectCode)
    .eq("career_id", careerId)
    .maybeSingle()
  if (!pairing)
    return { ok: false, error: "Esa carrera no dicta esta materia." }

  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: user.id,
      subject_code: subjectCode,
      career_id: careerId,
      difficulty,
      workload,
      usefulness,
      comment,
      term_taken: termTaken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,subject_code" }
  )

  if (error) return { ok: false, error: error.message }

  if (slug) revalidatePath(`/materias/${slug}`)
  return { ok: true }
}

/**
 * Crear un aporte (material o consejo) para una materia.
 */
export async function submitContribution(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Iniciá sesión para aportar." }

  const slug = str(formData, "slug")
  const subjectCode = str(formData, "subject_code")
  const careerId = str(formData, "career_id")
  const type = str(formData, "type")
  const body = str(formData, "body")

  if (!subjectCode || !careerId) return { ok: false, error: "Faltan datos." }
  if (type !== "material" && type !== "consejo")
    return { ok: false, error: "Tipo de aporte inválido." }
  if (body.length < 3) return { ok: false, error: "El aporte es muy corto." }
  if (body.length > MAX_BODY)
    return { ok: false, error: `El aporte supera ${MAX_BODY} caracteres.` }

  // La carrera tiene que dictar realmente esta materia (anti metric-poisoning).
  const { data: pairing } = await supabase
    .from("career_subjects")
    .select("id")
    .eq("subject_code", subjectCode)
    .eq("career_id", careerId)
    .maybeSingle()
  if (!pairing)
    return { ok: false, error: "Esa carrera no dicta esta materia." }

  const { error } = await supabase.from("contributions").insert({
    user_id: user.id,
    subject_code: subjectCode,
    career_id: careerId,
    type,
    body,
  })

  if (error) return { ok: false, error: error.message }

  if (slug) revalidatePath(`/materias/${slug}`)
  return { ok: true }
}

/**
 * Votar un aporte. value: 1 (útil) o -1 (no útil).
 * unique(user_id, contribution_id): votar igual al voto actual lo quita (toggle);
 * votar distinto lo cambia.
 */
export async function voteContribution(
  contributionId: string,
  value: 1 | -1,
  slug: string
): Promise<ActionState> {
  if (value !== 1 && value !== -1)
    return { ok: false, error: "Voto inválido." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Iniciá sesión para votar." }

  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("user_id", user.id)
    .eq("contribution_id", contributionId)
    .maybeSingle()

  let error
  if (existing) {
    if (existing.value === value) {
      ;({ error } = await supabase.from("votes").delete().eq("id", existing.id))
    } else {
      ;({ error } = await supabase
        .from("votes")
        .update({ value })
        .eq("id", existing.id))
    }
  } else {
    ;({ error } = await supabase
      .from("votes")
      .insert({ user_id: user.id, contribution_id: contributionId, value }))
  }

  if (error) return { ok: false, error: error.message }

  if (slug) revalidatePath(`/materias/${slug}`)
  return { ok: true }
}

/**
 * Reportar una reseña o un aporte. Inserta en `reports` y avisa al admin por mail
 * (best-effort: si el mail falla, el reporte igual queda registrado).
 */
export async function submitReport(
  targetType: "review" | "contribution",
  targetId: string,
  reason: string,
  slug: string
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Iniciá sesión para reportar." }

  if (targetType !== "review" && targetType !== "contribution")
    return { ok: false, error: "Tipo de reporte inválido." }
  if (!UUID_RE.test(targetId))
    return { ok: false, error: "Referencia inválida." }

  const trimmedReason = reason.trim().slice(0, MAX_REASON) || null

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason: trimmedReason,
  })
  if (error) return { ok: false, error: error.message }

  // Datos del contenido reportado para el mail (best-effort, vía vistas públicas).
  let subjectCode: string | null = null
  let content: string | null = null
  if (targetType === "review") {
    const { data } = await supabase
      .from("public_reviews")
      .select("subject_code, comment")
      .eq("id", targetId)
      .maybeSingle()
    subjectCode = data?.subject_code ?? null
    content = data?.comment ?? null
  } else {
    const { data } = await supabase
      .from("public_contributions")
      .select("subject_code, body")
      .eq("id", targetId)
      .maybeSingle()
    subjectCode = data?.subject_code ?? null
    content = data?.body ?? null
  }

  let subjectName: string | null = null
  if (subjectCode) {
    const { data } = await supabase
      .from("subjects")
      .select("name")
      .eq("code", subjectCode)
      .maybeSingle()
    subjectName = data?.name ?? null
  }

  // Notificación al admin vía Edge Function + Resend (best-effort: si falla, el
  // reporte igual queda registrado y no bloqueamos al usuario).
  try {
    await supabase.functions.invoke("report-notification", {
      body: {
        targetType,
        targetId,
        reason: trimmedReason,
        subjectCode,
        subjectName,
        content,
        path: slug ? `/materias/${slug}` : null,
      },
    })
  } catch {
    // ignorar: la notificación es best-effort
  }

  return { ok: true }
}
