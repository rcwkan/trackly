import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, SegmentedButtons, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
// FIX: Import the `Language` enum to be used for type casting.
import { Language, useLanguage } from '../../context/LanguageContext';
import { translations } from '../../localization/translations';

const SettingsScreen = () => {
  const theme = useTheme();
  const { language, setLanguage, autoRefresh, setAutoRefresh } = useLanguage();
  const t = translations[language];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Title title={t.appSettings} />
        <Card.Content>
          <Text style={styles.label}>{t.language}</Text>
          <SegmentedButtons
            value={language}
            // FIX: Cast the value to the `Language` enum type.
            onValueChange={(value) => setLanguage(value as Language)}
            buttons={[
              // FIX: Use Language enum values for SegmentedButtons to resolve type errors.
              { value: Language.EN, label: 'English' },
              { value: Language.CH, label: '中文' },
            ]}
            style={styles.segmentedButtons}
          />
          <View style={styles.settingRow}>
            <Text style={styles.label}>{t.autoRefresh}</Text>
            <Switch value={autoRefresh} onValueChange={setAutoRefresh} />
          </View>
          <Text style={styles.settingsText}>{t.futureSettings}</Text>
        </Card.Content>
      </Card>
      <Text style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
        {t.disclaimer}
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    padding: 8,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  settingsText: {
    marginTop: 8,
  },
  disclaimer: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default SettingsScreen;