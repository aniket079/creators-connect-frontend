import { useState } from "react";
import { sendOtp } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { successToast, errorToast } from "../utils/toast";
import Button from "../components/Button";

const Signup = () => {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendOtp({ email: formData.email });
      successToast("OTP sent to your email");

      navigate("/verify-otp", {
        state: formData
      });

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
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="name"
            placeholder="Name"
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>

        </form>
      </div>
    </div>
  );
};

export default Signup;
