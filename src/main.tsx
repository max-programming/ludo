import React from "react";
import ReactDOM from "react-dom/client";
import { PostHogProvider } from "posthog-js/react";
import { PageRoutes } from "./components/PageRoutes.tsx";
import { Provider } from "jotai";
import { DevTools } from "jotai-devtools";
import { ludoStore } from "./utils/atoms.ts";

import "./index.css";
import "jotai-devtools/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_POSTHOG_HOST,
        person_profiles: "always",
      }}
    >
      <Provider store={ludoStore}>
        <DevTools store={ludoStore} />
        <PageRoutes />
      </Provider>
    </PostHogProvider>
  </React.StrictMode>,
);
