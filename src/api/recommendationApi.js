import axiosInstance from "./axiosInstance";

export const trackActivity = async ({ type, targetType, targetId }) => {
  const res = await axiosInstance.post("/recommendations/activity", {
    type,
    targetType,
    targetId
  });

  return res.data;
};

export const getRecommendedAssets = async (limit = 10, options = {}) => {
  const res = await axiosInstance.get("/recommendations/assets", {
    params: {
      limit,
      ai: options.ai
    }
  });

  return res.data;
};

export const getRecommendedCreators = async (limit = 10, options = {}) => {
  const res = await axiosInstance.get("/recommendations/creators", {
    params: {
      limit,
      ai: options.ai
    }
  });

  return res.data;
};
