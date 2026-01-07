const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // OR SERVICE_ROLE_KEY if RLS blocks insert

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    const jsonPath = path.join(__dirname, '../legacy/tournaments.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('Error: legacy/tournaments.json not found.');
        process.exit(1);
    }

    const raw = fs.readFileSync(jsonPath, 'utf8');
    let tournaments = [];
    try {
        tournaments = JSON.parse(raw);
    } catch (e) {
        console.error('Error parsing JSON:', e);
        process.exit(1);
    }

    console.log(`Found ${tournaments.length} tournaments to migrate...`);

    for (const t of tournaments) {
        const { tourId, name, status, start, end, regStart, regEnd, url, posterUrl, divs, places } = t;

        const payload = {
            legacy_id: tourId,
            name: name,
            status: status,
            start_date: start || null,
            end_date: end || null,
            reg_start_at: regStart || null,
            reg_end_at: regEnd || null,
            details_url: url || null,
            poster_url: posterUrl || null,
            divs: divs || {},
            div_caps: t.divCaps || {}, // Check if JSON has this, otherwise empty
            places: places || []
        };

        console.log(`Migrating: ${name} (${tourId})`);

        // Upsert based on legacy_id
        const { error } = await supabase
            .from('tournaments')
            .upsert(payload, { onConflict: 'legacy_id' });

        if (error) {
            console.error(`Failed to migrate ${name}:`, error.message);
        } else {
            console.log(`Success!`);
        }
    }
}

migrate();
