import { ApiResponse, RaceMeeting, Race, Runner } from "../models/Hkjc";
// FIX: Import new storage functions and types for historical odds persistence.
import { saveMeetingOddsHistory, loadMeetingOddsHistory, MeetingOddsHistory, OddPoint } from "./storageService";

const API_URL = 'https://info.cld.hkjc.com/graphql/base/';


const ODDS_GQL_QUERY = `query racing($date: String, $venueCode: String, $oddsTypes: [OddsType], $raceNo: Int) {
  raceMeetings(date: $date, venueCode: $venueCode) {
    pmPools(oddsTypes: $oddsTypes, raceNo: $raceNo) {
      id
      status
      sellStatus
      oddsType
      lastUpdateTime
      guarantee
      minTicketCost
      name_en
      name_ch
      leg {
        number
        races
      }
      cWinSelections {
        composite
        name_ch
        name_en
        starters
      }
      oddsNodes {
        combString
        oddsValue
        hotFavourite
        oddsDropValue
        bankerOdds {
          combString
          oddsValue
        }
      }
    }
  }
}`;

export interface RunnerOdds {
    winOdds?: number;
    placeOdds?: number;
}

export interface OddsData {
    [runnerNo: string]: RunnerOdds;
}

interface OddsNode {
    combString: string;
    oddsValue: number;
}

interface Pool {
    oddsType: 'WIN' | 'PLA';
    oddsNodes: OddsNode[];
}

interface OddsApiResponse {
    data: {
        raceMeetings: {
            pmPools: Pool[];
        }[];
    };
}

export const fetchRaceOdds = async (date: string, venueCode: string, raceNo: number): Promise<OddsData> => {
    const payload = {
        operationName: "racing",
        variables: {
            date,
            venueCode,
            raceNo,
            oddsTypes: ["WIN", "PLA"]
        },
        query: ODDS_GQL_QUERY
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonResponse: OddsApiResponse = await response.json();
        const pools = jsonResponse.data?.raceMeetings?.[0]?.pmPools;
        
        const oddsData: OddsData = {};

        if (pools) {
            for (const pool of pools) {
                if (pool.oddsNodes) {
                    for (const node of pool.oddsNodes) {
                        const runnerNo = Number(node.combString);
                        if (!oddsData[runnerNo]) {
                            oddsData[runnerNo] = {};
                        }
                        if (pool.oddsType === 'WIN') {
                            oddsData[runnerNo].winOdds = node.oddsValue;
                        } else if (pool.oddsType === 'PLA') {
                            oddsData[runnerNo].placeOdds = node.oddsValue;
                        }
                    }
                }
            }
        }
        
        return oddsData;
    } catch (error) {
        console.error("Failed to fetch race odds:", error);
        throw error;
    }
};

/**
 * Appends a new odds record to the historical odds data.
 * @param date The date of the race meeting.
 * @param venueCode The venue code.
 * @param race The race object containing runners.
 * @param newOdds The newly fetched odds data.
 */
const appendOddsToHistory = async (date: string, venueCode: string, race: Race, newOdds: OddsData) => {
    const existingHistory = await loadMeetingOddsHistory(date, venueCode);
    const timestamp = new Date().getTime();

    if (!existingHistory[race.no]) {
        existingHistory[race.no] = {};
    }

    race.runners.forEach((runner: Runner) => {
        const runnerOdds = newOdds[runner.no.toString()];
        if (runnerOdds) {
            if (!existingHistory[race.no][runner.horse.id]) {
                existingHistory[race.no][runner.horse.id] = [];
            }
            const newOddPoint: OddPoint = {
                timestamp,
                winOdds: runnerOdds.winOdds,
                placeOdds: runnerOdds.placeOdds,
            };
            existingHistory[race.no][runner.horse.id].push(newOddPoint);
        }
    });

    await saveMeetingOddsHistory(date, venueCode, existingHistory);
};


/**
 * Fetches Win/Place odds for all races, appends them to history, and returns the updated meeting.
 * @param raceMeetings The race meetings data.
 * @returns A new array of race meetings with the latest odds populated.
 */
export const fetchAndPopulateAllOdds = async (raceMeetings: RaceMeeting[]): Promise<[RaceMeeting[], MeetingOddsHistory]> => {
    if (!raceMeetings || raceMeetings.length === 0) {
        return [raceMeetings, {}];
    }

    const newRaceMeetings = JSON.parse(JSON.stringify(raceMeetings));
    const meeting = newRaceMeetings[0];
    const { date, venueCode, races } = meeting;

    const allOddsPromises = races.map((race: Race) => fetchRaceOdds(date, venueCode, race.no));
    
    try {
        const allOddsResults = await Promise.all(allOddsPromises);
        const existingHistory = await loadMeetingOddsHistory(date, venueCode);
        const timestamp = new Date().getTime();

        races.forEach((race: Race, index: number) => {
            const oddsForRace = allOddsResults[index];
            if (oddsForRace && Object.keys(oddsForRace).length > 0) {
                if (!existingHistory[race.no]) existingHistory[race.no] = {};
                
                race.runners.forEach((runner: Runner) => {
                    const runnerOdds = oddsForRace[runner.no.toString()];
                    if (runnerOdds) {
                        runner.winOdds = runnerOdds.winOdds;
                        runner.placeOdds = runnerOdds.placeOdds;
                        
                        if (!existingHistory[race.no][runner.horse.id]) {
                            existingHistory[race.no][runner.horse.id] = [];
                        }
                        existingHistory[race.no][runner.horse.id].push({
                            timestamp,
                            winOdds: runnerOdds.winOdds,
                            placeOdds: runnerOdds.placeOdds,
                        });
                    }
                });
            }
        });
        
        await saveMeetingOddsHistory(date, venueCode, existingHistory);
        return [newRaceMeetings, existingHistory];
    } catch (error) {
        console.error("Failed to fetch one or more race odds:", error);
        throw new Error('Failed to fetch all race odds.');
    }
};

/**
 * Fetches, merges, and saves odds for a single race to the history.
 * @param raceMeetings The current race meetings data.
 * @param raceNo The specific race number to update.
 * @returns A new array of race meetings with updated odds for the specified race.
 */
export const fetchAndPopulateSingleRaceOdds = async (
  raceMeetings: RaceMeeting[],
  raceNo: number
): Promise<[RaceMeeting[], MeetingOddsHistory]> => {
  if (!raceMeetings || raceMeetings.length === 0) {
    return [raceMeetings, {}];
  }
  
  const newRaceMeetings = JSON.parse(JSON.stringify(raceMeetings));
  const meeting = newRaceMeetings[0];
  const { date, venueCode } = meeting;
  const raceToUpdate = meeting.races.find((r: Race) => r.no === raceNo);

  if (!raceToUpdate) {
    console.error(`Race #${raceNo} not found in meeting.`);
    return [raceMeetings, await loadMeetingOddsHistory(date, venueCode)];
  }

  try {
    const oddsForRace = await fetchRaceOdds(date, venueCode, raceNo);
    const existingHistory = await loadMeetingOddsHistory(date, venueCode);
    const timestamp = new Date().getTime();

    if (!existingHistory[raceNo]) existingHistory[raceNo] = {};

    raceToUpdate.runners.forEach((runner: Runner) => {
      const runnerOdds = oddsForRace[runner.no.toString()];
      if (runnerOdds) {
        runner.winOdds = runnerOdds.winOdds;
        runner.placeOdds = runnerOdds.placeOdds;

        if (!existingHistory[raceNo][runner.horse.id]) {
            existingHistory[raceNo][runner.horse.id] = [];
        }
        existingHistory[raceNo][runner.horse.id].push({
            timestamp,
            winOdds: runnerOdds.winOdds,
            placeOdds: runnerOdds.placeOdds,
        });
      }
    });

    await saveMeetingOddsHistory(date, venueCode, existingHistory);

    return [newRaceMeetings, existingHistory];
  } catch (error) {
    console.error(`Failed to update odds for race ${raceNo}:`, error);
    return [raceMeetings, await loadMeetingOddsHistory(date, venueCode)];
  }
};




const GQL_QUERY = `fragment raceFragment on Race {
  id
  no
  status
  raceName_en
  raceName_ch
  postTime
  country_en
  country_ch
  distance
  wageringFieldSize
  go_en
  go_ch
  ratingType
  raceTrack {
    description_en
    description_ch
  }
  raceCourse {
    description_en
    description_ch
    displayCode
  }
  claCode
  raceClass_en
  raceClass_ch
  judgeSigns {
    value_en
  }
}

fragment racingBlockFragment on RaceMeeting {
  jpEsts: pmPools(
    oddsTypes: [WIN, PLA, TCE, TRI, FF, QTT, DT, TT, SixUP]
    filters: ["jackpot", "estimatedDividend"]
  ) {
    leg {
      number
      races
    }
    oddsType
    jackpot
    estimatedDividend
    mergedPoolId
  }
  poolInvs: pmPools(
    oddsTypes: [WIN, PLA, QIN, QPL, CWA, CWB, CWC, IWN, FCT, TCE, TRI, FF, QTT, DBL, TBL, DT, TT, SixUP]
  ) {
    id
    leg {
      races
    }
  }
  penetrometerReadings(filters: ["first"]) {
    reading
    readingTime
  }
  hammerReadings(filters: ["first"]) {
    reading
    readingTime
  }
  changeHistories(filters: ["top3"]) {
    type
    time
    raceNo
    runnerNo
    horseName_ch
    horseName_en
    jockeyName_ch
    jockeyName_en
    scratchHorseName_ch
    scratchHorseName_en
    handicapWeight
    scrResvIndicator
  }
}

query raceMeetings($date: String, $venueCode: String) {
  timeOffset {
    rc
  }
  activeMeetings: raceMeetings {
    id
    venueCode
    date
    status
    races {
      no
      postTime
      status
      wageringFieldSize
    }
  }
  raceMeetings(date: $date, venueCode: $venueCode) {
    id
    status
    venueCode
    date
    totalNumberOfRace
    currentNumberOfRace
    dateOfWeek
    meetingType
    totalInvestment
    country {
      code
      namech
      nameen
      seq
    }
    races {
      ...raceFragment
      runners {
        id
        no
        standbyNo
        status
        name_ch
        name_en
        horse {
          id
          code
        }
        color
        barrierDrawNumber
        handicapWeight
        currentWeight
        currentRating
        internationalRating
        gearInfo
        racingColorFileName
        allowance
        trainerPreference
        last6run
        saddleClothNo
        trumpCard
        priority
        finalPosition
        deadHeat
        winOdds
        jockey {
          code
          name_en
          name_ch
        }
        trainer {
          code
          name_en
          name_ch
        }
      }
    }
    obSt: pmPools(oddsTypes: [WIN, PLA]) {
      leg {
        races
      }
      oddsType
      comingleStatus
    }
    poolInvs: pmPools(
      oddsTypes: [WIN, PLA, QIN, QPL, CWA, CWB, CWC, IWN, FCT, TCE, TRI, FF, QTT, DBL, TBL, DT, TT, SixUP]
    ) {
      id
      leg {
        number
        races
      }
      status
      sellStatus
      oddsType
      investment
      mergedPoolId
      lastUpdateTime
    }
    ...racingBlockFragment
    pmPools(oddsTypes: []) {
      id
    }
    jkcInstNo: foPools(oddsTypes: [JKC], filters: ["top"]) {
      instNo
    }
    tncInstNo: foPools(oddsTypes: [TNC], filters: ["top"]) {
      instNo
    }
  }
}`;
export const fetchRaceData = async (date: string, venueCode: string): Promise<ApiResponse> => {
  const payload = {
    operationName: "raceMeetings",
    variables: { date, venueCode },
    query: GQL_QUERY
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonResponse: ApiResponse = await response.json();
    if (jsonResponse.data?.raceMeetings?.length === 0) {
      throw new Error("No race meetings found for the provided date and venue.");
    }

    return jsonResponse;
  } catch (error) {
    console.error("Failed to fetch race data:", error);
    throw error;
  }
};