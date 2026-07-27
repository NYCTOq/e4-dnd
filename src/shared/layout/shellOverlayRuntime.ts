export const FIRST_RUN_STORAGE_KEY = "e4_dnd_first_run_guide_v1";
export const LAST_SEEN_VERSION_KEY = "e4_dnd_last_seen_version_v1";
export const FIRST_RUN_COMPLETED_EVENT = "e4:first-run-completed";

export function hasCompletedFirstRun(storage: Pick<Storage, "getItem">) {
  return storage.getItem(FIRST_RUN_STORAGE_KEY) === "true";
}

export function shouldOpenReleaseNotes(
  storage: Pick<Storage, "getItem">,
  version: string,
) {
  return (
    hasCompletedFirstRun(storage) &&
    storage.getItem(LAST_SEEN_VERSION_KEY) !== version
  );
}
