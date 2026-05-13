export const EMAIL_RISK_THEME = {
  safe: {
    badge: 'border-cyber-green/40 bg-cyber-green/10 text-cyber-green',
    accent: '#00ff88',
    label: 'Safe',
  },
  review: {
    badge: 'border-yellow-500/40 bg-yellow-500/10 text-cyber-yellow',
    accent: '#ffdd00',
    label: 'Review',
  },
  suspicious: {
    badge: 'border-orange-500/40 bg-orange-500/10 text-cyber-orange',
    accent: '#ff8c00',
    label: 'Suspicious',
  },
  disposable: {
    badge: 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red',
    accent: '#ff2244',
    label: 'Disposable',
  },
  invalid: {
    badge: 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red',
    accent: '#ff2244',
    label: 'Invalid',
  },
};

export const getEmailRiskTheme = (status = 'review') => EMAIL_RISK_THEME[status] || EMAIL_RISK_THEME.review;
