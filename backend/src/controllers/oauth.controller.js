import { oauthService } from "../services/oauth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const oauthController = {
  async googleCallback(req, res) {
    const user = req.user;
    const result = await oauthService.handleGoogleLogin({
      id: user.id,
      name: user.displayName || user.name || "User",
      email: user.emails?.[0]?.value,
      picture: user.photos?.[0]?.value,
    });

    sendSuccess(res, {
      statusCode: 200,
      message: "Google login successful.",
      data: result,
    });
  },

  async appleCallback(req, res) {
    const user = req.user;
    const result = await oauthService.handleAppleLogin({
      id: user.id,
      sub: user.id,
      name: user.name || "User",
      email: user.email,
    });

    sendSuccess(res, {
      statusCode: 200,
      message: "Apple login successful.",
      data: result,
    });
  },
};
