import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import StoreProvider from "./context/StoreContext"; // ✅ default export
import ProductProvider from "./context/ProductContext"; // ✅ product context
import "./index.css"; // ✅ Tailwind base
import "./styles/globals.css"; // ✅ your custom luxury theme

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StoreProvider>
      <ProductProvider>
        <App />
      </ProductProvider>
    </StoreProvider>
  </React.StrictMode>
);
