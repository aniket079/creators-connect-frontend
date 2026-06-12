import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import { Toaster } from "react-hot-toast";
import VerifyOtp from "./pages/Verifyotp";
import CreateAsset from "./pages/CreateAsset";
import MyAssets from "./pages/MyAsset";

import Inbox from "./pages/Inbox";
import BuyTokens from "./pages/BuyTokens";
import AssetDetail from "./pages/AssetDetail";
import EditAsset from "./pages/EditAsset";
import Purchases from "./pages/Purchases";
import Profile from "./pages/Profile";
import SellerOrders from "./pages/SellerOrders";
import ArtistProfile from "./pages/ArtistProfile";
import About from "./pages/About";
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>

          {/* Public landing page */}
          <Route
            path="/"
            element={
              <Layout>
                <About />
              </Layout>
            }
          />

          {/* Public Routes */}
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/verify-otp" element={<PublicRoute><VerifyOtp /></PublicRoute>} />


          {/* Protected Routes with Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-asset"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateAsset />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-assets"
            element={
                <ProtectedRoute>
              <Layout>
                <MyAssets />
              </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <Inbox />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute>
                <Inbox />
              </ProtectedRoute>
            }
/>

<Route
  path="/buy-tokens"
  element={
    <ProtectedRoute>
      <BuyTokens />
    </ProtectedRoute>
  }
/>

          <Route
            path="/assets/:assetId"
            element={
              <ProtectedRoute>
                <Layout>
                  <AssetDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assets/:assetId/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <EditAsset />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/artists/:artistId"
            element={
              <ProtectedRoute>
                <Layout>
                  <ArtistProfile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchases"
            element={
              <ProtectedRoute>
                <Layout>
                  <Purchases />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller-orders"
            element={
              <ProtectedRoute>
                <Layout>
                  <SellerOrders />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/about"
            element={
              <Layout>
                <About />
              </Layout>
            }
          />


        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
