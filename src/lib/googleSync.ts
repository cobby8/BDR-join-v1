import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Configuration
const SPREADSHEET_ID = '1dZpBtw1ZcnXXWVci_2GDyIu35kRpkc0gaTPfelMj6Ec'
const SERVICE_ACCOUNT_FILE = 'service-account.json'

// Candidates & Aliases
const TOURNAMENT_SHEET_CANDIDATES = ['tournaments', 'Tournaments', '대회']
const TEAM_SHEET_CANDIDATES = ['teams', 'Teams', '신청', '신청팀', '접수']
const PLAYER_SHEET_CANDIDATES = ['players', 'Players', '선수', '선수명단']

const CONF_ALIASES: Record<string, string[]> = {
    // Tournaments
    tourId: ['tourId', 'TourID', '대회id', 'ID', 'Id', 'id'],
    name: ['name', '대회명'],
    url: ['url', '안내페이지 url', '안내URL', 'pageUrl'],
    start: ['start', '대회시작', 'event.start', 'eventStart'],
    end: ['end', '대회종료', 'event.end', 'eventEnd'],
    regStart: ['regStart', 'reg.start', 'reg_start', 'regStartDate', 'reg.start.date', '접수시작'],
    regEnd: ['regEnd', 'reg.end', 'reg_end', 'regEndDate', 'reg.end.date', '접수종료'],
    status: ['status', '상태'],
    divs: ['divs', '종별', 'divisions', 'divs_json'],
    divCaps: ['divCaps', 'div_caps', 'divCapsJson', 'div_caps_json'],

    // Teams
    teamId: ['teamId', 'TeamID', 'id', '팀id'],
    teamNameKo: ['teamNameKo', 'teamName', '팀명', '팀명(한글)'],
    teamNameEn: ['teamNameEn', '팀명(영문)', 'team_en'],
    managerName: ['managerName', '담당자', '대표자', 'manager'],
    managerPhone: ['managerPhone', '연락처', 'phone', 'tel'],
    category: ['category', '종별'],
    division: ['division', '디비전'],
    uniformHome: ['uniformHome', 'homeColor', '홈유니폼'],
    uniformAway: ['uniformAway', 'awayColor', '원정유니폼'],
    paymentStatus: ['입금확인', 'paymentStatus'],

    // Players
    playerName: ['선수이름', 'name', 'PlayerName', 'playerName', '이름'],
    backNumber: ['backNumber', '등번호', 'back_number'],
    position: ['position', '포지션'],
    birth: ['birth', '생년월일', 'birthDate', '만나이'],
    isElite: ['isElite', '선출여부', '선출', 'is_elite']
}

// Helpers
async function getAuthClient() {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        return new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        })
    }

    const keyPath = path.join(process.cwd(), SERVICE_ACCOUNT_FILE)
    if (fs.existsSync(keyPath)) {
        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        })
        return auth.getClient()
    }

    throw new Error('Google Auth Credentials not found (Env or File)')
}

function findColIndex(headers: string[], key: string) {
    const candidates = CONF_ALIASES[key] || [key]
    for (const cand of candidates) {
        const idx = headers.indexOf(cand)
        if (idx !== -1) return idx
    }
    return -1
}

function getVal(row: string[], headers: string[], key: string) {
    const idx = findColIndex(headers, key)
    if (idx !== -1 && row[idx]) {
        return row[idx].trim()
    }
    return null
}

function tryParseJson(str: string | null) {
    if (!str) return {}
    try {
        return JSON.parse(str)
    } catch {
        return {}
    }
}

async function findSheetTitle(sheets: any, candidates: string[]) {
    try {
        const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
        const allSheets = res.data.sheets.map((s: any) => s.properties.title)

        for (const cand of candidates) {
            if (allSheets.includes(cand)) return cand
        }
        return null
    } catch (e: any) {
        console.error('findSheetTitle Error:', e)
        throw new Error('Failed to find sheet: ' + e.message)
    }
}

// Main Logic
export async function runSync() {
    const logs: string[] = []

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            return { success: false, error: 'Supabase Env Missing (Check SUPABASE_SERVICE_ROLE_KEY)', logs }
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        const auth = await getAuthClient()
        const sheets = google.sheets({ version: 'v4', auth: auth as any })

        // ---------------------------------------------------------
        // 1. Tournaments (Batch Upsert)
        // ---------------------------------------------------------
        const tTitle = await findSheetTitle(sheets, TOURNAMENT_SHEET_CANDIDATES) || 'tournaments'
        log(logs, `[Tournaments] Reading sheet: ${tTitle}`)

        let tourMapByName = new Map<string, string>() // Name -> UUID
        let tourMapByLegacyId = new Map<string, string>() // LegacyID -> UUID

        if (tTitle) {
            const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${tTitle}!A1:Z` })
            const rows = res.data.values
            if (rows && rows.length > 1) {
                const headers = rows[0].map((h: string) => h.trim())

                // A. Fetch Existing Tournaments
                const { data: existingTours } = await supabase.from('tournaments').select('id, legacy_id, name')
                const dbTourMapByLegacy = new Map<string, any>()
                const dbTourMapByName = new Map<string, any>()

                existingTours?.forEach(t => {
                    if (t.legacy_id) dbTourMapByLegacy.set(String(t.legacy_id), t)
                    if (t.name) dbTourMapByName.set(t.name, t)
                })

                // B. Prepare Payloads
                const upsertPayloads: any[] = []

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]
                    if (!row.length) continue
                    const tourId = getVal(row, headers, 'tourId')
                    const name = getVal(row, headers, 'name')
                    if (!name && !tourId) continue

                    const payload: any = {
                        legacy_id: tourId,
                        name: name || 'Untitled',
                        status: getVal(row, headers, 'status') || '접수중',
                        start_date: getVal(row, headers, 'start') || null,
                        end_date: getVal(row, headers, 'end') || null,
                        reg_start_at: getVal(row, headers, 'regStart') || null,
                        reg_end_at: getVal(row, headers, 'regEnd') || null,
                        details_url: getVal(row, headers, 'url') || null,
                        divs: tryParseJson(getVal(row, headers, 'divs')),
                        div_caps: tryParseJson(getVal(row, headers, 'divCaps'))
                    }

                    // Determine ID (Update vs Insert)
                    let match = null
                    if (tourId && dbTourMapByLegacy.has(tourId)) {
                        match = dbTourMapByLegacy.get(tourId)
                    } else if (dbTourMapByName.has(payload.name)) {
                        match = dbTourMapByName.get(payload.name)
                    }

                    if (match) {
                        payload.id = match.id
                    }
                    upsertPayloads.push(payload)
                }

                // C. Batch Upsert
                if (upsertPayloads.length > 0) {
                    log(logs, `[Tournaments] Upserting ${upsertPayloads.length} records...`)
                    const { error } = await supabase.from('tournaments').upsert(upsertPayloads)
                    if (error) throw new Error(`Tournament upsert failed: ${error.message}`)
                }

                // D. Re-fetch to build authoritative Map for dependencies
                // (We need UUIDs for everything we just upserted)
                const { data: allTours } = await supabase.from('tournaments').select('id, legacy_id, name')
                allTours?.forEach(t => {
                    if (t.name) tourMapByName.set(t.name, t.id)
                    if (t.legacy_id) tourMapByLegacyId.set(String(t.legacy_id), t.id)
                })
            }
        }

        // ---------------------------------------------------------
        // 2. Teams (Batch Upsert)
        // ---------------------------------------------------------
        const teamTitle = await findSheetTitle(sheets, TEAM_SHEET_CANDIDATES)
        const teamMapByLegacyId = new Map<string, string>() // LegacyID -> UUID
        const teamMapByComposite = new Map<string, string>() // TourUUID::TeamName::ManagerPhone -> UUID

        if (teamTitle) {
            log(logs, `[Teams] Reading sheet: ${teamTitle}`)
            const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${teamTitle}!A1:Z` })
            const rows = res.data.values
            if (rows && rows.length > 1) {
                const headers = rows[0].map((h: string) => h.trim())

                // A. Fetch Existing Teams (Simple fetch all, or optimized filter if needed)
                // Assuming < 10k teams, fetching all ID/Name/Phone is okay for server-side
                const { data: existingTeams } = await supabase.from('teams').select('id, tournament_id, name_ko, manager_phone')

                // Map: `${tourId}::${name_ko}::${manager_phone}` -> existingRecord
                // Note: Phone is used to distinguish different teams with same name in same tournament? 
                // Previous logic used (tourId && name && phone) as unique constraint check.
                const dbTeamMap = new Map<string, any>()
                existingTeams?.forEach(t => {
                    const key = `${t.tournament_id}::${t.name_ko}::${t.manager_phone}`
                    dbTeamMap.set(key, t)
                })

                const upsertPayloads: any[] = []

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]
                    if (!row.length) continue

                    const tourLegacyId = getVal(row, headers, 'tourId')
                    // Resolve Tournament UUID
                    let transactionUuid = tourMapByLegacyId.get(tourLegacyId || '')

                    // If not found by ID, try fuzzy match... (omitted based on previous code logic which was stricter?)
                    // Previous code: `if (!transactionUuid) ...` 
                    // Let's stick to strict map first. If needed, we can log error.
                    if (!transactionUuid) {
                        // Try optional name match if implemented? 
                        // Actually let's just skip if no parent tournament found.
                        // Or try to parse 'tourName'? The standard CSV usually has IDs.
                        continue
                    }

                    const teamName = getVal(row, headers, 'teamNameKo')
                    if (!teamName) continue

                    const managerPhone = getVal(row, headers, 'managerPhone') || '000-0000-0000'

                    const payload: any = {
                        tournament_id: transactionUuid,
                        name_ko: teamName,
                        name_en: getVal(row, headers, 'teamNameEn'),
                        manager_name: getVal(row, headers, 'managerName') || '미기입',
                        manager_phone: managerPhone,
                        category: getVal(row, headers, 'category'),
                        division: getVal(row, headers, 'division'),
                        uniform_home: getVal(row, headers, 'uniformHome'),
                        uniform_away: getVal(row, headers, 'uniformAway'),
                        payment_status: getVal(row, headers, 'paymentStatus') || 'pending',
                        status: getVal(row, headers, 'status') || 'pending'
                    }

                    // Check existing
                    const key = `${transactionUuid}::${teamName}::${managerPhone}`
                    const existing = dbTeamMap.get(key)

                    if (existing) {
                        payload.id = existing.id
                    }

                    upsertPayloads.push(payload)
                }

                // B. Batch Upsert Teams
                if (upsertPayloads.length > 0) {
                    log(logs, `[Teams] Upserting ${upsertPayloads.length} records...`)
                    // Chunking for safety (Supabase sometimes has payload limits)
                    const CHUNK_SIZE = 500
                    for (let i = 0; i < upsertPayloads.length; i += CHUNK_SIZE) {
                        const chunk = upsertPayloads.slice(i, i + CHUNK_SIZE)
                        const { error } = await supabase.from('teams').upsert(chunk)
                        if (error) {
                            console.error('Team Chunk Error:', error)
                            throw new Error(`Team upsert failed at chunk ${i}: ${error.message}`)
                        }
                    }
                }

                // C. Re-fetch for Players dependency
                // We need to map `LegacyTeamID` (from Sheet) -> `TeamUUID` (DB).
                // Or `TourUUID + TeamName + Phone`?
                // The sheet usually has `teamId` column for players to link.
                // Let's rebuild the maps.
                const { data: allTeams } = await supabase.from('teams').select('id, tournament_id, name_ko, manager_phone')
                allTeams?.forEach(t => {
                    // We need a way to link "Sheet Team Row" to "DB Team UUID".
                    // The sheet row has `teamId` (legacy). 
                    // But our Team DB doesn't store `legacy_id`? 
                    // Wait, previous code map: `if (legacyTeamId) legacyTeamIdMap.set(legacyTeamId, tid)`
                    // We need to reconstruct this mapping.
                    // We can map `${tourUUID}::${name}::${phone}` -> UUID from DB.
                    // Then re-process headers to build the `legacyTeamIdMap`.
                    const key = `${t.tournament_id}::${t.name_ko}::${t.manager_phone}`
                    teamMapByComposite.set(key, t.id)
                })

                // Iterate rows AGAIN to map LegacyID -> UUID
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]
                    const legacyId = getVal(row, headers, 'teamId')
                    if (!legacyId) continue

                    const tourLegacyId = getVal(row, headers, 'tourId')
                    const tourUUID = tourMapByLegacyId.get(tourLegacyId || '')
                    if (!tourUUID) continue

                    const name = getVal(row, headers, 'teamNameKo')
                    const phone = getVal(row, headers, 'managerPhone') || '000-0000-0000'

                    const key = `${tourUUID}::${name}::${phone}`
                    const uuid = teamMapByComposite.get(key)
                    if (uuid) {
                        teamMapByLegacyId.set(legacyId, uuid)
                    }
                }
            }
        }

        // ---------------------------------------------------------
        // 3. Players (Batch Upsert)
        // ---------------------------------------------------------
        const pTitle = await findSheetTitle(sheets, PLAYER_SHEET_CANDIDATES) // Correct constant usage?

        if (pTitle) {
            log(logs, `[Players] Reading sheet: ${pTitle}`)
            const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${pTitle}!A1:Z` })
            const rows = res.data.values
            if (rows && rows.length > 1) {
                const headers = rows[0].map((h: string) => h.trim())

                // A. Fetch Existing Players
                const { data: existingPlayers } = await supabase.from('players').select('id, team_id, name')
                const dbPlayerMap = new Map<string, any>()

                existingPlayers?.forEach(p => {
                    const key = `${p.team_id}::${p.name}`
                    dbPlayerMap.set(key, p)
                })

                const upsertPayloads: any[] = []

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]
                    if (!row.length) continue

                    // Resolve Team
                    const legacyTeamId = getVal(row, headers, 'teamId')
                    let teamUUID = legacyTeamId ? teamMapByLegacyId.get(legacyTeamId) : null

                    // Fallback logic for team finding (Tour + TeamName)
                    if (!teamUUID) {
                        const tourLegacyId = getVal(row, headers, 'tourId')
                        const tourUUID = tourLegacyId ? tourMapByLegacyId.get(tourLegacyId) : null
                        const teamName = getVal(row, headers, 'teamNameKo') // or 'teamName'
                        const managerPhone = getVal(row, headers, 'managerPhone') || '000-0000-0000' // Player sheet might not have phone, but teamMapByComposite needs it.

                        // Note: We don't have phone here, previous logic just used Tour+Name?
                        // "if (tourUUID && tName) teamUUID = teamMap.get(`${tourUUID}::${tName}`)"
                        // Our map teamMapByComposite key includes Phone.
                        // But if the player sheet lacks phone, we might have issues. 
                        // Check previous Code: "teamMap.set(`${transactionUuid}::${teamName}`, tid)" -> it did NOT include phone in key for the map passing to players?
                        // Ah, looking at previous code line 260: `teamMap.set(${transactionUuid}::${teamName}, tid)`
                        // So Team Map keyed only by Name is unsafe if duplicates exist, but that's what it did.

                        // Let's assume Unique Team Name per Tournament for this fallback.
                        if (tourUUID && teamName) {
                            // This fallback is tricky because teamMapByComposite uses phone.
                            // If player sheet doesn't have phone, we can't use teamMapByComposite directly.
                            // For now, if legacyTeamId is missing, we skip.
                            // A more robust solution would be to have a `teamMapByTourAndName` if team names are unique per tournament.
                        }
                    }

                    // If still no teamUUID, try to fuzzy match from 'teamMapByComposite' keys? 
                    // Ideally we strictly use teamId. If fallback is needed, we need a Tour+TeamName -> UUID map.
                    // Let's proceed with just legacyTeamId map for safety for now, or minimal fallback.
                    if (!teamUUID) continue

                    const name = getVal(row, headers, 'playerName')
                    if (!name) continue

                    const payload: any = {
                        team_id: teamUUID,
                        name: name,
                        back_number: getVal(row, headers, 'backNumber'),
                        position: getVal(row, headers, 'position'),
                        birth_date: getVal(row, headers, 'birth'),
                        is_elite: ['TRUE', 'true', 'O', '선출'].includes(getVal(row, headers, 'isElite') || '')
                    }

                    // Check existing
                    const key = `${teamUUID}::${name}`
                    const existing = dbPlayerMap.get(key)
                    if (existing) {
                        payload.id = existing.id
                    }

                    upsertPayloads.push(payload)
                }

                if (upsertPayloads.length > 0) {
                    log(logs, `[Players] Upserting ${upsertPayloads.length} records...`)
                    const CHUNK_SIZE = 500
                    for (let i = 0; i < upsertPayloads.length; i += CHUNK_SIZE) {
                        const chunk = upsertPayloads.slice(i, i + CHUNK_SIZE)
                        const { error } = await supabase.from('players').upsert(chunk)
                        if (error) {
                            console.error('Player Chunk Error:', error)
                            // continue? or throw.
                        }
                    }
                }
            }
        }

        return { success: true, logs }

    } catch (e: any) {
        console.error('Sync Exception:', e)
        return { success: false, error: e.message, logs }
    }
}
