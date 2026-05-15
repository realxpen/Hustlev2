import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import AppleStrategy from "passport-apple";
import { env } from "./env.js";
import { tokenService } from "../services/token.service.js";
import { oauthService } from "../services/oauth.service.js";

export function setupPassport() {
  // Google Strategy
  if (env.oauth.google.clientId && env.oauth.google.clientSecret) {
    passport.use(
      new GoogleStrategy.Strategy(
        {
          clientID: env.oauth.google.clientId,
          clientSecret: env.oauth.google.clientSecret,
          callbackURL: env.oauth.google.callbackUrl,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const result = await oauthService.handleGoogleLogin({
              id: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              picture: profile.photos[0]?.value,
            });

            return done(null, result);
          } catch (error) {
            return done(error);
          }
        },
      ),
    );
  }

  // Apple Strategy
  if (env.oauth.apple.clientId && env.oauth.apple.teamId && env.oauth.apple.keyId) {
    passport.use(
      new AppleStrategy.Strategy(
        {
          teamID: env.oauth.apple.teamId,
          keyID: env.oauth.apple.keyId,
          privateKey: env.oauth.apple.privateKey,
          clientID: env.oauth.apple.clientId,
          callbackURL: env.oauth.apple.callbackUrl,
        },
        async (_accessToken, _refreshToken, idToken, user, done) => {
          try {
            const result = await oauthService.handleAppleLogin({
              id: user.id,
              sub: user.id,
              name: user.name || "Apple User",
              email: user.email,
            });

            return done(null, result);
          } catch (error) {
            return done(error);
          }
        },
      ),
    );
  }

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
}
