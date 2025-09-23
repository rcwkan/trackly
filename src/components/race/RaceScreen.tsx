import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { Card, DataTable, Text, useTheme, Portal, Modal, Button, ActivityIndicator, SegmentedButtons, Chip, Switch } from 'react-native-paper';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../../context/DataContext';
// FIX: Import the `Language` enum to be used for type casting.
import { Language, useLanguage } from '../../context/LanguageContext';
import { translations } from '../../localization/translations';
import { Race, Runner } from '../../models/Hkjc';
import { RootTabParamList } from '../../navigation/TabNavigator';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { fetchAndPopulateAllOdds, fetchAndPopulateSingleRaceOdds } from '../../services/HkjcApiService';
import { tfLitePredict } from '../../services/tfLiteService';
import type { AppTheme } from '../../../App';

const RaceScreen = () => {
  const { raceMeetings, setRaceMeetings, horseData, jockeyData, trainerData, lastUrl, setOddsHistory, loading: loadingData } = useData();
  const { language } = useLanguage();
  const t = translations[language];
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedRaceIndex, setSelectedRaceIndex] = React.useState(0);
  const [loadingOdds, setLoadingOdds] = React.useState(false);
  const [loadingPredictions, setLoadingPredictions] = React.useState(false);
  const [predictions, setPredictions] = React.useState<Runner[]>([]);
  const [lastOddsRefreshTime, setLastOddsRefreshTime] = useState<Date | null>(null);

  const [sortColumn, setSortColumn] = React.useState('predictedRank');
  const [sortDirection, setSortDirection] = React.useState<'ascending' | 'descending'>('ascending');

  const theme = useTheme<AppTheme>();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();

  const raceMeeting = raceMeetings?.[0];
  const races = raceMeeting?.races || [];
  const selectedRace: Race | null = races.length > 0 ? races[selectedRaceIndex] : null;

  const handleOddsRefresh = useCallback(async () => {
    if (!raceMeetings) {
      return;
    }
    setLoadingOdds(true);
    try {
      const [updatedRaceMeetings, newHistory] = await fetchAndPopulateAllOdds(raceMeetings);
      setRaceMeetings(updatedRaceMeetings);
      setOddsHistory(newHistory);
      setLastOddsRefreshTime(new Date());
    } catch (error) {
      console.error("Failed to refresh all odds:", error);
    } finally {
      setLoadingOdds(false);
    }
  }, [raceMeetings, setRaceMeetings, setOddsHistory]);

  const { autoRefresh, setAutoRefresh } = useLanguage();
  React.useEffect(() => {
    if (!autoRefresh || !lastUrl) {
      return;
    }

    const intervalId = setInterval(() => {
      handleOddsRefresh();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [autoRefresh, lastUrl, handleOddsRefresh]);
  
  React.useEffect(() => {
    const runPrediction = async () => {
      if (!selectedRace || !raceMeeting) {
        setPredictions([]);
        return;
      }
      setLoadingPredictions(true);
      try {
        const predictedRunners = await tfLitePredict(selectedRace, raceMeeting, horseData, jockeyData, trainerData);
        setPredictions(predictedRunners);
      } catch (e) {
        console.error("Prediction failed in RaceScreen", e);
      } finally {
        setLoadingPredictions(false);
      }
    };
    runPrediction();
  }, [selectedRace, horseData, jockeyData, trainerData]);

  React.useEffect(() => {
    const updateOdds = async () => {
      if (!raceMeetings || !selectedRace) {
        return;
      }
      // Don't refetch if odds are already loaded for the runners
      const hasOdds = selectedRace.runners.some(r => r.winOdds !== undefined && r.winOdds !== null);
      if (hasOdds) return;

      setLoadingOdds(true);
      try {
        const [updatedMeetings, newHistory] = await fetchAndPopulateSingleRaceOdds(raceMeetings, selectedRace.no);
        setRaceMeetings(updatedMeetings);
        setOddsHistory(newHistory);
      } catch (error) {
        console.error("Failed to update odds for selected race:", error);
      } finally {
        setLoadingOdds(false);
      }
    };
    
    updateOdds();
  }, [selectedRaceIndex, raceMeeting?.id]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
    } else {
      setSortColumn(column);
      setSortDirection('ascending');
    }
  };

  const sortedRunners = useMemo(() => {
    const items = [...predictions];
    items.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortColumn) {
        case 'no': aValue = Number(a.no); bValue = Number(b.no); break;
        case 'predictedRank': aValue = Number(a.predictedRank ?? Infinity); bValue = Number(b.predictedRank ?? Infinity); break;
        case 'winOdds': aValue = Number(a.winOdds ?? Infinity); bValue = Number(b.winOdds ?? Infinity); break;
        case 'placeOdds': aValue = Number(a.placeOdds ?? Infinity); bValue = Number(b.placeOdds ?? Infinity); break;
        case 'barrier': aValue = Number(a.barrierDrawNumber); bValue = Number(b.barrierDrawNumber); break;
        case 'horse':
            aValue = language === 'en' ? a.name_en : a.name_ch;
            bValue = language === 'en' ? b.name_en : b.name_ch;
            break;
        case 'jockey':
            aValue = language === 'en' ? a.jockey.name_en : a.jockey.name_ch;
            bValue = language === 'en' ? b.jockey.name_en : b.jockey.name_ch;
            break;
        case 'trainer':
            aValue = language === 'en' ? a.trainer.name_en : a.trainer.name_ch;
            bValue = language === 'en' ? b.trainer.name_en : b.trainer.name_ch;
            break;
        case 'weight': aValue = Number(a.handicapWeight); bValue = Number(b.handicapWeight); break;
        case 'rating': aValue = Number(a.currentRating ?? -Infinity); bValue = Number(b.currentRating ?? -Infinity); break;
        case 'actualWgt': aValue = Number(a.currentWeight ?? -Infinity); bValue = Number(b.currentWeight ?? -Infinity); break;
        default: return 0;
      }

      if (typeof aValue === 'string') {
          return (sortDirection === 'ascending' ? 1 : -1) * aValue.localeCompare(bValue);
      }

      if (aValue < bValue) return sortDirection === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'ascending' ? 1 : -1;
      return 0;
    });
    return items;
  }, [predictions, sortColumn, sortDirection, language]);

  if (!raceMeetings) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall">{t.noDataAvailable}</Text>
        <Text>{t.fetchDataInstruction}</Text>
      </SafeAreaView>
    );
  }

  if (!raceMeeting) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall">{t.noRaceMeeting}</Text>
      </SafeAreaView>
    );
  }

  if (selectedRaceIndex >= races.length && races.length > 0) {
    setSelectedRaceIndex(0);
  }

  const textColor = { color: theme.colors.onSurface };
  const headerTextColor = { color: theme.colors.onPrimary };
  const modalContainerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    padding: 20,
    margin: 20,
    borderRadius: theme.roundness,
    maxHeight: '90%',
  };

  const venueMap = t.venueMap;
  const headers = t.raceHeaders;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={modalContainerStyle}>
          <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {t.rawData}
          </Text>
          <ScrollView>
            <Text selectable style={[styles.jsonText, textColor]}>{JSON.stringify(raceMeetings, null, 2)}</Text>
          </ScrollView>
          <Button style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>{t.close}</Button>
        </Modal>
        {loadingData && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
          </View>
        )}
      </Portal>

      <ScrollView style={styles.container}>
        <View style={styles.bottomTop}>
          <BannerAd
            unitId="ca-app-pub-5605412363416280/5170850758"
            size={BannerAdSize.FULL_BANNER}
          />
        </View>
        <Card style={styles.card}>
          <Card.Title
            title={`${venueMap[raceMeeting.venueCode] || raceMeeting.venueCode} (${raceMeeting.venueCode})`}
            subtitle={`${t.date}: ${raceMeeting.date} - ${raceMeeting.totalNumberOfRace} ${t.races}`}
            titleStyle={{ color: theme.colors.primary }}
          />
          <Card.Content>
             <View style={styles.autoRefreshContainer}>
              <Text>{t.autoRefresh}</Text>
              <Switch value={autoRefresh} onValueChange={setAutoRefresh} />
            </View>
            {lastOddsRefreshTime && (
              <Text style={[styles.refreshTimestamp, { color: theme.colors.onSurfaceVariant }]}>
                {`${t.lastRefresh} ${lastOddsRefreshTime.toLocaleTimeString()}`}
              </Text>
            )}
          </Card.Content>
        </Card>

        {races.length > 0 && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
              {races.map((race, index) => (
                <Chip
                  showSelectedCheck={false}
                  key={race.id}
                  mode="flat"
                  selected={selectedRaceIndex === index}
                  onPress={() => setSelectedRaceIndex(index)}
                  style={[styles.chip, { backgroundColor: selectedRaceIndex === index ? theme.colors.primary : theme.colors.surface }]}
                  textStyle={{ color: selectedRaceIndex === index ? theme.colors.onPrimary : theme.colors.onSurface }}
                >
                  {`${language === 'en' ? t.racePrefix : ''}${race.no}${language === 'ch' ? t.raceSuffix : ''}`}
                </Chip>
              ))}
            </ScrollView>

            {selectedRace && (
              <Card style={styles.raceCard}>
                <Card.Title
                  title={`${language === 'en' ? `${t.race} ${selectedRace.no}` : `第 ${selectedRace.no} 場`} - ${selectedRace.distance}m`}
                  subtitle={language === 'en' ? selectedRace.raceName_en : selectedRace.raceName_ch}
                  titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
                  subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
                  right={(props) => (
                    <View style={styles.cardTitleRight}>
                      {(loadingOdds || loadingPredictions) && <ActivityIndicator animating={true} style={{marginRight: 8}} />}
                      <Button
                        {...props}
                        mode="contained-tonal"
                        onPress={handleOddsRefresh}
                        disabled={loadingData || loadingOdds || loadingPredictions}
                      >
                        {t.refresh}
                      </Button>
                    </View>
                  )}
                />
                <ScrollView horizontal>
                  <DataTable>
                    <DataTable.Header style={{ backgroundColor: '#122c68' }}>
                      <DataTable.Title style={styles.colNo} textStyle={[headerTextColor, sortColumn === 'no' && { color: theme.colors.accent }]} onPress={() => handleSort('no')} sortDirection={sortColumn === 'no' ? sortDirection : undefined}>{headers.no}</DataTable.Title>
                      <DataTable.Title style={styles.colHorse} textStyle={[headerTextColor, sortColumn === 'horse' && { color: theme.colors.accent }]} onPress={() => handleSort('horse')} sortDirection={sortColumn === 'horse' ? sortDirection : undefined}>{headers.horse}</DataTable.Title>
                      <DataTable.Title style={styles.colPred} textStyle={[headerTextColor, sortColumn === 'predictedRank' && { color: theme.colors.accent }]} onPress={() => handleSort('predictedRank')} sortDirection={sortColumn === 'predictedRank' ? sortDirection : undefined}>{headers.prediction}</DataTable.Title>
                      <DataTable.Title style={styles.colOdds} textStyle={[headerTextColor, sortColumn === 'winOdds' && { color: theme.colors.accent }]} onPress={() => handleSort('winOdds')} sortDirection={sortColumn === 'winOdds' ? sortDirection : undefined}>{headers.winOdds}</DataTable.Title>
                      <DataTable.Title style={styles.colOdds} textStyle={[headerTextColor, sortColumn === 'placeOdds' && { color: theme.colors.accent }]} onPress={() => handleSort('placeOdds')} sortDirection={sortColumn === 'placeOdds' ? sortDirection : undefined}>{headers.placeOdds}</DataTable.Title>
                      <DataTable.Title style={styles.colJockey} textStyle={[headerTextColor, sortColumn === 'jockey' && { color: theme.colors.accent }]} onPress={() => handleSort('jockey')} sortDirection={sortColumn === 'jockey' ? sortDirection : undefined}>{headers.jockey}</DataTable.Title>
                      <DataTable.Title style={styles.colTrainer} textStyle={[headerTextColor, sortColumn === 'trainer' && { color: theme.colors.accent }]} onPress={() => handleSort('trainer')} sortDirection={sortColumn === 'trainer' ? sortDirection : undefined}>{headers.trainer}</DataTable.Title>
                      <DataTable.Title style={styles.colWgt} textStyle={[headerTextColor, sortColumn === 'weight' && { color: theme.colors.accent }]} onPress={() => handleSort('weight')} sortDirection={sortColumn === 'weight' ? sortDirection : undefined}>{headers.weight}</DataTable.Title>
                      <DataTable.Title style={styles.colBarrier} textStyle={[headerTextColor, sortColumn === 'barrier' && { color: theme.colors.accent }]} onPress={() => handleSort('barrier')} sortDirection={sortColumn === 'barrier' ? sortDirection : undefined}>{headers.barrier}</DataTable.Title>
                      <DataTable.Title style={styles.colRating} textStyle={[headerTextColor, sortColumn === 'rating' && { color: theme.colors.accent }]} onPress={() => handleSort('rating')} sortDirection={sortColumn === 'rating' ? sortDirection : undefined}>{headers.rating}</DataTable.Title>
                      <DataTable.Title style={styles.colLast6} textStyle={headerTextColor}>{headers.last6}</DataTable.Title>
                      <DataTable.Title style={styles.colGear} textStyle={headerTextColor}>{headers.gear}</DataTable.Title>
                      <DataTable.Title style={styles.colActualWgt} textStyle={[headerTextColor, sortColumn === 'actualWgt' && { color: theme.colors.accent }]} onPress={() => handleSort('actualWgt')} sortDirection={sortColumn === 'actualWgt' ? sortDirection : undefined}>{headers.actualWgt}</DataTable.Title>
                    </DataTable.Header>
                    {sortedRunners.map((runner, index) => (
                      <DataTable.Row
                        key={runner.id}
                        style={[
                          { borderBottomColor: theme.colors.outline },
                          index % 2 !== 0 ? { backgroundColor: theme.colors.stripedRowBackground } : { backgroundColor: theme.colors.rowBackground }
                        ]}
                      >
                        <DataTable.Cell style={styles.colNo} textStyle={textColor}>{runner.no}</DataTable.Cell>
                        <DataTable.Cell style={styles.colHorse} textStyle={textColor}>{language === 'en' ? runner.name_en : runner.name_ch}</DataTable.Cell>
                        <DataTable.Cell style={styles.colPred} textStyle={textColor}>{runner.predictedRank ?? '-'}</DataTable.Cell>
                        <DataTable.Cell style={styles.colOdds} textStyle={textColor}>{runner.winOdds ?? '-'}</DataTable.Cell>
                        <DataTable.Cell style={styles.colOdds} textStyle={textColor}>{runner.placeOdds ?? '-'}</DataTable.Cell>
                        <DataTable.Cell style={styles.colJockey} textStyle={textColor}>{language === 'en' ? runner.jockey.name_en : runner.jockey.name_ch}</DataTable.Cell>
                        <DataTable.Cell style={styles.colTrainer} textStyle={textColor}>{language === 'en' ? runner.trainer.name_en : runner.trainer.name_ch}</DataTable.Cell>
                        <DataTable.Cell style={styles.colWgt} textStyle={textColor}>{runner.handicapWeight}</DataTable.Cell>
                        <DataTable.Cell style={styles.colBarrier} textStyle={textColor}>{runner.barrierDrawNumber}</DataTable.Cell>
                        <DataTable.Cell style={styles.colRating} textStyle={textColor}>{runner.currentRating ?? '-'}</DataTable.Cell>
                        <DataTable.Cell style={styles.colLast6} textStyle={textColor}>{runner.last6run ?? '-'}</DataTable.Cell>
                        <DataTable.Cell style={styles.colGear} textStyle={textColor}>{runner.gearInfo ?? '-'}</DataTable.Cell>
                        <DataTable.Cell style={styles.colActualWgt} textStyle={textColor}>{runner.currentWeight ?? '-'}</DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </ScrollView>
              </Card>
            )}
            <Text style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
              {t.disclaimer}
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    margin: 8,
  },
  raceCard: {
    marginHorizontal: 8,
    marginBottom: 8,
  },
  cardTitleRight: {
    flexDirection: 'row', 
    alignItems: 'center',
    marginRight: 8
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  jsonText: {
    fontFamily: 'monospace',
  },
  modalCloseButton: {
    marginTop: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  autoRefreshContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
  refreshTimestamp: {
    marginTop: 4,
    textAlign: 'right',
    fontSize: 12,
  },
  chipContainer: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  chip: {
    marginRight: 8,
    justifyContent: 'center',
  },
  disclaimer: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
  },
  bottomTop: {
    top: 0
  },
  // Column Styles
  colNo: { width: 40, justifyContent: 'center' },
  colHorse: { width: 150, justifyContent: 'center' },
  colPred: { width: 80, justifyContent: 'center' },
  colJockey: { width: 120, justifyContent: 'center' },
  colTrainer: { width: 120, justifyContent: 'center' },
  colWgt: { width: 70, justifyContent: 'center' },
  colBarrier: { width: 70, justifyContent: 'center' },
  colOdds: { width: 70, justifyContent: 'center' },
  colRating: { width: 70, justifyContent: 'center' },
  colLast6: { width: 100, justifyContent: 'center' },
  colGear: { width: 80, justifyContent: 'center' },
  colActualWgt: { width: 80, justifyContent: 'center' },
});

export default RaceScreen;