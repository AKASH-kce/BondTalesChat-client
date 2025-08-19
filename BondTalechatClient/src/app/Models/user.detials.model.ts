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