import { lazy } from "react";

export const pages = {
  login: lazy(() => import("../pages/Login")),
  home: lazy(() => import("../pages/Home")),
  offers: lazy(() => import("../pages/Offers")),
  cart: lazy(() => import("../pages/Cart")),
  profile: lazy(() => import("../pages/Profile")),
  admin: lazy(() => import("../pages/Admin")),
  dataEntry: lazy(() => import("../pages/DataEntry")),
  representative: lazy(() => import("../pages/Representative")),
  notFound: lazy(() => import("@/pages/not-found")),
};

const preloaders: Record<string, () => Promise<unknown>> = {
  "/": () => import("../pages/Login"),
  "/home": () => import("../pages/Home"),
  "/offers": () => import("../pages/Offers"),
  "/cart": () => import("../pages/Cart"),
  "/profile": () => import("../pages/Profile"),
  "/admin": () => import("../pages/Admin"),
  "/data-entry": () => import("../pages/DataEntry"),
  "/representative": () => import("../pages/Representative"),
};

export function preloadPage(path: string) {
  const preload = preloaders[path];
  if (preload) void preload();
}