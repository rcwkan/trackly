import AsyncStorage from '@react-native-async-storage/async-storage';
import { RaceMeeting, Runner } from '../models/Hkjc';
import { Language } from '../context/LanguageContext';

// --- Types for Historical Odds Storage ---
export interface OddPoint {
  timestamp: number;
  winOdds?: number | null;
  placeOdds?: number | null;
}

export interface RaceOddsHistory {
  [horseId: string]: OddPoint[];
}

export interface MeetingOddsHistory {
  [raceNo: number]: RaceOddsHistory;
}

// Use AsyncStorage directly. The library provides a web implementation
// that uses localStorage, so a custom abstraction is not necessary and
// might cause conflicts.
const storage = AsyncStorage;

// --- Keys ---
const LAST_URL_KEY = '@LastUrl';
const LANGUAGE_KEY = '@Language';
const AUTO_REFRESH_KEY = '@AutoRefresh';

/**
 * Generates a unique storage key for a race meeting based on its date and venue.
 * @param date The date of the race meeting (e.g., "2025-09-21").
 * @param venueCode The venue code (e.g., "ST").
 * @returns A unique key string.
 */
const generateRaceMeetingKey = (date: string, venueCode: string) => `@RaceMeeting_${date}_${venueCode}`;

/**
 * Generates a unique storage key for a race meeting's odds history.
 * @param date The date of the race meeting.
 * @param venueCode The venue code.
 * @returns A unique key string for odds history.
 */
const generateRaceOddsHistoryKey = (date: string, venueCode: string) => `@RaceOddsHistory_${date}_${venueCode}`;

/**
 * Saves a single race meeting data, stripping out odds data.
 * @param raceMeeting The race meeting data to save.
 */
export const saveRaceMeeting = async (raceMeeting: RaceMeeting): Promise<void> => {
  if (!raceMeeting?.date || !raceMeeting?.venueCode) {
    console.error('Failed to save race meeting: date or venueCode is missing.');
    return;
  }
  try {
    const key = generateRaceMeetingKey(raceMeeting.date, raceMeeting.venueCode);
    
    // Create a deep copy to avoid mutating the original object
    const meetingToSave = JSON.parse(JSON.stringify(raceMeeting));
    
    // Strip odds from the copy before saving to keep the base data static
    meetingToSave.races.forEach((race: any) => {
      race.runners.forEach((runner: Partial<Runner>) => {
        delete runner.winOdds;
        delete runner.placeOdds;
      });
    });

    const jsonValue = JSON.stringify(meetingToSave);
    await storage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Failed to save race meeting to storage.', e);
  }
};

/**
 * Loads a specific race meeting data from storage.
 * @param date The date of the race meeting.
 * @param venueCode The venue code of the race meeting.
 * @returns The loaded race meeting data, or null if not found or on error.
 */
export const loadRaceMeeting = async (date: string, venueCode: string): Promise<RaceMeeting | null> => {
  const key = generateRaceMeetingKey(date, venueCode);
  try {
    const jsonValue = await storage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to load race meeting from storage.', e);
    await storage.removeItem(key);
    return null;
  }
};

/**
 * Saves the odds history for a specific race meeting.
 * @param date The date of the meeting.
 * @param venueCode The venue code of the meeting.
 * @param oddsHistory The MeetingOddsHistory object to save.
 */
export const saveMeetingOddsHistory = async (date: string, venueCode: string, oddsHistory: MeetingOddsHistory): Promise<void> => {
  try {
    const key = generateRaceOddsHistoryKey(date, venueCode);
    const jsonValue = JSON.stringify(oddsHistory);
    await storage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Failed to save meeting odds history to storage.', e);
  }
};

/**
 * Loads the odds history for a specific race meeting.
 * @param date The date of the meeting.
 * @param venueCode The venue code of the meeting.
 * @returns The loaded MeetingOddsHistory object, or an empty object if not found.
 */
export const loadMeetingOddsHistory = async (date: string, venueCode: string): Promise<MeetingOddsHistory> => {
  const key = generateRaceOddsHistoryKey(date, venueCode);
  try {
    const jsonValue = await storage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (e) {
    console.error('Failed to load meeting odds history from storage.', e);
    await storage.removeItem(key);
    return {};
  }
};

/**
 * Saves the last used HKJC URL to storage.
 * @param url The URL string to save.
 */
export const saveLastUrl = async (url: string): Promise<void> => {
  try {
    await storage.setItem(LAST_URL_KEY, url);
  } catch (e) {
    console.error('Failed to save last URL to storage.', e);
  }
};

/**
 * Loads the last used HKJC URL from storage.
 * @returns The loaded URL string, or null if not found.
 */
export const loadLastUrl = async (): Promise<string | null> => {
  try {
    return await storage.getItem(LAST_URL_KEY);
  } catch (e) {
    console.error('Failed to load last URL from storage.', e);
    return null;
  }
};

/**
 * Saves the selected language.
 * @param language The language to save.
 */
export const saveLanguage = async (language: Language): Promise<void> => {
  try {
    await storage.setItem(LANGUAGE_KEY, language);
  } catch (e) {
    console.error('Failed to save language.', e);
  }
};

/**
 * Loads the selected language.
 * @returns The saved language or null.
 */
export const loadLanguage = async (): Promise<Language | null> => {
  try {
    const value = await storage.getItem(LANGUAGE_KEY);
    if (value === Language.EN || value === Language.CH) {
      return value as Language;
    }
    return null;
  } catch (e) {
    console.error('Failed to load language.', e);
    return null;
  }
};

/**
 * Saves the auto-refresh setting.
 * @param isEnabled The state of the auto-refresh toggle.
 */
export const saveAutoRefresh = async (isEnabled: boolean): Promise<void> => {
  try {
    await storage.setItem(AUTO_REFRESH_KEY, JSON.stringify(isEnabled));
  } catch (e) {
    console.error('Failed to save auto refresh setting.', e);
  }
};

/**
 * Loads the auto-refresh setting.
 * @returns The saved auto-refresh state or null.
 */
export const loadAutoRefresh = async (): Promise<boolean | null> => {
  try {
    const value = await storage.getItem(AUTO_REFRESH_KEY);
    return value != null ? JSON.parse(value) : null;
  } catch (e) {
    console.error('Failed to load auto refresh setting.', e);
    return null;
  }
};
