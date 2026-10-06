const MAX_INT = 2147483647; // Postgres INTEGER

/** Returns the value as a positive integer id, or null if it is not one. */
function parseId(value) {
    const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    return Number.isInteger(n) && n > 0 && n <= MAX_INT ? n : null;
}

function isNonEmptyString(value, maxLength = 255) {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
    return isNonEmptyString(value) && EMAIL_PATTERN.test(value);
}

/** True for whole-number ratings from 1 to 5. */
function isValidRating(value) {
    return Number.isInteger(value) && value >= 1 && value <= 5;
}

module.exports = { parseId, isNonEmptyString, isValidEmail, isValidRating };
