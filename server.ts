import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { createServer as createViteServer } from 'vite';
import onboardingRoutes from './server/routes/onboardingRoutes';
import authRoutes from './server/routes/authRoutes';
import feedRoutes from './server/routes/feedRoutes';
import profileRoutes from './server/routes/profileRoutes';
import contentRoutes from './server/routes/contentRoutes';
import engagementRoutes from './server/routes/engagementRoutes';
import commentRoutes from './server/routes/commentRoutes';
import serviceRoutes from './server/routes/serviceRoutes';
import serviceDetailRoutes from './server/routes/serviceDetailRoutes';
import hireRoutes from './server/routes/hireRoutes';
import bookingRoutes from './server/routes/bookingRoutes';
import walletRoutes from './server/routes/walletRoutes';
import escrowRoutes from './server/routes/escrowRoutes';
import reviewRoutes from './server/routes/reviewRoutes';
import applicationRoutes from './server/routes/applicationRoutes';
import verificationRoutes from './server/routes/verificationRoutes';
import trustEngineRoutes from './server/routes/trustEngineRoutes';
import chatRoutes from './server/routes/chatRoutes';
import notificationRoutes from './server/routes/notificationRoutes';
import agentRoutes from './server/routes/agentRoutes';
import learningRoutes from './server/routes/learningRoutes';
import referralRoutes from './server/routes/referralRoutes';
import { socketService } from './server/services/socketService';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = createServer(app);

  // JSON request body parser
  app.use(express.json());

  // Static directory safety: expose local uploaded videos/photos statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Mount backend onboarding and authentication APIs
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/auth', authRoutes);
  
  // Mount Feed Service endpoints (supports both raw/API standards)
  app.use('/feed', feedRoutes);
  app.use('/api/feed', feedRoutes);

  // Mount User Profile Service endpoints (supports both raw/API standards)
  app.use('/profile', profileRoutes);
  app.use('/api/profile', profileRoutes);

  // Mount Content Service endpoints (upload, media process, metadata, index)
  app.use('/content', contentRoutes);
  app.use('/api/content', contentRoutes);

  // Mount Engagement Service endpoints
  app.use('/api/engagement', engagementRoutes);

  // Mount Comment Service endpoints
  app.use('/api', commentRoutes);

  // Mount Service Management endpoints
  app.use('/services', serviceRoutes);
  app.use('/api/services', serviceRoutes);

  // Mount Service Detail Specific endpoints
  app.use('/service', serviceDetailRoutes);
  app.use('/api/service', serviceDetailRoutes);

  // Mount Hiring and Escrow Service endpoints
  app.use('/hire', hireRoutes);
  app.use('/api/hire', hireRoutes);

  // Mount Booking Service endpoints
  app.use('/booking', bookingRoutes);
  app.use('/api/booking', bookingRoutes);

  // Mount Wallet endpoints
  app.use('/wallet', walletRoutes);
  app.use('/api/wallet', walletRoutes);

  // Mount Escrow endpoints
  app.use('/escrow', escrowRoutes);
  app.use('/api/escrow', escrowRoutes);

  // Mount Review endpoints
  app.use('/review', reviewRoutes);
  app.use('/api/review', reviewRoutes);

  // Mount Application endpoints
  app.use('/hustler', applicationRoutes);
  app.use('/api/hustler', applicationRoutes);

  // Mount Verification endpoints
  app.use('/', verificationRoutes);
  app.use('/api', verificationRoutes);

  // Mount Trust Engine endpoints
  app.use('/', trustEngineRoutes);
  app.use('/api', trustEngineRoutes);

  // Mount Messaging Service endpoints
  app.use('/', chatRoutes);
  app.use('/api', chatRoutes);

  // Mount Notification Service endpoints
  app.use('/notifications', notificationRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Mount Agent Service endpoints
  app.use('/agent', agentRoutes);
  app.use('/api/agent', agentRoutes);

  // Mount Learning Service endpoints
  app.use('/learning', learningRoutes);
  app.use('/api/learning', learningRoutes);

  // Mount Referral Service endpoints
  app.use('/referral', referralRoutes);
  app.use('/api/referral', referralRoutes);
  app.use('/referrals', referralRoutes);
  app.use('/api/referrals', referralRoutes);


  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite development server / production asset routing
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Express backend with Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Express backend in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Initialize socket service
  socketService.initialize(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server initialized. API and application accessible on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting backend server:", err);
  process.exit(1);
});
