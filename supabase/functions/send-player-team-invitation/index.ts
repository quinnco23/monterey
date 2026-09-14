import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
}

function jsonResponse(
  body: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    }
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders,
      }
    )
  }

  try {
    const authorization =
      req.headers.get(
        "Authorization"
      )

    if (!authorization) {
      return jsonResponse(
        {
          error:
            "Not authenticated.",
        },
        401
      )
    }

    const supabaseUrl =
      Deno.env.get(
        "SUPABASE_URL"
      )

    const anonKey =
      Deno.env.get(
        "SUPABASE_ANON_KEY"
      )

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      )

    const resendApiKey =
      Deno.env.get(
        "RESEND_API_KEY"
      )

    const appUrl =
      Deno.env.get(
        "APP_URL"
      )

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey ||
      !resendApiKey ||
      !appUrl
    ) {
      return jsonResponse(
        {
          error:
            "Required environment variables are missing.",
        },
        500
      )
    }

    const userClient =
      createClient(
        supabaseUrl,
        anonKey,
        {
          global: {
            headers: {
              Authorization:
                authorization,
            },
          },
        }
      )

    const {
      data: { user },
      error: userError,
    } =
      await userClient.auth.getUser()

    if (
      userError ||
      !user
    ) {
      return jsonResponse(
        {
          error:
            "Invalid user session.",
        },
        401
      )
    }

    const {
      invitationId,
    } =
      await req.json()

    if (!invitationId) {
      return jsonResponse(
        {
          error:
            "Invitation ID is required.",
        },
        400
      )
    }

    const adminClient =
      createClient(
        supabaseUrl,
        serviceRoleKey
      )

    const {
      data: invitation,
      error: invitationError,
    } =
      await adminClient
        .from(
          "player_team_invitations"
        )
        .select(`
          id,
          organization_id,
          team_id,
          player_id,
          email,
          status,
          expires_at,
          invited_by_user_id
        `)
        .eq(
          "id",
          invitationId
        )
        .maybeSingle()

    if (invitationError) {
      console.error(
        "PLAYER INVITATION LOAD ERROR:",
        invitationError
      )

      return jsonResponse(
        {
          error:
            "Could not load invitation.",
          details:
            invitationError.message,
        },
        500
      )
    }

    if (!invitation) {
      return jsonResponse(
        {
          error:
            "Invitation not found.",
        },
        404
      )
    }

    if (
      invitation.invited_by_user_id !==
      user.id
    ) {
      return jsonResponse(
        {
          error:
            "You do not have permission to send this invitation.",
        },
        403
      )
    }

    if (
      invitation.status !==
      "pending"
    ) {
      return jsonResponse(
        {
          error:
            "Invitation is no longer pending.",
        },
        400
      )
    }

    const {
      data: player,
      error: playerError,
    } =
      await adminClient
        .from("players")
        .select(`
          id,
          first_name,
          last_name
        `)
        .eq(
          "id",
          invitation.player_id
        )
        .maybeSingle()

    if (playerError) {
      console.error(
        "PLAYER LOAD ERROR:",
        playerError
      )
    }

    const {
      data: team,
      error: teamError,
    } =
      await adminClient
        .from("teams")
        .select(`
          id,
          name
        `)
        .eq(
          "id",
          invitation.team_id
        )
        .maybeSingle()

    if (teamError) {
      console.error(
        "TEAM LOAD ERROR:",
        teamError
      )
    }

    const {
      data: organization,
    } =
      await adminClient
        .from("organizations")
        .select(`
          id,
          name
        `)
        .eq(
          "id",
          invitation.organization_id
        )
        .maybeSingle()

    const playerName =
      player
        ? `${player.first_name} ${player.last_name}`
        : "your player"

    const teamName =
      team?.name ??
      "the team"

    const organizationName =
      organization?.name ??
      "Monterey Bay League Baseball"

    const invitationUrl =
      `${appUrl}/player/invitations/${invitation.id}`

    const response =
      await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${resendApiKey}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            from:
              "Monterey Bay League <sky@spark-sc.com>",

            to: [
              invitation.email,
            ],

            subject:
              `${playerName} has been invited to ${teamName}`,

            html: `
              <div
                style="
                  font-family: Arial, sans-serif;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 32px;
                "
              >
                <h1>
                  Roster Invitation
                </h1>

                <p>
                  <strong>${playerName}</strong>
                  has been invited to join
                  <strong>${teamName}</strong>
                  with ${organizationName}.
                </p>

                <p>
                  Review the invitation and
                  accept or decline the roster
                  spot.
                </p>

                <p style="margin-top:32px;">
                  <a
                    href="${invitationUrl}"
                    style="
                      display:inline-block;
                      background:#d6a72d;
                      color:#111;
                      padding:14px 22px;
                      text-decoration:none;
                      font-weight:bold;
                    "
                  >
                    Review Invitation
                  </a>
                </p>
              </div>
            `,
          }),
        }
      )

    const emailResult =
      await response.json()

    if (!response.ok) {
      console.error(
        "RESEND ERROR:",
        emailResult
      )

      return jsonResponse(
        {
          error:
            "Email provider rejected the message.",
          providerError:
            emailResult,
        },
        500
      )
    }

    console.log(
      "PLAYER TEAM EMAIL SENT:",
      emailResult
    )

    return jsonResponse({
      success: true,
      email:
        invitation.email,
    })
  } catch (error) {
    console.error(
      "PLAYER INVITATION ERROR:",
      error
    )

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      500
    )
  }
})