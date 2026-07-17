export type RiskAlertLevel = 'GREEN' | 'YELLOW' | 'RED';

export class RiskReasonDto {
  impact: number;
  feature: string;
}

export class HeuristicSegmentDto {
  segment_idx: number;
  coordinates: { lat: number; lon: number };
  observation: string;
}

export class RiskEvaluationMetadataDto {
  source?: 'ml_model' | 'fallback_heuristics' | string;
  confianza_clima?: number;
  confianza_iot?: number;
  penalizacion_aplicada?: number;
  base_score?: number;
  iot_found?: boolean;
  distance_km?: number;
  estimated_duration_days?: number;
  nearest_zone?: string;
}

/** Respuesta de POST /api/v1/risk/evaluate y GET /api/v1/risk/spatial */
export class RiskEvaluationResponseDto {
  shipment_id: string;
  composite_score_pct: number;
  alert_level: RiskAlertLevel;
  message: string;
  main_reasons: RiskReasonDto[];
  critical_segment?: HeuristicSegmentDto | null;
  shap_plot_base64?: string | null;
  metadata?: RiskEvaluationMetadataDto;
}

export class EvaluateRiskRequestDto {
  shipment_id: string;
  route_id: string;
  route_points: Array<{ lat: number; lon: number }>;
  transport_types: string[];
  product_types: string[];
  departure_date: string;
  iot_device_id?: string;
}
