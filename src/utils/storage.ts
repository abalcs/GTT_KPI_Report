import type { Team, Metrics } from '../types';

const TEAMS_STORAGE_KEY = 'kpi-report-teams';
const SENIORS_STORAGE_KEY = 'kpi-report-seniors';
const METRICS_STORAGE_KEY = 'kpi-report-metrics';

export const loadTeams = (): Team[] => {
  try {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load teams from storage:', error);
  }
  return [];
};

export const saveTeams = (teams: Team[]): void => {
  try {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
  } catch (error) {
    console.error('Failed to save teams to storage:', error);
  }
};

export const loadSeniors = (): string[] => {
  try {
    const stored = localStorage.getItem(SENIORS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load seniors from storage:', error);
  }
  return [];
};

export const saveSeniors = (seniors: string[]): void => {
  try {
    localStorage.setItem(SENIORS_STORAGE_KEY, JSON.stringify(seniors));
  } catch (error) {
    console.error('Failed to save seniors to storage:', error);
  }
};

export const loadMetrics = (): Metrics[] => {
  try {
    const stored = localStorage.getItem(METRICS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load metrics from storage:', error);
  }
  return [];
};

export const saveMetrics = (metrics: Metrics[]): void => {
  try {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.error('Failed to save metrics to storage:', error);
  }
};

export const clearMetrics = (): void => {
  try {
    localStorage.removeItem(METRICS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear metrics from storage:', error);
  }
};
