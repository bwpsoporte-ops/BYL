import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/incomes',
  '/expenses',
  '/cards',
  '/fixed-expenses',
  '/projects',
  '/budgets',
  '/documents',
  '/reports',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get('auth_token')?.value);
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtected && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === '/login' || pathname === '/') && hasSession) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  const response = NextResponse.next();
  if (isProtected) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }
  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/incomes/:path*',
    '/expenses/:path*',
    '/cards/:path*',
    '/fixed-expenses/:path*',
    '/projects/:path*',
    '/budgets/:path*',
    '/documents/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ],
};
