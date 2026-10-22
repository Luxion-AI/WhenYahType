import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { computeVerifiedStats, generateTargetText, getTodayUTC } from '../_shared/generator.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ ok: false, error: 'Sign-in required' }, { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return Response.json({ ok: false, error: 'Invalid session' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const ticketId = String(body.ticketId || '');
    const typed = String(body.typed || '');
    const elapsedMs = Number(body.elapsedMs || 0);

    if (!ticketId) {
      return Response.json({ ok: false, error: 'Ticket ID is required' }, { status: 400, headers: corsHeaders });
    }

    if (typed.length < 1 || typed.length > 3000) {
      return Response.json({ ok: false, error: 'Invalid typed text length' }, { status: 400, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify single-use ticket
    const { data: ticket, error: ticketError } = await admin
      .from('run_tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return Response.json({ ok: false, error: 'Invalid or missing run ticket' }, { status: 400, headers: corsHeaders });
    }

    if (ticket.user_id !== user.id) {
      return Response.json({ ok: false, error: 'Run ticket does not match current user' }, { status: 403, headers: corsHeaders });
    }

    if (ticket.used) {
      return Response.json({ ok: false, error: 'This ticket has already been used (duplicate submission rejected)' }, { status: 400, headers: corsHeaders });
    }

    const now = Date.now();
    const expiresAt = new Date(ticket.expires_at).getTime();
    if (now > expiresAt) {
      return Response.json({ ok: false, error: 'Run ticket expired' }, { status: 400, headers: corsHeaders });
    }

    // Mark ticket used immediately to prevent replay
    await admin.from('run_tickets').update({ used: true }).eq('ticket_id', ticketId);

    // 2. Validate timing constraints
    const targetDurationMs = ticket.duration * 1000;
    // Allow -1800ms to +7000ms window for network jitter & client stop
    if (!Number.isFinite(elapsedMs) || elapsedMs < targetDurationMs - 1800 || elapsedMs > targetDurationMs + 8000) {
      return Response.json({ ok: false, error: 'Run elapsed time outside allowed tolerance' }, { status: 400, headers: corsHeaders });
    }

    // 3. Daily challenge checks
    if (ticket.mode === 'daily') {
      const today = getTodayUTC();
      if (ticket.seed !== today) {
        return Response.json({ ok: false, error: 'Daily challenge seed expired' }, { status: 400, headers: corsHeaders });
      }
    }

    // 4. Generate deterministic target text and recalculate stats
    const seedNumber = ticket.mode === 'daily' ? Number(ticket.seed.replaceAll('-', '')) : 0;
    const expectedTarget = generateTargetText(3200, seedNumber);
    const derived = computeVerifiedStats(typed, expectedTarget, elapsedMs);

    // 5. Anti-cheat velocity & accuracy checks
    if (derived.wpm > 320 || derived.rawWpm > 380) {
      return Response.json({ ok: false, error: 'Typing speed exceeds superhuman threshold (320 WPM limit)' }, { status: 400, headers: corsHeaders });
    }

    if (derived.correct < typed.length * 0.25) {
      return Response.json({ ok: false, error: 'Run rejected: excessive random key-mashing' }, { status: 400, headers: corsHeaders });
    }

    // 6. Resolve username
    const { data: profile } = await admin.from('profiles').select('username').eq('id', user.id).single();
    const username = profile?.username || 'yah_pilot';

    // 7. Insert authoritative verified run
    const { data: run, error: runError } = await admin
      .from('typing_runs')
      .insert({
        user_id: user.id,
        username,
        mode: ticket.mode,
        duration: ticket.duration,
        seed: ticket.seed,
        challenge_version: ticket.challenge_version,
        ticket_id: ticket.ticket_id,
        typed_text: typed,
        typed_chars: typed.length,
        correct_chars: derived.correct,
        error_chars: derived.errors,
        wpm: derived.wpm,
        raw_wpm: derived.rawWpm,
        accuracy: derived.accuracy,
        phrase_count: derived.phraseCount,
        elapsed_ms: Math.round(elapsedMs),
        verified: true,
        validation_status: 'verified',
      })
      .select('id, wpm, raw_wpm, accuracy, phrase_count, created_at')
      .single();

    if (runError || !run) {
      console.error('Run insert error:', runError);
      return Response.json({ ok: false, error: 'Failed to record verified score' }, { status: 500, headers: corsHeaders });
    }

    // 8. Evaluate achievements
    const newlyUnlocked: string[] = [];
    const checkAchievement = async (id: string, condition: boolean) => {
      if (condition) {
        const { error } = await admin
          .from('user_achievements')
          .insert({ user_id: user.id, achievement_id: id })
          .select('id')
          .single();
        if (!error) {
          newlyUnlocked.push(id);
        }
      }
    };

    await checkAchievement('first_blood', true);
    await checkAchievement('speed_demon_60', derived.wpm >= 60);
    await checkAchievement('century_club', derived.wpm >= 100);
    await checkAchievement('hyperspeed', derived.wpm >= 130);
    await checkAchievement('flawless_victory', derived.accuracy === 100 && typed.length >= 50);
    await checkAchievement('marathon_waiter', ticket.duration === 120);
    await checkAchievement('daily_devotee', ticket.mode === 'daily');
    await checkAchievement('touch_grass', derived.phraseCount >= 35);

    return Response.json(
      {
        ok: true,
        runId: run.id,
        verified: true,
        score: {
          wpm: derived.wpm,
          rawWpm: derived.rawWpm,
          accuracy: derived.accuracy,
          phraseCount: derived.phraseCount,
          correct: derived.correct,
          errors: derived.errors,
        },
        newAchievements: newlyUnlocked,
      },
      { headers: corsHeaders }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Score validation failed';
    return Response.json({ ok: false, error: message }, { status: 400, headers: corsHeaders });
  }
});
