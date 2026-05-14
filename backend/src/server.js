import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { socketCorsOptions } from "./config/security.js";
import { prisma } from "./prisma/client.js";
import { registerSocketServer } from "./sockets/index.js";
import { registerSocketPublisher } from "./sockets/publisher.js";

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: socketCorsOptions,
});

// Socket namespaces are registered now so chat, live, and notifications can plug in later.
registerSocketServer(io);
registerSocketPublisher(io);

async function startServer() {
  try {
    await prisma.$connect();

    httpServer.listen(env.port, () => {
      console.log(`Hustle backend listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start Hustle backend:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down Hustle backend...`);

  await prisma.$disconnect();

  httpServer.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

void startServer();
