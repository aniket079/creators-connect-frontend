import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPublicAssets } from "../api/assetApi";
import { createConversation } from "../api/chatApi";
import { useDispatch, useSelector } from "react-redux";
import { setPublicAssets, setLoading } from "../store/slices/assetSlice";
import {
  setRecommendedAssets,
  setRecommendedCreators,
  setRecommendationsLoading,
  clearRecommendations
} from "../store/slices/recommendationSlice";
import {
  getRecommendedAssets,
  getRecommendedCreators,
  trackActivity
} from "../api/recommendationApi";
import { useNavigate } from "react-router-dom";

const getAssetPreviewUrl = (asset) => asset.thumbnailUrl || asset.previewUrl || asset.url;

const formatRecommendationBasis = (basis) => {
  if (!basis) return "";
  if (typeof basis === "string") return basis;
  if (Array.isArray(basis)) return basis.filter(Boolean).join(", ");
  if (typeof basis === "object") {
    return basis.label || basis.name || basis.type || basis.category || "your recent activity";
  }

  return String(basis);
};

const Dashboard = () => {
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const marketplaceRef = useRef(null);
  const assets = useSelector((state) => state.assets.publicAssets);
  const loading = useSelector((state) => state.assets.loading);
  const recommendedAssets = useSelector((state) => state.recommendations.assets);
  const recommendedCreators = useSelector((state) => state.recommendations.creators);
  const recommendationBasis = useSelector((state) => state.recommendations.basedOn);
  const loadingRecommendedAssets = useSelector(
    (state) => state.recommendations.loadingAssets
  );
  const loadingRecommendedCreators = useSelector(
    (state) => state.recommendations.loadingCreators
  );
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id || user?.id;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1
  });
  const limit = 6;

  const featuredCreators = useMemo(() => {
    const seenCreators = new Set();

    return assets
      .map((asset) => asset.owner)
      .filter((owner) => {
        const ownerId = owner?._id || owner?.id || owner?.name;
        if (!ownerId || seenCreators.has(ownerId)) return false;
        seenCreators.add(ownerId);
        return true;
      })
      .slice(0, 5);
  }, [assets]);

  const fetchAssets = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const data = await getPublicAssets({
        page,
        limit,
        search
      });

      dispatch(setPublicAssets(data.assets));
      setPagination({
        total: data.total || 0,
        page: data.page || page,
        totalPages: data.totalPages || 1
      });
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, page, search]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    if (!userId) {
      dispatch(clearRecommendations());
      return;
    }

    const fetchRecommendations = async () => {
      try {
        dispatch(setRecommendationsLoading({ type: "assets", loading: true }));
        dispatch(setRecommendationsLoading({ type: "creators", loading: true }));

        const [assetData, creatorData] = await Promise.all([
          getRecommendedAssets(6, { ai: true }),
          getRecommendedCreators(5, { ai: true })
        ]);

        dispatch(setRecommendedAssets(assetData));
        dispatch(setRecommendedCreators(creatorData));
      } catch {
        // Recommendations are optional; marketplace browsing should still work.
      } finally {
        dispatch(setRecommendationsLoading({ type: "assets", loading: false }));
        dispatch(setRecommendationsLoading({ type: "creators", loading: false }));
      }
    };

    fetchRecommendations();
  }, [dispatch, userId]);

  const pageNumbers = useMemo(() => {
    const totalPages = pagination.totalPages || 1;
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, page + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, pagination.totalPages]);

  const assetRecommendationBasis = useMemo(
    () => formatRecommendationBasis(recommendationBasis.assets),
    [recommendationBasis.assets]
  );

  const scrollToMarketplace = () => {
    window.requestAnimationFrame(() => {
      marketplaceRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage === page || loading) return;

    setPage(nextPage);
    scrollToMarketplace();
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleStartChat = async (receiverId) => {
    if (!receiverId) return;

    try {
      const conversation = await createConversation(receiverId);

      trackActivity({
        type: "message",
        targetType: "creator",
        targetId: receiverId
      }).catch(() => {});

      navigate(`/chat/${conversation._id}`, {
        state: { receiverId }
      });
    } catch {
      // Chat failures are handled silently here to keep marketplace browsing uninterrupted.
    }
  };

  const openAsset = (assetId) => {
    if (!assetId) return;

    trackActivity({
      type: "view",
      targetType: "asset",
      targetId: assetId
    }).catch(() => {});

    navigate(`/assets/${assetId}`);
  };

  const openCreator = (creatorId) => {
    if (!creatorId) return;

    trackActivity({
      type: "view",
      targetType: "creator",
      targetId: creatorId
    }).catch(() => {});

    navigate(`/artists/${creatorId}`);
  };

  return (
    <>
      <section className="mb-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/15">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:p-10">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">
                Creator marketplace
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white md:text-5xl">
                Discover expressive artwork, assets, and creators ready to collaborate.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                Browse public creator assets, inspect seller profiles, and start conversations from one focused workspace.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-2 rounded-lg bg-white/10 p-2 sm:flex-row">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search assets, styles, or creators"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-blue-400/30"
              />
              <div className="flex gap-2">
                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-lg bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-400"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/10 p-5">
            <div className="grid grid-cols-2 gap-3">
              {assets.slice(0, 4).map((asset) => (
                <button
                  key={asset._id}
                  type="button"
                  onClick={() => openAsset(asset._id)}
                  className="group overflow-hidden rounded-lg bg-slate-900 text-left"
                >
                  {asset.type === "video" ? (
                    <video
                      src={getAssetPreviewUrl(asset)}
                      poster={asset.thumbnailUrl}
                      className="h-32 w-full object-cover opacity-90"
                      muted
                      loop
                      playsInline
                      autoPlay
                      controls={false}
                      controlsList="nodownload noplaybackrate nofullscreen"
                      disablePictureInPicture
                    />
                  ) : (
                    <img src={getAssetPreviewUrl(asset)} alt={asset.title} className="h-32 w-full object-cover opacity-90 transition group-hover:scale-105" />
                  )}
                  <p className="truncate px-3 py-2 text-xs font-semibold text-white">
                    {asset.title}
                  </p>
                </button>
              ))}
            </div>

            {featuredCreators.length > 0 && (
              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-sm font-semibold text-slate-200">
                  Featured creators
                </p>
                <div className="mt-3 flex -space-x-2">
                  {featuredCreators.map((creator) => {
                    const creatorImage = creator?.avatar || creator?.profileImage || creator?.avatarUrl;

                    return creatorImage ? (
                      <img
                        key={creator._id || creator.name}
                        src={creatorImage}
                        alt={creator.name || "Creator"}
                        className="h-11 w-11 rounded-full border-2 border-slate-950 object-cover"
                      />
                    ) : (
                      <span
                        key={creator._id || creator.name}
                        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-950 bg-teal-200 text-sm font-black text-slate-950"
                      >
                        {(creator?.name || "C").slice(0, 1).toUpperCase()}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {(loadingRecommendedAssets ||
        loadingRecommendedCreators ||
        recommendedAssets.length > 0 ||
        recommendedCreators.length > 0) && (
        <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                  Picked for you
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Recommended assets
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                {loadingRecommendedAssets
                  ? "Finding the best matches..."
                  : assetRecommendationBasis
                    ? `Based on ${assetRecommendationBasis}`
                    : "Personalized from your activity"}
              </p>
            </div>

            {loadingRecommendedAssets && (
              <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <div className="h-44 animate-pulse bg-slate-200" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                      <div className="h-9 w-full animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingRecommendedAssets && recommendedAssets.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {recommendedAssets.slice(0, 3).map((asset) => (
                  <article
                    key={asset._id}
                    className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => openAsset(asset._id)}
                      className="block w-full overflow-hidden bg-slate-950 text-left"
                    >
                      {asset.type === "video" ? (
                        <video
                          src={getAssetPreviewUrl(asset)}
                          poster={asset.thumbnailUrl}
                          className="h-44 w-full object-cover opacity-95"
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
                          src={getAssetPreviewUrl(asset)}
                          alt={asset.title}
                          className="h-44 w-full object-cover opacity-95 transition duration-300 group-hover:scale-105"
                        />
                      )}
                    </button>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-1 text-base font-bold text-slate-950">
                            {asset.title}
                          </h3>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {asset.owner?.name || "Creator"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                          Match
                        </span>
                      </div>

                      {asset.aiReason && (
                        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                          {asset.aiReason}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => openAsset(asset._id)}
                        className="mt-4 w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Creator matches
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                Creators you may like
              </h2>
            </div>

            {loadingRecommendedCreators && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                    <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingRecommendedCreators && recommendedCreators.length > 0 && (
              <div className="space-y-3">
                {recommendedCreators.slice(0, 4).map((creator) => {
                  const creatorImage =
                    creator.avatar || creator.profileImage || creator.avatarUrl;

                  return (
                    <button
                      key={creator._id}
                      type="button"
                      onClick={() => openCreator(creator._id)}
                      className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/60"
                    >
                      {creatorImage ? (
                        <img
                          src={creatorImage}
                          alt={creator.name || "Creator"}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                          {(creator.name || "C").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-slate-950">
                          {creator.name || "Creator"}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-slate-500">
                          {creator.profession || creator.category || creator.title || "Artist"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        </section>
      )}

      <section ref={marketplaceRef} className="scroll-mt-6">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          {loading
            ? "Loading assets..."
            : `${pagination.total} asset${pagination.total === 1 ? "" : "s"} found`}
        </span>
        <span>
          Page {pagination.page} of {pagination.totalPages || 1}
        </span>
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="h-48 animate-pulse bg-slate-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="h-9 w-full animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && assets.length === 0 && (
        <div className="cc-panel rounded-lg px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-900">
            No assets found
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Try a different search term or clear the search.
          </p>
        </div>
      )}

      {!loading && assets.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {assets.map(asset => (
            <div
              key={asset._id}
              className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              {asset.type === "video" ? (
                <div className="relative h-56 overflow-hidden bg-slate-950">
                  <video
                    src={getAssetPreviewUrl(asset)}
                    poster={asset.thumbnailUrl}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                    autoPlay
                    controls={false}
                    controlsList="nodownload noplaybackrate nofullscreen"
                    disablePictureInPicture
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3">
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-950">
                      Video Preview
                    </span>
                  </div>
                </div>
              ) : (
                <img
                  src={getAssetPreviewUrl(asset)}
                  alt={asset.title}
                  className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
                />
              )}

              <div className="p-4">
                <h3 className="line-clamp-1 text-lg font-semibold text-slate-950">
                  {asset.title}
                </h3>
                <div className="mt-3 flex items-center gap-2">
                  {asset.owner?.avatar || asset.owner?.profileImage || asset.owner?.avatarUrl ? (
                    <img
                      src={asset.owner.avatar || asset.owner.profileImage || asset.owner.avatarUrl}
                      alt={asset.owner?.name || "Creator"}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {(asset.owner?.name || "C").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <p className="min-w-0 truncate text-sm font-medium text-slate-600">
                    {asset.owner?.name || "Creator"}
                  </p>
                </div>
                <button
                  onClick={() => openAsset(asset._id)}
                  className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleStartChat(asset.owner?._id)}
                  disabled={!asset.owner?._id}
                  className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => handlePageChange(pageNumber)}
              disabled={loading}
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
            onClick={() => handlePageChange(Math.min(pagination.totalPages, page + 1))}
            disabled={page >= pagination.totalPages || loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      </section>
    </>
  );
};

export default Dashboard;
