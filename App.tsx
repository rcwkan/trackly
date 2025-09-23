import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DataProvider } from './src/context/DataContext';
import { LanguageProvider } from './src/context/LanguageContext';
import TabNavigator from './src/navigation/TabNavigator';

// FIX: Added module augmentation for react-native-paper's theme to include
// custom color properties. This resolves TypeScript errors where the custom
// colors `stripedRowBackground` and `rowBackground` were not recognized on the
// MD3Colors type.
declare module 'react-native-paper' {
  interface MD3Colors {
    stripedRowBackground: string;
    rowBackground: string;
    success: string;
    accent: string;
  }
}

// Define a custom theme that extends the default theme with additional colors
// for striped data tables, improving readability.
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#122c68',
    secondary: '#FFFFFF',
    stripedRowBackground: '#f0f0f0', // Lighter shade for odd rows
    rowBackground: '#ffffff', // Standard white for even rows
    success: '#4CAF50', // Green color for candlestick chart
    accent: '#FFC107', // Gold/Amber for sort indicator
  },
};

// FIX: Export the theme type to be used with the useTheme hook in components.
export type AppTheme = typeof theme;

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <LanguageProvider>
          <DataProvider>
            <NavigationContainer>
              <TabNavigator />
            </NavigationContainer>
          </DataProvider>
        </LanguageProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}