/**
 * Get the average rating value from restaurant item
 * Handles multiple data structures from API
 */
export const getRatingAverage = item => {
  // Case 1: If the item itself is a rating object (like {average: X, count: Y})
  if (typeof item === 'object' && item !== null && typeof item.average === 'number') {
    return item.average;
  }
  if (typeof item === 'object' && item !== null && typeof item.average === 'string') {
    const avg = Number(item.average);
    return Number.isFinite(avg) ? avg : 0;
  }

  // Case 2: Standard checks for properties within the item
  if (typeof item?.rating?.average === 'number') return item.rating.average;
  if (typeof item?.ratingAverage === 'number') return item.ratingAverage;
  if (typeof item?.rating === 'number') return item.rating; // Direct rating number

  // Case 3: Checks for string values that can be converted to number
  if (typeof item?.rating?.average === 'string') {
    const avg = Number(item.rating.average);
    return Number.isFinite(avg) ? avg : 0;
  }
  if (typeof item?.rating === 'string') {
    const avg = Number(item.rating);
    return Number.isFinite(avg) ? avg : 0;
  }

  // Case 4: Check if item.rating is an object with an 'average' property
  if (typeof item?.rating === 'object' && item.rating !== null && typeof item.rating.average !== 'undefined') {
    const avg = Number(item.rating.average);
    return Number.isFinite(avg) ? avg : 0;
  }

  return 0;
};

/**
 * Get the rating count from restaurant item
 * Handles multiple data structures from API
 */
export const getRatingCount = item => {
  if (typeof item?.ratingCount === 'number') return item.ratingCount;
  if (typeof item?.rating?.count === 'number') return item.rating.count;
  if (typeof item?.rating?.count === 'string') {
    const count = Number(item.rating.count);
    return Number.isFinite(count) ? count : 0;
  }
  return item?.ratingCount || 0;
};
