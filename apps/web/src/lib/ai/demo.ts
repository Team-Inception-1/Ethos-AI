/** Local illustrative data is opt-in and is never enabled in production builds. */
export const OFFLINE_DEMO_ENABLED = process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_OFFLINE_DEMO === 'true';
