import axiosInstance from "./axiosInstance";

/* =========================
   CREATE ASSET
========================= */

export const createAsset = async (formData) => {
  const res = await axiosInstance.post("/assets", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return res.data;
};

/* =========================
   GET ASSETS
========================= */

export const getPublicAssets = async (params) => {
  const res = await axiosInstance.get("/assets", { params });
  return res.data;
};

export const getMyAssets = async (params) => {
  const res = await axiosInstance.get("/assets/my", { params });
  return res.data;
};

export const getAssetById = async (assetId) => {
  const res = await axiosInstance.get(`/assets/${assetId}`);
  return res.data;
};

export const getArtistById = async (artistId) => {
  const res = await axiosInstance.get(`/artists/${artistId}`);
  return res.data;
};

export const getArtistAssets = async (artistId, params) => {
  const res = await axiosInstance.get(`/artists/${artistId}/assets`, { params });
  return res.data;
};

export const updateAsset = async (assetId, formData) => {
  const res = await axiosInstance.patch(`/assets/${assetId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return res.data;
};

export const createAssetPurchaseOrder = async ({ assetId, pricingOptionId, addressId }) => {
  const payload = {
    assetId,
    pricingOptionId
  };

  if (addressId) {
    payload.addressId = addressId;
  }

  const res = await axiosInstance.post("/payment/asset/create-order", payload);

  return res.data;
};

export const verifyAssetPurchase = async (payload) => {
  const res = await axiosInstance.post("/payment/asset/verify", payload);
  return res.data;
};

export const getMyPurchasedAssets = async () => {
  const res = await axiosInstance.get("/assets/purchases/my");
  return res.data;
};

export const getPurchaseDownload = async (purchaseId) => {
  const res = await axiosInstance.get(`/purchases/${purchaseId}/download`);
  return res.data;
};

export const getSellerOrders = async () => {
  const res = await axiosInstance.get("/assets/orders/seller");
  return res.data;
};

export const updateSellerOrderStatus = async (orderId, payload) => {
  const res = await axiosInstance.patch(`/assets/orders/${orderId}/status`, payload);
  return res.data;
};
