import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isStrongPassword,
  isNonEmptyString,
  isPositiveInteger,
  isValidDateFormat,
  isValidTimeFormat,
} from './validation.js';

describe('isValidEmail', () => {
  it('accepte un email valide', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('accepte un email avec sous-domaine', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('rejette un email sans @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejette un email sans domaine', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejette une chaîne vide', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isStrongPassword', () => {
  it('accepte un mot de passe de 8 caractères exactement', () => {
    expect(isStrongPassword('abcdefgh')).toBe(true);
  });

  it('accepte un mot de passe long', () => {
    expect(isStrongPassword('motDePasseTrèsLong123!')).toBe(true);
  });

  it('rejette un mot de passe de 7 caractères', () => {
    expect(isStrongPassword('abc1234')).toBe(false);
  });

  it('rejette une chaîne vide', () => {
    expect(isStrongPassword('')).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  it('accepte une chaîne non vide', () => {
    expect(isNonEmptyString('bonjour')).toBe(true);
  });

  it('rejette une chaîne vide', () => {
    expect(isNonEmptyString('')).toBe(false);
  });

  it('rejette une chaîne composée uniquement d\'espaces', () => {
    expect(isNonEmptyString('   ')).toBe(false);
  });

  it('rejette un nombre', () => {
    expect(isNonEmptyString(42)).toBe(false);
  });
});

describe('isPositiveInteger', () => {
  it('accepte un entier positif', () => {
    expect(isPositiveInteger(5)).toBe(true);
  });

  it('rejette zéro', () => {
    expect(isPositiveInteger(0)).toBe(false);
  });

  it('rejette un entier négatif', () => {
    expect(isPositiveInteger(-3)).toBe(false);
  });

  it('rejette un nombre décimal', () => {
    expect(isPositiveInteger(1.5)).toBe(false);
  });

  it('rejette une chaîne numérique', () => {
    expect(isPositiveInteger('5')).toBe(false);
  });
});

describe('isValidDateFormat', () => {
  it('accepte une date valide au format YYYY-MM-DD', () => {
    expect(isValidDateFormat('2025-06-15')).toBe(true);
  });

  it('rejette un format JJ/MM/AAAA', () => {
    expect(isValidDateFormat('15/06/2025')).toBe(false);
  });

  it('rejette une date avec mois invalide (13)', () => {
    expect(isValidDateFormat('2025-13-01')).toBe(false);
  });

  it('rejette une chaîne non-date', () => {
    expect(isValidDateFormat('bonjour')).toBe(false);
  });
});

describe('isValidTimeFormat', () => {
  it('accepte une heure valide HH:MM:SS', () => {
    expect(isValidTimeFormat('14:30:00')).toBe(true);
  });

  it('accepte minuit (00:00:00)', () => {
    expect(isValidTimeFormat('00:00:00')).toBe(true);
  });

  it('rejette une heure avec heures invalides (24)', () => {
    expect(isValidTimeFormat('24:00:00')).toBe(false);
  });

  it('rejette une heure avec minutes invalides (60)', () => {
    expect(isValidTimeFormat('12:60:00')).toBe(false);
  });

  it('rejette un format sans secondes', () => {
    expect(isValidTimeFormat('14:30')).toBe(false);
  });
});
