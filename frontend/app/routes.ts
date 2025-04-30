import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  {
    path: "/login",
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
