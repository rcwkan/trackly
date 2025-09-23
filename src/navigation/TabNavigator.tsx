import React from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { useTheme, Icon } from 'react-native-paper';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../localization/translations';
import InputScreen from '../components/input/InputScreen';
import RaceScreen from '../components/race/RaceScreen';
import PredictionScreen from '../components/prediction/PredictionScreen';
import SettingsScreen from '../components/settings/SettingsScreen';

export type RootTabParamList = {
  Input: undefined;
  Races: undefined;
  Charts: { raceId?: string };
  Settings: undefined;
};

const Tab = createMaterialBottomTabNavigator<RootTabParamList>();

function TabNavigator() {
  const theme = useTheme();
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <Tab.Navigator
      initialRouteName="Input"
      activeColor={theme.colors.secondary}
      inactiveColor={theme.colors.outline}
      barStyle={{ backgroundColor: '#122c68' }}
    >
      <Tab.Screen
        name="Input"
        component={InputScreen}
        options={{
          tabBarLabel: t.input,
          tabBarIcon: ({ color }) => (
            <Icon source="database-import-outline" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Races"
        component={RaceScreen}
        options={{
          tabBarLabel: t.races,
          tabBarIcon: ({ color }) => <Icon source="horse" color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Charts"
        component={PredictionScreen}
        options={{
          tabBarLabel: t.predict,
          tabBarIcon: ({ color }) => <Icon source="chart-line" color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t.settings,
          tabBarIcon: ({ color }) => <Icon source="cog-outline" color={color} size={24} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default TabNavigator;