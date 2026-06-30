import { createClient } from "@/lib/supabase/server"

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

export type SubjectMetrics = {
  career_id: string
  career_name: string
  review_count: number
  difficulty_mode: number | null
  difficulty_distribution: Record<string, number> | null
  workload_mode: number | null
  credits: number | null
  usefulness_avg: number | null
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

export async function getSubjectMetrics(subjectCode: string, careerId?: string): Promise<SubjectMetrics[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("get_subject_metrics", {
    p_subject_code: subjectCode,
    p_career_id: careerId ?? null,
  })
  return (data ?? []) as SubjectMetrics[]
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
