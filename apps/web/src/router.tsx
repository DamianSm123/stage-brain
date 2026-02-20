import { createBrowserRouter, Navigate } from "react-router";
import { PageLayout } from "@/components/PageLayout";
import { AudioSourcePage } from "@/features/audio-source";
import { LivePage } from "@/features/live";
import { PostShowPage } from "@/features/post-show";
import { SetupPage } from "@/features/setup";
import { ROUTES } from "@/types/navigation";

export const router = createBrowserRouter([
  {
    element: <PageLayout />,
    children: [
      { index: true, element: <Navigate to={ROUTES.SETUP} replace /> },
      { path: ROUTES.SETUP, element: <SetupPage /> },
      { path: ROUTES.LIVE, element: <LivePage /> },
      { path: ROUTES.AUDIO_SOURCE, element: <AudioSourcePage /> },
      { path: ROUTES.POST_SHOW, element: <PostShowPage /> },
    ],
  },
]);
