import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  createAssetPurchaseOrder,
  getAssetById,
  verifyAssetPurchase
} from "../api/assetApi";
import { createAddress, getAddresses } from "../api/userApi";
import { errorToast, successToast } from "../utils/toast";

const getGalleryItem = (image, fallbackType = "image") => {
  if (typeof image === "string") {
    return {
      url: image,
      previewUrl: image,
      thumbnailUrl: image,
      type: fallbackType
    };
  }

  return {
    ...image,
    url: image?.url,
    previewUrl: image?.previewUrl || image?.thumbnailUrl || image?.url,
    thumbnailUrl: image?.thumbnailUrl || image?.previewUrl || image?.url,
    type: image?.type || fallbackType
  };
};

const getOwnerImage = (owner) => owner?.avatar || owner?.profileImage;

const getOwnerRole = (owner) => owner?.profession || owner?.category || owner?.title;

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: true
};

const AssetDetail = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id || user?.id;

  const [asset, setAsset] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [isGalleryPlaying, setIsGalleryPlaying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [buyingOptionId, setBuyingOptionId] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [checkoutOption, setCheckoutOption] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAsset = async () => {
      try {
        setLoading(true);
        const data = await getAssetById(assetId);
        const nextAsset = data.asset || data;

        if (isMounted) {
          setAsset(nextAsset);
          setSelectedImage(nextAsset.previewUrl || nextAsset.thumbnailUrl || nextAsset.url);
        }
      } catch (error) {
        errorToast(error.response?.data?.message || "Unable to load asset");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAsset();

    return () => {
      isMounted = false;
    };
  }, [assetId]);

  const galleryItems = useMemo(() => {
    if (!asset) return [];

    const mainItem = getGalleryItem(asset, asset.type || "image");
    const gallery = (asset.gallery || []).map((image) => getGalleryItem(image));

    return [mainItem, ...gallery].filter((item) => item.previewUrl || item.url);
  }, [asset]);

  const galleryImages = useMemo(
    () => galleryItems.map((item) => item.previewUrl || item.url).filter(Boolean),
    [galleryItems]
  );

  const selectedGalleryIndex = useMemo(() => {
    const nextIndex = galleryImages.indexOf(selectedImage);

    return nextIndex >= 0 ? nextIndex : 0;
  }, [galleryImages, selectedImage]);

  const selectedGalleryItem = galleryItems[selectedGalleryIndex] || galleryItems[0];

  useEffect(() => {
    if (!galleryImages.length || galleryImages.includes(selectedImage)) return;

    setSelectedImage(galleryImages[0]);
  }, [galleryImages, selectedImage]);

  useEffect(() => {
    if (galleryImages.length <= 1 || !isGalleryPlaying) return;

    const intervalId = window.setInterval(() => {
      setSelectedImage((currentImage) => {
        const currentIndex = galleryImages.indexOf(currentImage);
        const nextIndex =
          currentIndex >= 0 ? (currentIndex + 1) % galleryImages.length : 0;

        return galleryImages[nextIndex];
      });
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [galleryImages, isGalleryPlaying]);

  const pricingOptions = asset?.pricingOptions || [];
  const owner = asset?.owner && typeof asset.owner === "object" ? asset.owner : null;
  const ownerId = owner?._id || asset?.owner;
  const ownerImage = getOwnerImage(owner);
  const ownerRole = getOwnerRole(owner);
  const isOwner = ownerId?.toString() === userId?.toString();
  const isPhysicalAsset = Boolean(asset?.isPhysical);

  const fetchAddresses = async () => {
    try {
      const data = await getAddresses();
      const nextAddresses = data.addresses || data || [];
      setAddresses(nextAddresses);
      setSelectedAddressId(
        nextAddresses.find((address) => address.isDefault)?._id ||
          nextAddresses[0]?._id ||
          ""
      );
      return nextAddresses;
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to load addresses");
      return [];
    }
  };

  const openCheckout = async (pricingOption) => {
    if (isPhysicalAsset && asset.shippingAvailable === false) {
      return;
    }

    if (!isPhysicalAsset) {
      await startPayment(pricingOption);
      return;
    }

    setCheckoutOption(pricingOption);

    await fetchAddresses();
  };

  const validateAddressForm = () =>
    addressForm.fullName &&
    addressForm.phone &&
    addressForm.addressLine1 &&
    addressForm.city &&
    addressForm.state &&
    addressForm.postalCode &&
    addressForm.country;

  const handleCreateCheckoutAddress = async (event) => {
    event.preventDefault();

    if (!validateAddressForm()) {
      errorToast("Please fill all required address fields");
      return;
    }

    try {
      setSavingAddress(true);
      await createAddress(addressForm);
      setAddressForm(emptyAddress);
      await fetchAddresses();
      successToast("Address saved");
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const startPayment = async (pricingOption, addressId) => {
    if (!pricingOption) {
      errorToast("Please select a pricing option");
      return;
    }

    if (isPhysicalAsset && !addressId) {
      errorToast("Please select a delivery address");
      return;
    }

    if (!window.Razorpay) {
      errorToast("Payment checkout is not available. Please try again later.");
      return;
    }

    try {
      setBuyingOptionId(pricingOption._id);
      const order = await createAssetPurchaseOrder({
        assetId,
        pricingOptionId: pricingOption._id,
        addressId: isPhysicalAsset ? addressId : undefined
      });

      const razorpay = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "CreatorConnect",
        description: "Asset purchase",
        handler: async function (response) {
          const verifiedOrder = await verifyAssetPurchase({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            purchaseId: order.purchaseId
          });
          const deliveryType =
            verifiedOrder?.order?.deliveryType ||
            verifiedOrder?.purchase?.deliveryType ||
            verifiedOrder?.deliveryType;

          successToast(
            deliveryType === "digital"
              ? "Purchase complete. Your download is ready."
              : "Order placed successfully"
          );
          navigate("/purchases");
        },
        theme: {
          color: "#2563eb"
        }
      });

      razorpay.open();
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to start purchase");
    } finally {
      setBuyingOptionId("");
    }
  };

  const handleBuy = async () => {
    await startPayment(checkoutOption, selectedAddressId);
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading asset...</div>;
  }

  if (!asset) {
    return <div className="text-sm text-slate-500">Asset not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={() => navigate(`/assets/${asset._id}/edit`)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Edit Asset
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div>
          <div className="group relative overflow-hidden rounded-lg bg-slate-950 shadow-xl shadow-slate-950/10">
            {selectedGalleryItem?.type === "video" ? (
              <video
                src={selectedGalleryItem.previewUrl || selectedGalleryItem.url}
                poster={selectedGalleryItem.thumbnailUrl}
                muted
                loop
                playsInline
                autoPlay
                controls={false}
                controlsList="nodownload noplaybackrate nofullscreen"
                disablePictureInPicture
                className="max-h-[560px] w-full bg-black object-contain"
              />
            ) : selectedGalleryItem?.type === "audio" ? (
              <div className="flex min-h-[360px] flex-col justify-between bg-slate-950 p-6 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
                    Audio Preview
                  </p>
                  <h2 className="mt-3 text-3xl font-black">
                    {asset.title}
                  </h2>
                </div>
                {selectedGalleryItem.thumbnailUrl && (
                  <img
                    src={selectedGalleryItem.thumbnailUrl}
                    alt=""
                    className="my-6 max-h-60 rounded-lg object-contain"
                  />
                )}
                <audio
                  src={selectedGalleryItem.previewUrl || selectedGalleryItem.url}
                  controls
                  className="w-full"
                />
              </div>
            ) : (
              <img
                src={selectedGalleryItem?.previewUrl || selectedImage || asset.url}
                alt={asset.title}
                className="max-h-[560px] w-full bg-slate-100 object-contain"
              />
            )}

            {selectedGalleryItem?.type === "video" && (
              <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm">
                Video Preview
              </div>
            )}

            {galleryImages.length > 1 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-slate-950/80 to-transparent p-4 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                    {isGalleryPlaying ? "Auto Gallery" : "Gallery Paused"}
                  </p>
                  <p className="text-sm font-bold">
                    {selectedGalleryIndex + 1} / {galleryImages.length}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {galleryImages.map((imageUrl, index) => (
                    <span
                      key={imageUrl}
                      className={`h-1.5 rounded-full transition-all ${
                        index === selectedGalleryIndex
                          ? "w-8 bg-white"
                          : "w-2 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => setIsGalleryPlaying((isPlaying) => !isPlaying)}
                className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-white"
              >
                {isGalleryPlaying ? "Pause" : "Play"}
              </button>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {galleryItems.slice(0, 5).map((galleryItem) => {
                const imageUrl = galleryItem.previewUrl || galleryItem.url;

                return (
                <button
                  key={imageUrl}
                  type="button"
                  onClick={() => setSelectedImage(imageUrl)}
                  className={`overflow-hidden rounded-lg border ${
                    selectedImage === imageUrl
                      ? "border-blue-600 ring-4 ring-blue-100"
                      : "border-slate-200"
                  }`}
                >
                  {galleryItem.type === "video" ? (
                    <video
                      src={imageUrl}
                      className="h-24 w-full object-cover"
                      muted
                      playsInline
                      controls={false}
                      controlsList="nodownload noplaybackrate nofullscreen"
                      disablePictureInPicture
                    />
                  ) : galleryItem.type === "audio" ? (
                    <div className="flex h-24 items-center justify-center bg-slate-950 text-xs font-bold uppercase tracking-wide text-teal-200">
                      Audio
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-24 w-full object-cover"
                    />
                  )}
                </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-slate-950 p-6 text-white">
            <h1 className="text-3xl font-black text-white">
              {asset.title}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              By {asset.owner?.name || "Creator"}
            </p>
            {asset.description && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                {asset.description}
              </p>
            )}
            {asset.isPhysical && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {asset.category || "Physical artwork"}
                </p>
                {asset.dimensions && (
                  <p className="mt-1">
                    Size: {asset.dimensions.width || "-"} x {asset.dimensions.height || "-"} x {asset.dimensions.depth || "-"} {asset.dimensions.unit || ""}
                  </p>
                )}
                {asset.weight && (
                  <p>
                    Weight: {asset.weight.value || "-"} {asset.weight.unit || ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {owner && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-4">
                {ownerImage ? (
                  <img
                    src={ownerImage}
                    alt={owner.name || "Artist"}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                    {(owner.name || "A").slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Artist
                  </p>
                  <h2 className="mt-1 truncate text-lg font-bold text-slate-950">
                    {owner.name || "Creator"}
                  </h2>
                  {owner.username && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      @{owner.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {ownerRole && <p>{ownerRole}</p>}
                {owner.location && <p>{owner.location}</p>}
                {Number.isFinite(Number(owner.assetCount)) && (
                  <p>
                    {owner.assetCount} artwork{Number(owner.assetCount) === 1 ? "" : "s"}
                  </p>
                )}
                {owner.bio && (
                  <p className="line-clamp-3 leading-6">
                    {owner.bio}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/artists/${owner._id}`)}
                disabled={!owner._id}
                className="mt-4 w-full rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                View Artist Profile
              </button>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">
              Pricing
            </h2>

            {pricingOptions.length === 0 && (
              <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
                Not available for purchase.
              </p>
            )}

            {pricingOptions.map((option) => (
              <div key={option._id || option.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {option.title}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      {option.licenseType}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-slate-950">
                    Rs. {option.price}
                  </p>
                </div>

                {option.description && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {option.description}
                  </p>
                )}

                {!isOwner && (
                  asset.isPhysical && asset.shippingAvailable === false ? (
                    <p className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-center text-sm font-medium text-slate-600">
                      Shipping not available
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCheckout(option)}
                      disabled={buyingOptionId === option._id}
                      className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {buyingOptionId === option._id ? "Opening..." : "Buy"}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {checkoutOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-950">
                Delivery Address
              </h2>
              <button
                type="button"
                onClick={() => setCheckoutOption(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {addresses.length > 0 && (
              <div className="mt-4 space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address._id}
                    className={`block cursor-pointer rounded-lg border p-4 ${
                      selectedAddressId === address._id ? "border-blue-600" : "border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="checkoutAddress"
                      checked={selectedAddressId === address._id}
                      onChange={() => setSelectedAddressId(address._id)}
                      className="mr-2"
                    />
                    <span className="font-semibold text-slate-950">{address.fullName}</span>
                    <p className="mt-1 text-sm text-slate-600">
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                    </p>
                    <p className="text-sm text-slate-600">
                      {address.city}, {address.state} {address.postalCode}, {address.country}
                    </p>
                  </label>
                ))}
              </div>
            )}

            <form onSubmit={handleCreateCheckoutAddress} className="mt-5 space-y-3">
              <h3 className="font-semibold text-slate-950">
                {addresses.length > 0 ? "Add another address" : "Add delivery address"}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["fullName", "Full name"],
                  ["phone", "Phone"],
                  ["addressLine1", "Address line 1"],
                  ["addressLine2", "Address line 2"],
                  ["city", "City"],
                  ["state", "State"],
                  ["postalCode", "Postal code"],
                  ["country", "Country"]
                ].map(([field, label]) => (
                  <input
                    key={field}
                    value={addressForm[field]}
                    onChange={(event) =>
                      setAddressForm({ ...addressForm, [field]: event.target.value })
                    }
                    placeholder={label}
                    className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    required={field !== "addressLine2"}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={savingAddress}
                className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingAddress ? "Saving..." : "Save Address"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleBuy}
              disabled={!selectedAddressId || buyingOptionId === checkoutOption._id}
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {buyingOptionId === checkoutOption._id ? "Opening payment..." : "Continue to Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetail;
