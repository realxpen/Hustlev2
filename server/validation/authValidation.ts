export interface ValidationResult<T> {
  error?: string;
  value?: T;
}

// Ensure normal email syntax matches
export function validateEmailString(email?: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Simple sanitize phone formats to numeric digits
export function sanitizePhoneNumber(phone?: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, ""); // remove all non-digits
}

// Validate Register payload
export function validateRegisterPayload(body: any): ValidationResult<{
  email?: string;
  phone?: string;
  password: string;
  fullName: string;
}> {
  const { email, phone, password, fullName } = body || {};

  if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
    return { error: "A valid full name registration is required" };
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return { error: "Password must consist of 6 or more characters" };
  }

  if (!email && !phone) {
    return { error: "Please provide either an email address or mobile number to configure identity" };
  }

  const result: any = {
    password,
    fullName: fullName.trim()
  };

  if (email) {
    if (!validateEmailString(email)) {
      return { error: "Invalid email syntax provided" };
    }
    result.email = email.toLowerCase().trim();
  }

  if (phone) {
    const rawDigits = sanitizePhoneNumber(phone);
    if (rawDigits.length < 10) {
      return { error: "Mobile number must be a valid 10-digit number" };
    }
    result.phone = "+" + rawDigits; // format cleanly
  }

  return { value: result };
}

// Validate login structure
export function validateLoginPayload(body: any): ValidationResult<{
  email?: string;
  phone?: string;
  password?: string;
}> {
  const { email, phone, password } = body || {};

  if (!email && !phone) {
    return { error: "Provide either a configured email or phone channel to locate account" };
  }

  if (!password || typeof password !== "string") {
    return { error: "Password credentials verified flag not met" };
  }

  const result: any = { password };

  if (email) {
    if (!validateEmailString(email)) {
      return { error: "The provided email format is invalid" };
    }
    result.email = email.toLowerCase().trim();
  }

  if (phone) {
    const rawDigits = sanitizePhoneNumber(phone);
    if (rawDigits.length < 10) {
      return { error: "Specify a complete standard phone format" };
    }
    result.phone = "+" + rawDigits;
  }

  return { value: result };
}

// Validate OTP string structure
export function validateOtpPayload(body: any): ValidationResult<{ code: string }> {
  const { code } = body || {};
  if (!code || typeof code !== "string" || code.trim().length !== 6) {
    return { error: "The entered verification pin must be a 6-digit numeric combination" };
  }
  return { value: { code: code.trim() } };
}
