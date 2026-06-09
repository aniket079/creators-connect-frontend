import { Link } from "react-router-dom";

const highlights = [
  {
    title: "Creator-first marketplace",
    description:
      "Creators can publish digital, physical, audio, and video assets with licensing, pricing, and profile context built around their work."
  },
  {
    title: "Buyer-friendly discovery",
    description:
      "Users can explore assets, inspect artist profiles, preview media, start conversations, and purchase work from one focused experience."
  },
  {
    title: "Digital delivery ready",
    description:
      "Purchased digital assets are designed for secure downloads, while physical artwork keeps delivery addresses and fulfillment tracking separate."
  }
];

const stats = [
  ["Assets", "Images video Physical-Arts"],
  ["Profiles", "Artist-led identity"],
  ["Commerce", "Tokens + purchases"],
  ["Delivery", "Digital + physical"]
];

const About = () => {
  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-lg bg-slate-950 text-white shadow-2xl shadow-slate-950/15">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:p-10">
          <div className="flex flex-col justify-between gap-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">
                About CreatorConnect
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                A marketplace where creators, collectors, and digital media meet.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
                CreatorConnect is built for artists who want a sharper way to present their work, sell assets, manage orders, and connect with people who value creative output.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-lg bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-400"
              >
                Explore Assets
              </Link>
              <Link
                to="/create-asset"
                className="rounded-lg border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                Create Asset
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/10 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-h-44 rounded-lg bg-blue-500 p-5">
                <p className="text-sm font-bold text-blue-50">Digital assets</p>
                <p className="mt-8 text-3xl font-black">Preview, buy, download.</p>
              </div>
              <div className="min-h-44 rounded-lg bg-teal-300 p-5 text-slate-950">
                <p className="text-sm font-bold">Artist profiles</p>
                <p className="mt-8 text-3xl font-black">Story, style, trust.</p>
              </div>
              <div className="min-h-44 rounded-lg bg-white p-5 text-slate-950 sm:col-span-2">
                <p className="text-sm font-bold text-slate-500">Project credit</p>
                <p className="mt-4 text-4xl font-black">Done by Aniket Tiwari</p>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  Designed as a creator commerce platform with marketplace browsing, artist identity, payment flows, messaging, and asset delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="cc-panel rounded-lg p-5">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-3 text-xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            The idea
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Less noise. More creative signal.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            CreatorConnect is shaped around the practical things artists and buyers need: clean listings, useful previews, profile context, direct messaging, payments, and a collection page where purchased digital work can be downloaded without delivery clutter.
          </p>
        </div>

        <div className="grid gap-4">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
