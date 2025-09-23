import { loadTensorflowModel, TensorflowModel } from "react-native-fast-tflite";
import { Race, RaceMeeting, Runner } from "../models/Hkjc";
import { HorseDataMap, JockeyDataMap, TrainerDataMap } from "../context/DataContext";


class TensorflowLitePredictor {
    private model: TensorflowModel | null;
    private params: any;

    constructor() {
        this.model = null;
        this.params = null;
    }

    getParams() {

        return this.params;

    }

    async loadModel(): Promise<void> {
        const modelPath = require("../../assets/tflite/horse_racing_model.tflite");
        this.model = await loadTensorflowModel(modelPath);;
        this.params = require("../../assets/tflite/preprocessing_params.json");
    }

    private preprocessFeatures(features: number[]): Float32Array {
        if (!this.params) {
            throw new Error('Model parameters not loaded. Call loadModel() first.');
        }

        return new Float32Array(features);
    }


    async predict(featureInputs: number[]): Promise<number[]> {
        if (!this.model) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }

        //  if (featureInputs.length !== 10) {
        //      throw new Error('Exactly 10 past results required');
        //  }

        //  if (!featureInputs.every(result => result.length >= 6)) {
        //      throw new Error('Each result must have at least 6 numbers');
        //  }

        const features = this.preprocessFeatures(featureInputs);


        const prediction = this.model.runSync([features]);

        const pArray = prediction[0];
        const scaledPrediction: number[] = [];
        for (let i = 0; i < pArray.length; i++) {
            scaledPrediction.push(Number(pArray[i]));
        }

        return scaledPrediction;
    }
}

export default TensorflowLitePredictor;

// Usage example function
export async function tfLitePredict(race: Race, raceMeeting: RaceMeeting, horseData: HorseDataMap, jockeyData: JockeyDataMap, trainerData: TrainerDataMap): Promise<Runner[]> {
    const engine = new TensorflowLitePredictor();
    await engine.loadModel();
    const runners: Runner[] = race.runners;

    for (let i = 0; i < runners.length; i++) {
        const featuresInputs = getFeature(runners[i], race, raceMeeting, horseData, jockeyData, trainerData, engine.getParams());

        const result: Number[] = await engine.predict(featuresInputs);

        runners[i].predictedRank = Number(result[0].toFixed(3));
        runners[i].predictedScore = Number(result[0].toFixed(3));

    }

    return runners;

}

function getFeature(runner: Runner, race: Race, raceMeeting: RaceMeeting, horseData: HorseDataMap, jockeyData: JockeyDataMap, trainerData: TrainerDataMap, params: any): any {


    const { numerical_features, categorical_features, scaler_mean, scaler_scale, ohe_categories } = params;

    // --- Map data to features ---
    const featureMap: Record<string, number | string> = {
        '途程': race.distance,
        '檔位': runner.barrierDrawNumber,
        '評分': horseData.get(runner.horse.id)?.initialRating ?? 50,
        '實際負磅': runner.handicapWeight,
        '排位體重': runner.currentWeight ?? 1120,
        'Age': horseData.get(runner.horse.id)?.age ?? 5, // Not available in data, using default
        '現時評分': runner.currentRating ?? 50,
        'jockey_win_rate': jockeyData.get(runner.jockey.code)?.winRate ?? 0.1, // Not available, using default
        'jockey_win_place_rate': jockeyData.get(runner.jockey.code)?.winPlaceRate ?? 0.1,// Not available, using default
        'trainer_win_rate': trainerData.get(runner.trainer.code)?.winRate ?? 0.08, // Not available, using default
        'trainer_win_place_rate': trainerData.get(runner.trainer.code)?.winPlaceRate ?? 0.24, // Not available, using default
        '獨贏賠率': runner.winOdds ?? 9,
        '場地狀況': race.go_ch || '好',
        '馬場': raceMeeting.venueCode === 'ST' ? '沙田' : '跑馬地',
        'avg_速度_mps': horseData.get(runner.horse.id)?.avgSpeed ?? 16.93,
        'avg_頭馬距離': horseData.get(runner.horse.id)?.avgWinDist ?? 4.43,
        'races_counted': horseData.get(runner.horse.id)?.races_counted ?? 1,
        'horse_win_rate': horseData.get(runner.horse.id)?.horse_win_rate ?? 0.05,
        'horse_win_place_rate': horseData.get(runner.horse.id)?.horse_win_place_rate ?? 0.1,
    };

    // --- Process Numerical Features ---
    const numericalInputs = numerical_features.map((feature: string | number, index: string | number) => {
        const value = featureMap[feature] as number;
        return (value - scaler_mean[index]) / scaler_scale[index];
    });

    // --- Process Categorical Features ---
    const categoricalInputs = categorical_features.flatMap((feature: string | number, index: string | number) => {
        const value = featureMap[feature] as string;
        const categories = ohe_categories[index];
        const oneHot = Array(categories.length).fill(0);
        const catIndex = categories.indexOf(value);
        if (catIndex !== -1) {
            oneHot[catIndex] = 1;
        }
        return oneHot;
    });

    return [...numericalInputs, ...categoricalInputs];

}
