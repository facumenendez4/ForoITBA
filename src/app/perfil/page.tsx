import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { Header } from "@/components/header"
import { createClient } from "@/lib/supabase/server"
import { getCareers, getMyReviews, getMyContributions } from "@/lib/queries"
import { ProfileContent } from "./profile-content"

export const metadata: Metadata = { title: "Mi perfil" }

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("career_id, display_name")
    .eq("id", user.id)
    .single()

  const [careers, reviews, contributions] = await Promise.all([
    getCareers(),
    getMyReviews(),
    getMyContributions(),
  ])

  return (
    <main className="flex-1">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Mi perfil</h1>
        <ProfileContent
          email={user.email ?? ""}
          careers={careers}
          currentCareerId={profile?.career_id ?? ""}
          currentDisplayName={profile?.display_name ?? ""}
          initialReviews={reviews}
          initialContributions={contributions}
        />
      </div>
    </main>
  )
}
