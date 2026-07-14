import React, { createContext, useContext, useState, ReactNode } from 'react';

// Shape mirrors the /api/predict response
export interface PredictionResult {
  year: number;
  round: number;
  raceName: string;
  circuit: string;
  predictedWinner: { driver: string; team: string; confidence: number; teamColor?: string };
  podium: Array<{ position: number; driver: string; team: string; confidence: number; teamColor?: string }>;
  top10: Array<{ position: number; driver: string; team: string; confidence: number; teamColor?: string }>;
  overallConfidence: number;
  featureFactors: Array<{ feature: string; importance: number; description: string }>;
  modelType: string;
  whyWin: string[];
  strategyNote: string;
}

interface PredictionContextValue {
  prediction: PredictionResult | null;
  setPrediction: (p: PredictionResult) => void;
}

const PredictionContext = createContext<PredictionContextValue>({
  prediction: null,
  setPrediction: () => {},
});

export function PredictionProvider({ children }: { children: ReactNode }) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  return (
    <PredictionContext.Provider value={{ prediction, setPrediction }}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  return useContext(PredictionContext);
}
