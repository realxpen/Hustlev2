export interface Chat {
  id: number;
  name: string;
  avatar?: string;
  isGroup?: boolean;
  participants?: string[];
  type: "booking" | "order" | "team" | "dispute" | "apprenticeship";
  priority: "normal" | "urgent" | "action_needed";
  lastMessage: string;
  time: string;
  unread: number;
  active: boolean;
  verified?: boolean;
  pinned: boolean;
  tags: string[];
}

export const MOCK_CHATS: Chat[] = [
  {
    id: 1,
    name: "Marcus V.",
    avatar: "M",
    type: "booking",
    priority: "action_needed",
    lastMessage:
      "I can definitely help with that landing page. Are you available for a quick call?",
    time: "2m ago",
    unread: 2,
    active: true,
    verified: true,
    pinned: true,
    tags: ["VIP Client"],
  },
  {
    id: 2,
    name: "Hustle Launch Team",
    isGroup: true,
    participants: ["E", "M", "J", "+2"],
    type: "team",
    priority: "normal",
    lastMessage:
      "Jordan: The photos from the shoot are ready! Sent them to your gallery link.",
    time: "1h ago",
    unread: 5,
    active: false,
    pinned: true,
    tags: ["Internal"],
  },
  {
    id: 3,
    name: "Elena S.",
    avatar: "E",
    type: "order",
    priority: "urgent",
    lastMessage: "Is my order going to be delayed? I need it by Friday.",
    time: "3h ago",
    unread: 1,
    active: true,
    verified: true,
    pinned: false,
    tags: ["Fashion Orders", "Urgent"],
  },
  {
    id: 4,
    name: "Alex Johnson",
    avatar: "A",
    type: "dispute",
    priority: "normal",
    lastMessage: "Waiting for Hustle Mediation to review the milestone.",
    time: "1d ago",
    unread: 0,
    active: false,
    verified: false,
    pinned: false,
    tags: [],
  },
  {
    id: 5,
    name: "Apprentice Cohort 1",
    isGroup: true,
    participants: ["T", "C", "P", "+8"],
    type: "apprenticeship",
    priority: "normal",
    lastMessage: "Tomiwa: Can we review chapter 3 assignments today?",
    time: "Yesterday",
    unread: 0,
    active: false,
    pinned: false,
    tags: ["Apprentices"],
  },
];
