export function resolveProfileSaveIntent({
  userId,
  supabaseConfigured,
  loadedProfileFor,
  skipProfileSaveFor,
}) {
  if (!userId || !supabaseConfigured || loadedProfileFor !== userId) {
    return {
      shouldSave: false,
      nextSkipProfileSaveFor: skipProfileSaveFor,
    };
  }

  if (skipProfileSaveFor === userId) {
    return {
      shouldSave: false,
      nextSkipProfileSaveFor: "",
    };
  }

  return {
    shouldSave: true,
    nextSkipProfileSaveFor: skipProfileSaveFor,
  };
}
