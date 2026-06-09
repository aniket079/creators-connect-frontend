import { useState } from "react";
import { createAsset } from "../api/assetApi";
import { successToast, errorToast } from "../utils/toast";
import Button from "../components/Button";

const CreateAsset = () => {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("image");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewPreview, setPreviewPreview] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [pricingOptions, setPricingOptions] = useState([
    { title: "", description: "", price: "", licenseType: "personal" }
  ]);
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
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  /* =========================
     HANDLE FILE SELECT
  ========================= */

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    if (
      !selectedFile.type.startsWith("image/") &&
      !selectedFile.type.startsWith("video/") &&
      !selectedFile.type.startsWith("audio/")
    ) {
      errorToast("Only image, video, or audio files allowed");
      return;
    }

    setFile(selectedFile);
    setFilePreview(URL.createObjectURL(selectedFile));

    if (selectedFile.type.startsWith("video/")) {
      setType("video");
    } else if (selectedFile.type.startsWith("audio/")) {
      setType("audio");
    } else {
      setType("image");
    }
  };

  const handlePreviewChange = (selectedFile) => {
    if (!selectedFile) return;

    if (
      !selectedFile.type.startsWith("image/") &&
      !selectedFile.type.startsWith("video/") &&
      !selectedFile.type.startsWith("audio/")
    ) {
      errorToast("Preview must be an image, video, or audio file");
      return;
    }

    setPreviewFile(selectedFile);
    setPreviewPreview(URL.createObjectURL(selectedFile));
  };

  const handleThumbnailChange = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      errorToast("Thumbnail must be an image file");
      return;
    }

    setThumbnailFile(selectedFile);
    setThumbnailPreview(URL.createObjectURL(selectedFile));
  };

  const handleGalleryChange = (selectedFiles) => {
    const files = Array.from(selectedFiles || []).slice(0, 4);
    const imageFiles = files.filter((selectedFile) => selectedFile.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      errorToast("Gallery images must be image files");
    }

    setGalleryFiles(imageFiles);
    setGalleryPreviews(imageFiles.map((selectedFile) => URL.createObjectURL(selectedFile)));
  };

  const updatePricingOption = (index, field, value) => {
    setPricingOptions((currentOptions) =>
      currentOptions.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option
      )
    );
  };

  const addPricingOption = () => {
    setPricingOptions((currentOptions) => [
      ...currentOptions,
      { title: "", description: "", price: "", licenseType: "personal" }
    ]);
  };

  const removePricingOption = (index) => {
    setPricingOptions((currentOptions) =>
      currentOptions.length === 1
        ? currentOptions
        : currentOptions.filter((_, optionIndex) => optionIndex !== index)
    );
  };

  /* =========================
     HANDLE DROP
  ========================= */

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  /* =========================
     HANDLE SUBMIT
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // prevent re-click

    if (!file) {
      errorToast("Please select the original full-quality file");
      return;
    }

    if (!previewFile) {
      errorToast("Please upload a safe public preview file");
      return;
    }

    if (!thumbnailFile) {
      errorToast("Please upload a public thumbnail or cover image");
      return;
    }

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("visibility", visibility);
    formData.append("file", file);
    formData.append("preview", previewFile);
    formData.append("thumbnail", thumbnailFile);
    formData.append("isPhysical", String(isPhysical));
    formData.append("category", category);
    formData.append("dimensions", JSON.stringify(dimensions));
    formData.append("weight", JSON.stringify(weight));
    formData.append("shippingAvailable", String(shippingAvailable));
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

    // Simulated progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    try {
      await createAsset(formData);

      setProgress(100);

      successToast("Asset uploaded successfully!");

      // Reset
      setTitle("");
      setDescription("");
      setType("image");
      setFile(null);
      setFilePreview(null);
      setPreviewFile(null);
      setPreviewPreview(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setGalleryFiles([]);
      setGalleryPreviews([]);
      setPricingOptions([
        { title: "", description: "", price: "", licenseType: "personal" }
      ]);
      setIsPhysical(false);
      setCategory("digital");
      setDimensions({ width: "", height: "", depth: "", unit: "cm" });
      setWeight({ value: "", unit: "kg" });
      setShippingAvailable(true);
      setVisibility("public");

    } catch (error) {
      errorToast(error.response?.data?.message);
    } finally {
      clearInterval(interval);

      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <>

      {/* 🔥 LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md text-center">
            
            <p className="text-lg font-semibold mb-4">
              Uploading Asset...
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-sm text-gray-500 mt-2">
              {progress}%
            </p>

          </div>
        </div>
      )}

      {/* MAIN FORM */}
      <div className="cc-panel mx-auto max-w-3xl rounded-lg p-6 sm:p-8">
        <div className="mb-8 rounded-lg bg-slate-950 p-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">
            Creator studio
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Upload New Asset
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Add artwork details, pricing, gallery images, and marketplace visibility.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`space-y-6 ${loading ? "pointer-events-none opacity-60" : ""}`}
        >

          {/* Title */}
          <div>
            <label className="block mb-1 font-medium">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 font-medium">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Visibility */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-medium">Asset Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block font-medium">Visibility</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>

          {/* Drag & Drop */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition"
          >
            <p className="text-gray-500">
              Drag & drop original full-quality image, video, or audio here
            </p>

            <p className="text-sm text-gray-400 mt-2">
              or
            </p>

            <label className="text-blue-600 font-medium cursor-pointer">
              Browse Files
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                hidden
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
            </label>
          </div>

          {/* Original Preview */}
          {filePreview && (
            <div className="mt-4">
              <p className="font-medium mb-2">Original file selected:</p>

              {file.type.startsWith("image/") ? (
                <img
                  src={filePreview}
                  alt="Original preview"
                  className="rounded-lg max-h-60 object-contain"
                />
              ) : file.type.startsWith("audio/") ? (
                <audio
                  src={filePreview}
                  controls
                  className="w-full"
                />
              ) : (
                <video
                  src={filePreview}
                  controls
                  className="rounded-lg max-h-60"
                />
              )}

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFilePreview(null);
                }}
                className="text-red-500 text-sm mt-2"
              >
                Remove File
              </button>
            </div>
          )}

          <div className="grid gap-6 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">
                Public Preview File
              </label>
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={(e) => handlePreviewChange(e.target.files[0])}
                className="w-full rounded-lg border px-4 py-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                Safe public preview only. Use watermarked, compressed, or shortened media.
              </p>

              {previewPreview && (
                <div className="mt-3">
                  {previewFile.type.startsWith("image/") ? (
                    <img
                      src={previewPreview}
                      alt="Public preview"
                      className="max-h-40 rounded-lg object-contain"
                    />
                  ) : previewFile.type.startsWith("audio/") ? (
                    <audio src={previewPreview} controls className="w-full" />
                  ) : (
                    <video src={previewPreview} controls className="max-h-40 rounded-lg" />
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Public Thumbnail / Cover
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleThumbnailChange(e.target.files[0])}
                className="w-full rounded-lg border px-4 py-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                Public cover image used on cards and previews.
              </p>

              {thumbnailPreview && (
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="mt-3 h-32 rounded-lg object-cover"
                />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={isPhysical}
                onChange={(e) => {
                  setIsPhysical(e.target.checked);
                  setCategory(e.target.checked ? "painting" : "digital");
                }}
              />
              Physical artwork
            </label>

            {isPhysical && (
              <div className="mt-4 space-y-4">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                    type="number"
                    min="0"
                    placeholder="Width"
                    className="rounded-lg border px-3 py-2"
                  />
                  <input
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                    type="number"
                    min="0"
                    placeholder="Height"
                    className="rounded-lg border px-3 py-2"
                  />
                  <input
                    value={dimensions.depth}
                    onChange={(e) => setDimensions({ ...dimensions, depth: e.target.value })}
                    type="number"
                    min="0"
                    placeholder="Depth"
                    className="rounded-lg border px-3 py-2"
                  />
                  <select
                    value={dimensions.unit}
                    onChange={(e) => setDimensions({ ...dimensions, unit: e.target.value })}
                    className="rounded-lg border px-3 py-2"
                  >
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={weight.value}
                    onChange={(e) => setWeight({ ...weight, value: e.target.value })}
                    type="number"
                    min="0"
                    placeholder="Weight"
                    className="rounded-lg border px-3 py-2"
                  />
                  <select
                    value={weight.unit}
                    onChange={(e) => setWeight({ ...weight, unit: e.target.value })}
                    className="rounded-lg border px-3 py-2"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={shippingAvailable}
                    onChange={(e) => setShippingAvailable(e.target.checked)}
                  />
                  Shipping available
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Gallery Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleGalleryChange(e.target.files)}
              className="w-full rounded-lg border px-4 py-2"
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional, up to 4 extra images.
            </p>

            {galleryPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {galleryPreviews.map((galleryPreview, index) => (
                  <img
                    key={galleryPreview}
                    src={galleryPreview}
                    alt={`Gallery preview ${index + 1}`}
                    className="h-24 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">
                Pricing Options
              </h3>
              <button
                type="button"
                onClick={addPricingOption}
                className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Add Pricing
              </button>
            </div>

            {pricingOptions.map((option, index) => (
              <div key={index} className="rounded-lg border border-gray-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={option.title}
                    onChange={(e) => updatePricingOption(index, "title", e.target.value)}
                    placeholder="Title"
                    className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    value={option.price}
                    onChange={(e) => updatePricingOption(index, "price", e.target.value)}
                    type="number"
                    min="0"
                    placeholder="Price"
                    className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={option.licenseType}
                    onChange={(e) => updatePricingOption(index, "licenseType", e.target.value)}
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
                  onChange={(e) => updatePricingOption(index, "description", e.target.value)}
                  rows="2"
                  placeholder="License description"
                  className="mt-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          {/* Submit */}
          <Button type="submit" loading={loading}>
            Upload Asset
          </Button>

        </form>
      </div>
    </>
  );
};

export default CreateAsset;
