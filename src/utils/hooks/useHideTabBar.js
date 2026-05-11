import { useLayoutEffect } from 'react';

export default function useHideTabBar(navigation) {
  useLayoutEffect(() => {
    const parent = navigation.getParent();

    // Hide the tab bar by setting display:none on tabBarStyle
    parent?.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      // Restore the tab bar
      parent?.setOptions({
        tabBarStyle: undefined,
      });
    };
  }, [navigation]);
}
