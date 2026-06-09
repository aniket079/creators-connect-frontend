import axiosInstance from "./axiosInstance";


export const getConversations = async () => {
  const res = await axiosInstance.get("/chat");
  return res.data;
};


export const getMessages = async (conversationId) => {
  const res = await axiosInstance.get(`/chat/${conversationId}`);
  return res.data;
};

export const createConversation = async (receiverId) => {
  const res = await axiosInstance.post(
    "/chat/conversation",
    { receiverId }
  );
  return res.data;
};

export const markConversationRead = async (conversationId) => {
  const res = await axiosInstance.post(`/chat/${conversationId}/read`);
  return res.data;
};

export const uploadChatMedia = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post("/chat/media", formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return res.data.attachment;
};
