import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import assetReducer from "./slices/assetSlice";
import recommendationReducer from "./slices/recommendationSlice";

import chatReducer from "./slices/chatSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    assets: assetReducer,
    recommendations: recommendationReducer,
    chat: chatReducer
  }
});

export default store;
