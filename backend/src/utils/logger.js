/**
 * Safe Logger — masks sensitive data in production
 */
const isProd = process.env.NODE_ENV === 'production';

function mask(str, showFirst = 3, showLast = 3) {
  if (!str || typeof str !== 'string' || str.length <= showFirst + showLast) return '***';
  return str.slice(0, showFirst) + '***' + str.slice(-showLast);
}

module.exports = {
  info: (...args) => { if (!isProd) console.log(...args); },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  sensitive: (label, data) => {
    if (isProd) return;
    console.log('[DEV]', label, typeof data === 'string' ? mask(data) : data);
  },
  mask,
};
