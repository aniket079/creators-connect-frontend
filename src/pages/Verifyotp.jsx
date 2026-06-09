import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp } from "../api/authApi";
import useAuth from "../hooks/useAuth";
import { successToast, errorToast } from "../utils/toast";
import Button from "../components/Button";

const VerifyOtp = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const formData = location.state;

  if (!formData) {
    navigate("/signup");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await verifyOtp({
        ...formData,
        otp
      });

      setAuthenticatedUser(data);
      successToast("Account created successfully!");

      navigate("/dashboard", { replace: true });

    } catch (error) {
      errorToast(error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cc-page-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-950/10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
          OTP
        </div>

        <h2 className="mt-6 text-center text-3xl font-black text-slate-950">
          Verify OTP
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Enter the code sent to your email to activate your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">

          <input
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="cc-input text-center text-lg font-bold tracking-widest"
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </Button>

        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
