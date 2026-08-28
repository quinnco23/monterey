import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/features/auth/auth-context"

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="mx-auto max-w-6xl px-6 py-16 text-sm text-slate-500">Loading your account...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
