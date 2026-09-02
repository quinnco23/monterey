

export function isStrongPassword(password: string) {
    return (
      password.length >= 10 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    )
  }

  