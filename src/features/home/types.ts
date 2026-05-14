export type PrimaryHomeNav = "home" | "live" | "wallet" | "profile";
export type HomeNav = PrimaryHomeNav | "bookings";
export type HomeFeedTab = "for-you" | "live" | "nearby";
export type HomeNavigationDirection = "left" | "right";
export type MissionStep = "TRUST" | "INTENT" | "TRANSACTION" | "OUTCOME";

export interface MissionContext {
  id: number | string;
  creator: {
    name: string;
  };
  [key: string]: unknown;
}

export interface ActiveMission {
  id: string;
  step: MissionStep;
  context: MissionContext;
}

export const PRIMARY_HOME_TABS: readonly PrimaryHomeNav[] = [
  "home",
  "live",
  "wallet",
  "profile",
];
