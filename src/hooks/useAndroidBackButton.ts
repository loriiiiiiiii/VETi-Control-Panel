import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

/**
 * Bridges the Android hardware back button to the browser history stack.
 * On web this is a no-op. Mount once inside the router (e.g. in AppLayout)
 * so `window.history.back()` pops the router stack.
 */
export function useAndroidBackButton() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const sub = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        void App.exitApp();
      }
    });

    return () => {
      void sub.then((handle) => handle.remove());
    };
  }, []);
}
