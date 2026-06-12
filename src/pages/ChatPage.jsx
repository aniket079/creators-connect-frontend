import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addMessage,
  addOptimisticMessage,
  clearConversationUnread,
  markConversationMessagesRead,
  markMessageFailed,
  markMessagePending,
  removePendingMessagesForConversation,
  setMessages,
  upsertConversationLastMessage
} from "../store/slices/chatSlice";
import { getMessages, markConversationRead, uploadChatMedia } from "../api/chatApi";
import socket from "../socket/socket";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { errorToast } from "../utils/toast";
import { getUserImage, getUserTokenBalance } from "../utils/user";

const noTokensMessage = "No tokens left. Please recharge your tokens to continue chatting.";

const getSocketErrorMessage = (error) => {
  if (!error) return "";
  if (typeof error === "string") return error;

  return error.message || error.error || "";
};

const isNoTokensError = (error) => {
  const message = getSocketErrorMessage(error).toLowerCase();

  return (
    error?.code === "NO_TOKENS" ||
    error?.statusCode === 402 ||
    message.includes("no tokens") ||
    message.includes("insufficient tokens")
  );
};

const hasNoTokensLeft = (tokenCount) => {
  const tokens = Number(tokenCount);
  return Number.isFinite(tokens) && tokens <= 0;
};

const ChatPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const messages = useSelector((state) => state.chat.messages);
  const conversations = useSelector((state) => state.chat.conversations);
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id || user?.id;
  const tokenBalance = getUserTokenBalance(user);

  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [noTokensAlert, setNoTokensAlert] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pendingTimeoutsRef = useRef({});

  const createClientMessageId = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const getMessageConversationId = (message) =>
    message.conversation?._id || message.conversation || message.conversationId;

  const showNoTokensAlert = useCallback(() => {
    Object.values(pendingTimeoutsRef.current).forEach(clearTimeout);
    pendingTimeoutsRef.current = {};
    dispatch(removePendingMessagesForConversation({ conversationId: id, senderId: userId }));
    setNoTokensAlert(true);
  }, [dispatch, id, userId]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === id),
    [conversations, id]
  );

  const receiverId = useMemo(() => {
    if (!activeConversation) return location.state?.receiverId || null;

    return activeConversation.participants.find(
      (participant) => participant._id !== userId
    )?._id;
  }, [activeConversation, location.state?.receiverId, userId]);

  const otherUser = useMemo(() => {
    if (!activeConversation) return null;

    return activeConversation.participants.find(
      (participant) => participant._id !== userId
    );
  }, [activeConversation, userId]);
  const otherUserImage = getUserImage(otherUser);

  const markActiveConversationRead = useCallback(async () => {
    if (!id || !userId) return;

    dispatch(clearConversationUnread(id));
    dispatch(markConversationMessagesRead({ conversationId: id, readBy: userId }));

    try {
      await markConversationRead(id);

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit("mark_read", {
        conversationId: id,
        userId
      });
    } catch (error) {
      console.error("Unable to mark messages as read", error);
    }
  }, [dispatch, id, userId]);

  useEffect(() => {
    if (!id) return;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const data = await getMessages(id);
        dispatch(setMessages(data));
        markActiveConversationRead();
      } catch (error) {
        errorToast(error.response?.data?.message || "Unable to load messages");
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [dispatch, id, markActiveConversationRead]);

  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("register", userId);
  }, [userId]);

  useEffect(() => {
    const handleTyping = (payload) => {
      const senderId = payload?.senderId || payload;

      if (senderId?.toString() !== userId?.toString()) {
        setIsTyping(true);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 1500);
      }
    };

    socket.on("typing", handleTyping);

    return () => {
      socket.off("typing", handleTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId]);

  useEffect(() => {
    const handleMessage = (message) => {
      if (message.clientMessageId && pendingTimeoutsRef.current[message.clientMessageId]) {
        clearTimeout(pendingTimeoutsRef.current[message.clientMessageId]);
        delete pendingTimeoutsRef.current[message.clientMessageId];
      }

      if (getMessageConversationId(message) === id) {
        dispatch(addMessage(message));

        const messageReceiverId = message.receiver?._id || message.receiver;
        if (messageReceiverId?.toString() === userId?.toString()) {
          markActiveConversationRead();
        }
      }

      dispatch(upsertConversationLastMessage(message));
    };

    socket.on("message_sent", handleMessage);
    socket.on("receive_message", handleMessage);

    return () => {
      socket.off("message_sent", handleMessage);
      socket.off("receive_message", handleMessage);
    };
  }, [dispatch, id, markActiveConversationRead, userId]);

  useEffect(() => {
    const handleMessagesRead = (payload) => {
      dispatch(markConversationMessagesRead(payload));
    };

    socket.on("messages_read", handleMessagesRead);
    socket.on("messages_read_confirmed", handleMessagesRead);

    return () => {
      socket.off("messages_read", handleMessagesRead);
      socket.off("messages_read_confirmed", handleMessagesRead);
    };
  }, [dispatch]);

  useEffect(() => {
    const handleSocketError = (error) => {
      if (isNoTokensError(error)) {
        showNoTokensAlert();
        return;
      }

      errorToast(getSocketErrorMessage(error) || "Something went wrong while sending message.");
    };

    socket.on("error_message", handleSocketError);

    return () => {
      socket.off("error_message", handleSocketError);
    };
  }, [showNoTokensAlert]);

  useEffect(() => {
    const pendingTimeouts = pendingTimeoutsRef.current;

    return () => {
      Object.values(pendingTimeouts).forEach(clearTimeout);
    };
  }, []);

  const emitMessage = useCallback((message) => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("send_message", {
      senderId: message.sender,
      receiverId: message.receiver,
      conversationId: message.conversationId,
      clientMessageId: message.clientMessageId,
      text: message.text,
      attachments: message.attachments || []
    }, (response) => {
      if (pendingTimeoutsRef.current[message.clientMessageId]) {
        clearTimeout(pendingTimeoutsRef.current[message.clientMessageId]);
        delete pendingTimeoutsRef.current[message.clientMessageId];
      }

      if (response?.error) {
        if (isNoTokensError(response.error)) {
          showNoTokensAlert();
          return;
        }

        dispatch(markMessageFailed(message.clientMessageId));
        errorToast(getSocketErrorMessage(response.error) || "Something went wrong while sending message.");
        return;
      }

      if (response?.message) {
        if (getMessageConversationId(response.message) === id) {
          dispatch(addMessage(response.message));
        }

        dispatch(upsertConversationLastMessage(response.message));
      }
    });

    pendingTimeoutsRef.current[message.clientMessageId] = setTimeout(() => {
      dispatch(markMessageFailed(message.clientMessageId));
      delete pendingTimeoutsRef.current[message.clientMessageId];
    }, 10000);
  }, [dispatch, id, showNoTokensAlert]);

  const queueMessage = useCallback((messageText, messageAttachments = []) => {
    if ((!messageText && messageAttachments.length === 0) || !receiverId || !userId || !id) return;

    const clientMessageId = createClientMessageId();
    const optimisticMessage = {
      _id: clientMessageId,
      clientMessageId,
      conversationId: id,
      sender: userId,
      receiver: receiverId,
      text: messageText,
      attachments: messageAttachments,
      createdAt: new Date().toISOString(),
      status: "pending"
    };

    dispatch(addOptimisticMessage(optimisticMessage));
    dispatch(upsertConversationLastMessage(optimisticMessage));
    emitMessage(optimisticMessage);
  }, [dispatch, emitMessage, id, receiverId, userId]);

  const sendMessage = useCallback(() => {
    const messageText = text.trim();
    const messageAttachments = attachment ? [attachment] : [];
    if ((!messageText && messageAttachments.length === 0) || uploadingAttachment) return;

    if (hasNoTokensLeft(tokenBalance)) {
      showNoTokensAlert();
      return;
    }

    queueMessage(messageText, messageAttachments);
    setText("");
    setAttachment(null);
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [attachment, queueMessage, showNoTokensAlert, text, tokenBalance, uploadingAttachment]);

  const handleAttachmentChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isSupportedFile =
      file.type.startsWith("image/") ||
      file.type.startsWith("video/") ||
      file.type.startsWith("audio/");

    if (!isSupportedFile) {
      setUploadError("Please choose an image, video, or audio file.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingAttachment(true);
      setUploadError("");
      const uploadedAttachment = await uploadChatMedia(file);
      setAttachment(uploadedAttachment);
    } catch (error) {
      const message = error.response?.data?.message || "Unable to upload media. Please try again.";
      setUploadError(message);
      errorToast(message);
      event.target.value = "";
    } finally {
      setUploadingAttachment(false);
    }
  }, []);

  const retryMessage = useCallback((message) => {
    dispatch(markMessagePending(message.clientMessageId));
    emitMessage(message);
  }, [dispatch, emitMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, isTyping]);

  return (
    <div className="relative h-full">
      <div className={`flex h-full flex-col bg-slate-50 transition ${noTokensAlert ? "blur-sm" : ""}`}>
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => navigate("/inbox")}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 lg:hidden"
        >
          Back
        </button>

        {otherUserImage ? (
          <img
            src={otherUserImage}
            alt={otherUser?.name || "Creator"}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {otherUser?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-slate-950">
            {otherUser?.name || "Conversation"}
          </h2>
          <p className="text-xs text-slate-500">
            {isTyping ? "Typing..." : "Messages are private to this conversation"}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
        {loadingMessages && (
          <div className="text-center text-sm text-slate-500">
            Loading messages...
          </div>
        )}

        {!loadingMessages && messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-500 shadow-sm">
                Hi
              </div>
              <p className="text-sm font-medium text-slate-800">
                No messages yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Send the first message to start the conversation.
              </p>
            </div>
          </div>
        )}

        {!loadingMessages && messages.map((msg) => {
          const senderId = msg.sender?._id || msg.sender;
          const isSender = senderId?.toString() === userId?.toString();
          const attachments = msg.attachments || [];
          const isFailed = msg.status === "failed";
          const isPending = msg.status === "pending";

          const messageDate = new Date(msg.createdAt);
          const formattedTime = messageDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          });

          return (
            <div
              key={msg._id}
              className={`flex ${isSender ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[78%] sm:max-w-md">
                <div
                  className={`whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-6 shadow-sm ${isSender
                      ? isFailed
                        ? "rounded-2xl rounded-br-md bg-red-500 text-white"
                        : "rounded-2xl rounded-br-md bg-blue-600 text-white"
                      : "rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-800"
                    }`}
                >
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((item, index) => {
                        const key = item.publicId || item.url || index;

                        if (item.type === "image") {
                          return (
                            <img
                              key={key}
                              src={item.url}
                              alt={item.originalName || "Chat attachment"}
                              className="max-h-72 rounded-lg object-contain"
                            />
                          );
                        }

                        if (item.type === "video") {
                          return (
                            <video
                              key={key}
                              src={item.url}
                              controls
                              className="max-h-72 rounded-lg"
                            />
                          );
                        }

                        if (item.type === "audio") {
                          return (
                            <audio
                              key={key}
                              src={item.url}
                              controls
                              className="w-full"
                            />
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}
                  {msg.text && (
                    <div className={attachments.length > 0 ? "mt-2" : ""}>
                      {msg.text}
                    </div>
                  )}
                </div>

                <div
                  className={`mt-1 text-xs ${isSender
                      ? "text-right text-slate-400"
                      : "text-left text-slate-500"
                    }`}
                >
                  {formattedTime}
                  {isSender && isPending && " - Sending"}
                  {isSender && isFailed && " - Failed"}
                  {isSender && !isPending && !isFailed && msg.status === "read" && " - Read"}
                  {isSender && !isPending && !isFailed && msg.status !== "read" && " - Sent"}
                </div>

                {isSender && isFailed && (
                  <div className="mt-1 text-right">
                    <button
                      type="button"
                      onClick={() => retryMessage(msg)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="animate-pulse rounded-2xl rounded-bl-md bg-white px-4 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
              Typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
        {(uploadingAttachment || attachment || uploadError) && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {uploadingAttachment && (
              <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                Uploading media...
              </span>
            )}

            {!uploadingAttachment && attachment && (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                {attachment.originalName || `${attachment.type} attachment`}
              </span>
            )}

            {!uploadingAttachment && attachment && (
              <button
                type="button"
                onClick={() => {
                  setAttachment(null);
                  setUploadError("");
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Remove
              </button>
            )}

            {uploadError && (
              <span className="font-medium text-red-600">
                {uploadError}
              </span>
            )}
          </div>
        )}

        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleAttachmentChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAttachment}
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            aria-label="Attach media"
          >
            Attach
          </button>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);

              if (receiverId && userId) {
                socket.emit("typing", {
                  senderId: userId,
                  receiverId
                });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            className="max-h-28 min-h-11 flex-1 resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Type a message..."
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={uploadingAttachment || (!text.trim() && !attachment) || !receiverId}
            className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Send
          </button>
        </div>
      </div>
      </div>

      {noTokensAlert && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/35 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl"
          >
            <h3 className="text-base font-semibold text-slate-950">
              No tokens left
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {noTokensMessage}
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-5 h-11 w-full rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
