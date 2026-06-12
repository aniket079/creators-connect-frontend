import { useEffect, useState } from "react";
import { getSellerOrders, updateSellerOrderStatus } from "../api/assetApi";
import { errorToast, successToast } from "../utils/toast";

const orderStatuses = ["placed", "packed", "shipped", "delivered", "cancelled"];

const getAssetMediaUrl = (asset) => asset?.thumbnailUrl || asset?.previewUrl || asset?.url;

const getAssetPlaybackUrl = (asset) => asset?.previewUrl || asset?.url;

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [digitalOrders, setDigitalOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState("");
  const [drafts, setDrafts] = useState({});
  const activePhysicalOrders = orders.filter(
    (order) => !["delivered", "cancelled"].includes(order.orderStatus)
  ).length;
  const deliveredOrders = orders.filter((order) => order.orderStatus === "delivered").length;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getSellerOrders();
      const nextOrders = data.orders || data || [];
      const nextDigitalOrders = data.digitalOrders || [];
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      setDigitalOrders(Array.isArray(nextDigitalOrders) ? nextDigitalOrders : []);
      setDrafts(
        Object.fromEntries(
          (Array.isArray(nextOrders) ? nextOrders : []).map((order) => [
            order._id,
            {
              orderStatus: order.orderStatus || "placed",
              trackingNumber: order.trackingNumber || "",
              trackingUrl: order.trackingUrl || ""
            }
          ])
        )
      );
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to load seller orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateDraft = (orderId, field, value) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderId]: {
        ...currentDrafts[orderId],
        [field]: value
      }
    }));
  };

  const saveOrder = async (orderId) => {
    try {
      setSavingOrderId(orderId);
      await updateSellerOrderStatus(orderId, drafts[orderId]);
      successToast("Order updated");
      fetchOrders();
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to update order");
    } finally {
      setSavingOrderId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-950 p-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">
          Fulfillment
        </p>
        <h2 className="mt-2 text-3xl font-black">Seller Orders</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Manage delivery status, tracking details, and digital sales for orders placed on your artworks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Physical orders", orders.length],
          ["Active fulfillment", activePhysicalOrders],
          ["Delivered", deliveredOrders],
          ["Digital sales", digitalOrders.length]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
                <div className="h-28 animate-pulse rounded-lg bg-slate-200" />
                <div className="space-y-3">
                  <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="h-20 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && digitalOrders.length === 0 && (
        <div className="cc-panel rounded-lg px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-900">No seller orders yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Once buyers purchase your assets, physical fulfillment and digital sales records will appear here.
          </p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-black text-slate-950">Physical Deliveries</h3>
            <p className="mt-1 text-sm text-slate-500">
              Update shipping status and tracking details for physical artwork.
            </p>
          </div>

          {orders.map((order) => {
            const asset = order.asset || {};
            const draft = drafts[order._id] || {};

            return (
              <div key={order._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-lg">
                <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
                  {asset.type === "video" ? (
                    <video
                      src={getAssetPlaybackUrl(asset)}
                      poster={asset.thumbnailUrl}
                      className="h-28 w-full rounded-lg object-cover"
                      muted
                      loop
                      playsInline
                      autoPlay
                      controls={false}
                      controlsList="nodownload noplaybackrate nofullscreen"
                      disablePictureInPicture
                    />
                  ) : asset.type === "audio" ? (
                    <div className="flex h-28 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold uppercase tracking-wide text-teal-200">
                      Audio
                    </div>
                  ) : (
                    <img
                      src={getAssetMediaUrl(asset)}
                      alt={asset.title || "Order asset"}
                      className="h-28 w-full rounded-lg object-cover"
                    />
                  )}

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {asset.title || "Artwork order"}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Buyer: {order.buyer?.name || order.shippingAddress?.fullName || "Buyer"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Payment: {order.paymentStatus || "pending"}
                      </p>
                    </div>

                    {order.shippingAddress && (
                      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">
                          {order.shippingAddress.fullName}
                        </p>
                        <p>
                          {order.shippingAddress.addressLine1}
                          {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
                        </p>
                        <p>
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </p>
                        <p>{order.shippingAddress.phone}</p>
                      </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-3">
                      <select
                        value={draft.orderStatus || "placed"}
                        onChange={(event) => updateDraft(order._id, "orderStatus", event.target.value)}
                        className="cc-input"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <input
                        value={draft.trackingNumber || ""}
                        onChange={(event) => updateDraft(order._id, "trackingNumber", event.target.value)}
                        placeholder="Tracking number"
                        className="cc-input"
                      />
                      <input
                        value={draft.trackingUrl || ""}
                        onChange={(event) => updateDraft(order._id, "trackingUrl", event.target.value)}
                        placeholder="Tracking URL"
                        className="cc-input"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => saveOrder(order._id)}
                      disabled={savingOrderId === order._id}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {savingOrderId === order._id ? "Saving..." : "Update Order"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {!loading && digitalOrders.length > 0 && (
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-black text-slate-950">Digital Sales</h3>
            <p className="mt-1 text-sm text-slate-500">
              Downloadable purchases are completed automatically after payment.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {digitalOrders.map((order) => {
              const asset = order.asset || {};
              const pricingOption = order.pricingOption || order.pricingOptionId;

              return (
                <div key={order._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
                    {asset.type === "audio" ? (
                      <div className="flex h-24 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold uppercase tracking-wide text-teal-200">
                        Audio
                      </div>
                    ) : asset.type === "video" ? (
                      <video
                        src={getAssetPlaybackUrl(asset)}
                        poster={asset.thumbnailUrl}
                        className="h-24 w-full rounded-lg object-cover"
                        muted
                        loop
                        playsInline
                        autoPlay
                        controls={false}
                        controlsList="nodownload noplaybackrate nofullscreen"
                        disablePictureInPicture
                      />
                    ) : (
                      <img
                        src={getAssetMediaUrl(asset)}
                        alt={asset.title || "Digital asset"}
                        className="h-24 w-full rounded-lg object-cover"
                      />
                    )}

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="truncate font-semibold text-slate-950">
                          {asset.title || "Digital sale"}
                        </h4>
                        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                          Digital
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        Buyer: {order.buyer?.name || "Buyer"}
                      </p>
                      {pricingOption?.title && (
                        <p className="mt-1 text-sm text-slate-500">
                          {pricingOption.title}
                          {pricingOption.licenseType ? ` - ${pricingOption.licenseType}` : ""}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          Payment: {order.paymentStatus || "pending"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          {order.orderStatus || "completed"}
                        </span>
                        {order.amount && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            Rs. {order.amount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default SellerOrders;
