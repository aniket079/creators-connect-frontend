import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyPurchasedAssets, getPurchaseDownload } from "../api/assetApi";
import { errorToast } from "../utils/toast";

const getPurchaseAsset = (purchase) => purchase.asset || purchase.assetId || purchase;

const isDigitalPurchase = (purchase) => purchase.deliveryType === "digital";

const isDownloadReady = (purchase) =>
  (purchase.paymentStatus === "paid" || purchase.paymentStatus === "completed") &&
  purchase.canDownload === true;

const formatDuration = (duration) => {
  const totalSeconds = Number(duration);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatFileSize = (fileSize) => {
  const bytes = Number(fileSize);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getPreviewUrl = (asset) => asset?.thumbnailUrl || asset?.previewUrl || asset?.url;

const getPlaybackUrl = (asset) => asset?.previewUrl || asset?.url;

const getDownloadErrorMessage = (error) => {
  const status = error.response?.status;

  if (status === 400) return "This purchase is not downloadable.";
  if (status === 401) return "Please login again to download this purchase.";
  if (status === 402) return "Payment is not completed for this purchase.";
  if (status === 403) return "You do not have access to this download.";
  if (status === 404) return "Purchase not found.";

  return error.response?.data?.message || "Unable to download this purchase";
};

const Purchases = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPurchaseId, setDownloadingPurchaseId] = useState("");

  const digitalCount = purchases.filter((purchase) => isDigitalPurchase(purchase)).length;
  const physicalCount = purchases.length - digitalCount;
  const readyCount = purchases.filter((purchase) => isDownloadReady(purchase)).length;

  useEffect(() => {
    let isMounted = true;

    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const data = await getMyPurchasedAssets();
        const nextPurchases = data.orders || data.purchases || data.assets || data;

        if (isMounted) {
          setPurchases(Array.isArray(nextPurchases) ? nextPurchases : []);
        }
      } catch (error) {
        errorToast(error.response?.data?.message || "Unable to load purchases");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPurchases();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownload = async (purchase) => {
    try {
      setDownloadingPurchaseId(purchase._id);
      const data = await getPurchaseDownload(purchase._id);

      if (!data.downloadUrl) {
        errorToast("Download link is not available");
        return;
      }

      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      errorToast(getDownloadErrorMessage(error));
    } finally {
      setDownloadingPurchaseId("");
    }
  };

  const renderDigitalPreview = (asset) => {
    const previewUrl = getPreviewUrl(asset);

    if (asset?.type === "audio") {
      return (
        <div className="flex h-56 flex-col justify-between bg-slate-950 p-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
              Audio Preview
            </p>
            <h3 className="mt-3 line-clamp-2 text-xl font-black">
              {asset.title || "Audio asset"}
            </h3>
          </div>
          <audio src={getPlaybackUrl(asset)} controls className="w-full" />
        </div>
      );
    }

    if (asset?.type === "video") {
      return (
        <video
          src={getPlaybackUrl(asset)}
          poster={asset.thumbnailUrl}
          className="h-56 w-full bg-black object-cover"
          controls
        />
      );
    }

    return (
      <img
        src={previewUrl}
        alt={asset?.title || "Purchased asset"}
        className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-950 p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">
              Collection
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Purchased Assets
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Download digital media instantly or track physical artwork deliveries.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
          >
            Browse Assets
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total purchases", purchases.length],
          ["Digital files", digitalCount],
          ["Ready downloads", readyCount],
          ["Physical orders", physicalCount]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="h-56 animate-pulse bg-slate-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="h-9 w-full animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && purchases.length === 0 && (
        <div className="cc-panel rounded-lg px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-900">
            No purchased assets yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Your purchased digital downloads and physical artwork orders will appear here after checkout.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Browse Assets
          </button>
        </div>
      )}

      {!loading && purchases.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {purchases.map((purchase) => {
            const asset = getPurchaseAsset(purchase);
            const assetId = asset?._id || purchase.assetId;
            const pricingOption = purchase.pricingOption || purchase.pricingOptionId;
            const isDigital = isDigitalPurchase(purchase);
            const duration = formatDuration(asset?.duration);
            const fileSize = formatFileSize(asset?.fileSize);

            return (
              <div
                key={purchase._id || assetId}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                {isDigital ? (
                  renderDigitalPreview(asset)
                ) : asset?.type === "video" ? (
                  <video
                    src={getPlaybackUrl(asset)}
                    poster={asset?.thumbnailUrl}
                    className="h-56 w-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={getPreviewUrl(asset)}
                    alt={asset?.title || "Purchased asset"}
                    className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-950">
                      {asset?.title || "Purchased asset"}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        isDigital
                          ? "bg-teal-50 text-teal-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {isDigital ? "Digital" : "Physical"}
                    </span>
                  </div>

                  {pricingOption?.title && (
                    <p className="mt-1 text-sm text-slate-500">
                      {pricingOption.title}
                      {pricingOption.licenseType ? ` - ${pricingOption.licenseType}` : ""}
                    </p>
                  )}

                  {purchase.seller?.name && (
                    <p className="mt-2 text-sm text-slate-600">
                      Seller: {purchase.seller.name}
                    </p>
                  )}

                  {isDigital && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                      {asset?.format && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 uppercase">
                          {asset.format}
                        </span>
                      )}
                      {duration && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          {duration}
                        </span>
                      )}
                      {fileSize && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          {fileSize}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>Payment: {purchase.paymentStatus || "pending"}</p>
                    {isDigital ? (
                      <p>
                        Status:{" "}
                        {isDownloadReady(purchase)
                          ? "Available for download"
                          : "Download unavailable"}
                      </p>
                    ) : (
                      <p>Order: {purchase.orderStatus || "placed"}</p>
                    )}
                  </div>

                  {!isDigital && purchase.shippingAddress && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">
                        {purchase.shippingAddress.fullName}
                      </p>
                      <p>
                        {purchase.shippingAddress.addressLine1}
                        {purchase.shippingAddress.addressLine2 ? `, ${purchase.shippingAddress.addressLine2}` : ""}
                      </p>
                      <p>
                        {purchase.shippingAddress.city}, {purchase.shippingAddress.state} {purchase.shippingAddress.postalCode}
                      </p>
                    </div>
                  )}

                  {!isDigital && purchase.trackingNumber && (
                    <p className="mt-3 text-sm text-slate-600">
                      Tracking:{" "}
                      {purchase.trackingUrl ? (
                        <a
                          href={purchase.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {purchase.trackingNumber}
                        </a>
                      ) : (
                        purchase.trackingNumber
                      )}
                    </p>
                  )}

                  <div className="mt-4 grid gap-2">
                    {isDigital && isDownloadReady(purchase) && (
                      <button
                        type="button"
                        onClick={() => handleDownload(purchase)}
                        disabled={downloadingPurchaseId === purchase._id}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {downloadingPurchaseId === purchase._id ? "Preparing..." : "Download"}
                      </button>
                    )}

                    {assetId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/assets/${assetId}`)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View Asset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Purchases;
