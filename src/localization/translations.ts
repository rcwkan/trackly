export const translations = {
  en: {
    // Tabs
    input: 'Input',
    races: 'Races',
    settings: 'Settings',

    // Input Screen
    fetchRaceData: 'Fetch Race Data',
    fetching: 'Fetching...',
    raceUrlLabel: 'HKJC Race URL',
    invalidUrl: 'Invalid URL format. Expected .../YYYY-MM-DD/VC/',
    fetchSuccess: 'Race data fetched successfully!',
    error: 'Error',
    unknownError: 'An unknown error occurred',

    // Race & Prediction Screens
    noDataAvailable: 'No data available.',
    fetchDataInstruction: 'Please fetch race data from the Input tab.',
    noRaceMeeting: 'No race meeting data found.',
    race: 'Race',
    racePrefix: 'R',
    raceSuffix: '',
    date: 'Date',
    predict: 'Charts',
    selectRace: 'Select a Race',
    refresh: 'Refresh',
    lineChart: 'Line Chart',
    candlestickChart: 'Candlestick Chart',
    // FIX: Added 'refreshPrediction' translation key for the prediction refresh button.
    refreshPrediction: 'Refresh Prediction',
    venueMap: { HV: 'Happy Valley', ST: 'Sha Tin' },
    lastRefresh: 'Last Refresh:',

    // Modals & Buttons
    rawData: 'Raw Data',
    viewRawData: 'View raw data',
    close: 'Close',

    // Settings Screen
    appSettings: 'Application Settings',
    language: 'Language',
    autoRefresh: 'Auto Refresh (30s)',
    futureSettings: 'Future application settings will be configured here.',

    // Disclaimer
    disclaimer: 'Disclaimer: For entertainment purposes only. Winning is not guaranteed and race data is not guaranteed to be correct.',
    
    // Headers
    // FIX: Added 'predictionHeaders' to provide specific table headers for the prediction screen.
    predictionHeaders: {
      no: 'No.',
      horse: 'Horse',
      jockey: 'Jockey',
      rank: 'Rank',
    },
    raceHeaders: {
      no: 'No.',
      horse: 'Horse',
      jockey: 'Jockey',
      trainer: 'Trainer',
      weight: 'Wgt.',
      barrier: 'Barrier',
      winOdds: 'Win Odds',
      placeOdds: 'Place Odds',
      prediction: 'Pred. Rank',
      rating: 'Rating',
      last6: 'Last 6',
      gear: 'Gear',
      actualWgt: 'Act. Wgt.',
    },
  },
  ch: {
    // Tabs
    input: '輸入',
    races: '賽事',
    settings: '設定',

    // Input Screen
    fetchRaceData: '讀取賽事數據',
    fetching: '讀取中...',
    raceUrlLabel: '馬會賽事網址',
    invalidUrl: '網址格式無效。預期格式：.../YYYY-MM-DD/VC/',
    fetchSuccess: '成功讀取賽事數據！',
    error: '錯誤',
    unknownError: '發生未知錯誤',

    // Race & Prediction Screens
    noDataAvailable: '沒有可用數據。',
    fetchDataInstruction: '請在「輸入」分頁讀取賽事數據。',
    noRaceMeeting: '找不到賽事會議數據。',
    race: '場次',
    racePrefix: '',
    raceSuffix: '場',
    date: '日期',
    predict: '圖表',
    selectRace: '選擇賽事',
    refresh: '刷新',
    lineChart: '折線圖',
    candlestickChart: '燭台圖',
    // FIX: Added 'refreshPrediction' translation key for the prediction refresh button.
    refreshPrediction: '刷新預測',
    venueMap: { HV: '跑馬地', ST: '沙田' },
    lastRefresh: '上次刷新：',

    // Modals & Buttons
    rawData: '原始數據',
    viewRawData: '查看原始數據',
    close: '關閉',

    // Settings Screen
    appSettings: '應用程式設定',
    language: '語言',
    autoRefresh: '自動刷新 (30秒)',
    futureSettings: '未來的應用程式設定將在此處配置。',

    // Disclaimer
    disclaimer: '免責聲明：僅供娛樂。不保證獲勝，賽事數據不保證正確。',

    // Headers
    // FIX: Added 'predictionHeaders' to provide specific table headers for the prediction screen.
    predictionHeaders: {
      no: '馬號',
      horse: '馬名',
      jockey: '騎師',
      rank: '排名',
    },
    raceHeaders: {
      no: '馬號',
      horse: '馬名',
      jockey: '騎師',
      trainer: '練馬師',
      weight: '負磅',
      barrier: '檔位',
      winOdds: '獨贏賠率',
      placeOdds: '位置賠率',
      prediction: '預測排名',
      rating: '評分',
      last6: '近6仗',
      gear: '配備',
      actualWgt: '實磅',
    },
  },
};