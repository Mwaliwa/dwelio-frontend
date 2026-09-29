import React from "react";
import { createRoot } from "react-dom/client";

/* =========================================================
   IONIC CORE CSS
========================================================= */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* =========================================================
   IONIC UTILITY CSS
========================================================= */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* =========================================================
   LEAFLET CSS
   Required because your property/map pages use react-leaflet.
========================================================= */
import "leaflet/dist/leaflet.css";

/* =========================================================
   APPLICATION
========================================================= */
import App from "./App";

/* =========================================================
   AUTHENTICATION
========================================================= */
import { AuthProvider } from "./context/AuthContext";

/* =========================================================
   GLOBAL STYLES
========================================================= */
import "./theme/variables.css";

/* =========================================================
   ROOT ELEMENT
========================================================= */
const container = document.getElementById("root");

if (!container) {
  throw new Error(
    "Root element not found. Make sure index.html contains <div id=\"root\"></div>."
  );
}

/* =========================================================
   REACT ROOT
========================================================= */
const root = createRoot(container);

/* =========================================================
   APPLICATION BOOTSTRAP
========================================================= */

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);