export const COOKIE_ACCESS_NAME = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') ? '__Host-iw-access' : 'iw-access';
export const COOKIE_REFRESH_NAME = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') ? '__Host-iw-refresh' : 'iw-refresh';

export const COOKIE_THERAPIST_ACCESS_NAME = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') ? '__Host-iw-th-access' : 'iw-th-access';
export const COOKIE_THERAPIST_REFRESH_NAME = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') ? '__Host-iw-th-refresh' : 'iw-th-refresh';

export const getCookieOptions = (maxAgeSeconds: number) => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd, // require HTTPS in production, allow HTTP in dev (needed for 127.0.0.1 / IP testing)
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds
  };
};
