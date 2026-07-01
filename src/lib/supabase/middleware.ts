import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/", "/login", "/auth/callback", "/reset-password"]

function isPublicRoute(pathname: string) {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (pathname.startsWith("/materias/")) return true
  if (pathname.startsWith("/carreras/")) return true
  return false
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!user && !isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && pathname !== "/onboarding" && !isPublicRoute(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("career_id")
      .eq("id", user.id)
      .single()

    if (!profile?.career_id) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  return supabaseResponse
}
