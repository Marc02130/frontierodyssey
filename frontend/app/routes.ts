import { type RouteConfig } from "@react-router/dev/routes";

export default [
  {
    path: "/",
    file: "routes/login.tsx",
  },
  {
    path: "/signup",
    file: "routes/signup.tsx",
  },
  {
    path: "/auth/callback",
    file: "routes/auth-callback.tsx",
  },
  {
    path: "/dashboard",
    file: "routes/dashboard.tsx",
  },
] satisfies RouteConfig;
