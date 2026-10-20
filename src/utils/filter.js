// Filter for the swipe stack: campuses (empty = all) and a price range (null = no limit).
export const EMPTY_FILTER = { locations: [], minPrice: null, maxPrice: null };

// "€25.50" or "25,50" -> 25.5, null if there is no number in it.
export const parsePrice = (text) => {
  const number = parseFloat(String(text).replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isNaN(number) ? null : number;
};

// Compare place names without case and umlauts, so "Hameenlinna" matches "Hämeenlinna".
const normalize = (place) =>
  place.toLowerCase().trim().replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a");

export const isFilterActive = (filter) =>
  filter.locations.length > 0 || filter.minPrice !== null || filter.maxPrice !== null;

export function matchesFilter(post, filter) {
  if (filter.locations.length > 0) {
    const place = post.location ? normalize(post.location) : null;
    if (!place || !filter.locations.some((location) => normalize(location) === place)) {
      return false;
    }
  }

  const price = parsePrice(post.price);
  if (filter.minPrice !== null && (price === null || price < filter.minPrice)) {
    return false;
  }
  if (filter.maxPrice !== null && (price === null || price > filter.maxPrice)) {
    return false;
  }

  return true;
}
