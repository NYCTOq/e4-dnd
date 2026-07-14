import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AppErrorBoundary } from "./shared/errors/AppErrorBoundary";
import { AppSettingsProvider } from "./shared/settings/AppSettingsProvider";
import { FavoritesProvider } from "./shared/favorites/FavoritesProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppSettingsProvider>
        <FavoritesProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <App />
          </BrowserRouter>
        </FavoritesProvider>
      </AppSettingsProvider>
    </AppErrorBoundary>
  </StrictMode>
);