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
import { AddPlayerPage } from "./pages/add-player"
import { EditPlayerPage } from "./pages/edit-player"
import { BookingResourcePage } from "./pages/booking-resource-page"
import { ReserveResourcePage } from "./pages/reserve-resource-page"
import { AdminBookingsPage } from "@/pages/admin-bookings-page"
import { AdminRoute } from "./features/auth/admin-route"
import { AdminResourcePage } from "./pages/admin-resource-page"
import { TrainersPage } from "./pages/trainers-page"
import { AdminTournamentPage } from "./pages/admin-tournament-page"

import { CreateTournamentPage } from "./pages/create-tournament-page"

import { MyReservationsPage } from "./pages/my-reservations-page"

  import { AdminResourcesPage } from "./pages/admin-resources-page"

  import { TournamentsPage } from "./pages/tournaments-page"

  import { TournamentDetailPage } from "./pages/tournament-detail-page"

  import { TeamsPage } from "./pages/teams-page"

  import { AboutPage } from "./pages/about-page"
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
  element={<TeamsPage />}
/>

<Route
  path="/tournaments"
  element={<TournamentsPage />}
/>

<Route
  path="/tournaments/:tournamentId"
  element={<TournamentDetailPage />}
/>

<Route
  path="/about"
  element={<AboutPage />}
/>

          <Route path="/book" element={<BookPage />} />
          <Route
            path="/book/resources/:resourceId"
            element={<BookingResourcePage />}
          />

<Route
  path="/book/trainers"
  element={<TrainersPage />}
/>
          <Route path="/book/fields" element={<FieldReservationsPage />} />
          <Route path="/book/fields/:fieldId" element={<FieldDetailPage />} />

{/* PROTECTED USER ROUTES */}
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/onboarding" element={<OnboardingPage />} />

  <Route
    path="/dashboard/organizations/:organizationId"
    element={<OrganizationDashboardPage />}
  />

  <Route
    path="/dashboard/organizations/:organizationId/teams/new"
    element={<CreateTeamPage />}
  />

  <Route
    path="/dashboard/organizations/:organizationId/teams/:teamId"
    element={<TeamDashboardPage />}
  />

  <Route
    path="/dashboard/organizations/:organizationId/teams/:teamId/players/new"
    element={<AddPlayerPage />}
  />

  <Route
    path="/dashboard/organizations/:organizationId/teams/:teamId/players/:playerId/edit"
    element={<EditPlayerPage />}
  />

  <Route
    path="/book/resources/:resourceId/reserve"
    element={<ReserveResourcePage />}
  />
<Route
  path="/dashboard/reservations"
  element={<MyReservationsPage />}
/>

</Route>

{/* PLATFORM ADMIN ROUTES */}
<Route element={<AdminRoute />}>

  <Route
    path="/admin/bookings"
    element={<AdminBookingsPage />}
  />
<Route
  path="/admin/resources"
  element={<AdminResourcesPage />}
/>

  <Route
    path="/admin/resources/:resourceId"
    element={<AdminResourcePage />}
  />
  <Route
  path="/admin/tournaments/new"
  element={<CreateTournamentPage />}
/>

<Route
  path="/admin/tournaments/:tournamentId"
  element={<AdminTournamentPage />}
/>





</Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
