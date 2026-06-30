import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export async function AuthButton() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Link href="/login" className={buttonVariants({ size: "sm" })}>
        <LogIn className="mr-2 h-4 w-4" />
        Ingresar
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {user.email}
      </span>
      <form action="/auth/signout" method="POST">
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="mr-2 h-4 w-4" />
          Salir
        </Button>
      </form>
    </div>
  )
}
