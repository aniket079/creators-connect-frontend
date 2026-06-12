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
import { getUserImage } from "../utils/user";


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

  const handleViewCreatorProfile = (event, creatorId) => {
    event.stopPropagation();

    if (!creatorId) return;

    navigate(`/artists/${creatorId}`);
  };

  return (
    <Layout>
      <div className="space-y-5">
        <section className="rounded-lg bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-200">
                Communication hub
              </p>
              <h1 className="mt-2 text-3xl font-black">
                Inbox
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Manage conversations with buyers, creators, and collaborators from one focused workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
            >
              Explore Creators
            </button>
          </div>
        </section>

      <div className="h-[calc(100vh-14rem)] min-h-[640px]">
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
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-lg p-2">
                      <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && conversations.length === 0 && (
                <div className="flex h-full items-center justify-center px-8 text-center">
                  <div>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
                      CC
                    </div>
                    <p className="text-base font-black text-slate-950">
                      No conversations yet
                    </p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                      Start from an asset or creator profile to open your first chat thread.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard")}
                      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                    >
                      Browse Marketplace
                    </button>
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
                const otherUserImage = getUserImage(otherUser);
                const otherUserId = otherUser?._id || otherUser?.id;
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
                    <span
                      role="link"
                      tabIndex={0}
                      title="View creator profile"
                      onClick={(event) => handleViewCreatorProfile(event, otherUserId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          handleViewCreatorProfile(event, otherUserId);
                        }
                      }}
                      className="shrink-0 rounded-full outline-none ring-offset-2 focus:ring-2 focus:ring-blue-500"
                    >
                      {otherUserImage ? (
                        <img
                          src={otherUserImage}
                          alt={otherUser?.name || "Creator"}
                          className={`h-11 w-11 rounded-full object-cover ring-2 ${
                            isActive ? "ring-blue-200" : "ring-slate-100"
                          }`}
                        />
                      ) : (
                        <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                          {initial}
                        </span>
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          role="link"
                          tabIndex={0}
                          title="View creator profile"
                          onClick={(event) => handleViewCreatorProfile(event, otherUserId)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              handleViewCreatorProfile(event, otherUserId);
                            }
                          }}
                          className="truncate text-sm font-semibold text-slate-900 outline-none hover:text-blue-600 focus:text-blue-600"
                        >
                          {otherUser?.name || "Unknown user"}
                        </span>
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
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-black text-blue-700 shadow-sm">
                    CC
                  </div>
                  <p className="text-base font-black text-slate-950">
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
      </div>
    </Layout>
  );
};

export default Inbox;
