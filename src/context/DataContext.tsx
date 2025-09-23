import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Race, RaceMeeting, Runner } from '../models/Hkjc';
import { fetchRaceData as apiFetchRaceData, fetchAndPopulateAllOdds } from '../services/HkjcApiService';
import { Asset } from 'expo-asset';
// FIX: Updated storage service imports for historical odds data.
import { 
  saveLastUrl, 
  loadLastUrl, 
  saveRaceMeeting, 
  loadRaceMeeting, 
  saveMeetingOddsHistory,
  loadMeetingOddsHistory,
  MeetingOddsHistory,
  OddPoint
} from '../services/storageService';

// --- New Data Loading Logic ---
export interface HorseData {
  age: number;
  initialRating: number | null;
}
export type HorseDataMap = Map<string, HorseData>;

export interface JockeyData {
  winRate: number;
  winPlaceRate: number;
}
export type JockeyDataMap = Map<string, JockeyData>;

export interface TrainerData {
  winRate: number;
  winPlaceRate: number;
}
export type TrainerDataMap = Map<string, TrainerData>;

function parseCsv<T>(csv: string, idKey: string, parser: (row: { [key: string]: string }) => T): Map<string, T> {
    const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return new Map();

    const headerLine = lines.shift()!.replace(/^\uFEFF/, '');
    const header = headerLine.split(',').map(h => h.trim());
    const map = new Map<string, T>();

    for (const line of lines) {
        const values = line.split(',').map(v => v.trim());
        const row = header.reduce((obj, h, index) => {
            obj[h] = values[index];
            return obj;
        }, {} as { [key: string]: string });
        
        const id = row[idKey];
        if (id) {
            map.set(id.trim(), parser(row));
        }
    }
    return map;
}

const parseUrl = (url: string): { date: string; venueCode: string } | null => {
    const regex = /(\d{4}-\d{2}-\d{2})\/([A-Z]{2})/;
    const match = url.match(regex);
    if (!match) return null;
    const [, date, venueCode] = match;
    return { date, venueCode };
};

// --- Helper Function to merge the LATEST odds from history into a RaceMeeting object ---
const mergeOddsIntoMeeting = (meeting: RaceMeeting, oddsHistory: MeetingOddsHistory): RaceMeeting => {
  if (!oddsHistory) {
    return meeting;
  }
  const newMeeting = JSON.parse(JSON.stringify(meeting)); // Deep copy
  
  newMeeting.races.forEach((race: Race) => {
    const raceHistory = oddsHistory[race.no];
    if (raceHistory) {
      race.runners.forEach((runner: Runner) => {
        const runnerHistory = raceHistory[runner.horse.id];
        if (runnerHistory && runnerHistory.length > 0) {
          // Get the most recent odd point
          const latestOdd = runnerHistory[runnerHistory.length - 1];
          runner.winOdds = latestOdd.winOdds;
          runner.placeOdds = latestOdd.placeOdds;
        }
      });
    }
  });
  return newMeeting;
};

interface DataContextType {
  raceMeetings: RaceMeeting[] | null;
  setRaceMeetings: (data: RaceMeeting[] | null) => void;
  horseData: HorseDataMap;
  jockeyData: JockeyDataMap;
  trainerData: TrainerDataMap;
  appDataLoaded: boolean;
  lastUrl: string;
  setLastUrl: (url: string) => void;
  loading: boolean;
  error: string | null;
  fetchData: (url: string) => Promise<boolean>;
  oddsHistory: MeetingOddsHistory | null;
  setOddsHistory: (history: MeetingOddsHistory | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [raceMeetings, setRaceMeetings] = useState<RaceMeeting[] | null>(null);
  const [oddsHistory, setOddsHistory] = useState<MeetingOddsHistory | null>(null);
  const [horseData, setHorseData] = useState<HorseDataMap>(new Map());
  const [jockeyData, setJockeyData] = useState<JockeyDataMap>(new Map());
  const [trainerData, setTrainerData] = useState<TrainerDataMap>(new Map());
  const [appDataLoaded, setAppDataLoaded] = useState(false);

  const [lastUrl, setLastUrlState] = useState('https://bet.hkjc.com/ch/racing/home/2025-09-21/ST');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAppData = async () => {
      try {
        const horseAsset = Asset.fromModule(require('../../assets/csv/app_data_horse.csv'));
        const jockeyAsset = Asset.fromModule(require('../../assets/csv/app_data_jockey.csv'));
        const trainerAsset = Asset.fromModule(require('../../assets/csv/app_data_trainer.csv'));

        await Promise.all([
          horseAsset.downloadAsync(),
          jockeyAsset.downloadAsync(),
          trainerAsset.downloadAsync()
        ]);

        const [horseCsv, jockeyCsv, trainerCsv] = await Promise.all([
            fetch(horseAsset.uri).then(res => res.text()),
            fetch(jockeyAsset.uri).then(res => res.text()),
            fetch(trainerAsset.uri).then(res => res.text()),
        ]);

        const horseDataMap: HorseDataMap = parseCsv(horseCsv, 'HorseId', row => ({
            age: parseInt(row['Age'], 10),
            initialRating: row['季初評分'] && row['季初評分'].trim() ? parseFloat(row['季初評分']) : null
        }));
        setHorseData(horseDataMap);

        const jockeyDataMap: JockeyDataMap = parseCsv(jockeyCsv, 'JockeyId', row => ({
            winRate: parseFloat(row['jockey_win_rate']),
            winPlaceRate: parseFloat(row['jockey_win_place_rate'])
        }));
        setJockeyData(jockeyDataMap);

        const trainerDataMap: TrainerDataMap = parseCsv(trainerCsv, 'TrainerId', row => ({
            winRate: parseFloat(row['trainer_win_rate']),
            winPlaceRate: parseFloat(row['trainer_win_place_rate'])
        }));
        setTrainerData(trainerDataMap);

      } catch (e) {
        console.error("Failed to load app CSV data", e);
      } finally {
        setAppDataLoaded(true);
      }
    };
    loadAppData();
  }, []);

  useEffect(() => {
    const loadStoredData = async () => {
      const storedUrl = await loadLastUrl();
      if (storedUrl) {
        setLastUrlState(storedUrl);
        const urlParts = parseUrl(storedUrl);
        if (urlParts) {
            const storedMeeting = await loadRaceMeeting(urlParts.date, urlParts.venueCode);
            const storedOddsHistory = await loadMeetingOddsHistory(urlParts.date, urlParts.venueCode);
            setOddsHistory(storedOddsHistory);
            if (storedMeeting) {
              const mergedMeeting = mergeOddsIntoMeeting(storedMeeting, storedOddsHistory);
              setRaceMeetings([mergedMeeting]);
            }
        }
      }
    };
    loadStoredData();
  }, []);

  const setLastUrl = (url: string) => {
    setLastUrlState(url);
    saveLastUrl(url);
  };

  const fetchData = useCallback(async (url: string) => {
    const urlParts = parseUrl(url);
    if (!urlParts) {
        setError('Invalid URL format. Expected .../YYYY-MM-DD/VC/');
        return false;
    }

    const { date, venueCode } = urlParts;
    setLoading(true);
    setError(null);

    try {
        const result = await apiFetchRaceData(date, venueCode);
        const initialRaceMeetings = result.data.raceMeetings;

        if (initialRaceMeetings && initialRaceMeetings.length > 0) {
          // Save the base meeting structure first. `saveRaceMeeting` strips any initial odds.
          await saveRaceMeeting(initialRaceMeetings[0]);

          // Now, fetch the latest odds for all races and update the meetings data.
          // This function also handles loading existing history, appending new data, and saving it.
          const [updatedMeetings, updatedHistory] = await fetchAndPopulateAllOdds(initialRaceMeetings);
          
          setRaceMeetings(updatedMeetings);
          setOddsHistory(updatedHistory);
          setLastUrl(url);
        } else {
          setRaceMeetings(null);
          setOddsHistory(null);
        }
        setLoading(false);
        return true;
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        setLoading(false);
        return false;
    }
  }, []);

  return (
    <DataContext.Provider value={{ 
      raceMeetings, 
      setRaceMeetings,
      horseData,
      jockeyData,
      trainerData,
      appDataLoaded,
      lastUrl,
      setLastUrl,
      loading,
      error,
      fetchData,
      oddsHistory,
      setOddsHistory
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
