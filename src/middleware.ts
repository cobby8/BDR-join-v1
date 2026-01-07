import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired - required for Server Components
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Protect /admin routes
    if (path.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Redirect /login to /admin if already logged in
    if (path === '/login' && user) {
        return NextResponse.redirect(new URL('/admin', request.url))
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*', '/login'],
}
