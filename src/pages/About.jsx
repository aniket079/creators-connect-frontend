import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const contact = {
  email: "anikettiwari.0793112@gmail.com",
  linkedin: "https://www.linkedin.com/in/aniket-tiwari-667082203",
  phone: "+917607575887"
};

const capabilities = [
  {
    title: "Marketplace discovery",
    description:
      "Searchable, paginated browsing for public assets with rich previews, creator context, and asset detail pages."
  },
  {
    title: "Creator selling tools",
    description:
      "Artists can create, edit, price, and manage digital or physical assets while keeping their profile identity visible."
  },
  {
    title: "Secure purchase flow",
    description:
      "Buyer journeys support pricing options, Razorpay order creation, checkout, payment verification, digital downloads, and physical delivery details."
  },
  {
    title: "Recommendation model",
    description:
      "Personalized asset and creator recommendations help users discover relevant work based on activity signals and AI-assisted matching."
  },
  {
    title: "Real-time collaboration",
    description:
      "Integrated inbox and chat experiences help buyers and creators move from discovery to conversation without leaving the platform."
  }
];

const backendSystems = [
  {
    title: "REST API foundation",
    description:
      "Backend endpoints support authentication, assets, artist profiles, recommendations, chat, purchases, downloads, seller orders, and payment workflows."
  },
  {
    title: "Authentication and sessions",
    description:
      "Cookie-based session handling, protected API access, OTP verification, current-user checks, and session-expiry behavior keep private routes controlled."
  },
  {
    title: "Razorpay payment backend",
    description:
      "Order creation and payment verification are handled through backend payment routes so purchase status is confirmed before access is granted."
  },
  {
    title: "Recommendation services",
    description:
      "Dedicated recommendation routes track user activity and return personalized creator and asset suggestions for smarter marketplace discovery."
  },
  {
    title: "Realtime messaging layer",
    description:
      "Socket.IO support powers conversation updates, unread states, read handling, and a smoother buyer-to-creator communication flow."
  },
  {
    title: "Commerce data flow",
    description:
      "The backend contract separates asset ownership, purchase records, delivery addresses, downloadable purchases, and seller order management."
  }
];

const metrics = [
  ["Frontend", "React, Vite, Tailwind"],
  ["Backend", "REST APIs + sessions"],
  ["Payments", "Razorpay verification"],
  ["Discovery", "Recommendation endpoints"]
];

const responsibilities = [
  "Product interface and route-level user experience",
  "Backend API contract for auth, assets, orders, chat, and payments",
  "Authentication-aware marketplace flows",
  "Asset creation, editing, preview, Razorpay purchase, and download screens",
  "Recommendation model integration with user activity tracking",
  "Creator profiles, buyer messaging, seller orders, and dashboard polish",
  "API integration structure, Redux state management, and production build readiness"
];

const contactLinks = [
  {
    label: "Email",
    value: contact.email,
    href: `mailto:${contact.email}`
  },
  {
    label: "LinkedIn",
    value: contact.linkedin.replace("https://www.", ""),
    href: contact.linkedin
  },
  {
    label: "Phone",
    value: contact.phone,
    href: `tel:${contact.phone.replace(/\s/g, "")}`
  }
];

const About = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <div className="bg-slate-950 p-6 text-white sm:p-8 lg:p-10">
            <p className="text-sm font-bold uppercase tracking-wide text-teal-200">
              About CreatorConnect
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              A polished creator marketplace for assets, profiles, purchases, and conversations.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
              CreatorConnect brings the practical parts of creator commerce into one focused product: publish work, discover artists, preview media, purchase assets, manage orders, and keep buyer conversations moving.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-lg bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400"
              >
                Explore More
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                >
                  Login
                </Link>
              )}
              <Link
                to="/create-asset"
                className="rounded-lg border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Create Asset
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6 sm:p-8 lg:p-10">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                Project credit
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Designed and developed by Aniket Tiwari
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Aniket built CreatorConnect as a full-stack creator commerce product, covering responsive frontend design, backend API integration, authentication flows, recommendation services, Razorpay order and verification flows, asset commerce, seller operations, and real-time communication surfaces.
              </p>

              <div className="mt-6 grid gap-3">
                {contactLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.label === "LinkedIn" ? "_blank" : undefined}
                    rel={item.label === "LinkedIn" ? "noreferrer" : undefined}
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span className="text-sm font-bold text-slate-500">
                      {item.label}
                    </span>
                    <span className="min-w-0 truncate text-right text-sm font-semibold text-slate-950">
                      {item.value}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-3 text-xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-teal-700">
            The product
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Built for creators who need more than a gallery.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            The platform treats creative work as something that deserves context, trust, and a smooth transaction path. Buyers can inspect work, understand the creator, start a conversation, and complete purchases with fewer distractions.
          </p>

          <div className="mt-6 rounded-lg bg-slate-950 p-5 text-white">
            <p className="text-sm font-bold text-teal-200">Professional scope</p>
            <p className="mt-3 text-2xl font-black">
              Marketplace, portfolio, backend APIs, recommendations, Razorpay payments, orders, purchases, and chat working together as one product.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {capabilities.map((item) => (
            <article
              key={item.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-teal-200">
              Backend engineering
            </p>
            <h2 className="mt-3 text-3xl font-black">
              The backend is not just connected. It drives the product logic.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              CreatorConnect depends on a structured backend contract for user identity, marketplace data, payments, recommendations, purchases, downloads, order management, and realtime messaging.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {backendSystems.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-white/10 bg-white/10 p-4"
              >
                <h3 className="font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              What Aniket delivered
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              A full-stack product experience with production-minded structure.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {responsibilities.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
