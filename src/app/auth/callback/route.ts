import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // Solo rutas internas: evita open redirect (no "//host", no esquemas externos).
  const nextParam = searchParams.get("next") ?? "/"
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // El redirect a onboarding solo aplica al login/registro normal (next="/").
      // Para destinos explícitos (p. ej. recuperación → /reset-password) respetamos
      // el next y no forzamos el onboarding.
      if (next === "/") {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("career_id")
            .eq("id", user.id)
            .single()

          if (!profile?.career_id) {
            return NextResponse.redirect(`${origin}/onboarding`)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
