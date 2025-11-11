/**
 * React Router configuration
 */

import { createBrowserRouter } from "react-router"
import { RootLayout } from "./layouts/RootLayout"
import { HomePage } from "./pages/HomePage"
import { CharacterLibraryPage } from "./pages/CharacterLibraryPage"
import { CharacterSheetPage } from "./pages/CharacterSheetPage"
import { CharacterBuilderPage } from "./pages/CharacterBuilderPage"
import { SettingsPage } from "./pages/SettingsPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "characters",
        element: <CharacterLibraryPage />,
      },
      {
        path: "characters/new",
        element: <CharacterBuilderPage />,
      },
      {
        path: "characters/:id",
        element: <CharacterSheetPage />,
      },
      {
        path: "characters/:id/edit",
        element: <CharacterBuilderPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
])
