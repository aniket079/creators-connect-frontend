import { useContext, useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import Confetti from "react-confetti";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import AuthContext from "../context/AuthContextStore";
import { errorToast, successToast } from "../utils/toast";

const BuyTokens = () => {
  const [plans, setPlans] = useState([]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [buyingPlanId, setBuyingPlanId] = useState("");
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);

  useEffect(() => {
    let isMounted = true;

    axiosInstance
      .get("/plans")
      .then((res) => {
        if (isMounted) {
          setPlans(res.data);
        }
      })
      .catch((error) => {
        errorToast(error.response?.data?.message || "Unable to load token plans");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBuy = async (planId) => {
    if (!window.Razorpay) {
      errorToast("Payment checkout is not available. Please try again later.");
      return;
    }

    try {
      setBuyingPlanId(planId);
      const res = await axiosInstance.post("/payment/create-order", {
        planId
      });

      const order = res.data;
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "CreatorConnect",
        description: "Buy Tokens",
        theme: {
          color: "#2563eb"
        },
        handler: async function (response) {
          try {
            await axiosInstance.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              orderId: order.orderId
            });

            await refreshUser();
            setPaymentSuccess(true);
            successToast("Tokens added successfully");

            setTimeout(() => {
              navigate("/dashboard");
            }, 4000);
          } catch (error) {
            errorToast(error.response?.data?.message || "Payment verification failed");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        errorToast(response.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to start payment");
    } finally {
      setBuyingPlanId("");
    }
  };

  return (
    <div className="cc-page-shell relative min-h-screen overflow-hidden px-4 py-12 sm:px-6">
      {paymentSuccess && <Confetti numberOfPieces={400} />}

      <div className="mx-auto max-w-6xl">
        <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Token wallet
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight text-slate-950 md:text-5xl">
              Recharge tokens for smoother creator conversations.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              Pick a plan, complete checkout in Razorpay test mode, and your balance will refresh after verification.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-950">
              Testing Razorpay?
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use the Razorpay test checkout options. Manual UPI test IDs only work inside Razorpay checkout, not external Paytm or UPI apps.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => {
            const isPopular = index === 1;

            return (
              <Motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`relative overflow-hidden rounded-lg border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  isPopular ? "border-blue-500 ring-4 ring-blue-100" : "border-slate-200"
                }`}
              >
                {isPopular && (
                  <div className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                  {plan.tokens}
                </div>

                <h2 className="mt-6 text-xl font-black text-slate-950">
                  {plan.name}
                </h2>

                <p className="mt-3 text-4xl font-black text-blue-600">
                  Rs. {plan.price}
                </p>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  {plan.tokens} Tokens
                </p>

                {plan.bonusTokens > 0 && (
                  <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                    +{plan.bonusTokens} bonus tokens
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => handleBuy(plan._id)}
                  disabled={buyingPlanId === plan._id}
                  className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {buyingPlanId === plan._id ? "Opening..." : "Buy Now"}
                </button>
              </Motion.div>
            );
          })}
        </div>
      </div>

      {paymentSuccess && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
        >
          <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700">
              OK
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Payment Successful
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your tokens have been added successfully.
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Go To Dashboard
            </button>
          </div>
        </Motion.div>
      )}
    </div>
  );
};

export default BuyTokens;
