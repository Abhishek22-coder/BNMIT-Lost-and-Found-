import { ValidationResult } from './types.js';

export const ALLOWED_DEPTS = ['AI', 'CS', 'EC', 'EE', 'ME', 'IS'];

export const DEPT_MAPPING: Record<string, string> = {
  'AI': 'aiml',
  'CS': 'cse',
  'EC': 'ece',
  'EE': 'eee',
  'ME': 'me',
  'IS': 'ise'
};

export function validateUSNAndEmail(usn: string, email: string): ValidationResult {
  const cleanUsn = usn.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();

  // USN Pattern: 1BG[YY][DEPT][3DIGITS]
  const usnRegex = /^1BG(\d{2})([A-Z]{2})(\d{3})$/;
  const usnM = cleanUsn.match(usnRegex);

  if (!usnM) {
    return {
      isValid: false,
      error: 'Invalid USN format. Must strictly be like: 1BG24AI002'
    };
  }

  const usnYear = usnM[1];
  const usnDept = usnM[2];
  const usnRoll = usnM[3];

  if (!ALLOWED_DEPTS.includes(usnDept)) {
    return {
      isValid: false,
      error: `Invalid Department code in USN "${usnDept}". Allowed: ${ALLOWED_DEPTS.join(', ')}`
    };
  }

  // Email Pattern: [yy][dept][3digits]@bnmit.in where dept is 2 to 4 chars
  const emailRegex = /^(\d{2})([a-z]{2,4})(\d{3})@bnmit\.in$/;
  const emailM = cleanEmail.match(emailRegex);

  if (!emailM) {
    return {
      isValid: false,
      error: 'Invalid BNMIT Email. Must be official format like: 24aiml002@bnmit.in or 24cse045@bnmit.in'
    };
  }

  const emailYear = emailM[1];
  const emailDept = emailM[2].toLowerCase();
  const emailRoll = emailM[3];

  if (usnYear !== emailYear) {
    return {
      isValid: false,
      error: `Year mismatch. USN year (${usnYear}) does not match Email year (${emailYear}).`
    };
  }

  const expectedEmailDept = DEPT_MAPPING[usnDept] || usnDept.toLowerCase();
  if (expectedEmailDept !== emailDept) {
    return {
      isValid: false,
      error: `Department mismatch. For USN department "${usnDept}", the email department code must be "${expectedEmailDept}" (e.g. ${expectedEmailDept} instead of ${emailDept}).`
    };
  }

  if (usnRoll !== emailRoll) {
    return {
      isValid: false,
      error: `Roll details mismatch. USN roll (${usnRoll}) does not match Email roll (${emailRoll}).`
    };
  }

  return {
    isValid: true,
    parsed: {
      year: usnYear,
      dept: usnDept,
      roll: usnRoll
    }
  };
}
