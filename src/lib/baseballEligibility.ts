type EligibilityInput = {
  birthDate: string | null
  ageGroup: string | null
  seasonYear: number | null
}

type EligibilityResult = {
  eligible: boolean
  leagueAge: number | null
  reason: string | null
}

export function checkPlayerEligibility({
  birthDate,
  ageGroup,
  seasonYear,
}: EligibilityInput): EligibilityResult {
  if (!birthDate) {
    return {
      eligible: false,
      leagueAge: null,
      reason: "Date of birth is required.",
    }
  }

  if (!ageGroup) {
    return {
      eligible: false,
      leagueAge: null,
      reason: "Team age group is missing.",
    }
  }

  if (!seasonYear) {
    return {
      eligible: false,
      leagueAge: null,
      reason: "Team season year is missing.",
    }
  }

  // Convert "10U" -> 10
  const maxAge = Number(
    ageGroup.toUpperCase().replace("U", "")
  )

  if (Number.isNaN(maxAge)) {
    return {
      eligible: false,
      leagueAge: null,
      reason: "Invalid team age group.",
    }
  }

  const dob = new Date(`${birthDate}T12:00:00`)

  if (Number.isNaN(dob.getTime())) {
    return {
      eligible: false,
      leagueAge: null,
      reason: "Invalid date of birth.",
    }
  }

  // League-age cutoff is April 30
  // Month is zero-indexed: 3 = April
  const cutoffDate = new Date(
    seasonYear,
    3,
    30,
    12,
    0,
    0
  )

  let leagueAge =
    cutoffDate.getFullYear() -
    dob.getFullYear()

  const birthdayThisYear = new Date(
    seasonYear,
    dob.getMonth(),
    dob.getDate(),
    12,
    0,
    0
  )

  // If the player's birthday occurs AFTER April 30,
  // they haven't turned that age by the cutoff.
  if (birthdayThisYear > cutoffDate) {
    leagueAge -= 1
  }

  const eligible =
    leagueAge <= maxAge

  return {
    eligible,
    leagueAge,
    reason: eligible
      ? null
      : `Player is League Age ${leagueAge} and is not eligible for ${ageGroup}.`,
  }
}