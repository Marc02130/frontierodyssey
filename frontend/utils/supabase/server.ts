import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies();
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            const cookieStore = await cookies();
            await Promise.all(
              cookiesToSet.map(({ name, value, options }) => cookieStore.set(name, value, options))
            );
          } catch {
            // Ignore Server Component errors
          }
        },
      },
      cookieOptions: {
        name: 'sb-joszarvzpdmagwhgadkd-auth-token',
        maxAge: 60 * 60 * 24 * 100, // 100 days
        domain: 'localhost',
        path: '/',
        sameSite: 'lax',
        secure: false,
      },
    }
  );
}