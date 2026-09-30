export const COLORS = {
  // Main Theme: Soft Oceanic Blue & Mint Gradient Mix
  primary: '#0284C7', // Sky 600
  primaryLight: '#E0F2FE', // Sky 100
  primaryDark: '#0369A1',
  secondary: '#06B6D4', // Cyan
  mint: '#14B8A6', // Teal / Mint
  lavender: '#818CF8', // Soft Indigo / Lavender
  background: '#F0F9FF', // Sky 50 (Soft light blue background)
  card: '#FFFFFF',
  text: '#0F172A', // Slate 900
  textMuted: '#64748B', // Slate 500
  border: '#E2E8F0', // Slate 200

  // Curated 2-3 Color Blended Gradients
  gradients: {
    // Primary Button / Accent: Sky Blue -> Cyan -> Mint
    primary: ['#0EA5E9', '#06B6D4', '#14B8A6'] as const,
    // Logo / Header Icon
    logo: ['#38BDF8', '#0EA5E9', '#2DD4BF'] as const,
    // Soft Header Background Wash
    headerWash: ['#FFFFFF', '#F0F9FF', '#E0F2FE'] as const,

    // Task Card Left-Side Accent Bar Gradients (Pha 2-3 màu ở thanh bên trái)
    taskStatus: {
      todo: ['#38BDF8', '#6366F1', '#A855F7'] as const, // Sky Blue -> Indigo -> Purple
      in_progress: ['#0EA5E9', '#06B6D4', '#2DD4BF'] as const, // Sky -> Cyan -> Mint
      done: ['#2DD4BF', '#10B981', '#34D399'] as const, // Mint -> Emerald -> Light Green
    },
    taskPriority: {
      high: ['#F43F5E', '#FB923C', '#FBBF24'] as const, // Rose -> Coral -> Amber
      medium: ['#38BDF8', '#818CF8', '#06B6D4'] as const, // Sky Blue -> Lavender -> Cyan
      low: ['#2DD4BF', '#34D399', '#38BDF8'] as const, // Mint -> Light Emerald -> Sky Blue
    },
  },
  
  // Status colors for chips and badges
  status: {
    todo: {
      bg: '#F0F9FF',
      text: '#0284C7',
      border: '#BAE6FD',
      label: 'To Do',
    },
    in_progress: {
      bg: '#ECFEFF',
      text: '#0891B2',
      border: '#A5F3FC',
      label: 'In Progress',
    },
    done: {
      bg: '#F0FDF4',
      text: '#16A34A',
      border: '#BBF7D0',
      label: 'Done',
    },
  },

  // Priority colors
  priority: {
    low: {
      bg: '#F0FDFA',
      text: '#0D9488',
      label: 'Low',
    },
    medium: {
      bg: '#EFF6FF',
      text: '#2563EB',
      label: 'Medium',
    },
    high: {
      bg: '#FFF1F2',
      text: '#E11D48',
      label: 'High',
    },
  },

  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#10B981',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  full: 9999,
};
