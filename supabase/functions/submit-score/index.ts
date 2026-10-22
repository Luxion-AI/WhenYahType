import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const PHRASE = 'When Yah';

function generateTargetText(length = 3000, _seed = 0): string {
  let out = '';
  while (out.length < length) {
    out += PHRASE + ' ';
  }
  return out.trimEnd();
}

function computeVerifiedStats(typed: string, target: string, elapsedMs: number) {
  let correct = 0;
  const compareLength = Math.min(typed.length, target.length);
  for (let i = 0; i < compareLength; i++) {
    if (typed[i] === target[i]) {
      correct++;
    }
  }

  const elapsedMinutes = Math.max(elapsedMs / 60000, 1 / 60);
  const rawWpm = Math.round((typed.length / 5) / elapsedMinutes);
  const wpm = Math.round((correct / 5) / elapsedMinutes);
  const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 10000) / 100 : 100;
  const errors = typed.length - correct;
  const phraseCount = (typed.match(/When Yah/g) || []).length;

  return {
    correct,
    errors,
    wpm,
    rawWpm,
    accuracy,
    phraseCount,
  };
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
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    const body = await req.json().catch(() => ({}));
    const ticketId = String(body.ticketId || '');
    const typed = String(body.typed || '');
    const elapsedMs = Number(body.elapsedMs || 0);

    if (!ticketId) {
      return Response.json({ ok: false, error: 'Ticket ID is required' }, { status: 400, headers: corsHeaders });
    }

    if (typed.length < 1 || typed.length > 5000) {
      return Response.json({ ok: false, error: 'Invalid typed text length' }, { status: 400, headers: corsHeaders });
    }

    // 1. Resolve user / guest runner identity
    let effectiveUserId: string | null = null;
    let resolvedUsername = String(body.guestUsername || 'yah_runner').slice(0, 30);

    if (authHeader && authHeader !== `Bearer ${supabaseAnonKey}`) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        effectiveUserId = user.id;
        const { data: profile } = await admin.from('profiles').select('username').eq('id', user.id).single();
        if (profile?.username) {
          resolvedUsername = profile.username;
        }
      }
    }

    if (!effectiveUserId) {
      effectiveUserId = String(body.guestId || '');
    }

    // 2. Verify single-use ticket
    const { data: ticket, error: ticketError } = await admin
      .from('run_tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return Response.json({ ok: false, error: 'Invalid or missing run ticket' }, { status: 400, headers: corsHeaders });
    }

    if (effectiveUserId && ticket.user_id !== effectiveUserId) {
      return Response.json({ ok: false, error: 'Run ticket does not match current runner' }, { status: 403, headers: corsHeaders });
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

    // 3. Reconstruct authoritative server target text
    const seedNumber = ticket.mode === 'daily'
      ? ticket.seed.split('-').reduce((acc: number, part: string) => (acc * 31 + parseInt(part, 10)) >>> 0, 0)
      : 0;

    const targetText = generateTargetText(3200, seedNumber);

    // 4. Verify elapsed time against ticket duration
    const minElapsed = Math.max(500, (ticket.duration - 2) * 1000);
    const maxElapsed = (ticket.duration + 5) * 1000;

    if (elapsedMs < minElapsed || elapsedMs > maxElapsed) {
      return Response.json(
        { ok: false, error: `Invalid elapsed duration: ${elapsedMs}ms for ${ticket.duration}s run` },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. Compute server authoritative score
    const derived = computeVerifiedStats(typed, targetText, elapsedMs);

    // Anti-cheat speed sanity checks
    if (derived.wpm > 260) {
      return Response.json({ ok: false, error: 'Run rejected: inhuman speed anomaly (>260 WPM)' }, { status: 400, headers: corsHeaders });
    }

    if (derived.correct < typed.length * 0.25) {
      return Response.json({ ok: false, error: 'Run rejected: excessive random key-mashing' }, { status: 400, headers: corsHeaders });
    }

    // 6. Insert authoritative verified run
    const finalUserId = effectiveUserId || ticket.user_id;
    const { data: run, error: runError } = await admin
      .from('typing_runs')
      .insert({
        user_id: finalUserId,
        username: resolvedUsername,
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

    // 7. Evaluate achievements
    const newlyUnlocked: string[] = [];
    const checkAchievement = async (id: string, condition: boolean) => {
      if (condition && finalUserId) {
        const { error } = await admin
          .from('user_achievements')
          .insert({ user_id: finalUserId, achievement_id: id })
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

    return Response.json(
      {
        ok: true,
        verified: true,
        runId: run.id,
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
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Submit score error:', err);
    return Response.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
