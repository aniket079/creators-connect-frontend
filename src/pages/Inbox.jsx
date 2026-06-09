import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearConversationUnread,
  incrementConversationUnread,
  markConversationMessagesRead,
  setConversations,
  upsertConversationLastMessage
} from "../store/slices/chatSlice";
import { getConversations } from "../api/chatApi";
import Layout from "../components/Layout";
import { useNavigate, useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import ChatPage from "./ChatPage";
import { errorToast } from "../utils/toast";
import socket from "../socket/socket";


const Inbox = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const conversations = useSelector(state => state.chat.conversations);
  const user = useSelector(state => state.auth.user);
  const userId = user?._id || user?.id;
  const [loading, setLoading] = useState(false);

  // Extract conversationId from URL manually
  const chatMatch = location.pathname.match(/^\/chat\/(.+)$/);
  const conversationId = chatMatch ? chatMatch[1] : null;

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      dispatch(setConversations(data));
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to load conversations");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("register", userId);
  }, [userId]);

  useEffect(() => {
    const getMessageConversationId = (message) =>
      message.conversation?._id || message.conversation || message.conversationId;

    const handleIncomingConversationMessage = (message) => {
      const messageConversationId = getMessageConversationId(message);
      const receiverId = message.receiver?._id || message.receiver;

      if (!messageConversationId) return;

      dispatch(upsertConversationLastMessage(message));

      const isIncomingForMe = receiverId?.toString() === userId?.toString();
      if (isIncomingForMe && messageConversationId !== conversationId) {
        dispatch(incrementConversationUnread(messageConversationId));
      }

      if (messageConversationId === conversationId) {
        dispatch(clearConversationUnread(messageConversationId));
      }
    };

    const handleMessagesRead = (payload) => {
      dispatch(markConversationMessagesRead(payload));
    };

    socket.on("receive_message", handleIncomingConversationMessage);
    socket.on("message_sent", handleIncomingConversationMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("messages_read_confirmed", handleMessagesRead);

    return () => {
      socket.off("receive_message", handleIncomingConversationMessage);
      socket.off("message_sent", handleIncomingConversationMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("messages_read_confirmed", handleMessagesRead);
    };
  }, [conversationId, dispatch, userId]);

  const handleStartChat = async (receiverId, conversationId) => {
    navigate(`/chat/${conversationId}`, {
      state: { receiverId }
    });
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-7rem)] min-h-[640px]">
        <div className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:flex">

          {/* LEFT PANEL */}
          <div className={`${id ? "hidden lg:flex" : "flex"} h-full w-full flex-col border-slate-200 bg-white lg:w-[360px] lg:border-r`}>

            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Inbox
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Conversations with creators and clients
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {conversations.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="px-5 py-4 text-sm text-slate-500">
                  Loading conversations...
                </div>
              )}

              {!loading && conversations.length === 0 && (
                <div className="flex h-full items-center justify-center px-8 text-center">
                  <div>
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                      CC
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                      No conversations yet
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Start from an asset card to open a new chat.
                    </p>
                  </div>
                </div>
              )}

              {conversations.map(conv => {
                const otherUser = conv.participants.find(
                  p => p._id !== (user?._id || user?.id)
                );

                const isActive = conv._id === conversationId;
                const unreadCount = conv.unreadCount || 0;
                const initial = otherUser?.name?.charAt(0)?.toUpperCase() || "?";
                const lastMessageAttachments = conv.lastMessage?.attachments || [];
                const lastMessagePreview =
                  conv.lastMessage?.text ||
                  (lastMessageAttachments.length > 0
                    ? `${lastMessageAttachments[0].type || "Media"} attachment`
                    : "No messages yet");

                return (
                  <button
                    key={conv._id}
                    onClick={() =>
                      handleStartChat(otherUser?._id, conv._id)
                    }
                    className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${isActive
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                      }`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                      {initial}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {otherUser?.name || "Unknown user"}
                        </h3>
                        {unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>

                      <p className={`mt-1 truncate text-sm ${unreadCount > 0 ? "font-medium text-slate-900" : "text-slate-500"}`}>
                        {lastMessagePreview}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className={`${id ? "flex" : "hidden lg:flex"} h-full flex-1 flex-col bg-slate-50`}>
            {id ? (
              <ChatPage />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center">
                <div>
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white shadow-sm" />
                  <p className="text-base font-semibold text-slate-800">
                    Select a conversation
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-slate-500">
                    Pick a thread from the left to view messages, read receipts, and replies.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Inbox;
