import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/* Routes that require a logged-in session */
const PROTECTED_PREFIXES = [
  '/dat-chuyen',
  '/cho-sinh-vien/dang-ban',
  '/cho-sinh-vien/yeu-thich',
  '/cho-sinh-vien/tin-cua-toi',
  '/don-hang',
  '/hoat-dong',
  '/tin-nhan',
  '/tai-khoan',
  '/thong-bao',
  '/ho-tro/bao-cao',
]

/* Routes that logged-in users should NOT see (auth pages) */
const AUTH_PREFIXES = ['/dang-nhap', '/dang-ky', '/quen-mat-khau']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('unimove_token')?.value

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
  const isAuthPage = AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  /* Unauthenticated user tries to access protected page */
  if (isProtected && !token) {
    const loginUrl = new URL('/dang-nhap', request.url)
    loginUrl.searchParams.set('tiep-theo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  /* Authenticated user lands on a login/register page — send home */
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dat-chuyen/:path*',
    '/cho-sinh-vien/dang-ban',
    '/cho-sinh-vien/dang-ban/:path*',
    '/cho-sinh-vien/yeu-thich/:path*',
    '/cho-sinh-vien/tin-cua-toi/:path*',
    '/don-hang/:path*',
    '/hoat-dong/:path*',
    '/tin-nhan/:path*',
    '/tai-khoan/:path*',
    '/thong-bao/:path*',
    '/ho-tro/bao-cao/:path*',
    '/dang-nhap',
    '/dang-ky',
    '/quen-mat-khau',
  ],
}
