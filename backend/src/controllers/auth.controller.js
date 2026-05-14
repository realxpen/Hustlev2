import { authService } from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const authController = {
  async register(req, res) {
    const payload = req.validated?.body ?? req.body;
    const result = await authService.register(payload);

    sendSuccess(res, {
      statusCode: 201,
      message: "User registered successfully.",
      data: result,
    });
  },

  async login(req, res) {
    const payload = req.validated?.body ?? req.body;
    const result = await authService.login(payload);

    sendSuccess(res, {
      statusCode: 200,
      message: "Login successful.",
      data: result,
    });
  },

  async me(req, res) {
    const user = await authService.getAuthenticatedUser(req.user.id);

    sendSuccess(res, {
      statusCode: 200,
      message: "Authenticated user fetched successfully.",
      data: user,
    });
  },
};
