const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SERVICE_ACCOUNT_FILE = 'service-account.json';
const SPREADSHEET_ID = '1dZpBtw1ZcnXXWVci_2GDyIu35kRpkc0gaTPfelMj6Ec'; // Keeping the ID you provided

const HEADERS = {
    'Tournaments': [
        'tourId', 'name', 'status', 'start', 'end', 'regStart', 'regEnd',
        'url', 'posterUrl', 'divs', 'divCaps', 'places'
    ],
    'Teams': [
        'tourId', 'teamNameKo', 'teamNameEn', 'managerName', 'managerPhone',
        'category', 'division', 'uniformHome', 'uniformAway', 'paymentStatus', 'status'
    ],
    'Players': [
        'tourId', 'teamName', 'name', 'backNumber', 'position', 'birth', 'isElite'
    ]
};

async function getAuthClient() {
    const keyPath = path.join(process.cwd(), SERVICE_ACCOUNT_FILE);
    if (!fs.existsSync(keyPath)) {
        throw new Error(`Service account file not found at ${keyPath}`);
    }
    const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Need write access
    });
    return auth.getClient();
}

async function initHeaders() {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Get existing sheets
        const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const existingTitles = res.data.sheets.map(s => s.properties.title);
        console.log('Existing Sheets:', existingTitles);

        for (const [sheetName, headers] of Object.entries(HEADERS)) {
            let targetSheet = existingTitles.find(t => t.toLowerCase() === sheetName.toLowerCase());

            if (!targetSheet) {
                // Create Sheet if not exists
                console.log(`Creating Sheet: ${sheetName}...`);
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: SPREADSHEET_ID,
                    requestBody: {
                        requests: [{ addSheet: { properties: { title: sheetName } } }]
                    }
                });
                targetSheet = sheetName;

                // Add Headers
                console.log(`Adding Headers to ${sheetName}...`);
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${sheetName}!A1`,
                    valueInputOption: 'RAW',
                    requestBody: { values: [headers] }
                });
            } else {
                // Check if A1 is empty, if so, add headers
                const valRes = await sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `${targetSheet}!A1`
                });

                if (!valRes.data.values || valRes.data.values.length === 0) {
                    console.log(`Sheet ${targetSheet} is empty. Adding Headers...`);
                    await sheets.spreadsheets.values.update({
                        spreadsheetId: SPREADSHEET_ID,
                        range: `${targetSheet}!A1`,
                        valueInputOption: 'RAW',
                        requestBody: { values: [headers] }
                    });
                } else {
                    console.log(`Sheet ${targetSheet} already has data/headers. Safe-skipping.`);
                }
            }
        }

        console.log('\nSUCCESS: Sheet initialization check complete.');

    } catch (e) {
        console.error('FATAL ERROR:', e);
    }
}

initHeaders();
