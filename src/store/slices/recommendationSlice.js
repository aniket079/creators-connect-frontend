import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  assets: [],
  creators: [],
  basedOn: {
    assets: null,
    creators: null
  },
  loadingAssets: false,
  loadingCreators: false,
  error: null
};

const recommendationSlice = createSlice({
  name: "recommendations",
  initialState,
  reducers: {
    setRecommendedAssets: (state, action) => {
      state.assets = action.payload.assets || [];
      state.basedOn.assets = action.payload.basedOn || null;
    },
    setRecommendedCreators: (state, action) => {
      state.creators = action.payload.creators || [];
      state.basedOn.creators = action.payload.basedOn || null;
    },
    setRecommendationsLoading: (state, action) => {
      const { type, loading } = action.payload;

      if (type === "assets") {
        state.loadingAssets = loading;
      }

      if (type === "creators") {
        state.loadingCreators = loading;
      }
    },
    setRecommendationsError: (state, action) => {
      state.error = action.payload;
    },
    clearRecommendationsError: (state) => {
      state.error = null;
    },
    clearRecommendations: (state) => {
      state.assets = [];
      state.creators = [];
      state.basedOn = {
        assets: null,
        creators: null
      };
      state.loadingAssets = false;
      state.loadingCreators = false;
      state.error = null;
    }
  }
});

export const {
  setRecommendedAssets,
  setRecommendedCreators,
  setRecommendationsLoading,
  setRecommendationsError,
  clearRecommendationsError,
  clearRecommendations
} = recommendationSlice.actions;

export default recommendationSlice.reducer;
