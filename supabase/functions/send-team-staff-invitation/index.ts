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
        "Content-Type": "application/json",
      },
    }
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const authorization =
      req.headers.get("Authorization")

    if (!authorization) {
      return jsonResponse(
        {
          error: "Not authenticated.",
        },
        401
      )
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL")

    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY")

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      )

    const resendApiKey =
      Deno.env.get("RESEND_API_KEY")

    const appUrl =
      Deno.env.get("APP_URL")

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {
      return jsonResponse(
        {
          error:
            "Supabase environment variables are missing.",
        },
        500
      )
    }

    if (!resendApiKey) {
      return jsonResponse(
        {
          error:
            "RESEND_API_KEY is not configured.",
        },
        500
      )
    }

    if (!appUrl) {
      return jsonResponse(
        {
          error:
            "APP_URL is not configured.",
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

    if (userError || !user) {
      return jsonResponse(
        {
          error:
            "Invalid user session.",
        },
        401
      )
    }

    const body =
      await req.json()

    const invitationId =
      body?.invitationId

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

    // -----------------------------
    // LOAD STAFF INVITATION
    // -----------------------------

    const {
      data: invitation,
      error: invitationError,
    } = await adminClient
      .from("team_staff_invitations")
      .select(`
        id,
        team_id,
        organization_id,
        email,
        first_name,
        last_name,
        staff_role,
        title,
        status,
        expires_at,
        invited_by_user_id
      `)
      .eq("id", invitationId)
      .maybeSingle()

    if (invitationError) {
      console.error(
        "STAFF INVITATION LOAD ERROR:",
        invitationError
      )

      return jsonResponse(
        {
          error:
            "Could not load staff invitation.",
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
            "Staff invitation not found.",
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
      invitation.status !== "pending"
    ) {
      return jsonResponse(
        {
          error:
            "Invitation is no longer pending.",
        },
        400
      )
    }

    if (
      invitation.expires_at &&
      new Date(
        invitation.expires_at
      ).getTime() <= Date.now()
    ) {
      return jsonResponse(
        {
          error:
            "Invitation has expired.",
        },
        400
      )
    }

    // -----------------------------
    // LOAD TEAM
    // -----------------------------

    const {
      data: team,
      error: teamError,
    } = await adminClient
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

    // -----------------------------
    // LOAD ORGANIZATION
    // -----------------------------

    const {
      data: organization,
      error: organizationError,
    } = await adminClient
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

    if (organizationError) {
      console.error(
        "ORGANIZATION LOAD ERROR:",
        organizationError
      )
    }

    const teamName =
      team?.name ?? "your team"

    const organizationName =
      organization?.name ??
      "Monterey Bay League Baseball"

    const roleLabel =
      invitation.staff_role
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        )

    const invitationUrl =
      `${appUrl}/staff/invitations/${invitation.id}`

    const resendResponse =
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
              `You're invited to join ${teamName}`,

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
                  Team Staff Invitation
                </h1>

                <p>
                  You've been invited to join
                  <strong>${teamName}</strong>
                  as
                  <strong>${roleLabel}</strong>
                  with ${organizationName}.
                </p>

                ${
                  invitation.title
                    ? `
                      <p>
                        Title:
                        <strong>
                          ${invitation.title}
                        </strong>
                      </p>
                    `
                    : ""
                }

                <p>
                  After accepting the invitation,
                  you'll receive access to the team
                  based on your assigned staff role.
                </p>

                <p style="margin-top: 32px;">
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
                    Accept Team Invitation
                  </a>
                </p>
              </div>
            `,
          }),
        }
      )

    const emailResult =
      await resendResponse.json()

    if (!resendResponse.ok) {
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
      "TEAM STAFF EMAIL SENT:",
      emailResult
    )

    return jsonResponse({
      success: true,
      email: invitation.email,
    })
  } catch (error) {
    console.error(
      "SEND TEAM STAFF INVITE ERROR:",
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