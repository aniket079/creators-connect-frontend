import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendOtp } from "../api/authApi";
import Button from "../components/Button";
import { errorToast, successToast } from "../utils/toast";

const demoCredentials = {
  userId: "seed-demo-user",
  email: "demo.creator@example.com",
  password: "Demo@12345"
};

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

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
      await sendOtp({ email: formData.email });
      successToast("OTP sent to your email");

      navigate("/verify-otp", {
        state: formData
      });
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoProfile = () => {
    setFormData({
      name: "Demo Creator",
      email: demoCredentials.email,
      password: demoCredentials.password
    });
  };

  return (
    <div className="cc-page-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 lg:grid-cols-[0.85fr_1fr]">
        <div className="p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">
            Join CreatorConnect
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Set up your creator profile and start publishing marketplace-ready work.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              name="name"
              value={formData.name}
              placeholder="Name"
              onChange={handleChange}
              className="cc-input"
            />

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
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>

          <div className="mt-5 rounded-lg border border-teal-100 bg-teal-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">
                  Demo seeded user
                </p>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p>User ID: {demoCredentials.userId}</p>
                  <p>Email: {demoCredentials.email}</p>
                  <p>Password: {demoCredentials.password}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemoProfile}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700"
              >
                Fill Demo
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-blue-600">
              Login
            </Link>
          </p>
        </div>

        <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-400 text-sm font-black text-slate-950">
              CC
            </div>
            <h1 className="mt-8 text-4xl font-black leading-tight">
              Build a public artist presence that buyers can trust.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Add your bio, upload assets, manage orders, and connect directly with interested users.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-blue-400" />
              <div>
                <p className="font-bold">Artist profile</p>
                <p className="text-sm text-slate-300">Portfolio, bio, and public works</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
