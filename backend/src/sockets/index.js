import { SOCKET_EVENTS, SOCKET_NAMESPACES } from "./events.js";

function registerNamespacePlaceholder(namespace, label) {
  namespace.on("connection", (socket) => {
    socket.emit(SOCKET_EVENTS.systemReady, {
      message: `${label} socket namespace is connected and ready for future events.`,
    });

    socket.on(SOCKET_EVENTS.subscribe, (roomName) => {
      if (typeof roomName === "string" && roomName.trim()) {
        socket.join(roomName);
      }
    });
  });
}

export function registerSocketServer(io) {
  io.on("connection", (socket) => {
    socket.emit(SOCKET_EVENTS.systemReady, {
      message: "Base socket connection established.",
    });
  });

  registerNamespacePlaceholder(io.of(SOCKET_NAMESPACES.feed), "Feed");
  registerNamespacePlaceholder(io.of(SOCKET_NAMESPACES.chat), "Chat");
  registerNamespacePlaceholder(io.of(SOCKET_NAMESPACES.livestream), "Livestream");
  registerNamespacePlaceholder(io.of(SOCKET_NAMESPACES.notifications), "Notifications");
}
