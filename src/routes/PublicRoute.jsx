import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useAuth from "../hooks/useAuth";

const PublicRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const { loading } = useAuth();

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
};

export default PublicRoute;
