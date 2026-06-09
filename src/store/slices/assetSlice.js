import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  publicAssets: [],
  myAssets: [],
  loading: false
};

const assetSlice = createSlice({
  name: "assets",
  initialState,
  reducers: {
    setPublicAssets: (state, action) => {
      state.publicAssets = action.payload;
    },
    setMyAssets: (state, action) => {
      state.myAssets = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const {
  setPublicAssets,
  setMyAssets,
  setLoading
} = assetSlice.actions;

export default assetSlice.reducer;
