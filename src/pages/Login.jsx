import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import Button from "../components/Button";
import useAuth from "../hooks/useAuth";
import { errorToast, successToast } from "../utils/toast";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const { setAuthenticatedUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser(formData);
      setAuthenticatedUser(data);
      successToast("Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cc-page-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 lg:grid-cols-[1fr_0.85fr]">
        <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-sm font-black">
              CC
            </div>
            <h1 className="mt-8 text-4xl font-black leading-tight">
              Step back into your creator marketplace.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Manage assets, meet artists, and keep your creative conversations moving.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="h-28 rounded-lg bg-blue-500/80" />
            <div className="h-28 rounded-lg bg-teal-400/80" />
            <div className="h-28 rounded-lg bg-slate-700" />
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Welcome back
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Login
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Access your profile, tokens, assets, and messages.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="cc-input"
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              className="cc-input"
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-bold text-blue-600">
              Signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
