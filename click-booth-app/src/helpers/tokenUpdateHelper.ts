// Helper for token updates across components
export const dispatchTokenUpdate = (tokens?: number) => {
  const event = new CustomEvent("tokenUpdate", {
    detail: {
      tokens,
      timestamp: Date.now(),
    },
  });
  window.dispatchEvent(event);
};

export const addTokenUpdateListener = (callback: (tokens?: number) => void) => {
  const handleTokenUpdate = (event: CustomEvent) => {
    callback(event.detail?.tokens);
  };

  window.addEventListener("tokenUpdate", handleTokenUpdate as EventListener);

  return () => {
    window.removeEventListener(
      "tokenUpdate",
      handleTokenUpdate as EventListener
    );
  };
};

// Helper for authentication state changes
export const dispatchAuthUpdate = (
  action: "login" | "logout",
  userData?: { id: string; email: string; role: string; tokens?: number }
) => {
  const event = new CustomEvent("authUpdate", {
    detail: {
      action,
      userData,
      timestamp: Date.now(),
    },
  });
  window.dispatchEvent(event);
};

export const addAuthUpdateListener = (
  callback: (
    action: "login" | "logout",
    userData?: { id: string; email: string; role: string; tokens?: number }
  ) => void
) => {
  const handleAuthUpdate = (event: CustomEvent) => {
    callback(event.detail?.action, event.detail?.userData);
  };

  window.addEventListener("authUpdate", handleAuthUpdate as EventListener);

  return () => {
    window.removeEventListener("authUpdate", handleAuthUpdate as EventListener);
  };
};
