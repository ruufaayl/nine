import type { CharacterTheme } from '../types/game';

export const TheArchitect: CharacterTheme = {
  id: 'architect',
  name: 'The Architect',
  colors: {
    background: '#0a0e27',
    gridLines: '#1e3a5f',
    primaryText: '#f0f4ff',
    accent: '#4a90e2',
    error: '#ff6b6b',
  },
};

export const TheOracle: CharacterTheme = {
  id: 'oracle',
  name: 'The Oracle',
  colors: {
    background: '#0f0612',
    gridLines: '#2d1b4e',
    primaryText: '#e8d5f2',
    accent: '#9d6fd3',
    error: '#ff6b6b',
  },
};

export const TheAnalyst: CharacterTheme = {
  id: 'analyst',
  name: 'The Analyst',
  colors: {
    background: '#0a0f0a',
    gridLines: '#1a3a1a',
    primaryText: '#00ff41',
    accent: '#00cc33',
    error: '#ff5555',
  },
};

export const TheSculptor: CharacterTheme = {
  id: 'sculptor',
  name: 'The Sculptor',
  colors: {
    background: '#1a1612',
    gridLines: '#3d3428',
    primaryText: '#f5f0e8',
    accent: '#d4a574',
    error: '#e85d5d',
  },
};

export const THEMES: CharacterTheme[] = [
  TheArchitect,
  TheOracle,
  TheAnalyst,
  TheSculptor,
];

export function getThemeById(id: string): CharacterTheme | undefined {
  return THEMES.find((t) => t.id === id);
}
