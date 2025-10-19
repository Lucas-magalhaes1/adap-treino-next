import { authOptions } from '@/lib/auth'
import NextAuth from 'next-auth'

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions)

export const { GET, POST } = handlers
