import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import useAuth from "../hooks/useAuth";

const getUserImage = (user) =>
  user?.avatar ||
  user?.profileImage ||
  user?.avatarUrl ||
  user?.image;

const navItems = [
  { to: "/dashboard", label: "Explore" },
  { to: "/inbox", label: "Inbox" },
  { to: "/purchases", label: "Purchases" },
  { to: "/seller-orders", label: "Orders" },
  { to: "/my-assets", label: "My Assets" },
  { to: "/about", label: "About" }
];

const Navbar = () => {
  const { logout } = useAuth();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const userImage = getUserImage(user);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20">
            CC
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-slate-950">
              CreatorConnect
            </p>
            <p className="hidden text-xs font-medium text-slate-500 sm:block">
              Marketplace for creator assets
            </p>
          </div>
        </Link>

        {user && (
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                to="/buy-tokens"
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
              >
                {user?.token ?? 0} Tokens
              </Link>
              <Link
                to="/create-asset"
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
              >
                Create Asset
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 hover:bg-slate-50"
              >
                {userImage ? (
                  <img
                    src={userImage}
                    alt={user.name || "User"}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                    {(user?.name || "U").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="max-w-28 truncate text-sm font-semibold text-slate-700">
                  {user.name}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-600">
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                Signup
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 lg:hidden"
        >
          Menu
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                {userImage ? (
                  <img
                    src={userImage}
                    alt={user.name || "User"}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-700">
                    {(user?.name || "U").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">{user.name}</p>
                  <p className="text-sm font-medium text-blue-700">
                    {user?.token ?? 0} Tokens
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {[...navItems, { to: "/buy-tokens", label: "Buy Tokens" }, { to: "/profile", label: "Profile" }].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={navLinkClass}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <Link
                to="/create-asset"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg bg-slate-950 px-4 py-2 text-center text-sm font-bold text-white"
              >
                Create Asset
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="grid gap-2">
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600">
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-bold text-white"
              >
                Signup
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
