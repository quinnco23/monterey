import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors"

type InviteRequest = {
  invitationId?: string
}

Deno.serve(async (request) => {
  // =========================================
  // CORS PREFLIGHT
  // =========================================

  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    })
  }

  try {
    // =========================================
    // ENVIRONMENT
    // =========================================

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL")

    const supabaseServiceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      )

    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY")

    const resendApiKey =
      Deno.env.get("RESEND_API_KEY")

    const siteUrl =
      Deno.env.get("SITE_URL") ||
      Deno.env.get("APP_URL")

    if (
      !supabaseUrl ||
      !supabaseServiceRoleKey ||
      !supabaseAnonKey
    ) {
      throw new Error(
        "Supabase server configuration is missing."
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

    if (!siteUrl) {
      return jsonResponse(
        {
          error:
            "SITE_URL or APP_URL is not configured.",
        },
        500
      )
    }

    // =========================================
    // AUTH
    // =========================================

    const authorization =
      request.headers.get(
        "Authorization"
      )

    if (!authorization) {
      return jsonResponse(
        {
          error:
            "Authentication is required.",
        },
        401
      )
    }

    // =========================================
    // USER CLIENT
    // =========================================

    const userClient =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
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
      data: {
        user,
      },
      error: userError,
    } =
      await userClient.auth.getUser()

    if (
      userError ||
      !user
    ) {
      console.error(
        "INVITE AUTH ERROR:",
        userError
      )

      return jsonResponse(
        {
          error:
            "Authentication is required.",
        },
        401
      )
    }

    // =========================================
    // PLATFORM ADMIN CHECK
    // =========================================

    const {
      data: isAdmin,
      error: adminCheckError,
    } =
      await userClient.rpc(
        "is_platform_admin"
      )

    if (adminCheckError) {
      console.error(
        "PLATFORM ADMIN CHECK ERROR:",
        adminCheckError
      )

      return jsonResponse(
        {
          error:
            "Platform administrator permission could not be verified.",
        },
        403
      )
    }

    if (!isAdmin) {
      return jsonResponse(
        {
          error:
            "Platform administrator permission is required.",
        },
        403
      )
    }

    // =========================================
    // ADMIN CLIENT
    // =========================================

    const adminClient =
      createClient(
        supabaseUrl,
        supabaseServiceRoleKey
      )

    // =========================================
    // REQUEST BODY
    // =========================================

    let body: InviteRequest

    try {
      body =
        await request.json()
    } catch {
      return jsonResponse(
        {
          error:
            "Invalid request body.",
        },
        400
      )
    }

    const invitationId =
      body.invitationId

    if (!invitationId) {
      return jsonResponse(
        {
          error:
            "invitationId is required.",
        },
        400
      )
    }

    // =========================================
    // LOAD INVITATION
    // =========================================

    const {
      data: invitation,
      error: invitationError,
    } =
      await adminClient
        .from(
          "platform_invitations"
        )
        .select(`
          id,
          email,
          recipient_name,
          tournament_id,
          organization_name,
          team_name,
          invitation_type,
          status,
          token,
          invited_by_user_id,
          sent_at,
          accepted_at,
          expires_at
        `)
        .eq(
          "id",
          invitationId
        )
        .single()

        if (
          invitationError ||
          !invitation
        ) {
          console.error(
            "INVITATION LOOKUP ERROR:",
            invitationError
          )
        
          return jsonResponse(
            {
              error:
                "Tournament invitation lookup failed.",
        
              invitationId,
        
              databaseError:
                invitationError
                  ? {
                      message:
                        invitationError.message,
        
                      code:
                        invitationError.code,
        
                      details:
                        invitationError.details,
        
                      hint:
                        invitationError.hint,
                    }
                  : null,
        
              invitationFound:
                Boolean(invitation),
            },
            500
          )
        }

    // =========================================
    // VALIDATE INVITATION
    // =========================================

    if (
      invitation.invitation_type !==
      "tournament"
    ) {
      return jsonResponse(
        {
          error:
            "This invitation is not a tournament invitation.",
        },
        400
      )
    }

    if (
      invitation.status ===
        "accepted" ||
      invitation.status ===
        "cancelled"
    ) {
      return jsonResponse(
        {
          error:
            `This invitation is already ${invitation.status}.`,
        },
        400
      )
    }

    // =========================================
    // EXPIRATION
    // =========================================

    if (invitation.expires_at) {
      const expiresAt =
        new Date(
          invitation.expires_at
        )

      if (
        expiresAt.getTime() <
        Date.now()
      ) {
        await adminClient
          .from(
            "platform_invitations"
          )
          .update({
            status:
              "expired",
          })
          .eq(
            "id",
            invitation.id
          )

        return jsonResponse(
          {
            error:
              "This invitation has expired.",
          },
          400
        )
      }
    }

    // =========================================
    // LOAD TOURNAMENT
    // =========================================

    const {
      data: tournament,
      error: tournamentError,
    } =
      await adminClient
        .from("tournaments")
        .select(`
          id,
          name,
          slug,
          city,
          state,
          start_date,
          end_date,
          status
        `)
        .eq(
          "id",
          invitation.tournament_id
        )
        .single()

    if (
      tournamentError ||
      !tournament
    ) {
      console.error(
        "TOURNAMENT LOOKUP ERROR:",
        tournamentError
      )

      return jsonResponse(
        {
          error:
            "Tournament could not be loaded.",
        },
        404
      )
    }

    // =========================================
    // INVITE URL
    // =========================================

    const cleanSiteUrl =
      siteUrl.replace(
        /\/+$/,
        ""
      )

    const inviteUrl =
      `${cleanSiteUrl}/invite/tournament/${invitation.token}`

    // =========================================
    // TOURNAMENT DISPLAY DATA
    // =========================================

    const startDate =
      formatDate(
        tournament.start_date
      )

    const endDate =
      formatDate(
        tournament.end_date
      )

    const location =
      [
        tournament.city,
        tournament.state,
      ]
        .filter(Boolean)
        .join(", ")

    const recipientGreeting =
      invitation.recipient_name
        ? `Hi ${escapeHtml(
            invitation.recipient_name
          )},`
        : "Hello,"

    const teamLine =
      invitation.team_name
        ? `
          <p style="margin:0 0 16px;">
            The 
            <strong>${escapeHtml(
              invitation.team_name
            )}</strong>
            Have been invited to play ball!
          </p>
        `
        : `
          <p style="margin:0 0 16px;">
            We'd like to invite your team to participate.
          </p>
        `

    // =========================================
    // EMAIL
    // =========================================

    const subject =
       `MBL Tournament Invitation: ${tournament.name}`

    const html = `
<!doctype html>
<html>
  <body
    style="
      margin:0;
      padding:0;
      background:#111111;
      font-family:Arial,Helvetica,sans-serif;
      color:#f5f0df;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        background:#111111;
        padding:32px 16px;
      "
    >
      <tr>
        <td align="center">

          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              max-width:600px;
              background:#183426;
              border:1px solid #d9cfaa;
            "
          >

            <tr>
              <td
                style="
                  padding:28px;
                  border-bottom:4px solid #9f241f;
                "
              >

                <div
                  style="
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:2px;
                    text-transform:uppercase;
                    color:#d9aa45;
                  "
                >
                  MBL Baseball
                </div>

                <h1
                  style="
                    margin:12px 0 0;
                    font-size:28px;
                    line-height:1.15;
                    text-transform:uppercase;
                    color:#f5f0df;
                  "
                >
                  Tournament Invitation
                </h1>

              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:28px;
                "
              >

                <p
                  style="
                    margin:0 0 18px;
                    font-size:16px;
                    line-height:1.6;
                  "
                >
                  ${recipientGreeting}
                </p>

                ${teamLine}

                <div
                  style="
                    margin:24px 0;
                    padding:20px;
                    background:#101d16;
                    border:1px solid #6d755f;
                  "
                >

                  <div
                    style="
                      font-size:11px;
                      font-weight:700;
                      letter-spacing:2px;
                      text-transform:uppercase;
                      color:#d9aa45;
                    "
                  >
                    You're Invited
                  </div>

                  <div
                    style="
                      margin-top:8px;
                      font-size:22px;
                      font-weight:800;
                      text-transform:uppercase;
                      color:#f5f0df;
                    "
                  >
                    ${escapeHtml(
                      tournament.name
                    )}
                  </div>

                  <div
                    style="
                      margin-top:14px;
                      font-size:14px;
                      line-height:1.7;
                      color:#c9c5b5;
                    "
                  >
                    ${startDate}
                    ${
                      startDate !== endDate
                        ? ` – ${endDate}`
                        : ""
                    }

                    ${
                      location
                        ? `<br>${escapeHtml(
                            location
                          )}`
                        : ""
                    }
                  </div>

                </div>

                <p
                  style="
                    margin:0 0 24px;
                    font-size:15px;
                    line-height:1.6;
                    color:#d7d2c2;
                  "
                >
                  Create or sign in to your MBL account,
                  add your organization and team if needed,
                  then complete tournament registration
                  and roster submission online.
                </p>

                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                >
                  <tr>
                    <td
                      bgcolor="#d9aa45"
                      style="
                        border:1px solid #d9aa45;
                      "
                    >
                      <a
                        href="${inviteUrl}"
                        style="
                          display:inline-block;
                          padding:14px 22px;
                          color:#111111;
                          font-size:13px;
                          font-weight:800;
                          letter-spacing:1px;
                          text-decoration:none;
                          text-transform:uppercase;
                        "
                      >
                        Register Your Team
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin:28px 0 0;
                    font-size:11px;
                    line-height:1.5;
                    color:#9d9a8d;
                  "
                >
                  This invitation is specific to
                  ${escapeHtml(
                    tournament.name
                  )}.
                </p>

              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
`

    // =========================================
    // SEND THROUGH RESEND
    // =========================================

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

          body:
            JSON.stringify({
              from:
                "MBL Baseball <sky@spark-sc.com>",

              to: [
                invitation.email,
              ],

              subject,

              html,
            }),
        }
      )

    const resendBody =
      await resendResponse
        .json()
        .catch(() => null)

    if (!resendResponse.ok) {
      console.error(
        "RESEND ERROR:",
        resendBody
      )

      return jsonResponse(
        {
          error:
            "Email provider rejected the tournament invitation.",

          providerError:
            resendBody,
        },
        resendResponse.status
      )
    }

    // =========================================
    // MARK INVITATION SENT
    // =========================================

    const {
      error: updateError,
    } =
      await adminClient
        .from(
          "platform_invitations"
        )
        .update({
          status:
            "sent",

          sent_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          invitation.id
        )

    if (updateError) {
      console.error(
        "INVITATION SENT BUT STATUS UPDATE FAILED:",
        updateError
      )

      return jsonResponse(
        {
          success: true,

          warning:
            "Email was sent, but invitation status could not be updated.",

          provider:
            resendBody,
        },
        200
      )
    }

    // =========================================
    // SUCCESS
    // =========================================

    return jsonResponse(
      {
        success: true,

        invitationId:
          invitation.id,

        email:
          invitation.email,

        inviteUrl,

        provider:
          resendBody,
      },
      200
    )

  } catch (error) {
    console.error(
      "SEND TOURNAMENT INVITE ERROR:",
      error
    )

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Tournament invitation could not be sent.",
      },
      500
    )
  }
})

// =========================================
// HELPERS
// =========================================

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

function formatDate(
  value: string
) {
  const date =
    new Date(
      `${value}T12:00:00`
    )

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(date)
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    )
}