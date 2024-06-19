import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { PostHogProvider } from "posthog-js/react";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_POSTHOG_HOST,
        person_profiles: "always",
      }}
    >
      <App />
    </PostHogProvider>
  </React.StrictMode>,
);
