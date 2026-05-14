export type AppStage = "splash" | "auth" | "transition" | "home";

export const NEXT_APP_STAGE: Readonly<Record<AppStage, AppStage | null>> = {
  splash: "auth",
  auth: "transition",
  transition: "home",
  home: null,
};
