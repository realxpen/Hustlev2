import { SOCKET_EVENTS, SOCKET_NAMESPACES } from "./events.js";

let socketServer = null;

export function registerSocketPublisher(io) {
  socketServer = io;
}

export function publishFeedEvent(eventName, payload) {
  if (!socketServer) {
    return;
  }

  socketServer.of(SOCKET_NAMESPACES.feed).emit(eventName, payload);

  if (
    eventName === SOCKET_EVENTS.postLiked ||
    eventName === SOCKET_EVENTS.postCommented ||
    eventName === SOCKET_EVENTS.postReposted ||
    eventName === SOCKET_EVENTS.postSaved
  ) {
    socketServer.of(SOCKET_NAMESPACES.notifications).emit(eventName, payload);
  }
}
