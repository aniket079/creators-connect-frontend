import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getArtistAssets, getArtistById } from "../api/assetApi";
import { trackActivity } from "../api/recommendationApi";
import { errorToast } from "../utils/toast";

const getArtistImage = (artist) => artist?.avatar || artist?.profileImage;

const getArtistRole = (artist) => artist?.profession || artist?.category || artist?.title;

const getAssetMediaUrl = (asset) => asset?.thumbnailUrl || asset?.previewUrl || asset?.url;

const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric"
  }).format(parsedDate);
};

const getSocialEntries = (socialLinks) => {
  if (!socialLinks || typeof socialLinks !== "object") return [];

  return Object.entries(socialLinks).filter(([, value]) => Boolean(value));
};

const getSocialUrl = (value) => {
  const url = String(value);

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
};

const ArtistProfile = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id || user?.id;

  const [artist, setArtist] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1
  });
  const limit = 12;

  useEffect(() => {
    let isMounted = true;

    const fetchArtist = async () => {
      try {
        setLoadingArtist(true);
        const data = await getArtistById(artistId);

        if (isMounted) {
          setArtist(data.artist || data);
        }
      } catch (error) {
        errorToast(error.response?.data?.message || "Unable to load artist profile");
      } finally {
        if (isMounted) {
          setLoadingArtist(false);
        }
      }
    };

    fetchArtist();

    return () => {
      isMounted = false;
    };
  }, [artistId]);

  const fetchAssets = useCallback(async () => {
    try {
      setLoadingAssets(true);
      const data = await getArtistAssets(artistId, { page, limit });
      const nextPagination = data.pagination || {};

      setAssets(data.assets || []);
      setPagination({
        total: nextPagination.total || data.total || 0,
        page: nextPagination.page || data.page || page,
        pages: nextPagination.pages || data.totalPages || 1
      });
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to load artist assets");
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, [artistId, page]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    if (!artistId || !userId) return;

    trackActivity({
      type: "view",
      targetType: "creator",
      targetId: artistId
    }).catch(() => {});
  }, [artistId, userId]);

  const pageNumbers = useMemo(() => {
    const totalPages = pagination.pages || 1;
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, page + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, pagination.pages]);

  const artistImage = getArtistImage(artist);
  const artistRole = getArtistRole(artist);
  const joinedDate = formatDate(artist?.joinedAt);
  const socialEntries = getSocialEntries(artist?.socialLinks);

  if (loadingArtist) {
    return <div className="text-sm text-slate-500">Loading artist profile...</div>;
  }

  if (!artist) {
    return <div className="text-sm text-slate-500">Artist not found.</div>;
  }

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Back
      </button>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {artist.coverImage && (
          <img
            src={artist.coverImage}
            alt=""
            className="h-52 w-full object-cover"
          />
        )}

        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {artistImage ? (
              <img
                src={artistImage}
                alt={artist.name || "Artist"}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-white"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700 ring-4 ring-white">
                {(artist.name || "A").slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-slate-950">
                {artist.name || "Artist"}
              </h1>
              {artist.username && (
                <p className="mt-1 text-sm text-slate-500">
                  @{artist.username}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                {artistRole && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {artistRole}
                  </span>
                )}
                {artist.location && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {artist.location}
                  </span>
                )}
                {Number.isFinite(Number(artist.assetCount)) && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {artist.assetCount} artwork{Number(artist.assetCount) === 1 ? "" : "s"}
                  </span>
                )}
                {joinedDate && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Joined {joinedDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {artist.bio && (
            <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {artist.bio}
            </p>
          )}

          {socialEntries.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {socialEntries.map(([label, value]) => (
                <a
                  key={label}
                  href={getSocialUrl(value)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium capitalize text-slate-700 hover:bg-slate-50"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
          <h2 className="text-xl font-bold text-slate-950">
            Artist Work
          </h2>
          <span>
            {loadingAssets
              ? "Loading assets..."
              : `${pagination.total} asset${pagination.total === 1 ? "" : "s"}`}
          </span>
        </div>

        {loadingAssets && (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="h-48 animate-pulse bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingAssets && assets.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-900">
              No public assets yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              This artist has not published any work for the marketplace.
            </p>
          </div>
        )}

        {!loadingAssets && assets.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {assets.map((asset) => (
              <div
                key={asset._id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {asset.type === "video" ? (
                  <video
                    src={asset.previewUrl || asset.url}
                    poster={asset.thumbnailUrl}
                    className="h-48 w-full object-cover"
                    muted
                    loop
                    playsInline
                    autoPlay
                    controls={false}
                    controlsList="nodownload noplaybackrate nofullscreen"
                    disablePictureInPicture
                  />
                ) : asset.type === "audio" ? (
                  <div className="flex h-48 flex-col justify-between bg-slate-950 p-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
                      Audio Preview
                    </p>
                    <audio src={asset.previewUrl || asset.url} controls className="w-full" />
                  </div>
                ) : (
                  <img
                    src={getAssetMediaUrl(asset)}
                    alt={asset.title}
                    className="h-48 w-full object-cover"
                  />
                )}

                <div className="p-4">
                  <h3 className="line-clamp-1 text-lg font-semibold text-slate-950">
                    {asset.title}
                  </h3>
                  {asset.category && (
                    <p className="mt-1 text-sm text-slate-500">
                      {asset.category}
                    </p>
                  )}
                  {asset.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                      {asset.description}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/assets/${asset._id}`)}
                    className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page <= 1 || loadingAssets}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                disabled={loadingAssets}
                className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition ${
                  pageNumber === page
                    ? "bg-blue-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(pagination.pages, currentPage + 1)
                )
              }
              disabled={page >= pagination.pages || loadingAssets}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default ArtistProfile;
