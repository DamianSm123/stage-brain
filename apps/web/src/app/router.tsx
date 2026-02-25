import { createBrowserRouter } from "react-router";
import { PageLayout } from "@/app/layouts/PageLayout";
import { DashboardPage } from "@/pages/dashboard";
import { LivePage } from "@/pages/live";
import { PostShowPage } from "@/pages/post-show";
import { SetlistTemplatesPage, TemplateEditorPage } from "@/pages/setlist-templates";
import { ShowEditorPage } from "@/pages/show-editor";
import { StatisticsPage } from "@/pages/statistics";
import { ROUTES } from "@/shared/config/navigation";

export const router = createBrowserRouter([
  {
    element: <PageLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: ROUTES.SHOW_EDITOR, element: <ShowEditorPage /> },
      { path: ROUTES.SETLIST_TEMPLATES, element: <SetlistTemplatesPage /> },
      { path: ROUTES.TEMPLATE_EDITOR, element: <TemplateEditorPage /> },
      { path: ROUTES.STATISTICS, element: <StatisticsPage /> },
      { path: ROUTES.POST_SHOW, element: <PostShowPage /> },
    ],
  },
  { path: ROUTES.LIVE, element: <LivePage /> },
]);
