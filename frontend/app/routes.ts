import { type RouteConfig } from "@react-router/dev/routes";

export default [
  {
    path: "/",
    file: "routes/login/login.tsx",
  },
  {
    path: "/signup",
    file: "routes/login/signup.tsx",
  },
  {
    path: "/check-email",
    file: "routes/login/check-email.tsx",
  },
  {
    path: "/auth/callback",
    file: "routes/login/auth-callback.tsx",
  },
  {
    path: "/dashboard",
    file: "routes/dashboard.tsx",
    children: [
      {
        index: true,
        file: "routes/dashboard.index.tsx"
      },
      {
        path: "onboarding",
        file: "routes/onboarding/dashboard.onboarding.tsx"
      },
      {
        path: "review_onboarding",
        file: "routes/onboarding/dashboard.review_onboarding.tsx"
      }
    ]
  },
] satisfies RouteConfig;
