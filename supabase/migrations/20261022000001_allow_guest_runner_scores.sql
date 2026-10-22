-- Allow guest players with persistent device UUIDs to compete on global leaderboard
ALTER TABLE public.run_tickets DROP CONSTRAINT IF EXISTS run_tickets_user_id_fkey;
ALTER TABLE public.typing_runs DROP CONSTRAINT IF EXISTS typing_runs_user_id_fkey;
