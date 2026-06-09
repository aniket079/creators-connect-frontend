import axios from "axios";
import { errorToast } from "../utils/toast";

const axiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://creators-connect-backend-1.onrender.com/api",
  withCredentials: true
});

/*
   RESPONSE INTERCEPTOR
 */

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthCheck = requestUrl.includes("/auth/me");
    const isAuthAction =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/logout") ||
      requestUrl.includes("/auth/verify-otp");

    if (error.response?.status === 401) {
      if (!isAuthCheck && !isAuthAction) {
        errorToast("Session expired. Please login again.");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:session-expired"));
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
