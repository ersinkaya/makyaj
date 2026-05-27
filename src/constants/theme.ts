/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#E8A7B5', // Powder Pink / Rose Gold
    accent: '#D48C9E', // Deeper Coral Pink
    text: '#4A3538', // Deep Plum
    background: '#FFF5F5', // Creamy Pink Background
    backgroundElement: '#FFF0F2', // Soft Pink Element
    backgroundSelected: '#FAD2E1', // Highlight Pink
    textSecondary: '#8C7377', // Muted Rose
    border: '#E8D3D6',
    success: '#81B29A',
    warning: '#F2CC8F',
  },
  dark: {
    primary: '#F8B3C2', // Bright Powder Pink
    accent: '#E07A5F', // Deep Pink Terracotta
    text: '#FFF0F2', // Soft Pinkish White
    background: '#1F1214', // Rich Dark Cherry
    backgroundElement: '#2C1D20', // Medium Dark Cherry
    backgroundSelected: '#422C30', // Highlight Dark Rose
    textSecondary: '#CDB5B8', // Muted Pink Grey
    border: '#3D2B2E',
    success: '#81B29A',
    warning: '#F2CC8F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
