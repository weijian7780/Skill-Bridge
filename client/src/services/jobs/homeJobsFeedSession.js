export const HAS_SAVED_CAREER_TARGET_KEY = "skillbridge:has-saved-career-target";

export function getCareerTargetStorage(storage) {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function readHasSavedCareerTarget(storage = getCareerTargetStorage()) {
  if (!storage) {
    return false;
  }

  return storage.getItem(HAS_SAVED_CAREER_TARGET_KEY) === "true";
}

export function markCareerTargetSaved(storage = getCareerTargetStorage()) {
  storage?.setItem(HAS_SAVED_CAREER_TARGET_KEY, "true");
}
