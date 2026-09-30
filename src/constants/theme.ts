export const COLORS = {
  // Main Theme: Soft Periwinkle & Light Blue-Violet Palette (Màu Xanh Tím Nhạt)
  primary: '#6366F1', // Indigo / Periwinkle (Xanh tím chủ đạo)
  primaryLight: '#EEF2FF', // Xanh tím nhạt pastel
  primaryDark: '#4F46E5', // Xanh tím đậm
  periwinkle: '#818CF8', // Xanh tím phấn
  skyBlue: '#38BDF8', // Xanh da trời nhạt
  lavender: '#A78BFA', // Tím nhạt Lavender
  lilac: '#C084FC', // Tím hoa cà nhạt
  background: '#F5F3FF', // Nền tím xanh nhạt siêu êm dịu (Violet 50)
  card: '#FFFFFF',
  text: '#0F172A', // Slate 900
  textMuted: '#64748B', // Slate 500
  border: '#E0E7FF', // Viền xanh tím pastel siêu mỏng

  // Curated 2-3 Color Blended Gradients (Xanh tím nhạt pha trộn)
  gradients: {
    // Primary Button / Accent: Sky Blue -> Xanh tím Periwinkle -> Tím Lilac
    primary: ['#38BDF8', '#6366F1', '#A855F7'] as const,
    // Logo Icon: Xanh nhạt -> Xanh tím -> Lavender
    logo: ['#60A5FA', '#6366F1', '#C084FC'] as const,

    // Task Card Left-Side Accent Bar (Thanh bên trái khung pha màu xanh tím nhạt)
    taskStatus: {
      todo: ['#818CF8', '#A855F7', '#C084FC'] as const, // Xanh tím -> Tím hoa cà -> Lilac
      in_progress: ['#38BDF8', '#6366F1', '#818CF8'] as const, // Sky -> Xanh tím -> Periwinkle
      done: ['#34D399', '#818CF8', '#A78BFA'] as const, // Mint pastel -> Xanh tím -> Lavender
    },
    taskPriority: {
      high: ['#F43F5E', '#EC4899', '#A855F7'] as const, // Rose -> Hồng tím -> Tím
      medium: ['#38BDF8', '#818CF8', '#C084FC'] as const, // Sky nhạt -> Xanh tím nhạt -> Lavender
      low: ['#2DD4BF', '#60A5FA', '#818CF8'] as const, // Mint -> Sky -> Xanh tím
    },
  },
  
  // Status colors for chips and badges
  status: {
    todo: {
      bg: '#F5F3FF',
      text: '#7C3AED',
      border: '#DDD6FE',
      label: 'To Do',
    },
    in_progress: {
      bg: '#EEF2FF',
      text: '#4F46E5',
      border: '#C7D2FE',
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
      bg: '#EEF2FF',
      text: '#4F46E5',
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
