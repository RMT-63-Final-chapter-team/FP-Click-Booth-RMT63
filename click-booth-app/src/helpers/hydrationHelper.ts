import React from "react";

// Utility to suppress hydration warnings caused by browser extensions
export const createNoSSRWrapper = <T extends object>(
  Component: React.ComponentType<T>
) => {
  const NoSSRComponent = (props: T) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return null;
    }

    return React.createElement(Component, props);
  };

  NoSSRComponent.displayName = `NoSSR(${
    Component.displayName || Component.name
  })`;
  return NoSSRComponent;
};

// Hook to check if component is mounted (client-side)
export const useIsMounted = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
};
