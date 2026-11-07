export interface DataPoint {
  date: string; // YYYY-MM-DD
  unit: string; // Store / Region / Department / City name
  value: number; // Metric value (Sales, Users, Overtime hours, Energy, etc.)
}

export interface UnitSeries {
  unit: string;
  dates: string[];
  values: number[];
}

export interface SCMResult {
  targetUnit: string;
  interventionDate: string;
  interventionIndex: number;
  dates: string[];
  actualValues: number[];
  syntheticValues: number[];
  gapValues: number[]; // actual - synthetic
  donorWeights: { unit: string; weight: number }[];
  preRMSPE: number;
  postRMSPE: number;
  rmspeRatio: number;
  confidenceScore: number; // 0 - 100%
  totalIncrementalEffect: number;
  averageIncrementalEffect: number;
  // Placebo test
  placeboPValue: number | null;
  placeboResults: {
    unit: string;
    preRMSPE: number;
    postRMSPE: number;
    ratio: number;
    gaps: number[];
  }[];
}

export interface SimulationParams {
  interventionCost: number; // Cost in currency (JPY)
  grossMarginPercent: number; // Profit margin or value multiplier % (e.g. 30%)
  monthlyDecayRate: number; // 0 - 50%
  forecastMonths: number; // 1 - 12
}

export interface WhatIfPoint {
  date: string;
  actual?: number;
  synthetic: number;
  projectedDecayed?: number;
  projectedBaseline?: number;
}

export interface ScenarioMeta {
  id: string;
  title: string;
  domain: string;
  targetUnit: string;
  donorUnits: string[];
  interventionDate: string;
  metricName: string;
  metricUnit: string;
  unitTypeName: string;
  interventionName: string;
  description: string;
  defaultCost: number;
  defaultMargin: number;
}
