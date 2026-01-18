import type {
  BosFeature,
  BosFeatureCollection,
  BosGeometry,
  BosLayer,
  BosProperties,
  LAYER_CONFIG,
} from '../types/bos';
import { generateId } from './uuid';

const VALID_LAYERS: BosLayer[] = [
  'geography',
  'institutions',
  'flows',
  'borders',
];

export function isValidLayer(layer: string): layer is BosLayer {
  return VALID_LAYERS.includes(layer as BosLayer);
}

export function validateBosFeature(feature: unknown): feature is BosFeature {
  if (typeof feature !== 'object' || feature === null) {
    return false;
  }

  const f = feature as Record<string, unknown>;

  if (f.type !== 'Feature') {
    return false;
  }

  if (typeof f.geometry !== 'object' || f.geometry === null) {
    return false;
  }

  const geom = f.geometry as Record<string, unknown>;
  const validGeomTypes = ['Point', 'LineString', 'Polygon', 'MultiPolygon'];
  if (!validGeomTypes.includes(geom.type as string)) {
    return false;
  }

  if (!Array.isArray(geom.coordinates)) {
    return false;
  }

  if (typeof f.properties !== 'object' || f.properties === null) {
    return false;
  }

  const props = f.properties as Record<string, unknown>;

  if (typeof props.id !== 'string') {
    return false;
  }

  if (!isValidLayer(props.layer as string)) {
    return false;
  }

  if (typeof props.title !== 'string') {
    return false;
  }

  return true;
}

export function validateBosFeatureCollection(
  data: unknown
): data is BosFeatureCollection {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const fc = data as Record<string, unknown>;

  if (fc.type !== 'FeatureCollection') {
    return false;
  }

  if (!Array.isArray(fc.features)) {
    return false;
  }

  return fc.features.every(validateBosFeature);
}

export function createFeature(
  layer: BosLayer,
  title: string,
  geometry: BosGeometry,
  options?: {
    firstSeen?: string;
    notes?: string;
    createdBy?: string;
  }
): BosFeature {
  const properties: BosProperties = {
    id: generateId(),
    layer,
    title,
    createdAt: new Date().toISOString(),
    ...(options?.firstSeen && { firstSeen: options.firstSeen }),
    ...(options?.notes && { notes: options.notes }),
    ...(options?.createdBy && { createdBy: options.createdBy }),
  };

  return {
    type: 'Feature',
    geometry,
    properties,
  };
}

export function createEmptyFeatureCollection(): BosFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [],
  };
}

export function getGeometryTypeForLayer(
  layer: BosLayer,
  config: typeof LAYER_CONFIG
): 'Point' | 'LineString' | 'Polygon' {
  return config[layer].geometryType;
}
