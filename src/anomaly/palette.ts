export type AnomalyPalette = {
  id: string;
  name: string;
  primary: string;
  primarySoft: string;
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  border: string;
  glow: string;
};

export const PALETTES: AnomalyPalette[] = [
  {
    id: 'electric-violet',
    name: 'Electric Violet',
    primary: '#8B5CF6',
    primarySoft: '#A78BFA',
    background: '#08060F',
    surface: '#12101C',
    surfaceRaised: '#1A1728',
    text: '#F4F1FF',
    textMuted: '#9A93B8',
    border: '#2A2440',
    glow: 'rgba(139, 92, 246, 0.28)',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    primary: '#A3B1C2',
    primarySoft: '#C7D2DE',
    background: '#0A0B0D',
    surface: '#14161A',
    surfaceRaised: '#1C1F25',
    text: '#F2F4F7',
    textMuted: '#8C939E',
    border: '#2A2E36',
    glow: 'rgba(163, 177, 194, 0.22)',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    primary: '#10B981',
    primarySoft: '#34D399',
    background: '#04100B',
    surface: '#0B1A14',
    surfaceRaised: '#11241C',
    text: '#ECFDF5',
    textMuted: '#87A79A',
    border: '#1E3A2E',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  {
    id: 'rust',
    name: 'Rust',
    primary: '#E2703A',
    primarySoft: '#F2955F',
    background: '#100806',
    surface: '#1C100B',
    surfaceRaised: '#27160F',
    text: '#FFF3EC',
    textMuted: '#B49181',
    border: '#3A2218',
    glow: 'rgba(226, 112, 58, 0.25)',
  },
  {
    id: 'honey',
    name: 'Honey',
    primary: '#EAB308',
    primarySoft: '#FACC15',
    background: '#0F0C04',
    surface: '#1A1608',
    surfaceRaised: '#241F0C',
    text: '#FFFBE8',
    textMuted: '#B0A277',
    border: '#3A3214',
    glow: 'rgba(234, 179, 8, 0.23)',
  },
  {
    id: 'lapiz',
    name: 'Lapiz',
    primary: '#3B82F6',
    primarySoft: '#60A5FA',
    background: '#050A14',
    surface: '#0C1424',
    surfaceRaised: '#121D31',
    text: '#EEF4FF',
    textMuted: '#8698B8',
    border: '#1D2C46',
    glow: 'rgba(59, 130, 246, 0.25)',
  },
];

export const DEFAULT_PALETTE_ID = 'electric-violet';

export const resolvePalette = (id?: string): AnomalyPalette =>
  PALETTES.find(palette => palette.id === id) ??
  PALETTES.find(palette => palette.id === DEFAULT_PALETTE_ID) ??
  PALETTES[0];

/** A translucent version of the accent, for chips and focus rings. */
export const accentAlpha = (palette: AnomalyPalette, alpha: number) => {
  const hex = palette.primary.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
