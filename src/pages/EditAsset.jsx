import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAssetById, updateAsset } from "../api/assetApi";
import { errorToast, successToast } from "../utils/toast";

const emptyPricingOption = {
  title: "",
  description: "",
  price: "",
  licenseType: "personal"
};

const EditAsset = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [pricingOptions, setPricingOptions] = useState([emptyPricingOption]);
  const [isPhysical, setIsPhysical] = useState(false);
  const [category, setCategory] = useState("digital");
  const [dimensions, setDimensions] = useState({
    width: "",
    height: "",
    depth: "",
    unit: "cm"
  });
  const [weight, setWeight] = useState({
    value: "",
    unit: "kg"
  });
  const [shippingAvailable, setShippingAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAsset = async () => {
      try {
        setLoading(true);
        const data = await getAssetById(assetId);
        const asset = data.asset || data;

        if (!isMounted) return;

        setTitle(asset.title || "");
        setDescription(asset.description || "");
        setVisibility(asset.visibility || "public");
        setCoverPreview(asset.url || "");
        setGalleryPreviews((asset.gallery || []).map((image) => image.url || image));
        setIsPhysical(Boolean(asset.isPhysical));
        setCategory(asset.category || (asset.isPhysical ? "painting" : "digital"));
        setDimensions({
          width: asset.dimensions?.width || "",
          height: asset.dimensions?.height || "",
          depth: asset.dimensions?.depth || "",
          unit: asset.dimensions?.unit || "cm"
        });
        setWeight({
          value: asset.weight?.value || "",
          unit: asset.weight?.unit || "kg"
        });
        setShippingAvailable(asset.shippingAvailable !== false);
        setPricingOptions(
          asset.pricingOptions?.length
            ? asset.pricingOptions.map((option) => ({
                title: option.title || "",
                description: option.description || "",
                price: option.price || "",
                licenseType: option.licenseType || "personal"
              }))
            : [emptyPricingOption]
        );
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

  const handleCoverChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      errorToast("Only image or video files allowed");
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleGalleryChange = (files) => {
    const selectedFiles = Array.from(files || []).slice(0, 4);
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== selectedFiles.length) {
      errorToast("Gallery images must be image files");
    }

    setGalleryFiles(imageFiles);
    setGalleryPreviews(imageFiles.map((file) => URL.createObjectURL(file)));
  };

  const updatePricingOption = (index, field, value) => {
    setPricingOptions((currentOptions) =>
      currentOptions.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option
      )
    );
  };

  const addPricingOption = () => {
    setPricingOptions((currentOptions) => [...currentOptions, emptyPricingOption]);
  };

  const removePricingOption = (index) => {
    setPricingOptions((currentOptions) =>
      currentOptions.length === 1
        ? currentOptions
        : currentOptions.filter((_, optionIndex) => optionIndex !== index)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("visibility", visibility);
    formData.append("isPhysical", String(isPhysical));
    formData.append("category", category);
    formData.append("dimensions", JSON.stringify(dimensions));
    formData.append("weight", JSON.stringify(weight));
    formData.append("shippingAvailable", String(shippingAvailable));

    if (coverFile) {
      formData.append("file", coverFile);
    }

    galleryFiles.slice(0, 4).forEach((galleryFile) => {
      formData.append("gallery", galleryFile);
    });

    formData.append(
      "pricingOptions",
      JSON.stringify(
        pricingOptions
          .filter((option) => option.title || option.description || option.price)
          .map((option) => ({
            ...option,
            price: Number(option.price)
          }))
      )
    );

    try {
      setSaving(true);
      await updateAsset(assetId, formData);
      successToast("Asset updated successfully");
      navigate(`/assets/${assetId}`);
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to update asset");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading asset...</div>;
  }

  return (
    <div className="cc-panel mx-auto max-w-3xl rounded-lg p-6 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 rounded-lg bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">
            Creator studio
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Edit Asset
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Refine the presentation, pricing, and availability for this asset.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/assets/${assetId}`)}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Title"
        />

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows="4"
          className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Description"
        />

        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <div>
          <label className="mb-2 block font-medium">Cover Image</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(event) => handleCoverChange(event.target.files[0])}
            className="w-full rounded-lg border px-4 py-2"
          />
          {coverPreview && (
            <img
              src={coverPreview}
              alt="Cover preview"
              className="mt-3 max-h-56 rounded-lg object-contain"
            />
          )}
        </div>

        <div>
          <label className="mb-2 block font-medium">Gallery Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handleGalleryChange(event.target.files)}
            className="w-full rounded-lg border px-4 py-2"
          />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {galleryPreviews.slice(0, 4).map((preview) => (
              <img
                key={preview}
                src={preview}
                alt=""
                className="h-24 rounded-lg object-cover"
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={isPhysical}
              onChange={(event) => {
                setIsPhysical(event.target.checked);
                setCategory(event.target.checked ? "painting" : "digital");
              }}
            />
            Physical artwork
          </label>

          {isPhysical && (
            <div className="mt-4 space-y-4">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="painting">Painting</option>
                <option value="furniture">Furniture</option>
                <option value="sculpture">Sculpture</option>
                <option value="digital">Digital</option>
                <option value="other">Other</option>
              </select>

              <div className="grid gap-3 sm:grid-cols-4">
                <input
                  value={dimensions.width}
                  onChange={(event) => setDimensions({ ...dimensions, width: event.target.value })}
                  type="number"
                  min="0"
                  placeholder="Width"
                  className="rounded-lg border px-3 py-2"
                />
                <input
                  value={dimensions.height}
                  onChange={(event) => setDimensions({ ...dimensions, height: event.target.value })}
                  type="number"
                  min="0"
                  placeholder="Height"
                  className="rounded-lg border px-3 py-2"
                />
                <input
                  value={dimensions.depth}
                  onChange={(event) => setDimensions({ ...dimensions, depth: event.target.value })}
                  type="number"
                  min="0"
                  placeholder="Depth"
                  className="rounded-lg border px-3 py-2"
                />
                <select
                  value={dimensions.unit}
                  onChange={(event) => setDimensions({ ...dimensions, unit: event.target.value })}
                  className="rounded-lg border px-3 py-2"
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={weight.value}
                  onChange={(event) => setWeight({ ...weight, value: event.target.value })}
                  type="number"
                  min="0"
                  placeholder="Weight"
                  className="rounded-lg border px-3 py-2"
                />
                <select
                  value={weight.unit}
                  onChange={(event) => setWeight({ ...weight, unit: event.target.value })}
                  className="rounded-lg border px-3 py-2"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={shippingAvailable}
                  onChange={(event) => setShippingAvailable(event.target.checked)}
                />
                Shipping available
              </label>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Pricing Options</h3>
            <button
              type="button"
              onClick={addPricingOption}
              className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Add Pricing
            </button>
          </div>

          {pricingOptions.map((option, index) => (
            <div key={index} className="rounded-lg border border-slate-200 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={option.title}
                  onChange={(event) => updatePricingOption(index, "title", event.target.value)}
                  placeholder="Title"
                  className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={option.price}
                  onChange={(event) => updatePricingOption(index, "price", event.target.value)}
                  type="number"
                  min="0"
                  placeholder="Price"
                  className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={option.licenseType}
                  onChange={(event) => updatePricingOption(index, "licenseType", event.target.value)}
                  className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="personal">Personal</option>
                  <option value="commercial">Commercial</option>
                  <option value="exclusive">Exclusive</option>
                </select>
                <button
                  type="button"
                  onClick={() => removePricingOption(index)}
                  disabled={pricingOptions.length === 1}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={option.description}
                onChange={(event) => updatePricingOption(index, "description", event.target.value)}
                rows="2"
                placeholder="License description"
                className="mt-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditAsset;
