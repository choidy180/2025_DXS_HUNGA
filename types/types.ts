// app/(demo)/materials/types.ts

export type Option = { value: string; label: string };

export type Ingredient = { name: string; value: number };

export type CaseCard = { 
  id: string; 
  title: string; 
  ingredients: Ingredient[] 
};

export type PredDetailRow = {
  codeName: string;
  y_pred: number;
  ci_low: number;
  ci_high: number;
};

export type PredictionCard = {
  id: string;
  title: string;
  checked: boolean;
  propCount: number;
  caseId: string;
  props: number[];
  propKeys?: string[];
  ciLow?: number[];
  ciHigh?: number[];
  detailRows?: PredDetailRow[];
};