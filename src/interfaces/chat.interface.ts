export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'support' | 'system';
  timestamp: Date;
  userName?: string;
}

export interface SocketMessage {
  id?: string;
  text?: string;
  message?: string;
  sender: string | number;
  timestamp?: string | Date;
  userName?: string;
}

export interface TypingEvent {
  userId: string;
  isTyping: boolean;
}

export interface JoinRoomEvent {
  userId: string | number;
}

export interface SendMessageEvent {
  text: string;
  userId: string | number;
  sender: string | number;
  timestamp: string;
} 