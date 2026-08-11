export type UserRole = "Client" | "Hustler";

export interface OTPDetails {
  code: string;
  expiresAt: Date;
  verified: boolean;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailOTP?: OTPDetails;
  phoneOTP?: OTPDetails;
  hustlerApplicationStatus: "none" | "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface TokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    email?: string;
    phone?: string;
    fullName: string;
    role: UserRole;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    hustlerApplicationStatus: string;
    createdAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
