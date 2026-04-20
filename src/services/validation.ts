export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const isNonEmptyString = (value: any): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isPositiveInteger = (value: any): boolean => {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
};

export const isValidDateFormat = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateString;
};

export const isValidTimeFormat = (timeString: string): boolean => {
  const regex = /^\d{2}:\d{2}:\d{2}$/;
  if (!regex.test(timeString)) return false;
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;
};