# CreatorConnect

CreatorConnect is a full-stack creator commerce platform where artists can publish assets, buyers can discover and purchase creative work, and both sides can continue the conversation through real-time chat.

The app is built as a polished marketplace experience: public landing page, protected dashboard, creator profiles, asset uploads, Razorpay-backed purchases, recommendation-driven discovery, seller order management, downloads, and messaging.

## Live Product Flow

Visitors land on the public About page first, where they can understand the project and choose to explore more. Marketplace, purchases, assets, orders, and inbox routes are protected behind authentication.

```text
Public visitor
  -> About page
  -> Login / Signup
  -> Marketplace dashboard
  -> Asset detail / creator profile
  -> Chat / purchase / download / order tracking
```

## What It Does

- Public About page that presents CreatorConnect as a professional product
- Login, signup, OTP verification, protected routes, and session-aware navigation
- Marketplace dashboard with search, pagination, featured creators, and recommendations
- Personalized asset and creator recommendations powered by backend activity tracking
- Asset detail pages with media previews, gallery support, pricing options, and creator context
- Creator asset publishing with original file, public preview, thumbnail, gallery, pricing, visibility, and physical artwork metadata
- Razorpay checkout flow with backend order creation and payment verification
- Digital purchase downloads and physical order delivery details
- Seller order dashboard for fulfillment status and tracking updates
- Real-time inbox and chat experience using Socket.IO
- Redux Toolkit state management with centralized Axios API modules

## Built By

Designed and developed by **Aniket Tiwari** as a production-minded creator marketplace, covering frontend UI, protected user flows, backend API integration, Razorpay payment flow integration, recommendation services, and real-time communication.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite 7 |
| Routing | React Router 7 |
| State | Redux Toolkit, React Redux |
| Styling | Tailwind CSS 4, custom CSS utilities |
| API Client | Axios with credentials |
| Realtime | Socket.IO Client |
| Payments | Razorpay Checkout integration |
| UX | React Hot Toast, Framer Motion, React Confetti |
| Tooling | ESLint, Vite build pipeline |

## Core Pages

| Route | Purpose |
| --- | --- |
| `/` | Public About / landing page |
| `/about` | Public project and contact page |
| `/login` | Sign in with normal or demo credentials |
| `/signup` | Create account and request OTP |
| `/verify-otp` | Complete account verification |
| `/dashboard` | Browse marketplace assets and recommendations |
| `/create-asset` | Publish a new creator asset |
| `/my-assets` | Manage uploaded assets |
| `/assets/:assetId` | View, preview, and purchase an asset |
| `/assets/:assetId/edit` | Edit owned asset details |
| `/artists/:artistId` | View creator profile and portfolio |
| `/inbox` | Conversation list |
| `/chat/:id` | Active chat thread |
| `/purchases` | Purchased assets and downloads |
| `/seller-orders` | Seller fulfillment dashboard |
| `/buy-tokens` | Token purchase screen |
| `/profile` | User profile and addresses |

## Project Structure

```text
src/
  api/          Axios instance and feature API modules
  components/   Shared layout, navbar, and UI pieces
  context/      Auth context provider
  hooks/        Shared React hooks
  pages/        Route-level product screens
  routes/       Protected and public route wrappers
  socket/       Socket.IO client setup
  store/        Redux Toolkit store and slices
  utils/        Toast helpers and user utilities
```

## Demo Credentials

The login and signup screens include a demo credential panel for deployment demos.

```text
User ID: seed-demo-user
Email: demo.creator@example.com
Password: Demo@12345
```

Before final deployment, update these values in:

```text
src/pages/Login.jsx
src/pages/Signup.jsx
```

Use the exact email and password from your backend seed data so visitors can try the app without creating a fresh account.

## Environment Variables

Create a `.env` file using `.env.example` as the base.

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=https://creators-connect-backend-1.onrender.com
```

For production, set these values in your hosting provider:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

Important backend requirements:

- The backend must allow credentialed CORS for the deployed frontend domain.
- Axios uses `withCredentials: true`, so cookies must be configured correctly.
- Razorpay order creation and verification endpoints must be live.
- Socket.IO must accept the deployed frontend origin.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Run lint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deploying To Vercel

This app is Vercel-ready. The included `vercel.json` keeps browser refreshes working for client-side routes.

Recommended Vercel settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Deployment checklist:

1. Push the frontend repo to GitHub.
2. Import the repo into Vercel.
3. Add `VITE_API_BASE_URL` and `VITE_SOCKET_URL` in Vercel environment variables.
4. Add the deployed frontend URL to backend CORS allowed origins.
5. Confirm auth cookies work on the deployed domain.
6. Confirm Razorpay checkout opens and backend verification succeeds.
7. Confirm Socket.IO connects from Inbox and Chat.
8. Replace demo credentials with real seeded account values.
9. Run a final smoke test across About, Login, Dashboard, Asset Detail, Purchases, Orders, My Assets, and Inbox.

## Backend Contract

The frontend expects backend support for:

- Auth: signup, OTP, login, logout, current user, session expiry
- Assets: public browsing, owner assets, creation, update, detail, artist assets
- Purchases: digital downloads, physical delivery address flow, seller orders
- Payments: Razorpay order creation and verification
- Recommendations: activity tracking, recommended assets, recommended creators
- Chat: conversations, messages, read receipts, attachments
- Realtime: Socket.IO registration and message events

## Production Quality Notes

- Public routes introduce the project before asking visitors to sign in.
- Protected routes keep marketplace actions, purchases, orders, profile, and inbox private.
- Recommendation UI appears above general marketplace browsing.
- Pagination returns users to the marketplace grid instead of leaving them at the bottom.
- Empty states and loading skeletons are included for core workflow pages.
- The UI follows a consistent slate, blue, teal, and white product theme.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start local Vite development server |
| `npm run build` | Generate production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

## License

Private project. Add a license before distributing or open-sourcing.
