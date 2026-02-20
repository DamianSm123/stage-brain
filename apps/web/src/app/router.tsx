import { createBrowserRouter, Navigate } from "react-router";
import { PageLayout } from "@/app/layouts/PageLayout";
import { AudioSourcePage } from "@/pages/audio-source";
import { LivePage } from "@/pages/live";
import { PostShowPage } from "@/pages/post-show";
import { SetupPage } from "@/pages/setup";
import { ROUTES } from "@/shared/config/navigation";

export const router = createBrowserRouter([
  {
    element: <PageLayout />,
    children: [
      { index: true, element: <Navigate to={ROUTES.SETUP} replace /> },
      { path: ROUTES.SETUP, element: <SetupPage /> },
      { path: ROUTES.AUDIO_SOURCE, element: <AudioSourcePage /> },
      { path: ROUTES.POST_SHOW, element: <PostShowPage /> },
    ],
  },
  { path: ROUTES.LIVE, element: <LivePage /> },
]);
