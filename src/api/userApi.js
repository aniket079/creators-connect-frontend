import axiosInstance from "./axiosInstance";

export const updateProfile = async (payload) => {
  const isFormData = payload instanceof FormData;

  const res = await axiosInstance.patch("/users/me", payload, {
    headers: isFormData
      ? {
          "Content-Type": "multipart/form-data"
        }
      : undefined
  });

  return res.data;
};

export const getAddresses = async () => {
  const res = await axiosInstance.get("/users/me/addresses");
  return res.data;
};

export const createAddress = async (address) => {
  const res = await axiosInstance.post("/users/me/addresses", address);
  return res.data;
};

export const updateAddress = async (addressId, address) => {
  const res = await axiosInstance.patch(`/users/me/addresses/${addressId}`, address);
  return res.data;
};

export const deleteAddress = async (addressId) => {
  const res = await axiosInstance.delete(`/users/me/addresses/${addressId}`);
  return res.data;
};

export const setDefaultAddress = async (addressId) => {
  const res = await axiosInstance.patch(`/users/me/addresses/${addressId}/default`);
  return res.data;
};
