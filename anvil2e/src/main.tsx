import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"
import { QueryClientProvider } from "@tanstack/react-query"
import "./index.css"
import { router } from "./routes"
import { queryClient } from "./lib/query"

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  // Dynamic import for PWA register (only available in build)
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({
        onNeedRefresh() {
          console.log("New content available, please refresh.")
        },
        onOfflineReady() {
          console.log("App ready to work offline")
        },
      })
    })
    .catch(() => {
      // PWA not available in dev mode
      console.log("PWA register not available (dev mode)")
    })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
