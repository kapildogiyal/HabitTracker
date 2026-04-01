/**
 * Returns today's date as YYYY-MM-DD string
 */
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Returns an array of the last N days as YYYY-MM-DD strings (including today)
 */
const getLastNDays = (n) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

export const getLast7Days = () => getLastNDays(7);
export const getLast30Days = () => getLastNDays(30);

/**
 * Calculate current streak given sorted date strings (descending)
 */
export const calculateStreak = (sortedDates) => {
  if (!sortedDates || sortedDates.length === 0) return 0;
  const sorted = [...sortedDates].sort().reverse(); // descending
  let streak = 0;
  let expected = getTodayString();

  for (const date of sorted) {
    if (date === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toISOString().split('T')[0];
    } else {
      break;
    }
  }
  return streak;
};
