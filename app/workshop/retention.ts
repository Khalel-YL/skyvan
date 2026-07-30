import "server-only";

const ANONYMOUS_PUBLIC_BUILD_RETENTION_DAYS = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function getAnonymousPublicBuildExpiresAt(now: Date) {
  return new Date(
    now.getTime() +
      ANONYMOUS_PUBLIC_BUILD_RETENTION_DAYS * MILLISECONDS_PER_DAY,
  );
}
