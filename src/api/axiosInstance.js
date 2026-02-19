import axios from "axios";
import { errorToast } from "../utils/toast";
import { loginUser } from "./authApi";
const axiosInstance = axios.create({
  baseURL: "https://creators-connect-backend.onrender.com/api",
  withCredentials: true
});

/*
   RESPONSE INTERCEPTOR
 */

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {

    // Optional: handle global 401 here
    if (error.response?.status === 401) {
      errorToast("Unauthorized request")
      loginUser();
      console.log("Unauthorized request");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
