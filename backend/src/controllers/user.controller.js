import { userService } from "../services/user.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const userController = {
  async me(req, res) {
    const user = await userService.getCurrentUser(req.user.id);

    sendSuccess(res, {
      statusCode: 200,
      message: "Current user fetched successfully.",
      data: user,
    });
  },

  async getById(req, res) {
    const { id } = req.validated?.params ?? req.params;
    const user = await userService.getUserById(id);

    sendSuccess(res, {
      statusCode: 200,
      message: "User fetched successfully.",
      data: user,
    });
  },
};
