import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getCurrentUser, logoutUser } from "../api/authApi";
import { clearUser, setUser as setReduxUser } from "../store/slices/authSlice";
import AuthContext from "./AuthContextStore";
import { normalizeAuthUser } from "../utils/user";

export const AuthProvider = ({ children }) => {

  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const setAuthenticatedUser = useCallback((user) => {
    dispatch(setReduxUser(normalizeAuthUser(user)));
  }, [dispatch]);

  const clearAuthenticatedUser = useCallback(() => {
    dispatch(clearUser());
  }, [dispatch]);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      setAuthenticatedUser(data);
      return data;
    } catch {
      clearAuthenticatedUser();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearAuthenticatedUser, setAuthenticatedUser]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      clearAuthenticatedUser();
    }
  }, [clearAuthenticatedUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthenticatedUser();
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [clearAuthenticatedUser]);

  return (
    <AuthContext.Provider
      value={{
        loading,
        refreshUser,
        setAuthenticatedUser,
        clearAuthenticatedUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
