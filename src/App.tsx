import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { SiteHeader } from "@/components/layout/site-header"
import { AuthProvider } from "@/features/auth/auth-context"
import { AuthPage } from "@/features/auth/auth-page"
import { AdminRoute } from "@/features/auth/admin-route"

import { DashboardPage } from "@/pages/dashboard-page"
import { HomePage } from "@/pages/home-page"
import { OnboardingPage } from "@/pages/onboarding-page"

import { FieldReservationsPage } from "./pages/field-page"
import { FieldDetailPage } from "./pages/field-detail-page"
import { BookPage } from "./pages/book-page"

import { OrganizationDashboardPage } from "./pages/organization-dashboard-page"
import { OrganizationSettingsPage } from "./pages/organization-settings-page"
import { OrganizationSchedulePage } from "./pages/organization-schedule-page"
import { CreateOrganizationEventPage } from "./pages/create-organization-event-page"
import { EditOrganizationEventPage } from "./pages/edit-org-event"

import { OrganizationMembersPage } from "./organization-members-page"

import OrganizationPlayersPage from "./pages/organization-players-page"
import OrganizationPlayerPage from "./pages/organization-player-page"
import NewOrganizationPlayerPage from "./pages/new-organization-player-page"

import { PlayerProfilePage } from "./pages/player-profile-page"
import { InviteGuardianPage } from "./pages/invite-guardian-page"
import { AcceptGuardianInvitationPage } from "./pages/accept-guardian-invitation-page"

import { CreateTeamPage } from "./pages/create-team"
import { TeamDashboardPage } from "@/pages/team-dashboard-page"
import { TeamProfilePage } from "./team-profile-page"
import { TeamsPage } from "./pages/teams-page"
import { EditTeamPage } from "./edit-team-page"

import { AddPlayerPage } from "./pages/add-player"
import { EditPlayerPage } from "./pages/edit-player"

import { BookingResourcePage } from "./pages/booking-resource-page"
import { ReserveResourcePage } from "./pages/reserve-resource-page"
import { MyReservationsPage } from "./pages/my-reservations-page"

import { AdminBookingsPage } from "@/pages/admin-bookings-page"
import { AdminResourcePage } from "./pages/admin-resource-page"
import { AdminResourcesPage } from "./pages/admin-resources-page"

import { TrainersPage } from "./pages/trainers-page"

import { CreateTournamentPage } from "./pages/create-tournament-page"
import { AdminTournamentPage } from "./pages/admin-tournament-page"
import { TournamentsPage } from "./pages/tournaments-page"
import { TournamentDetailPage } from "./pages/tournament-detail-page"
import { TournamentRegistrationPage } from "./pages/tournament-registration-page"
import { TournamentRegistrationSuccessPage } from "./pages/tournament-registration-success-page"
import { TournamentSchedulePage } from "./pages/tournement-schedule-page"
import { TournamentScheduleGamePage } from "./pages/tournement-schedule-game-page"

import { PublicSchedulePage } from "./pages/public-schedule-page"
import { BackgroundCheckPage } from "./pages/background-check-page"

import { AboutPage } from "./pages/about-page"
import { ForgotPasswordPage } from "./pages/forgot-password-page"
import { UpdatePasswordPage } from "./pages/update-password-page"
import { GuardianRegisterPage } from "./pages/guardian-register-page"
import { OrganizationCreatorRoute } from "@/features/auth/organization-creator-route"

import { GuardianDashboardPage } from "./pages/guardian-dashboard-page"
import { GuardianPlayerPage } from "./pages/guardian-player-page"
import { InviteTeamStaffPage } from "./pages/invite-team-staff-page"

import { AcceptTeamStaffInvitationPage } from "./pages/accept-team-staff-invitation-page"
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteHeader />

        <Routes>
          {/* =========================
              PUBLIC ROUTES
          ========================= */}

          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/login"
            element={<AuthPage mode="login" />}
          />

          <Route
            path="/register"
            element={<AuthPage mode="register" />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />

          <Route
            path="/update-password"
            element={<UpdatePasswordPage />}
          />

          <Route
            path="/teams"
            element={<TeamsPage />}
          />

          <Route
            path="/teams/:teamId"
            element={<TeamProfilePage />}
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

          <Route
            path="/book"
            element={<BookPage />}
          />

          <Route
            path="/book/resources/:resourceId"
            element={<BookingResourcePage />}
          />

          <Route
            path="/book/trainers"
            element={<TrainersPage />}
          />

          <Route
            path="/book/fields"
            element={<FieldReservationsPage />}
          />

          <Route
            path="/book/fields/:fieldId"
            element={<FieldDetailPage />}
          />

          <Route
            path="/organizations/:organizationId/schedule"
            element={<PublicSchedulePage />}
          />

          {/* Guardian invitation landing page */}
          <Route
            path="/guardian/invitations/:invitationId"
            element={<AcceptGuardianInvitationPage />}
          />

<Route
  path="/guardian/register"
  element={<GuardianRegisterPage />}
/>

<Route
  path="/staff/invitations/:invitationId"
  element={<AcceptTeamStaffInvitationPage />}
/>

          {/* =========================
              PROTECTED USER ROUTES
          ========================= */}

          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

<Route element={<OrganizationCreatorRoute />}>
  <Route
    path="/onboarding"
    element={<OnboardingPage />}
  />
</Route>

            {/* ORGANIZATION */}

            <Route
              path="/dashboard/organizations/:organizationId"
              element={<OrganizationDashboardPage />}
            />

            <Route
              path="/dashboard/organizations/:organizationId/settings"
              element={<OrganizationSettingsPage />}
            />

            <Route
              path="/dashboard/organizations/:organizationId/members"
              element={<OrganizationMembersPage />}
            />

            <Route
              path="/dashboard/organizations/:organizationId/members/:memberId/background-check"
              element={<BackgroundCheckPage />}
            />

            {/* ORGANIZATION PLAYERS */}

            <Route
              path="/dashboard/organizations/:organizationId/players"
              element={<OrganizationPlayersPage />}
            />

            <Route
              path="/dashboard/organizations/:organizationId/players/new"
              element={<NewOrganizationPlayerPage />}
            />

            {/* PLAYER PROFILE */}
            <Route
              path="/dashboard/organizations/:organizationId/players/:playerId"
              element={<PlayerProfilePage />}
            />

            {/* ORGANIZATION-LEVEL PLAYER EDIT */}
            <Route
              path="/dashboard/organizations/:organizationId/players/:playerId/edit"
              element={<OrganizationPlayerPage />}
            />

            {/* GUARDIAN INVITE */}
            <Route
              path="/dashboard/organizations/:organizationId/players/:playerId/guardians/invite"
              element={<InviteGuardianPage />}
            />

            {/* TEAMS */}

            <Route
              path="/dashboard/organizations/:organizationId/teams/new"
              element={<CreateTeamPage />}
            />

            <Route
              path="/dashboard/organizations/:organizationId/teams/:teamId"
              element={<TeamDashboardPage />}
            />

            <Route
              path="/dashboard/organizations/:organizationId/teams/:teamId/settings"
              element={<EditTeamPage />}
            />

            {/* TEAM PLAYER ADD */}

            <Route
              path="/dashboard/organizations/:organizationId/teams/:teamId/players/new"
              element={<AddPlayerPage />}
            />

            {/* TEAM-SPECIFIC PLAYER EDIT */}

            <Route
              path="/dashboard/organizations/:organizationId/teams/:teamId/players/:playerId/edit"
              element={<EditPlayerPage />}
            />

            {/* ORGANIZATION SCHEDULE */}

            <Route
              path="/dashboard/organizations/:organizationId/schedule"
              element={<OrganizationSchedulePage />}
            />

            <Route
              path="/dashboard/organizations/:organizationId/schedule/new"
              element={<CreateOrganizationEventPage />}
            />

            <Route
              path="/dashboard/organizations/:organizationId/schedule/:eventId/edit"
              element={<EditOrganizationEventPage />}
            />

            {/* RESERVATIONS */}

            <Route
              path="/book/resources/:resourceId/reserve"
              element={<ReserveResourcePage />}
            />

            <Route
              path="/dashboard/reservations"
              element={<MyReservationsPage />}
            />

            {/* TOURNAMENT REGISTRATION */}

            <Route
              path="/tournaments/:tournamentId/register"
              element={<TournamentRegistrationPage />}
            />

            <Route
              path="/dashboard/registrations/success"
              element={<TournamentRegistrationSuccessPage />}
            />
          </Route>

          <Route
  path="/guardian"
  element={<GuardianDashboardPage />}
/>

<Route
  path="/guardian/players/:playerId"
  element={<GuardianPlayerPage />}
/>

<Route
  path="/dashboard/organizations/:organizationId/teams/:teamId/staff/invite"
  element={<InviteTeamStaffPage />}
/>

          {/* =========================
              PLATFORM ADMIN ROUTES
          ========================= */}

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

            <Route
              path="/dashboard/tournaments/:tournamentId/schedule"
              element={<TournamentSchedulePage />}
            />

            <Route
              path="/dashboard/tournaments/:tournamentId/schedule/new"
              element={<TournamentScheduleGamePage />}
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}