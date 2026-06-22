import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Verificar si el usuario ya tiene un tenant asociado en user_roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .maybeSingle()

        return NextResponse.redirect(
          roleData?.tenant_id ? `${origin}/dashboard` : `${origin}/dashboard/onboarding`
        )
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?message=Error+al+confirmar+email`)
}