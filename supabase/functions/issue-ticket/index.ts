import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const DURATIONS = [15, 30, 60, 120];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    const body = await req.json().catch(() => ({}));
    const duration = Number(body.duration);
    const mode = String(body.mode || 'classic');

    if (!DURATIONS.includes(duration)) {
      return Response.json({ ok: false, error: 'Invalid duration' }, { status: 400, headers: corsHeaders });
    }

    if (!['classic', 'daily'].includes(mode)) {
      return Response.json({ ok: false, error: 'Invalid mode' }, { status: 400, headers: corsHeaders });
    }

    // Resolve user ID: either from authenticated session or persistent guest ID
    let effectiveUserId: string | null = null;
    if (authHeader && authHeader !== `Bearer ${supabaseAnonKey}`) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        effectiveUserId = user.id;
      }
    }

    if (!effectiveUserId) {
      if (body.guestId && UUID_REGEX.test(body.guestId)) {
        effectiveUserId = body.guestId;
      } else {
        effectiveUserId = crypto.randomUUID();
      }
    }

    const seed = mode === 'daily' ? getTodayUTC() : 'classic-v1';
    // Allow duration seconds + 45s grace period for client typing, network, and submission
    const expiresAt = new Date(Date.now() + (duration + 45) * 1000).toISOString();

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: ticket, error: ticketError } = await adminClient
      .from('run_tickets')
      .insert({
        user_id: effectiveUserId,
        mode,
        duration,
        seed,
        challenge_version: 1,
        expires_at: expiresAt,
        used: false,
      })
      .select('ticket_id, mode, duration, seed, expires_at, issued_at')
      .single();

    if (ticketError || !ticket) {
      console.error('Ticket creation error:', ticketError);
      return Response.json({ ok: false, error: 'Failed to generate run ticket' }, { status: 500, headers: corsHeaders });
    }

    return Response.json(
      {
        ok: true,
        ticket: {
          ticketId: ticket.ticket_id,
          mode: ticket.mode,
          duration: ticket.duration,
          seed: ticket.seed,
          expiresAt: ticket.expires_at,
          issuedAt: ticket.issued_at,
        },
      },
      { headers: corsHeaders }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
