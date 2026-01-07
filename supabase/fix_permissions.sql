-- Tournaments: Allow full access (Insert/Update/Delete) for now
CREATE POLICY "Enable all access for tournaments" ON public.tournaments
FOR ALL
USING (true)
WITH CHECK (true);

-- Teams: Allow all for now (Admin + Public Registration needs)
CREATE POLICY "Enable all access for teams" ON public.teams
FOR ALL
USING (true)
WITH CHECK (true);

-- Players: Allow all
CREATE POLICY "Enable all access for players" ON public.players
FOR ALL
USING (true)
WITH CHECK (true);
