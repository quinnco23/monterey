import { Navigate, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export function OrganizationCreatorRoute() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    async function checkPermission() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setAllowed(false)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("can_create_organizations")
        .eq("id", user.id)
        .maybeSingle()

      if (error) {
        console.error(
          "ORG CREATOR CHECK ERROR:",
          error
        )

        setAllowed(false)
        setLoading(false)
        return
      }

      setAllowed(
        data?.can_create_organizations === true
      )

      setLoading(false)
    }

    void checkPermission()
  }, [])

  if (loading) {
    return null
  }

  if (!allowed) {
    return <Navigate to="/guardian" replace />
  }

  return <Outlet />
}