export const colors = {
  accent: {
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryLight: '#DBEAFE',
    primaryDark: '#1D4ED8',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
  },
  background: {
    primary: '#0F172A',
    secondary: '#1E293B',
    tertiary: '#334155',
    hover: '#475569',
    active: '#64748B',
  },
  surface: {
    primary: '#1E293B',
    secondary: '#334155',
    tertiary: '#475569',
    border: '#334155',
    borderHover: '#475569',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    inverse: '#0F172A',
    onAccent: '#FFFFFF',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  overlay: {
    backdrop: 'rgba(15, 23, 42, 0.8)',
    modal: 'rgba(15, 23, 42, 0.95)',
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.3)',
};

export const typography = {
  fontFamily: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
};

export const zIndex = {
  dropdown: '100',
  sticky: '200',
  modal: '300',
  popover: '400',
  tooltip: '500',
  toast: '600',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const layout = {
  sidebarWidth: '260px',
  sidebarCollapsedWidth: '72px',
  headerHeight: '64px',
  maxContentWidth: '1400px',
};

export const accentOptions = {
  blue: {
    name: 'Ocean Blue',
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryLight: '#1E3A5F',
  },
  emerald: {
    name: 'Emerald Green',
    primary: '#10B981',
    primaryHover: '#059669',
    primaryLight: '#064E3B',
  },
  violet: {
    name: 'Violet Purple',
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryLight: '#3B0764',
  },
  amber: {
    name: 'Amber Gold',
    primary: '#F59E0B',
    primaryHover: '#D97706',
    primaryLight: '#78350F',
  },
  rose: {
    name: 'Rose Pink',
    primary: '#F43F5E',
    primaryHover: '#E11D48',
    primaryLight: '#881337',
  },
  cyan: {
    name: 'Cyan Teal',
    primary: '#06B6D4',
    primaryHover: '#0891B2',
    primaryLight: '#164E63',
  },
};

export type AccentKey = keyof typeof accentOptions;
export const defaultAccent: AccentKey = 'blue';

export const hindiTranslations = {
  'PENTACLOUD': 'पेंटाक्लाउड',
  'My Files': 'मेरी फाइलें',
  'Shared': 'शेयर्ड',
  'Storage Usage': 'स्टोरेज उपयोग',
  'Settings': 'सेटिंग्स',
  'Search files...': 'फाइलें खोजें...',
  'Upload': 'अपलोड',
  'New Folder': 'नया फोल्डर',
  'Grid View': 'ग्रिड दृश्य',
  'List View': 'सूची दृश्य',
  'Sort by': 'क्रमबद्ध करें',
  'Name': 'नाम',
  'Size': 'आकार',
  'Date Modified': 'संशोधित तिथि',
  'Download': 'डाउनलोड',
  'Rename': 'नाम बदलें',
  'Move': 'स्थानांतरित',
  'Delete': 'हटाएं',
  'Share': 'शेयर करें',
  'Preview': 'पूर्वावलोकन',
  'Create Share Link': 'शेयर लिंक बनाएं',
  'Expires in (hours, optional)': 'समाप्ति (घंटे, वैकल्पिक)',
  'Create Link': 'लिंक बनाएं',
  'Cancel': 'रद्द करें',
  'Copy': 'कॉपी करें',
  'Copied!': 'कॉपी हो गया!',
  'Total Storage': 'कुल स्टोरेज',
  'Used': 'उपयोग किया गया',
  'Free': 'मुक्त',
  'Account': 'खाता',
  'Back to Dashboard': 'डैशबोर्ड पर वापस',
  'Unable to Preview': 'पूर्वावलोकन उपलब्ध नहीं',
  'Preview Not Available': 'पूर्वावलोकन उपलब्ध नहीं',
  'This file type cannot be previewed in the browser': 'इस फ़ाइल प्रकार का ब्राउज़र में पूर्वावलोकन नहीं किया जा सकता',
  'Download File': 'फ़ाइल डाउनलोड करें',
  'Ready to download': 'डाउनलोड के लिए तैयार',
  'Sign In': 'साइन इन करें',
  'Create Account': 'खाता बनाएं',
  'Email': 'ईमेल',
  'Password': 'पासवर्ड',
  'Name (optional)': 'नाम (वैकल्पिक)',
  'Confirm Password': 'पासवर्ड की पुष्टि करें',
  "Don't have an account?": 'खाता नहीं है?',
  'Already have an account?': 'पहले से खाता है?',
  'Sign up': 'साइन अप करें',
  'Sign in': 'साइन इन करें',
  'Welcome to PENTACLOUD': 'पेंटाक्लाउड में आपका स्वागत है',
  'Join PENTACLOUD - 50GB unified cloud storage': 'पेंटाक्लाउड से जुड़ें - 50GB एकीकृत क्लाउड स्टोरेज',
  'Sign in to access your unified cloud storage': 'अपने एकीकृत क्लाउड स्टोरेज तक पहुंचने के लिए साइन इन करें',
  'Drag & drop files here, or click to browse': 'फाइलें यहां ड्रैग और ड्रॉप करें, या ब्राउज़ करने के लिए क्लिक करें',
  'Maximum file size: 5GB per file': 'अधिकतम फ़ाइल आकार: 5GB प्रति फ़ाइल',
  'No files in this folder': 'इस फोल्डर में कोई फाइल नहीं',
  'Drag and drop files above or click to upload': 'ऊपर फाइलें ड्रैग और ड्रॉप करें या अपलोड करने के लिए क्लिक करें',
  'Folders': 'फोल्डर',
  'All Files': 'सभी फाइलें',
  'New folder': 'नया फोल्डर',
  'Rename file': 'फ़ाइल का नाम बदलें',
  'Rename folder': 'फोल्डर का नाम बदलें',
  'Move to Folder': 'फोल्डर में ले जाएं',
  'Root (All Files)': 'रूट (सभी फाइलें)',
  'Move Here': 'यहां ले जाएं',
  'Are you sure you want to delete this file?': 'क्या आप वाकई इस फाइल को हटाना चाहते हैं?',
  'Are you sure you want to delete this folder?': 'क्या आप वाकई इस फोल्डर को हटाना चाहते हैं?',
  'Account Settings': 'खाता सेटिंग्स',
  'Backblaze B2 Accounts': 'बैकब्लेज B2 खाते',
  'Add Account': 'खाता जोड़ें',
  'Account Name': 'खाता नाम',
  'Key ID': 'की आईडी',
  'Application Key': 'एप्लिकेशन की',
  'Bucket ID': 'बकेट आईडी',
  'Bucket Name': 'बकेट नाम',
  'Bucket Region (optional)': 'बकेट क्षेत्र (वैकल्पिक)',
  'Max Size (GB)': 'अधिकतम आकार (GB)',
  'No B2 accounts configured': 'कोई B2 खाता कॉन्फ़िगर नहीं किया गया',
  'Add your first account to start storing files': 'स्टोरेज शुरू करने के लिए अपना पहला खाता जोड़ें',
  'Security': 'सुरक्षा',
  'Danger Zone': 'खतरे का क्षेत्र',
  'Sign Out': 'साइन आउट',
  'How It Works': 'यह कैसे काम करता है',
  'Files automatically route to the account with the most free space': 'फाइलें स्वचालित रूप से सबसे अधिक खाली स्थान वाले खाते में जाती हैं',
  'Each account provides 10GB free tier (50GB total)': 'प्रत्येक खाता 10GB मुफ्त टियर प्रदान करता है (कुल 50GB)',
  'Transparent to you - just upload and go!': 'आपके लिए पारदर्शी - बस अपलोड करें और जाएं!',
  'Per-Account Breakdown': 'प्रति-खाता विवरण',
};

export type Language = 'en' | 'hi';

export function t(key: string, lang: Language = 'en'): string {
  if (lang === 'hi' && hindiTranslations[key as keyof typeof hindiTranslations]) {
    return hindiTranslations[key as keyof typeof hindiTranslations];
  }
  return key;
}