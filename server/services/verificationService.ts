let verificationsDB: Record<string, any> = {};

export class VerificationService {
  public async getVerificationStatus(userId: string) {
    if (!verificationsDB[userId]) {
      verificationsDB[userId] = {
        phone: { status: 'unverified' },
        email: { status: 'unverified' },
        identity: { status: 'unverified' },
        address: { status: 'unverified' },
        business: { status: 'unverified' }
      };
    }
    return verificationsDB[userId];
  }

  public async verifyPhone(userId: string, data: any) {
    const status = await this.getVerificationStatus(userId);
    status.phone = { status: 'verified', value: data.phone, updatedAt: new Date().toISOString() };
    return status;
  }

  public async verifyEmail(userId: string, data: any) {
    const status = await this.getVerificationStatus(userId);
    status.email = { status: 'verified', value: data.email, updatedAt: new Date().toISOString() };
    return status;
  }

  public async verifyIdentity(userId: string, data: any) {
    const status = await this.getVerificationStatus(userId);
    status.identity = { status: 'pending', documents: data.documents, updatedAt: new Date().toISOString() };
    return status;
  }

  public async verifyAddress(userId: string, data: any) {
    const status = await this.getVerificationStatus(userId);
    status.address = { status: 'pending', address: data.address, updatedAt: new Date().toISOString() };
    return status;
  }
}

export const verificationService = new VerificationService();
