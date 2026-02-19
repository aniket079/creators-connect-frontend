import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { successToast, errorToast } from "../utils/toast";
import Button from "../components/Button";

const VerifyOtp = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

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

      setUser(data);
      successToast("Account created successfully!");

      navigate("/dashboard");

    } catch (error) {
      errorToast(error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-96">

        <h2 className="text-2xl font-semibold text-center mb-6">
          Verify OTP
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 text-center tracking-widest"
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
