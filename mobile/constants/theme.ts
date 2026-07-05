export const COLORS = {
  primary: '#0072B2', // Colorblind safe Blue
  primaryHover: '#005A8D',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#D55E00', // Colorblind safe Vermillion
  errorBackground: '#FFF0E6', // Light Vermillion
  success: '#009E73', // Colorblind safe Bluish green
  warning: '#E69F00', // Colorblind safe Orange
  warningBackground: '#FFF9E6',
  disabled: '#94A3B8',
  disabledBackground: '#F1F5F9',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  giant: 64,
  touchTarget: 48, // WCAG minimum touch target
  radius: 12,
};

export const FONTS = {
  regular: 'System', 
  medium: 'System',
  bold: 'System', 
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};
