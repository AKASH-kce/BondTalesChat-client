export interface IUserDetial {
  user: IUserMessage,
  event: Event
}

export interface IUserMessage {
  userId: number | undefined;
  ProfileImageURl: string;
  name: string;
  lastMessageTime: string;
  lastMessage: string;
}

export interface IConversation {
  conversationId: number;
  isGroup: boolean;
  title?: string;
  otherUserId?: number;
  otherUserName: string;
  otherUserProfilePicture: string;
  lastMessage?: string;
  lastMessageTime: string;
  lastMessageSenderId?: number;
  unreadCount: number;
}