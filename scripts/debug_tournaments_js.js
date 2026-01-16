
const supabaseUrl = 'https://uimucvwyultgmbobnzwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbXVjdnd5dWx0Z21ib2JuendnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjIzNzUsImV4cCI6MjA4MzI5ODM3NX0.Q81KOkE4SSlUaWUse85ReGDxqU_aVMRa1_lEfd6QndM';

async function main() {
    console.log('Fetching latest tournaments via REST API...');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/tournaments?select=*&order=created_at.desc&limit=5`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (!response.ok) {
            console.error('Error fetching tournaments:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }

        const tournaments = await response.json();

        tournaments.forEach(t => {
            console.log('---------------------------------------------------');
            console.log(`ID: ${t.id}`);
            console.log(`Name: ${t.name}`);
            console.log(`Status: ${t.status}`);
            console.log(`Div Caps (Type: ${typeof t.div_caps}):`, JSON.stringify(t.div_caps));
            // Log divs raw
            console.log(`Divs (Type: ${typeof t.divs}):`);
            console.log(JSON.stringify(t.divs, null, 2));

            // Test Calculation Logic
            let totalCap = 0;
            let divsObj = t.divs;

            // Check if parsing is needed
            if (typeof t.divs === 'string') {
                try {
                    divsObj = JSON.parse(t.divs);
                    console.log('Parsed divs from string.');
                } catch (e) {
                    console.error('Failed to parse divs:', e);
                }
            }

            if (divsObj) {
                // Try to iterate
                try {
                    const values = Object.values(divsObj);
                    console.log(`Found ${values.length} div categories.`);

                    values.forEach((divs) => {
                        if (Array.isArray(divs)) {
                            divs.forEach((d) => {
                                // log each div
                                const cap = typeof d === 'object' ? (d.cap || d.max_teams || 0) : 0;
                                console.log(` - Division ${d.name || '?'}: cap=${cap}`);
                                totalCap += Number(cap);
                            });
                        } else {
                            console.log('Values item is not array:', divs);
                        }
                    });
                } catch (e) {
                    console.log('Failed to iterate divsObj:', e);
                }
            }
            console.log(`Calculated Total Cap: ${totalCap}`);
        });

    } catch (e) {
        console.error('Fetch error:', e);
    }
}

main();
