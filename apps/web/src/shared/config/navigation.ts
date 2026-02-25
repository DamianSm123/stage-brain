export const ROUTES = {
  DASHBOARD: "/",
  SHOW_EDITOR: "/shows/:id",
  SETLIST_TEMPLATES: "/setlist-templates",
  TEMPLATE_EDITOR: "/setlist-templates/:id",
  STATISTICS: "/statistics",
  POST_SHOW: "/post-show/:id",
  LIVE: "/live",
} as const;

export interface NavItem {
  label: string;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Koncerty", path: ROUTES.DASHBOARD },
  { label: "Live", path: ROUTES.LIVE },
  { label: "Szablony setlist", path: ROUTES.SETLIST_TEMPLATES },
  { label: "Statystyki", path: ROUTES.STATISTICS },
];
