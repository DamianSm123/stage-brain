export const ROUTES = {
  SETUP: "/setup",
  LIVE: "/live",
  AUDIO_SOURCE: "/audio-source",
  POST_SHOW: "/post-show",
} as const;

export interface NavItem {
  label: string;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Setup", path: ROUTES.SETUP },
  { label: "Live", path: ROUTES.LIVE },
  { label: "Audio Source", path: ROUTES.AUDIO_SOURCE },
  { label: "Post-show", path: ROUTES.POST_SHOW },
];
