import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../api/authApi";
const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

const handleLogout = async () => {
  await logoutUser();
  setUser(null);
  navigate("/login");
};

  

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          CreatorConnect
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link to="/login" className="text-gray-700">
              Login
            </Link>
            <Link to="/signup" className="text-blue-600 font-medium">
              Signup
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
