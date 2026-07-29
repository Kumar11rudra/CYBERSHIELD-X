/**
 * formatLabel Helper
 * Converts camelCase or snake_case keys into readable Title Case labels.
 */
export const formatLabel = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();

export default formatLabel;
