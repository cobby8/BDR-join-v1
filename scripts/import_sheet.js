const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importSheet() {
    const csvPath = path.join(__dirname, '../legacy/sheet_data.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('Error: sheet_data.csv not found.');
        process.exit(1);
    }

    const raw = fs.readFileSync(csvPath, 'utf8');
    // Parse CSV assuming headers are on line 1?
    // Let's inspect the headers or assume standard columns based on user sheet
    const records = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    console.log(`Found ${records.length} records in CSV...`);

    // Group by Tournament (Name) to creating Tournaments first
    // Then create Teams

    // MAPPING based on User Sheet:
    // Timestamp, Email Address, 대회선택, 팀명, 대표자명, 연락처, 종별, 유니폼(홈), 유니폼(어웨이), 입금확인...
    // Columns may vary. Let's try to map dynamically or loosely.

    const tournamentsMap = new Map(); // Name -> ID

    for (const row of records) {
        const tourName = row['대회선택'] || row['대회명'] || 'Unknown Tournament';

        // 1. Ensure Tournament Exists
        let tourId = tournamentsMap.get(tourName);

        if (!tourId) {
            // Try to find in DB
            const { data: existingTour } = await supabase.from('tournaments').select('id').eq('name', tourName).maybeSingle();
            if (existingTour) {
                tourId = existingTour.id;
            } else {
                // Create new tournament
                console.log(`Creating new tournament: ${tourName}`);
                const { data: newTour, error } = await supabase.from('tournaments').insert({
                    name: tourName,
                    status: '접수중'
                }).select('id').single();

                if (error) {
                    console.error('Failed to create tournament:', error);
                    continue;
                }
                tourId = newTour.id;
            }
            tournamentsMap.set(tourName, tourId);
        }

        // 2. Insert Team
        const teamName = row['팀명'] || row['Team Name'];
        const managerName = row['대표자명'] || row['Manager Name'];
        const phone = row['연락처'] || row['Phone'];
        const division = row['종별'] || row['Category']; // "일반부", "선출부" etc.

        if (!teamName) continue;

        console.log(`Upserting Team: ${teamName} (${managerName})`);

        // Check if team exists to avoid duplicates (by name + manager)
        const { data: existingTeam } = await supabase.from('teams')
            .select('id')
            .eq('tournament_id', tourId)
            .eq('name_ko', teamName)
            .eq('manager_phone', phone)
            .maybeSingle();

        if (!existingTeam) {
            await supabase.from('teams').insert({
                tournament_id: tourId,
                name_ko: teamName,
                manager_name: managerName,
                manager_phone: phone,
                division: division, // Mapping to 'division' column (or category)
                status: 'pending'   // All imports as pending
            });
        } else {
            console.log(`Team already exists, skipping.`);
        }
    }
    console.log('Import completed.');
}

importSheet();
