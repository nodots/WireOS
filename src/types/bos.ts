export type BosLayer = 'geography' | 'institutions' | 'flows' | 'borders';

export interface BosProperties {
  id: string;
  layer: BosLayer;
  firstSeen?: string; // Format: SxxExx (e.g., S01E01)
  title: string;
  notes?: string;
  createdAt: string; // ISO timestamp
  createdBy?: string;
}

export interface BosPointGeometry {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface BosLineGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // Array of [lng, lat]
}

export interface BosPolygonGeometry {
  type: 'Polygon';
  coordinates: [number, number][][]; // Array of rings, each ring is array of [lng, lat]
}

export interface BosMultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: [number, number][][][];
}

export type BosGeometry =
  | BosPointGeometry
  | BosLineGeometry
  | BosPolygonGeometry
  | BosMultiPolygonGeometry;

export interface BosFeature<G extends BosGeometry = BosGeometry> {
  type: 'Feature';
  geometry: G;
  properties: BosProperties;
}

export type BosPointFeature = BosFeature<BosPointGeometry>;
export type BosLineFeature = BosFeature<BosLineGeometry>;
export type BosPolygonFeature = BosFeature<
  BosPolygonGeometry | BosMultiPolygonGeometry
>;

export interface BosFeatureCollection {
  type: 'FeatureCollection';
  features: BosFeature[];
}

// Layer configuration
export const LAYER_CONFIG: Record<
  BosLayer,
  { color: string; geometryType: 'Point' | 'LineString' | 'Polygon' }
> = {
  geography: { color: '#4A90A4', geometryType: 'Point' },
  institutions: { color: '#5B8C5A', geometryType: 'Point' },
  flows: { color: '#D4A574', geometryType: 'LineString' },
  borders: { color: '#8B7B8B', geometryType: 'Polygon' },
};

// Drawing mode states
export type DrawingMode = 'none' | 'point' | 'line' | 'polygon';

// Session tracking for episode gate
export interface SessionAdditions {
  [episode: string]: {
    [layer in BosLayer]?: number;
  };
}
