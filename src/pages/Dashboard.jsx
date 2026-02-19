import { useEffect, useState } from "react";
import { getPublicAssets } from "../api/assetApi";
import Layout from "../components/Layout";

const Dashboard = () => {

  const [assets, setAssets] = useState([]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    const data = await getPublicAssets({ page: 1 });
    setAssets(data.assets);
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-6">
        Explore Public Assets
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {assets.map(asset => (
          <div
            key={asset._id}
            className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition"
          >
            {asset.type === "image" ? (
              <img
                src={asset.url}
                alt={asset.title}
                className="h-48 w-full object-cover"
              />
            ) : (
              <video
                src={asset.url}
                className="h-48 w-full object-cover"
                controls
              />
            )}

            <div className="p-4">
              <h3 className="font-semibold text-lg">
                {asset.title}
              </h3>
              <p className="text-sm text-gray-500">
                By {asset.owner.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Dashboard;
