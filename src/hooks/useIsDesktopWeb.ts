import { Platform, useWindowDimensions } from 'react-native';

/** Returns true only on web browser at desktop widths (>= 768px). */
export function useIsDesktopWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 768;
}
