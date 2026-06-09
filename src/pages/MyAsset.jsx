import { useEffect, useState } from "react";
import { getMyAssets } from "../api/assetApi";
import { useNavigate } from "react-router-dom";

const getAssetMediaUrl = (asset) => asset?.thumbnailUrl || asset?.previewUrl || asset?.url;

const getAssetPlaybackUrl = (asset) => asset?.previewUrl || asset?.url;

const MyAssets = () => {

    const [assets, setAssets] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        getMyAssets({ page: 1 }).then((data) => {
            if (isMounted) {
                setAssets(data.assets);
            }
        });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                        Creator studio
                    </p>
                    <h2 className="mt-1 text-3xl font-black text-slate-950">
                        My Assets
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Review your published work and edit marketplace details.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/create-asset")}
                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                    Create Asset
                </button>
            </div>

            {assets.length === 0 && (
                <div className="cc-panel rounded-lg px-6 py-12 text-center">
                    <p className="text-base font-semibold text-slate-950">
                        No assets yet
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        Add your first artwork or digital asset to start building your portfolio.
                    </p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {assets.map(asset => (
                    <div
                        key={asset._id}
                        className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >
                        {asset.type === "image" ? (
                            <img
                                src={getAssetMediaUrl(asset)}
                                alt={asset.title}
                                className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                        ) : asset.type === "audio" ? (
                            <div className="flex h-56 flex-col justify-between bg-slate-950 p-5 text-white">
                                <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
                                    Audio Preview
                                </p>
                                <audio src={getAssetPlaybackUrl(asset)} controls className="w-full" />
                            </div>
                        ) : (
                            <video
                                className="h-56 w-full object-cover"
                                muted
                                autoPlay
                                loop
                                playsInline
                                controls={false}
                                controlsList="nodownload noplaybackrate nofullscreen"
                                disablePictureInPicture
                            >
                                <source src={getAssetPlaybackUrl(asset)} type="video/mp4" />
                            </video>
                        )}

                        <div className="p-4">
                            <h3 className="line-clamp-1 text-lg font-bold text-slate-950">
                                {asset.title}
                            </h3>

                            <span
                                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${asset.visibility === "public"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-rose-50 text-rose-700"
                                    }`}
                            >
                                {asset.visibility}
                            </span>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/assets/${asset._id}`)}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    View
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/assets/${asset._id}/edit`)}
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default MyAssets;
