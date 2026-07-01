export const COLORS = {
  primary: '#0F4C81', // Classic authoritative blue (Pantone Classic Blue)
  primaryHover: '#0b3961',
  background: '#F8FAFC', // Slate 50 for a clean base
  surface: '#FFFFFF',
  text: '#0F172A', // Slate 900 for high contrast
  textSecondary: '#64748B', // Slate 500
  border: '#E2E8F0', // Slate 200
  error: '#DC2626', // Red 600
  errorBackground: '#FEF2F2', // Red 50
  success: '#059669', // Emerald 600
  warning: '#D97706', // Amber 600
  warningBackground: '#FFFBEB', // Amber 50
  disabled: '#94A3B8', // Slate 400
  disabledBackground: '#F1F5F9', // Slate 100
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  giant: 64,
  touchTarget: 48, // Minimum touch target size (WCAG)
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};
