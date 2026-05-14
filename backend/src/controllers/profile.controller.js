import { profileService } from "../services/profile.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const profileController = {
  async getMyProfile(req, res) {
    const profile = await profileService.getMyProfile(req.user.id);

    sendSuccess(res, {
      statusCode: 200,
      message: "Profile fetched successfully.",
      data: profile,
    });
  },

  async updateMyProfile(req, res) {
    const payload = req.validated?.body ?? req.body;
    const profile = await profileService.updateMyProfile(req.user.id, payload);

    sendSuccess(res, {
      statusCode: 200,
      message: "Profile updated successfully.",
      data: profile,
    });
  },
};
