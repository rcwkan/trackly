import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Chip, Text, useTheme, SegmentedButtons, DataTable, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../../context/DataContext';
import { Language, useLanguage } from '../../context/LanguageContext';
import { translations } from '../../localization/translations';
import { Runner, Race } from '../../models/Hkjc';
import { OddPoint } from '../../services/storageService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import type { AppTheme } from '../../../App';

const screenWidth = Dimensions.get('window').width;

// --- Data Structure for Candlestick Chart ---
interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// --- Chart Component: Line Chart ---
const LineChart = ({ data, theme }: { data: OddPoint[], theme: AppTheme }) => {
  if (!data || data.length < 2) {
    return <View style={styles.chartContainer}><Text>Not enough odds history for this horse.</Text></View>;
  }

  const chartHeight = 250;
  const chartWidth = screenWidth - 100;
  const lineThickness = 2;

  const allOdds = data.flatMap(d => [d.winOdds, d.placeOdds]).filter(d => d != null) as number[];
  if (allOdds.length === 0) {
      return <View style={styles.chartContainer}><Text>No odds history for this horse.</Text></View>;
  }

  const yMinRaw = Math.min(...allOdds);
  const yMaxRaw = Math.max(...allOdds);
  const yPadding = (yMaxRaw - yMinRaw) * 0.1 || 1;
  const yMin = Math.max(0, yMinRaw - yPadding);
  const yMax = yMaxRaw + yPadding;
  const yRange = yMax - yMin;

  const xMin = data[0].timestamp;
  const xMax = data[data.length - 1].timestamp;
  const xRange = xMax - xMin;

  const numYLabels = 5;
  const yAxisLabels = Array.from({ length: numYLabels + 1 }, (_, i) => {
    const value = yMin + (yRange / numYLabels) * i;
    return value.toFixed(1);
  });

  const getXPosition = (timestamp: number) => {
    if (xRange === 0) return chartWidth / 2;
    return ((timestamp - xMin) / xRange) * chartWidth;
  };

  const getYPosition = (value: number) => {
    if (yRange === 0) return chartHeight / 2;
    return chartHeight - ((value - yMin) / yRange) * chartHeight;
  };

  const renderLine = (oddsKey: 'winOdds' | 'placeOdds', color: string) => {
    const segments = [];
    for (let i = 0; i < data.length - 1; i++) {
        const p1 = data[i];
        const p2 = data[i+1];

        if (p1[oddsKey] != null && p2[oddsKey] != null) {
            const y1 = getYPosition(p1[oddsKey] as number);
            const y2 = getYPosition(p2[oddsKey] as number);
            const x1 = getXPosition(p1.timestamp);
            const x2 = getXPosition(p2.timestamp);

            const dx = x2 - x1;
            const dy = y2 - y1;
            const distance = Math.sqrt(dx*dx + dy*dy);
            const angleRad = Math.atan2(dy, dx);
            const angleDeg = angleRad * 180 / Math.PI;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            
            segments.push(
                <View
                    key={`${oddsKey}-${p1.timestamp}`}
                    style={{
                        position: 'absolute',
                        left: midX - distance / 2,
                        top: midY - lineThickness / 2,
                        width: distance,
                        height: lineThickness,
                        backgroundColor: color,
                        transform: [{ rotate: `${angleDeg}deg` }]
                    }}
                />
            );
        }
    }
    return segments;
  };

  return (
    <View style={styles.chartWrapper}>
      <View style={{ width: 40, height: chartHeight, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 4 }}>
        {yAxisLabels.reverse().map(label => <Text key={label} style={styles.axisLabel}>{label}</Text>)}
      </View>
      <View>
          <View style={[styles.chartContainer, { height: chartHeight, width: chartWidth }]}>
            {renderLine('winOdds', theme.colors.primary)}
            {renderLine('placeOdds', theme.colors.success)}
          </View>
          <View style={{ width: chartWidth, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
            {data.length > 0 && <Text style={styles.axisLabel}>{new Date(data[0].timestamp).toLocaleTimeString()}</Text>}
            {data.length > 1 && <Text style={styles.axisLabel}>{new Date(data[data.length - 1].timestamp).toLocaleTimeString()}</Text>}
          </View>
      </View>
    </View>
  );
};


// --- Chart Component: Candlestick Chart ---
const CandlestickChart = ({ data, theme }: { data: CandlestickData[], theme: AppTheme }) => {
    if (!data || data.length === 0) {
      return <View style={styles.chartContainer}><Text>Not enough odds history for this horse.</Text></View>;
    }

    const chartHeight = 250;
    const chartWidth = screenWidth - 100;
    const candleWidth = Math.max(5, chartWidth / (data.length * 1.5));

    const allLows = data.map(d => d.low);
    const allHighs = data.map(d => d.high);
    const yMinRaw = Math.min(...allLows);
    const yMaxRaw = Math.max(...allHighs);
    const yPadding = (yMaxRaw - yMinRaw) * 0.1 || 1;
    const yMin = Math.max(0, yMinRaw - yPadding);
    const yMax = yMaxRaw + yPadding;
    const yRange = yMax - yMin;

    const numYLabels = 5;
    const yAxisLabels = Array.from({ length: numYLabels + 1 }, (_, i) => (yMin + (yRange / numYLabels) * i).toFixed(1));

    const getYPosition = (value: number) => {
        if (yRange === 0) return chartHeight / 2;
        return chartHeight - ((value - yMin) / yRange) * chartHeight;
    };

    return (
        <View style={styles.chartWrapper}>
            <View style={{ width: 40, height: chartHeight, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 4 }}>
                {yAxisLabels.reverse().map(label => <Text key={label} style={styles.axisLabel}>{label}</Text>)}
            </View>
            <View>
                <View style={[styles.chartContainer, { height: chartHeight, width: chartWidth, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }]}>
                    {data.map((candle, index) => {
                        const yOpen = getYPosition(candle.open);
                        const yClose = getYPosition(candle.close);
                        const yHigh = getYPosition(candle.high);
                        const yLow = getYPosition(candle.low);
                        const isBullish = candle.close > candle.open;
                        const color = isBullish ? theme.colors.success : theme.colors.error;

                        return (
                            <View key={index} style={{ height: chartHeight, width: candleWidth, alignItems: 'center' }}>
                                <View style={[styles.wick, { height: yLow - yHigh, top: yHigh, backgroundColor: color }]} />
                                <View style={[styles.candleBody, { top: Math.min(yOpen, yClose), height: Math.abs(yOpen - yClose), backgroundColor: color }]} />
                            </View>
                        );
                    })}
                </View>
                <View style={{ width: chartWidth, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
                    {data.length > 0 && <Text style={styles.axisLabel}>{new Date(data[0].timestamp).toLocaleTimeString()}</Text>}
                    {data.length > 1 && <Text style={styles.axisLabel}>{new Date(data[data.length - 1].timestamp).toLocaleTimeString()}</Text>}
                </View>
            </View>
        </View>
    );
};


const PredictionScreen = () => {
  const { raceMeetings, oddsHistory } = useData();
  const { language } = useLanguage();
  const t = translations[language];
  const theme = useTheme<AppTheme>();

  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [timeRange, setTimeRange] = useState<number | null>(null); // in ms, null for all
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const timeRangeOptions = [
    { label: '30m', value: 30 * 60 * 1000 },
    { label: '1h', value: 60 * 60 * 1000 },
    { label: '2h', value: 2 * 60 * 1000 },
    { label: '3h', value: 3 * 60 * 1000 },
    { label: '6h', value: 6 * 60 * 1000 },
    { label: '12h', value: 12 * 60 * 1000 },
    { label: 'All', value: null },
  ];
  const itemsPerPageOptions = [10, 25, 50];

  const races = raceMeetings?.[0]?.races || [];

  useEffect(() => {
    if (races.length > 0 && !selectedRace) {
      setSelectedRace(races[0]);
    }
  }, [races, selectedRace]);

  useEffect(() => {
    if (selectedRace && selectedRace.runners.length > 0) {
      setSelectedHorseId(selectedRace.runners[0].horse.id);
    } else {
      setSelectedHorseId(null);
    }
  }, [selectedRace]);

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage, timeRange, selectedHorseId]);


  const handleRaceSelection = (race: Race) => {
    if (race.id !== selectedRace?.id) {
      setSelectedRace(race);
    }
  };

  const selectedHorseHistory: OddPoint[] = useMemo(() => {
    if (!oddsHistory || !selectedRace || !selectedHorseId) return [];
    const history = oddsHistory[selectedRace.no]?.[selectedHorseId] || [];
    return history.sort((a, b) => a.timestamp - b.timestamp);
  }, [oddsHistory, selectedRace, selectedHorseId]);

  const filteredHorseHistory = useMemo(() => {
    if (!timeRange) {
      return selectedHorseHistory;
    }
    if (selectedHorseHistory.length === 0) {
      return [];
    }
    const lastTimestamp = selectedHorseHistory[selectedHorseHistory.length - 1].timestamp;
    return selectedHorseHistory.filter(point => (lastTimestamp - point.timestamp) <= timeRange);
  }, [selectedHorseHistory, timeRange]);

  const candlestickData = useMemo(() => {
    if (!filteredHorseHistory || filteredHorseHistory.length === 0) return [];
    const bucketSize = 60 * 1000; // 1 minute
    const buckets = new Map<number, OddPoint[]>();

    filteredHorseHistory.forEach(point => {
        if (point.winOdds != null) {
            const bucketTimestamp = Math.floor(point.timestamp / bucketSize) * bucketSize;
            if (!buckets.has(bucketTimestamp)) {
                buckets.set(bucketTimestamp, []);
            }
            buckets.get(bucketTimestamp)!.push(point);
        }
    });

    const candlestickPoints: CandlestickData[] = [];
    const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
    
    for (const [, points] of sortedBuckets) {
        if (points.length > 0) {
            const winOdds = points.map(p => p.winOdds!).filter(o => o != null);
            if (winOdds.length > 0) {
                candlestickPoints.push({
                    timestamp: points[0].timestamp,
                    open: winOdds[0],
                    high: Math.max(...winOdds),
                    low: Math.min(...winOdds),
                    close: winOdds[winOdds.length - 1],
                });
            }
        }
    }
    return candlestickPoints;
  }, [filteredHorseHistory]);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredHorseHistory.length);
  const pagedData = filteredHorseHistory.slice(from, to);

  if (!raceMeetings) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineSmall">{t.noDataAvailable}</Text>
        <Text>{t.fetchDataInstruction}</Text>
      </SafeAreaView>
    );
  }

  const selectedHorse = selectedRace?.runners.find(r => r.horse.id === selectedHorseId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <View style={styles.bannerContainer}>
            <BannerAd
            unitId="ca-app-pub-5605412363416280/5170850758"
            size={BannerAdSize.FULL_BANNER}
            />
        </View>
        <View style={styles.controlsContainer}>
            {selectedRace ? (
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }} numberOfLines={1}>
                {`${language === 'en' ? `${t.race} ${selectedRace.no}` : `第 ${selectedRace.no} 場`} - ${selectedRace.distance}m`}
            </Text>
            ) : (
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                {t.selectRace}
            </Text>
            )}
        </View>

        {races.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {races.map((race) => (
                <Chip
                showSelectedCheck={false}
                key={race.id}
                mode="flat"
                selected={selectedRace?.id === race.id}
                onPress={() => handleRaceSelection(race)}
                style={[styles.chip, { backgroundColor: selectedRace?.id === race.id ? theme.colors.primary : theme.colors.surface }]}
                textStyle={{ color: selectedRace?.id === race.id ? theme.colors.onPrimary : theme.colors.onSurface }}
                >
                {`${language === 'en' ? t.racePrefix : ''}${race.no}${language === 'ch' ? t.raceSuffix : ''}`}
                </Chip>
            ))}
            </ScrollView>
        )}

        {selectedRace && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {selectedRace.runners.map((runner: Runner) => (
                <Chip
                key={runner.horse.id}
                mode="flat"
                selected={selectedHorseId === runner.horse.id}
                onPress={() => setSelectedHorseId(runner.horse.id)}
                style={[styles.chip, { backgroundColor: selectedHorseId === runner.horse.id ? theme.colors.primary : theme.colors.surface }]}
                textStyle={{ color: selectedHorseId === runner.horse.id ? theme.colors.onPrimary : theme.colors.onSurface }}
                >
                {`${runner.no}. ${language === 'en' ? runner.name_en : runner.name_ch}`}
                </Chip>
            ))}
            </ScrollView>
        )}

        {selectedHorse && (
            <View style={styles.chartSection}>
                <SegmentedButtons
                    value={chartType}
                    onValueChange={(value) => setChartType(value as 'line' | 'candlestick')}
                    buttons={[
                        { value: 'line', label: t.lineChart },
                        { value: 'candlestick', label: t.candlestickChart },
                    ]}
                    style={styles.segmentedButtons}
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {timeRangeOptions.map((option) => (
                        <Chip
                            key={option.label}
                            mode="flat"
                            selected={timeRange === option.value}
                            onPress={() => setTimeRange(option.value)}
                            style={[styles.chip, { backgroundColor: timeRange === option.value ? theme.colors.primary : theme.colors.surface }]}
                            textStyle={{ color: timeRange === option.value ? theme.colors.onPrimary : theme.colors.onSurface }}
                        >
                            {option.label}
                        </Chip>
                    ))}
                </ScrollView>

                <Text variant='titleMedium' style={{textAlign: 'center', marginBottom: 8}}>
                    {chartType === 'line' 
                        ? `#${selectedHorse.no} ${language === Language.EN ? selectedHorse.name_en : selectedHorse.name_ch} - Win/Place Odds`
                        : `#${selectedHorse.no} ${language === Language.EN ? selectedHorse.name_en : selectedHorse.name_ch} - Win Odds (1min)`
                    }
                </Text>

                {chartType === 'line' 
                    ? <LineChart data={filteredHorseHistory} theme={theme} />
                    : <CandlestickChart data={candlestickData} theme={theme} />
                }
                
                {chartType === 'line' && (
                    <View style={styles.legendContainer}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: theme.colors.primary }]} />
                            <Text style={{ color: theme.colors.onSurface }}>Win Odds</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: theme.colors.success }]} />
                            <Text style={{ color: theme.colors.onSurface }}>Place Odds</Text>
                        </View>
                    </View>
                )}

                <Card style={styles.dataTableCard}>
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title>Time</DataTable.Title>
                            <DataTable.Title numeric>Win Odds</DataTable.Title>
                            <DataTable.Title numeric>Place Odds</DataTable.Title>
                        </DataTable.Header>

                        {pagedData.map((item) => (
                            <DataTable.Row key={item.timestamp}>
                                <DataTable.Cell>{new Date(item.timestamp).toLocaleTimeString()}</DataTable.Cell>
                                <DataTable.Cell numeric>{item.winOdds ?? '-'}</DataTable.Cell>
                                <DataTable.Cell numeric>{item.placeOdds ?? '-'}</DataTable.Cell>
                            </DataTable.Row>
                        ))}

                        <DataTable.Pagination
                            page={page}
                            numberOfPages={Math.ceil(filteredHorseHistory.length / itemsPerPage)}
                            onPageChange={page => setPage(page)}
                            label={`${from + 1}-${to} of ${filteredHorseHistory.length}`}
                            showFastPaginationControls
                            numberOfItemsPerPageList={itemsPerPageOptions}
                            numberOfItemsPerPage={itemsPerPage}
                            onItemsPerPageChange={setItemsPerPage}
                            selectPageDropdownLabel={'Rows per page'}
                        />
                    </DataTable>
                </Card>
            </View>
        )}
      
        <Text style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
            {t.disclaimer}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  chipContainer: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    flexGrow: 0,
  },
  chip: {
    marginRight: 0,
    justifyContent: 'center',
  },
  disclaimer: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
  },
  bannerContainer: {
    alignItems: 'center',
  },
  chartSection: {
      marginTop: 8,
      alignItems: 'center',
  },
  segmentedButtons: {
    marginBottom: 12,
    marginHorizontal: 16,
  },
  chartWrapper: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center'
  },
  chartContainer: {
      borderLeftWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#aaa',
  },
  axisLabel: {
      fontSize: 10,
      color: '#666'
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
  },
  legendColorBox: {
      width: 14,
      height: 14,
      marginRight: 8,
  },
  // Candlestick styles
  wick: {
      position: 'absolute',
      width: 1,
  },
  candleBody: {
      position: 'absolute',
      width: '100%',
  },
  dataTableCard: {
    marginTop: 16,
    marginHorizontal: 16,
    width: screenWidth - 32,
  },
});

export default PredictionScreen;