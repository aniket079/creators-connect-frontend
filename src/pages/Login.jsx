import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import Button from "../components/Button";
import useAuth from "../hooks/useAuth";
import { errorToast, successToast } from "../utils/toast";

const demoCredentials = {
  userId: "seed-demo-user",
  email: "isha.photographer@test.com",
  password: "Test@12345"
};

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

  const fillDemoCredentials = () => {
    setFormData({
      email: demoCredentials.email,
      password: demoCredentials.password
    });
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

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="h-28 rounded-lg bg-blue-500/80" />
              <div className="h-28 rounded-lg bg-teal-400/80" />
              <div className="h-28 rounded-lg bg-slate-700" />
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-teal-200">
                Demo account
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Use the seeded demo user to preview marketplace, orders, chat, purchases, and recommendations.
              </p>
            </div>
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
              value={formData.email}
              placeholder="Email"
              onChange={handleChange}
              className="cc-input"
            />

            <input
              name="password"
              type="password"
              value={formData.password}
              placeholder="Password"
              onChange={handleChange}
              className="cc-input"
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">
                  Demo login
                </p>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p>User ID: {demoCredentials.userId}</p>
                  <p>Email: {demoCredentials.email}</p>
                  <p>Password: {demoCredentials.password}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Use Demo
              </button>
            </div>
          </div>

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
