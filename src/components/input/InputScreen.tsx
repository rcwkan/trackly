import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Card, ActivityIndicator, Snackbar, useTheme, Text } from 'react-native-paper';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../localization/translations';
import { RootTabParamList } from '../../navigation/TabNavigator';

const InputScreen = () => {
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { lastUrl, setLastUrl, fetchData, loading, error } = useData();
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    if (error) {
      setSnackbarMessage(`${t.error}: ${error}`);
      setSnackbarVisible(true);
    }
  }, [error, t.error]);

  const handleFetchData = async () => {
    const success = await fetchData(lastUrl);
    if (success) {
      setSnackbarMessage(t.fetchSuccess);
      setSnackbarVisible(true);
      navigation.navigate('Races');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Title title={t.fetchRaceData} />
        <Card.Content>
          <TextInput
            label={t.raceUrlLabel}
            value={lastUrl}
            onChangeText={setLastUrl}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            accessibilityLabel={t.raceUrlLabel}
          />
          <Button
            mode="contained"
            onPress={handleFetchData}
            disabled={loading}
            style={styles.button}
            icon={loading ? () => <ActivityIndicator animating={true} color={theme.colors.onPrimary} /> : 'database-search'}
            accessibilityLabel={t.fetchRaceData}
          >
            {loading ? t.fetching : t.fetchRaceData}
          </Button>
        </Card.Content>
      </Card>
      <Text style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
        {t.disclaimer}
      </Text>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_MEDIUM}
      >
        {snackbarMessage}
      </Snackbar>
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
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  disclaimer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 12,
  },
});

export default InputScreen;