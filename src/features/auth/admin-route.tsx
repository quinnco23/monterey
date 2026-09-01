import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/features/auth/auth-context"
import { supabase } from "@/lib/supabase"

export function AdminRoute() {
  const { user, loading: authLoading } = useAuth()

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      // Don't run until auth initialization is finished
      if (authLoading) {
        return
      }

      if (!user) {
        setIsAdmin(false)
        return
      }

      // Reset while checking the current user
      setIsAdmin(null)

      const { data, error } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle()

      console.log("ADMIN CHECK", {
        currentUserId: user.id,
        adminData: data,
        adminError: error,
      })

      if (error) {
        console.error("ADMIN CHECK ERROR:", error)
        setIsAdmin(false)
        return
      }

      setIsAdmin(Boolean(data))
    }

    void checkAdmin()
  }, [user, authLoading])

  // IMPORTANT:
  // Don't redirect while Supabase is restoring the session
  if (authLoading || isAdmin === null) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-7xl">
          <p className="scoreboard-label">
            Checking Permissions...
          </p>
        </div>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}