export interface Jockey {
  code: string;
  name_en: string;
  name_ch: string;
}

export interface Trainer {
  code: string;
  name_en: string;
  name_ch: string;
}

export interface Horse {
  id: string;
  code: string;
}

export interface Runner {
  id: string;
  no: number;
  name_ch: string;
  name_en: string;
  barrierDrawNumber: number;
  handicapWeight: number;
  winOdds?: number | null;
  placeOdds?: number | null;
  jockey: Jockey;
  trainer: Trainer;
  horse: Horse;
  predictedRank?: number;
  predictedScore?: number;

  // Additional fields from GraphQL query
  currentRating?: number;
  last6run?: string;
  gearInfo?: string;
  currentWeight?: number;
}

export interface Race {
  id: string;
  no: number;
  raceName_en: string;
  raceName_ch: string;
  distance: number;
  runners: Runner[];
  go_en: string;
  go_ch: string;
}

export interface RaceMeeting {
  id: string;
  venueCode: string;
  date: string;
  totalNumberOfRace: number;
  races: Race[];
}

export interface ApiResponse {
  data: {
    raceMeetings: RaceMeeting[];
  };
}