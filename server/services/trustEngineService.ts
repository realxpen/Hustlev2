let trustProfilesDB: Record<string, any> = {};

export class TrustEngineService {
  public async getTrustProfile(userId: string) {
    if (!trustProfilesDB[userId]) {
      trustProfilesDB[userId] = {
        internalScore: 1000,
        visibleLabel: 'New'
      };
    }
    return trustProfilesDB[userId];
  }

  // Internal function: Maps raw score to safe visible label
  public calculateLabel(score: number): string {
    if (score >= 9000) return 'Expert';
    if (score >= 7000) return 'Top Rated';
    if (score >= 4000) return 'Trusted';
    if (score >= 1500) return 'Verified';
    return 'New';
  }

  public async updateScore(userId: string, delta: number) {
    const profile = await this.getTrustProfile(userId);
    // Score clamped between 0 and 10000
    profile.internalScore = Math.max(0, Math.min(10000, profile.internalScore + delta));
    profile.visibleLabel = this.calculateLabel(profile.internalScore);
    return profile;
  }
}

export const trustEngineService = new TrustEngineService();
