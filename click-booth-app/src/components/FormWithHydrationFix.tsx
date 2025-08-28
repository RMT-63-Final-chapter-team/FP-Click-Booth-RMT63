"use client";

import React, { useEffect, useState } from "react";

interface FormWithHydrationFixProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

// Component wrapper untuk form yang tahan hydration error dari browser extension
export const FormWithHydrationFix: React.FC<FormWithHydrationFixProps> = ({
  children,
  ...props
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render form dengan suppressHydrationWarning setelah mounted
  return (
    <form {...props} suppressHydrationWarning>
      {mounted ? (
        children
      ) : (
        // Fallback content selama hydration
        <div suppressHydrationWarning>{children}</div>
      )}
    </form>
  );
};

// Component wrapper untuk input yang tahan hydration error
export const InputWithHydrationFix: React.FC<
  React.InputHTMLAttributes<HTMLInputElement>
> = (props) => {
  return (
    <input
      {...props}
      suppressHydrationWarning
      key={`${props.id || props.name || "input"}-${props.type || "text"}`}
    />
  );
};

interface ButtonWithHydrationFixProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

// Component wrapper untuk button yang tahan hydration error
export const ButtonWithHydrationFix: React.FC<ButtonWithHydrationFixProps> = ({
  children,
  ...props
}) => {
  return (
    <button {...props} suppressHydrationWarning>
      {children}
    </button>
  );
};
