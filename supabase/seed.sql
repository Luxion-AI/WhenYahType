-- Default Achievements Seed Data
insert into public.achievements (id, name, description, icon, badge_tier) values
('first_blood', 'First Yah', 'Completed your very first When Yah run. Welcome to the waiting room.', 'Sparkles', 'bronze'),
('speed_demon_60', 'Wait Harder', 'Clocked 60+ WPM typing When Yah repeatedly.', 'Zap', 'silver'),
('century_club', 'Century of Yah', 'Broke past the 100 WPM sound barrier on pure meme energy.', 'Crown', 'gold'),
('hyperspeed', 'Certified Yah Enjoyer', 'Shattered 130+ WPM. Your fingers have ascended.', 'Award', 'diamond'),
('flawless_victory', 'Zero Missed Yahs', 'Achieved 100% accuracy with at least 50 characters typed.', 'ShieldCheck', 'gold'),
('marathon_waiter', 'Patience Level 99', 'Survived an entire 120-second endurance test.', 'Clock3', 'silver'),
('daily_devotee', 'Daily Disciple', 'Competed in an official UTC Daily Challenge.', 'CalendarDays', 'bronze'),
('touch_grass', 'Touch Grass', 'Completed over 35 phrases in a single run. Step outside.', 'UserRound', 'meme')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  badge_tier = excluded.badge_tier;
