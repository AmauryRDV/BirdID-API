/**
 * Valide si une chaîne de caractères est un format d'email valide.
 * @param email L'email à valider.
 * @returns `true` si l'email est valide, `false` sinon.
 */
export const isValidEmail = (email) => {
    // Regex simple pour la validation d'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
/**
 * Valide si un mot de passe est considéré comme "fort" (au moins 8 caractères).
 * @param password Le mot de passe à valider.
 * @returns `true` si le mot de passe est fort, `false` sinon.
 */
export const isStrongPassword = (password) => {
    // Le mot de passe doit contenir au moins 8 caractères.
    // Vous pouvez ajouter d'autres règles ici (majuscules, minuscules, chiffres, caractères spéciaux).
    return password.length >= 8;
};
/**
 * Valide si une valeur est une chaîne de caractères non vide.
 * @param value La valeur à valider.
 * @returns `true` si la valeur est une chaîne non vide, `false` sinon.
 */
export const isNonEmptyString = (value) => {
    return typeof value === 'string' && value.trim().length > 0;
};
/**
 * Valide si une valeur est un entier positif.
 * @param value La valeur à valider.
 * @returns `true` si la valeur est un entier positif, `false` sinon.
 */
export const isPositiveInteger = (value) => {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
};
/**
 * Valide si une chaîne de caractères est au format de date YYYY-MM-DD.
 * @param dateString La chaîne de date à valider.
 * @returns `true` si le format est valide, `false` sinon.
 */
export const isValidDateFormat = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString))
        return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateString;
};
/**
 * Valide si une chaîne de caractères est au format d'heure HH:MM:SS.
 * @param timeString La chaîne d'heure à valider.
 * @returns `true` si le format est valide, `false` sinon.
 */
export const isValidTimeFormat = (timeString) => {
    const regex = /^\d{2}:\d{2}:\d{2}$/;
    if (!regex.test(timeString))
        return false;
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;
};
