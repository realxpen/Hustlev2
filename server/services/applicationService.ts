import crypto from "crypto";

let applicationsDB: any[] = [];
let userVerificationsDB: Record<string, any> = {};

export class ApplicationService {
  public async getApplication(userId: string) {
    const app = applicationsDB.find(a => a.userId === userId);
    
    // Check prerequisites
    const verification = userVerificationsDB[userId] || {
      phoneVerified: false,
      idVerified: false,
      paymentMethodLinked: false
    };

    return {
      hasApplication: !!app,
      application: app || null,
      verification
    };
  }

  public async apply(userId: string, data: any) {
    const existingApp = applicationsDB.find(a => a.userId === userId);
    if (existingApp && ['pending', 'more_info'].includes(existingApp.status)) {
      throw new Error("You already have an active application.");
    }

    const newApp = {
      id: existingApp ? existingApp.id : crypto.randomUUID(),
      userId,
      basicInfo: data.basicInfo || {},
      skills: data.skills || {},
      portfolio: data.portfolio || {},
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    
    if (existingApp) {
        Object.assign(existingApp, newApp);
        return existingApp;
    }

    applicationsDB.push(newApp);
    return newApp;
  }

  public async updateApplication(userId: string, data: any) {
      const app = applicationsDB.find(a => a.userId === userId);
      if (!app) throw new Error("Application not found.");
      
      if (app.status !== 'more_info' && app.status !== 'pending') {
          throw new Error("Cannot update application in current status.");
      }
      
      if (data.basicInfo) app.basicInfo = { ...app.basicInfo, ...data.basicInfo };
      if (data.skills) app.skills = { ...app.skills, ...data.skills };
      if (data.portfolio) app.portfolio = { ...app.portfolio, ...data.portfolio };
      
      app.status = 'pending'; // Re-submit for review
      app.updatedAt = new Date().toISOString();
      
      return app;
  }

  public async setStatus(applicationId: string, status: string, adminId: string) {
    const app = applicationsDB.find(a => a.id === applicationId);
    if (!app) throw new Error("Application not found.");
    
    if (!['pending', 'approved', 'rejected', 'more_info'].includes(status)) {
        throw new Error("Invalid status");
    }
    
    app.status = status;
    app.reviewerId = adminId;
    app.resolvedAt = new Date().toISOString();

    // Trigger update to ProfileService to set `is_hustler = true` if approved
    
    return app;
  }
}

export const applicationService = new ApplicationService();
