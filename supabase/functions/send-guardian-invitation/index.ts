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
  // --------------------------------
  // CORS PREFLIGHT
  // --------------------------------

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    })
  }

  try {
    // --------------------------------
    // AUTH HEADER
    // --------------------------------

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

    // --------------------------------
    // ENV VARIABLES
    // --------------------------------

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

    // --------------------------------
    // USER CLIENT
    // --------------------------------

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

    // --------------------------------
    // REQUEST BODY
    // --------------------------------

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

    // --------------------------------
    // ADMIN CLIENT
    // --------------------------------

    const adminClient =
      createClient(
        supabaseUrl,
        serviceRoleKey
      )

    // --------------------------------
    // LOAD INVITATION
    // --------------------------------

    const {
      data: invitation,
      error: invitationError,
    } = await adminClient
      .from("player_guardian_invitations")
      .select(`
        id,
        player_id,
        organization_id,
        email,
        first_name,
        relationship,
        status,
        expires_at,
        invited_by_user_id
      `)
      .eq("id", invitationId)
      .maybeSingle()
    
    if (invitationError) {
      console.error(
        "INVITATION LOAD ERROR:",
        invitationError
      )
    
      return jsonResponse(
        {
          error: "Could not load invitation.",
          details: invitationError.message,
        },
        500
      )
    }
    
    if (!invitation) {
      console.error(
        "INVITATION NOT FOUND:",
        invitationId
      )
    
      return jsonResponse(
        {
          error: "Invitation not found.",
          invitationId,
        },
        404
      )
    }

    const {
      data: player,
      error: playerError,
    } = await adminClient
      .from("players")
      .select(`
        id,
        first_name,
        last_name
      `)
      .eq("id", invitation.player_id)
      .maybeSingle()
    
    if (playerError) {
      console.error(
        "PLAYER LOAD ERROR:",
        playerError
      )
    }

    const {
      data: organization,
      error: organizationError,
    } = await adminClient
      .from("organizations")
      .select(`
        id,
        name
      `)
      .eq("id", invitation.organization_id)
      .maybeSingle()
    
    if (organizationError) {
      console.error(
        "ORGANIZATION LOAD ERROR:",
        organizationError
      )
    }

    // --------------------------------
    // PERMISSION CHECK
    // --------------------------------

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

    // --------------------------------
    // STATUS CHECK
    // --------------------------------

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

    // --------------------------------
    // NORMALIZE RELATION DATA
    // --------------------------------

   

    const playerName =
      player
        ? `${player.first_name} ${player.last_name}`
        : "your player"

    const organizationName =
      organization?.name ??
      "Monterey Bay League Baseball"

    const invitationUrl =
      `${appUrl}/guardian/invitations/${invitation.id}`

    // --------------------------------
    // SEND EMAIL THROUGH RESEND
    // --------------------------------

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
              `You're invited to join ${organizationName}`,

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
                  Parent / Guardian Invitation
                </h1>

                <p>
                  You've been invited to connect
                  with
                  <strong>${playerName}</strong>
                  on Monterey Bay League Baseball.
                </p>

                <p>
                  After accepting the invitation,
                  you'll be able to view schedules,
                  team information and respond to
                  player availability requests.
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
                    Accept Invitation
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
      "GUARDIAN EMAIL SENT:",
      emailResult
    )

    return jsonResponse({
      success: true,
      email: invitation.email,
    })
  } catch (error) {
    console.error(
      "SEND GUARDIAN INVITE ERROR:",
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