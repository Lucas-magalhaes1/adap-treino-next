import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isRootPath = request.nextUrl.pathname === '/'

  // Proteger rotas do dashboard
  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirecionar usuário logado tentando acessar auth para dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard/trainings', request.url))
  }

  // Redirecionar / para dashboard se logado, auth/login se não logado
  if (isRootPath) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard/trainings', request.url))
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/auth/:path*'],
}
