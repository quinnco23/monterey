import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SiteHeader } from "@/components/layout/site-header"
import { AuthProvider } from "@/features/auth/auth-context"
import { AuthPage } from "@/features/auth/auth-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { HomePage } from "@/pages/home-page"
import { OnboardingPage } from "@/pages/onboarding-page"
import { PlaceholderPage } from "@/pages/placeholder-page"
import { FieldReservationsPage } from "./pages/field-page"
import { FieldDetailPage } from "./pages/field-detail-page"
import { BookPage } from "./pages/book-page"
import { OrganizationDashboardPage } from "./pages/organization-dashboard-page"
import { CreateTeamPage } from "./pages/create-team"
import { TeamDashboardPage } from "@/pages/team-dashboard-page"



export default function App() {
  return (
    <BrowserRouter>
  <AuthProvider>
    <SiteHeader />

    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route
        path="/teams"
        element={
          <PlaceholderPage
            title="Teams"
            description="Public team profiles and organization team management will live here."
          />
        }
      />

      <Route
        path="/tournaments"
        element={
          <PlaceholderPage
            title="Tournaments"
            description="Browse upcoming events and register teams here."
          />
        }
      />

      <Route
        path="/about"
        element={
          <PlaceholderPage
            title="About The League"
            description=""
          />
        }
      />

      <Route path="/book" element={<BookPage />} />
      <Route path="/book/fields" element={<FieldReservationsPage />} />
      <Route path="/book/fields/:fieldId" element={<FieldDetailPage />} />

      {/* PROTECTED */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route
          path="/dashboard/organizations/:organizationId"
          element={<OrganizationDashboardPage />}
        />

        <Route
          path="/dashboard/organizations/:organizationId/teams"
          element={
            <PlaceholderPage
              title="Teams"
              description="Organization team management."
            />
          }
        />

        <Route
          path="/dashboard/organizations/:organizationId/members"
          element={
            <PlaceholderPage
              title="Members"
              description="Organization coaches, managers, and staff."
            />
          }
        />

        <Route
          path="/dashboard/organizations/:organizationId/settings"
          element={
            <PlaceholderPage
              title="Organization Settings"
              description="Manage organization profile and settings."
            />
          }
        />
        {/* <Route
  path="/dashboard/organizations/:organizationId/teams"
  element={<OrganizationTeamsPage />}

  
/> */

<Route
    path="/dashboard/organizations/:organizationId/teams/:teamId"
    element={<TeamDashboardPage />}
  />

}

<Route
  path="/dashboard/organizations/:organizationId/teams/new"
  element={<CreateTeamPage />}
/>

{/* <Route
  path="/dashboard/organizations/:organizationId/teams/:teamId"
  element={<TeamDashboardPage />}
/> */}
      </Route>
    </Routes>
  </AuthProvider>
</BrowserRouter>
  )
}
