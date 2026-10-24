export const STORAGE_KEYS = {
  users: "sw_users_v1",
  cars: "sw_cars_v1",
  bookings: "sw_bookings_v1",
  reviews: "sw_reviews_v1",
  disputes: "sw_disputes_v1",
  announcements: "sw_announcements_v1",
  session: "sw_session_v1",
  checkoutDraft: "sw_checkout_draft_v1",
};

function getStorage(type) {
  if (typeof window === "undefined") {
    return null;
  }

  if (type === "session") {
    return window.sessionStorage;
  }

  return window.localStorage;
}

export function readStoredData(key, fallback = null, type = "local") {
  try {
    const storage = getStorage(type);

    if (!storage) {
      return fallback;
    }

    const savedValue = storage.getItem(key);

    if (savedValue === null) {
      return fallback;
    }

    return JSON.parse(savedValue);
  } catch {
    return fallback;
  }
}

export function writeStoredData(key, value, type = "local") {
  try {
    const storage = getStorage(type);

    if (!storage) {
      return false;
    }

    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStoredData(key, type = "local") {
  try {
    const storage = getStorage(type);

    if (!storage) {
      return false;
    }

    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}