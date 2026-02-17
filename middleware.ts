export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/', '/leads/:path*', '/compliance', '/api/places/:path*', '/api/leads']
};
