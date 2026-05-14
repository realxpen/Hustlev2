export const SOCKET_NAMESPACES = {
  feed: "/feed",
  chat: "/chat",
  livestream: "/livestream",
  notifications: "/notifications",
};

export const SOCKET_EVENTS = {
  systemReady: "system:ready",
  subscribe: "room:subscribe",
  postCreated: "post:created",
  postLiked: "post:liked",
  postCommented: "post:commented",
  postReposted: "post:reposted",
  postSaved: "post:saved",
};
