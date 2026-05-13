export const getPasswordRequirements = (password = '', t) => {
  const rules = [
    {
      key: 'atLeast8Chars',
      test: (pw) => pw.length >= 8,
    },
    {
      key: 'uppercaseLetter',
      test: (pw) => /[A-Z]/.test(pw),
    },
    {
      key: 'lowercaseLetter',
      test: (pw) => /[a-z]/.test(pw),
    },
    {
      key: 'number',
      test: (pw) => /\d/.test(pw),
    },
    {
      key: 'specialChar',
      test: (pw) => /[@$!%*?&]/.test(pw),
    },
  ];

  return rules.map((rule) => ({
    label: t ? t(`auth.validation.${rule.key}`) : rule.key,
    met: rule.test(password),
  }));
};

export const isPasswordStrongEnough = (password = '') => {
  const tests = [
    (pw) => pw.length >= 8,
    (pw) => /[A-Z]/.test(pw),
    (pw) => /[a-z]/.test(pw),
    (pw) => /\d/.test(pw),
    (pw) => /[@$!%*?&]/.test(pw),
  ];
  return tests.every(test => test(password));
};

export const formatApiError = (error, fallbackMessage) => {
  const details = error?.response?.data?.details;

  if (Array.isArray(details) && details.length > 0) {
    const messages = details
      .map((detail) => detail?.message)
      .filter(Boolean);

    if (messages.length > 0) {
      return Array.from(new Set(messages)).join(' • ');
    }
  }

  return error?.response?.data?.error || error?.message || fallbackMessage;
};
