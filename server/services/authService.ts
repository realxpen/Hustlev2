import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, UserRole, TokenPayload, AuthResponse, OTPDetails } from "../types/auth";

class AuthService {
  // Simple stateful memory persistence for simulated DB records
  private users: Map<string, User> = new Map();
  private refreshTokensDb: Map<string, string> = new Map(); // Maps token to userId

  // Private keys for signing tokens with solid standard fallbacks for sandbox
  private readonly ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "hustle_super_secure_access_secret_2026";
  private readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "hustle_super_secure_refresh_secret_2026/dev";

  constructor() {
    // Seed an elegant test Client user to guarantee preview convenience out-of-the-box
    const testClientId = "test-client-id";
    const passwordHash = bcrypt.hashSync("password123", 10);
    this.users.set(testClientId, {
      id: testClientId,
      email: "client@hustle.com",
      phone: "+15555551212",
      passwordHash,
      fullName: "Alex Hustler",
      role: "Client",
      isEmailVerified: true,
      isPhoneVerified: true,
      hustlerApplicationStatus: "none",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Generate OTP helper (6-digit format with 10 minutes timeout window)
  private generateOTP(): OTPDetails {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes valid duration
    return {
      code,
      expiresAt,
      verified: false
    };
  }

  // Issue custom Access & Refresh JWT pair
  private issueTokens(userId: string, role: UserRole, email?: string, phone?: string) {
    const payload: TokenPayload = { userId, email, phone, role };
    
    const accessToken = jwt.sign(payload, this.ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, this.REFRESH_SECRET, { expiresIn: "7d" });

    // Store refresh token mappings for rotation
    this.refreshTokensDb.set(refreshToken, userId);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 mins in seconds
    };
  }

  // --- CORE SYSTEM METHODS ---

  // Standard user signup (always creates general Client role user)
  public async register(payload: { email?: string; phone?: string; password: string; fullName: string }): Promise<AuthResponse> {
    const { email, phone, password, fullName } = payload;

    if (!email && !phone) {
      throw new Error("Must provide either a verified email or local mobile number");
    }

    // Check pre-existence
    if (email) {
      const existingUser = Array.from(this.users.values()).find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        throw new Error("Profile with this email is already registered");
      }
    }
    if (phone) {
      const existingUser = Array.from(this.users.values()).find(u => u.phone === phone);
      if (existingUser) {
        throw new Error("Phone number is already associated with another account");
      }
    }

    const userId = "u-" + Math.random().toString(36).substring(2, 10);
    const passwordHash = await bcrypt.hash(password, 10);

    const emailOTP = email ? this.generateOTP() : undefined;
    const phoneOTP = phone ? this.generateOTP() : undefined;

    const newUser: User = {
      id: userId,
      email,
      phone,
      passwordHash,
      fullName,
      role: "Client", // Strictly starts as Client as mandated by safety regulations
      isEmailVerified: false,
      isPhoneVerified: false,
      emailOTP,
      phoneOTP,
      hustlerApplicationStatus: "none",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(userId, newUser);

    // Mock Dispatch Output Triggers
    if (emailOTP) {
      console.log(`[AUTH-EMAIL-DISPATCH] Verification email delivered to ${email}. Code: ${emailOTP.code}`);
    }
    if (phoneOTP) {
      console.log(`[AUTH-SMS-DISPATCH] OTP SMS text dispatched to ${phone}. Code: ${phoneOTP.code}`);
    }

    const tokens = this.issueTokens(userId, "Client", email, phone);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        fullName: newUser.fullName,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        isPhoneVerified: newUser.isPhoneVerified,
        hustlerApplicationStatus: newUser.hustlerApplicationStatus,
        createdAt: newUser.createdAt
      },
      tokens
    };
  }

  // Normal user login
  public async login(payload: { email?: string; phone?: string; password?: string }): Promise<AuthResponse> {
    const { email, phone, password } = payload;

    let user: User | undefined;

    if (email) {
      user = Array.from(this.users.values()).find(u => u.email?.toLowerCase() === email.toLowerCase());
    } else if (phone) {
      user = Array.from(this.users.values()).find(u => u.phone === phone);
    }

    if (!user) {
      throw new Error("Invalid login credentials specified");
    }

    // Verify hashed password safely
    if (password) {
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        throw new Error("Invalid login credentials specified");
      }
    } else {
      throw new Error("Password authentication verification failed");
    }

    const tokens = this.issueTokens(user.id, user.role, user.email, user.phone);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        hustlerApplicationStatus: user.hustlerApplicationStatus,
        createdAt: user.createdAt
      },
      tokens
    };
  }

  // Logout - destroys current session token mapping
  public logout(refreshToken: string): void {
    this.refreshTokensDb.delete(refreshToken);
  }

  // Verify phone OTP
  public verifyPhoneCode(userId: string, enteredCode: string): boolean {
    const user = this.users.get(userId);
    if (!user || !user.phoneOTP) {
      throw new Error("OTP transaction details not found for this profile");
    }

    const { code, expiresAt, verified } = user.phoneOTP;

    if (verified) {
      return true; // Already verified previously
    }

    if (new Date() > expiresAt) {
      throw new Error("The entered phone verification OTP code has expired");
    }

    // Accept real random OTP code OR immediate standard premium override value "123456" for instant preview convenience
    if (code === enteredCode || enteredCode === "123456") {
      user.isPhoneVerified = true;
      user.phoneOTP.verified = true;
      user.updatedAt = new Date().toISOString();
      this.users.set(userId, user);
      return true;
    }

    throw new Error("Invalid verification code. Please request a new code or try again");
  }

  // Verify email OTP
  public verifyEmailCode(userId: string, enteredCode: string): boolean {
    const user = this.users.get(userId);
    if (!user || !user.emailOTP) {
      throw new Error("Email verification profile records not found");
    }

    const { code, expiresAt, verified } = user.emailOTP;

    if (verified) {
      return true;
    }

    if (new Date() > expiresAt) {
      throw new Error("Email activation code has expired");
    }

    if (code === enteredCode || enteredCode === "123456") {
      user.isEmailVerified = true;
      user.emailOTP.verified = true;
      user.updatedAt = new Date().toISOString();
      this.users.set(userId, user);
      return true;
    }

    throw new Error("Invalid activation code. Please reference server log outputs or try with 123456");
  }

  // Trigger dispatching a fresh code on demand
  public resendOTP(userId: string, channel: "email" | "phone"): string {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Profile not encountered");
    }

    const freshOTP = this.generateOTP();

    if (channel === "email" && user.email) {
      user.emailOTP = freshOTP;
      console.log(`[AUTH-EMAIL-REDISPATCH] Dispatched fresh activation code to ${user.email}. Code: ${freshOTP.code}`);
    } else if (channel === "phone" && user.phone) {
      user.phoneOTP = freshOTP;
      console.log(`[AUTH-SMS-REDISPATCH] Transmitted fresh activation sms to ${user.phone}. Code: ${freshOTP.code}`);
    } else {
      throw new Error(`Profile does not possess registered details for channel: ${channel}`);
    }

    user.updatedAt = new Date().toISOString();
    this.users.set(userId, user);
    return freshOTP.code;
  }

  // JWT Refresh Token flow
  public refreshTokens(refreshToken: string) {
    const storedUserId = this.refreshTokensDb.get(refreshToken);
    if (!storedUserId) {
      throw new Error("Invalid or revoked session refresh token");
    }

    try {
      // Validate signature
      jwt.verify(refreshToken, this.REFRESH_SECRET);
    } catch (err) {
      this.refreshTokensDb.delete(refreshToken); // cleanup
      throw new Error("Expired or corrupted refresh token signature");
    }

    const user = this.users.get(storedUserId);
    if (!user) {
      throw new Error("Bound user account is no longer valid");
    }

    // Revoke old token and issue fresh rotated pair
    this.refreshTokensDb.delete(refreshToken);

    const tokens = this.issueTokens(user.id, user.role, user.email, user.phone);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        hustlerApplicationStatus: user.hustlerApplicationStatus,
        createdAt: user.createdAt
      },
      tokens
    };
  }

  // Securely get single user
  public getUserProfile(userId: string) {
    const user = this.users.get(userId);
    if (!user) return undefined;
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      hustlerApplicationStatus: user.hustlerApplicationStatus,
      createdAt: user.createdAt
    };
  }

  // Applying for Hustler Role Flow
  // "every new account automatically becomes Client role. no role switching system. users can later apply for Hustler role"
  public applyForHustlerRole(userId: string, applicationDetails: any) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Specified profile key not found");
    }

    // Transition status to pending review
    user.hustlerApplicationStatus = "pending";
    user.updatedAt = new Date().toISOString();
    this.users.set(userId, user);

    return {
      success: true,
      message: "Application for Hustler role has been registered successfully. Waiting for administrator governance audit.",
      currentStatus: user.hustlerApplicationStatus,
      role: user.role
    };
  }

  // Admin Approval mechanism for demonstration
  public adminApproveHustlerRole(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("Profile not found");
    }

    user.hustlerApplicationStatus = "approved";
    user.role = "Hustler"; // Safe legal progression
    user.updatedAt = new Date().toISOString();
    this.users.set(userId, user);
    return true;
  }
}

export const authService = new AuthService();
export type { TokenPayload };
