import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  typingUser: null,
  onlineUsers: []
};

const getSenderId = (message) => message.sender?._id || message.sender || message.senderId;

const getConversationId = (message) =>
  message.conversation?._id || message.conversation || message.conversationId;

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload.map((conversation) => ({
        ...conversation,
        unreadCount: conversation.unreadCount || 0
      }));
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload.map((message) => ({
        ...message,
        status: message.status || "sent"
      }));
    },
    addMessage: (state, action) => {
      const message = action.payload;
      const messageWithStatus = {
        ...message,
        status: message.status || "sent"
      };
      const pendingMessage = state.messages.find((item) => {
        const hasSameClientId =
          item.clientMessageId &&
          messageWithStatus.clientMessageId &&
          item.clientMessageId === messageWithStatus.clientMessageId;

        const looksLikeSameMessage =
          item.status === "pending" &&
          item.text === messageWithStatus.text &&
          getConversationId(item) === getConversationId(messageWithStatus) &&
          getSenderId(item)?.toString() === getSenderId(messageWithStatus)?.toString();

        return hasSameClientId || looksLikeSameMessage;
      });

      if (pendingMessage) {
        Object.assign(pendingMessage, messageWithStatus, { status: "sent" });
        return;
      }

      const exists = state.messages.some((item) => item._id === messageWithStatus._id);

      if (!exists) {
        state.messages.push(messageWithStatus);
      }
    },
    addOptimisticMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    markMessagePending: (state, action) => {
      const message = state.messages.find(
        (item) => item.clientMessageId === action.payload
      );

      if (message) {
        message.status = "pending";
      }
    },
    markMessageFailed: (state, action) => {
      const message = state.messages.find(
        (item) => item.clientMessageId === action.payload
      );

      if (message && message.status === "pending") {
        message.status = "failed";
      }
    },
    removePendingMessagesForConversation: (state, action) => {
      const { conversationId, senderId } = action.payload;

      state.messages = state.messages.filter((message) => {
        const isSameConversation = getConversationId(message) === conversationId;
        const isSameSender =
          getSenderId(message)?.toString() === senderId?.toString();

        return !(message.status === "pending" && isSameConversation && isSameSender);
      });

      const conversation = state.conversations.find(
        (item) => item._id === conversationId
      );

      if (conversation?.lastMessage?.status === "pending") {
        const latestMessage = [...state.messages]
          .reverse()
          .find((message) => getConversationId(message) === conversationId);

        conversation.lastMessage = latestMessage || null;
      }
    },
    upsertConversationLastMessage: (state, action) => {
      const message = action.payload;
      const conversationId =
        message.conversation?._id || message.conversation || message.conversationId;

      if (!conversationId) return;

      const conversation = state.conversations.find(
        (item) => item._id === conversationId
      );

      if (conversation) {
        conversation.lastMessage = message;
      }
    },
    incrementConversationUnread: (state, action) => {
      const conversation = state.conversations.find(
        (item) => item._id === action.payload
      );

      if (conversation) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
    },
    clearConversationUnread: (state, action) => {
      const conversation = state.conversations.find(
        (item) => item._id === action.payload
      );

      if (conversation) {
        conversation.unreadCount = 0;
      }
    },
    markConversationMessagesRead: (state, action) => {
      const { conversationId, readBy } = action.payload;

      state.messages.forEach((message) => {
        const messageConversationId = getConversationId(message);
        const receiverId = message.receiver?._id || message.receiver;

        if (
          messageConversationId === conversationId &&
          receiverId?.toString() === readBy?.toString()
        ) {
          message.status = "read";
        }
      });

      const conversation = state.conversations.find(
        (item) => item._id === conversationId
      );

      if (conversation?.lastMessage) {
        const receiverId =
          conversation.lastMessage.receiver?._id || conversation.lastMessage.receiver;

        if (receiverId?.toString() === readBy?.toString()) {
          conversation.lastMessage.status = "read";
        }
      }
    },
    setTypingUser: (state, action) => {
      state.typingUser = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    }
  }
});

export const {
  setConversations,
  setCurrentConversation,
  setMessages,
  addMessage,
  addOptimisticMessage,
  markMessageFailed,
  markMessagePending,
  removePendingMessagesForConversation,
  upsertConversationLastMessage,
  incrementConversationUnread,
  clearConversationUnread,
  markConversationMessagesRead,
  setTypingUser,
  setOnlineUsers
} = chatSlice.actions;

export default chatSlice.reducer;
