
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('Fetching latest tournaments...')
    const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching tournaments:', error)
        return
    }

    tournaments.forEach(t => {
        console.log('---------------------------------------------------')
        console.log(`ID: ${t.id}`)
        console.log(`Name: ${t.name}`)
        console.log(`Status: ${t.status}`)
        console.log(`Div Caps (Type: ${typeof t.div_caps}):`, t.div_caps)
        console.log(`Divs (Type: ${typeof t.divs}):`)
        console.dir(t.divs, { depth: null, colors: true })

        // Test Calculation Logic
        let totalCap = 0
        if (t.divs) {
            const divsObj = typeof t.divs === 'string' ? JSON.parse(t.divs) : t.divs
            Object.values(divsObj).forEach((divs: any) => {
                if (Array.isArray(divs)) {
                    divs.forEach((d: any) => {
                        const cap = typeof d === 'object' ? (d.cap || d.max_teams || 0) : 0
                        totalCap += Number(cap)
                    })
                }
            })
        }
        console.log(`Calculated Total Cap: ${totalCap}`)
    })
}

main()
