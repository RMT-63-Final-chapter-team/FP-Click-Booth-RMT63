"use client";

import dynamic from "next/dynamic";
import React from "react";

// Component NoSSR untuk menghindari hydration error
const NoSSR: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Export NoSSR component yang hanya render di client side
export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
});

// Hook untuk memastikan component hanya render setelah mount
export const useClientOnly = () => {
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
};
