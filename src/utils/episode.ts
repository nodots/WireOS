import type { BosLayer, SessionAdditions } from '../types/bos';

export interface ParsedEpisode {
  season: number;
  episode: number;
}

const EPISODE_REGEX = /^S(\d{2})E(\d{2})$/i;

export function validateEpisodeFormat(value: string): boolean {
  return EPISODE_REGEX.test(value);
}

export function parseEpisode(value: string): ParsedEpisode | null {
  const match = value.match(EPISODE_REGEX);
  if (!match) {
    return null;
  }
  return {
    season: parseInt(match[1], 10),
    episode: parseInt(match[2], 10),
  };
}

export function formatEpisode(season: number, episode: number): string {
  const s = season.toString().padStart(2, '0');
  const e = episode.toString().padStart(2, '0');
  return `S${s}E${e}`;
}

/**
 * Compare two episodes.
 * Returns:
 *  - negative if a is before b
 *  - 0 if a equals b
 *  - positive if a is after b
 */
export function compareEpisodes(a: string, b: string): number {
  const parsedA = parseEpisode(a);
  const parsedB = parseEpisode(b);

  if (!parsedA || !parsedB) {
    return 0;
  }

  if (parsedA.season !== parsedB.season) {
    return parsedA.season - parsedB.season;
  }
  return parsedA.episode - parsedB.episode;
}

export interface EpisodeGateWarning {
  type: 'duplicate_layer' | 'future_episode';
  message: string;
}

export function checkEpisodeGate(
  currentEpisode: string,
  featureEpisode: string,
  featureLayer: BosLayer,
  sessionAdditions: SessionAdditions
): EpisodeGateWarning[] {
  const warnings: EpisodeGateWarning[] = [];

  // Check if firstSeen is ahead of current episode
  if (featureEpisode && currentEpisode) {
    const comparison = compareEpisodes(featureEpisode, currentEpisode);
    if (comparison > 0) {
      warnings.push({
        type: 'future_episode',
        message: `Warning: This feature's first appearance (${featureEpisode}) is ahead of your current episode (${currentEpisode}).`,
      });
    }
  }

  // Check if user already added a feature to this layer for current episode
  if (currentEpisode && sessionAdditions[currentEpisode]?.[featureLayer]) {
    const count = sessionAdditions[currentEpisode][featureLayer];
    if (count && count >= 1) {
      warnings.push({
        type: 'duplicate_layer',
        message: `Warning: You've already added ${count} feature(s) to the "${featureLayer}" layer for episode ${currentEpisode}.`,
      });
    }
  }

  return warnings;
}
