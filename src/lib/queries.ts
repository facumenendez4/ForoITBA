import { createClient } from "@/lib/supabase/server"

export type Viewer = {
  userId: string
  careerId: string | null
  displayName: string | null
}

export type MyReview = {
  career_id: string
  difficulty: number
  workload: number
  usefulness: number
  comment: string | null
  term_taken: string | null
  is_anonymous: boolean
}

export type Career = {
  id: string
  name: string
  slug: string
}

export type Subject = {
  code: string
  name: string
  slug: string
}

export type CareerSubject = {
  id: string
  career_id: string
  subject_code: string
  credits: number
  term: string
  elective_group: string | null
  is_elective: boolean
  prerequisites: string[]
  required_credits: number | null
  subjects: Subject
}

export type PublicReview = {
  id: string
  subject_code: string
  career_id: string
  difficulty: number
  workload: number
  usefulness: number
  comment: string | null
  term_taken: string | null
  created_at: string
  updated_at: string
  upvotes: number
  downvotes: number
  score: number
  is_anonymous: boolean
  author_name: string | null
}

export type PublicContribution = {
  id: string
  subject_code: string
  career_id: string
  type: "material" | "consejo"
  body: string
  created_at: string
  upvotes: number
  downvotes: number
  score: number
  is_anonymous: boolean
  author_name: string | null
}

export async function getCareers(): Promise<Career[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("careers")
    .select("id, name, slug")
    .order("name")
  return data ?? []
}

export async function getCareerBySlug(slug: string): Promise<Career | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("careers")
    .select("id, name, slug")
    .eq("slug", slug)
    .single()
  return data
}

export async function getSubjectBySlug(slug: string): Promise<Subject | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("subjects")
    .select("code, name, slug")
    .eq("slug", slug)
    .single()
  return data
}

export async function searchSubjects(query: string): Promise<Subject[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("search_subjects", {
    p_query: query,
  })
  return (data ?? []) as Subject[]
}

export async function getCareerSubjects(careerId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("career_subjects")
    .select("id, career_id, subject_code, credits, term, elective_group, is_elective, prerequisites, required_credits, subjects(code, name, slug)")
    .eq("career_id", careerId)
    .order("term")
  return (data ?? []) as unknown as CareerSubject[]
}

export async function getSubjectCareers(subjectCode: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("career_subjects")
    .select("id, career_id, subject_code, credits, term, elective_group, is_elective, prerequisites, required_credits, careers:career_id(id, name, slug)")
    .eq("subject_code", subjectCode)
  return data ?? []
}

export async function getSubjectReviews(subjectCode: string): Promise<PublicReview[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("public_reviews")
    .select("*")
    .eq("subject_code", subjectCode)
    .order("created_at", { ascending: false })
  return (data ?? []) as PublicReview[]
}

export async function getSubjectContributions(subjectCode: string): Promise<PublicContribution[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("public_contributions")
    .select("*")
    .eq("subject_code", subjectCode)
    .order("created_at", { ascending: false })
  return (data ?? []) as PublicContribution[]
}

export async function getSubjectReviewCount(subjectCode: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("public_reviews")
    .select("*", { count: "exact", head: true })
    .eq("subject_code", subjectCode)
  return count ?? 0
}

/** El usuario logueado + su carrera de perfil, o null si es anónimo. */
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("career_id, display_name")
    .eq("id", user.id)
    .single()

  return {
    userId: user.id,
    careerId: profile?.career_id ?? null,
    displayName: profile?.display_name ?? null,
  }
}

/** La reseña propia del usuario para una materia (para prefill/editar), o null. */
export async function getMyReview(subjectCode: string): Promise<MyReview | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("reviews")
    .select(
      "career_id, difficulty, workload, usefulness, comment, term_taken, is_anonymous"
    )
    .eq("user_id", user.id)
    .eq("subject_code", subjectCode)
    .maybeSingle()

  return (data as MyReview | null) ?? null
}

/**
 * Los votos del usuario sobre un conjunto de targets (reseñas y/o aportes):
 * { target_id: 1 | -1 }. Los ids de reseñas y aportes no colisionan (uuid).
 */
export async function getMyVotes(
  targetIds: string[]
): Promise<Record<string, 1 | -1>> {
  if (targetIds.length === 0) return {}
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from("votes")
    .select("target_id, value")
    .eq("user_id", user.id)
    .in("target_id", targetIds)

  const map: Record<string, 1 | -1> = {}
  for (const row of data ?? []) {
    map[row.target_id as string] = row.value as 1 | -1
  }
  return map
}

export type MyReviewListItem = {
  id: string
  subject_code: string
  difficulty: number
  workload: number
  usefulness: number
  comment: string | null
  term_taken: string | null
  created_at: string
  is_anonymous: boolean
  subjects: { name: string; slug: string }
  careers: { name: string }
}

export type MyContributionListItem = {
  id: string
  subject_code: string
  type: "material" | "consejo"
  body: string
  created_at: string
  is_anonymous: boolean
  subjects: { name: string; slug: string }
  careers: { name: string }
}

/** Las reseñas propias del usuario logueado, con materia y carrera resueltas. */
export async function getMyReviews(): Promise<MyReviewListItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("reviews")
    .select(
      "id, subject_code, difficulty, workload, usefulness, comment, term_taken, created_at, is_anonymous, subjects(name, slug), careers:career_id(name)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (data ?? []) as unknown as MyReviewListItem[]
}

/** Los aportes propios del usuario logueado, con materia y carrera resueltos. */
export async function getMyContributions(): Promise<MyContributionListItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("contributions")
    .select(
      "id, subject_code, type, body, created_at, is_anonymous, subjects(name, slug), careers:career_id(name)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (data ?? []) as unknown as MyContributionListItem[]
}

export async function getCareerSubjectCounts(careerId: string): Promise<{ total: number; electives: number }> {
  const supabase = await createClient()
  const { count: total } = await supabase
    .from("career_subjects")
    .select("*", { count: "exact", head: true })
    .eq("career_id", careerId)
  const { count: electives } = await supabase
    .from("career_subjects")
    .select("*", { count: "exact", head: true })
    .eq("career_id", careerId)
    .eq("is_elective", true)
  return { total: total ?? 0, electives: electives ?? 0 }
}
