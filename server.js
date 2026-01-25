require('dotenv').config();
const { MongoClient } = require('mongodb');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

let db;

// ===========================================
// MIDDLEWARE - Must come first
// ===========================================
// Enable CORS for all routes
app.use(cors({
    origin: true, // Allow all origins (or specify your domain)
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===========================================
// EXPLICIT ROUTES - Must come BEFORE /:urlPath
// ===========================================

// NEW - Health check endpoint (keeps Render awake)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint to serve config.json
app.get('/config.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'config.json'));
});

// Endpoint to download all trial data as CSV
app.get('/download', async (req, res) => {
    try {
        const trialsCollection = db.collection('result');
        const results = await trialsCollection.find({}).sort({ timestamp: 1 }).toArray();

        if (results.length === 0) {
            return res.status(404).send('No results found');
        }

        const header = "participant_id,trial_number,bar_size_condition,choice,confidence,risk_probability,risk_reward,safe_probability,safe_reward,risk_position,safe_position,ev,bar_choice_time,confidence_choice_time,trial_id,is_bonus_trial,bonus_amount,timestamp";

        const csvRows = results.map(result => {
            return [
                result.participant_id || '',
                result.trial_number || '',
                result.bar_size_condition || '',
                result.choice || '',
                result.confidence || '',
                result.risk_probability || '',
                result.risk_reward || '',
                result.safe_probability || '',
                result.safe_reward || '',
                result.risk_position || '',
                result.safe_position || '',
                result.ev || '',
                result.bar_choice_time || '',
                result.confidence_choice_time || '',
                result.trial_id || '',
                result.is_bonus_trial ? 'TRUE' : 'FALSE',
                result.bonus_amount || '',
                result.timestamp ? result.timestamp.toISOString() : ''
            ].map(field => {
                if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            }).join(',');
        });

        const csvContent = [header, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="results_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
    } catch (error) {
        console.error('Error generating CSV:', error);
        res.status(500).send('Error generating CSV file');
    }
});

// ===========================================
// POST ENDPOINTS - Must come BEFORE /:urlPath
// ===========================================

// Endpoint to save trial data
app.post('/save', async (req, res) => {
    console.log('POST /save received');
    const { data } = req.body;
    
    if (!data) {
        console.log('No data in request body');
        return res.status(400).json({ error: 'No data received.' });
    }

    try {
        const resultCollection = db.collection('result');
        const header = "participant_id,trial_number,bar_size_condition,choice,confidence,risk_probability,risk_reward,safe_probability,safe_reward,risk_position,safe_position,ev,bar_choice_time,confidence_choice_time,trial_id,is_bonus_trial,bonus_amount";
        const keys = header.split(',');
        
        const rows = data.split('\n').filter(row => row.trim() !== '');
        const entries = rows.map((row, index) => {
            try {
                const values = parseCSVRow(row);
                
                if (values.length !== keys.length) {
                    console.warn(`Row ${index + 1} has ${values.length} values but expected ${keys.length}`);
                }
                
                const entry = {};
                keys.forEach((key, keyIndex) => {
                    const value = values[keyIndex];
                    if (['trial_number', 'confidence', 'risk_probability', 'risk_reward', 'safe_reward', 'safe_probability', 'bar_choice_time', 'confidence_choice_time', 'trial_id', 'bonus_amount'].includes(key)) {
                        if (value === 'null' || value === '' || value === undefined) {
                            entry[key] = null;
                        } else {
                            entry[key] = parseFloat(value);
                        }
                    } else if (key === 'is_bonus_trial') {
                        // Handle boolean field
                        entry[key] = value === 'TRUE' || value === 'true' || value === '1';
                    } else {
                        entry[key] = value || '';
                    }
                });
                
                entry.timestamp = new Date();
                return entry;
            } catch (parseError) {
                console.error(`Error parsing row ${index + 1}:`, parseError);
                throw parseError;
            }
        });

        console.log(`Inserting ${entries.length} entries to database`);

        if (entries.length > 0) {
            await resultCollection.insertMany(entries);
        }
        
        res.status(200).json({ 
            success: true, 
            message: `Data saved successfully. ${entries.length} entries processed.` 
        });
    } catch (err) {
        console.error('Error saving data to database:', err);
        return res.status(500).json({ 
            error: 'Error saving data', 
            message: err.message 
        });
    }
});

// Endpoint to save attention check data
app.post('/save-attention', async (req, res) => {
    console.log('POST /save-attention received');
    const { participantId, data } = req.body;
    
    if (!data || !participantId) {
        return res.status(400).json({ error: 'No attention check data or participant ID received.' });
    }

    try {
        const attentionCollection = db.collection('attention_checks');
        
        const entries = data.map(item => ({
            ...item,
            participant_id: participantId,
            saved_at: new Date()
        }));

        console.log(`Inserting ${entries.length} attention check entries for participant ${participantId}`);

        if (entries.length > 0) {
            await attentionCollection.insertMany(entries);
        }
        
        res.status(200).json({ 
            success: true, 
            message: `Attention check data saved successfully. ${entries.length} entries processed.` 
        });
    } catch (err) {
        console.error('Error saving attention check data:', err);
        return res.status(500).json({ 
            error: 'Error saving attention check data', 
            message: err.message 
        });
    }
});

// Endpoint to save bonus payment data
app.post('/save-bonus', async (req, res) => {
    console.log('POST /save-bonus received');
    const bonusData = req.body;
    
    if (!bonusData.participant_id) {
        return res.status(400).json({ error: 'No participant ID received.' });
    }

    try {
        const bonusCollection = db.collection('bonus_payments');
        const resultCollection = db.collection('result');
        
        // Check if bonus payment already exists for this participant
        const existing = await bonusCollection.findOne({ 
            participant_id: bonusData.participant_id 
        });

        if (existing) {
            // Update existing record
            await bonusCollection.updateOne(
                { participant_id: bonusData.participant_id },
                { $set: bonusData }
            );
            console.log(`Updated bonus payment for participant ${bonusData.participant_id}`);
        } else {
            // Insert new record
            await bonusCollection.insertOne(bonusData);
            console.log(`Inserted bonus payment for participant ${bonusData.participant_id}`);
        }
        
        // Update the trial record in the result collection to mark it as bonus trial
        if (bonusData.bonus_trial_number) {
            await resultCollection.updateOne(
                { 
                    participant_id: bonusData.participant_id,
                    trial_number: bonusData.bonus_trial_number
                },
                { 
                    $set: { 
                        is_bonus_trial: true,
                        bonus_amount: parseFloat(bonusData.outcome_amount) || 0
                    }
                }
            );
            console.log(`Updated trial ${bonusData.bonus_trial_number} for participant ${bonusData.participant_id} with bonus info`);
        }
        
        res.status(200).json({ 
            success: true, 
            message: `Bonus payment data saved successfully.` 
        });
    } catch (err) {
        console.error('Error saving bonus payment data:', err);
        return res.status(500).json({ 
            error: 'Error saving bonus payment data', 
            message: err.message 
        });
    }
});

// ===========================================
// DYNAMIC ROUTES - Must come LAST
// ===========================================

// Route for downloading trial data via /{url}/{password}/download-trial
app.get('/:urlPath/:password/download-trial', async (req, res) => {
    const { urlPath, password } = req.params;
    
    try {
        const settings = await db.collection('settings').findOne({ url: urlPath });
        
        if (!settings) {
            return res.status(404).send('Page not found');
        }
        
        if (settings.password !== password) {
            return res.status(401).send('Invalid password');
        }
        
        await serveCsvResults(res);
        
    } catch (error) {
        console.error('Error in download-trial route:', error);
        res.status(500).send('Server error');
    }
});

// Route for downloading attention check data via /{url}/{password}/download-attention
app.get('/:urlPath/:password/download-attention', async (req, res) => {
    const { urlPath, password } = req.params;
    
    try {
        const settings = await db.collection('settings').findOne({ url: urlPath });
        
        if (!settings) {
            return res.status(404).send('Page not found');
        }
        
        if (settings.password !== password) {
            return res.status(401).send('Invalid password');
        }
        
        await serveAttentionCheckCsv(res);
        
    } catch (error) {
        console.error('Error in download-attention route:', error);
        res.status(500).send('Server error');
    }
});

// Route for downloading bonus payments data via /{url}/{password}/download-bonus
app.get('/:urlPath/:password/download-bonus', async (req, res) => {
    const { urlPath, password } = req.params;
    
    try {
        const settings = await db.collection('settings').findOne({ url: urlPath });
        
        if (!settings) {
            return res.status(404).send('Page not found');
        }
        
        if (settings.password !== password) {
            return res.status(401).send('Invalid password');
        }
        
        await serveBonusPaymentsCsv(res);
        
    } catch (error) {
        console.error('Error in download-bonus route:', error);
        res.status(500).send('Server error');
    }
});

// Protected CSV download endpoint - MUST BE LAST because it catches all /:urlPath
app.get('/:urlPath', async (req, res) => {
    const requestedPath = req.params.urlPath;
    
    // Skip if it looks like a file request
    if (requestedPath.includes('.')) {
        return res.status(404).send('File not found');
    }
    
    try {
        const settingsCollection = db.collection('settings');
        const setting = await settingsCollection.findOne({ url: requestedPath });
        
        if (!setting) {
            return res.status(404).send('Page not found');
        }
        
        const providedPassword = req.headers.authorization?.replace('Bearer ', '') || req.query.password;
        
        if (!providedPassword) {
            return res.send(getPasswordPromptHTML());
        }
        
        if (providedPassword !== setting.password) {
            return res.status(401).send(getAccessDeniedHTML(req.path));
        }
        
        await showDownloadPage(res, requestedPath, providedPassword);
        
    } catch (error) {
        console.error('Error in protected route:', error);
        res.status(500).send('Internal server error');
    }
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < row.length) {
        const char = row[i];
        const nextChar = row[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i += 2;
            } else {
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    
    result.push(current);
    return result;
}

async function serveCsvResults(res) {
    try {
        const resultCollection = db.collection('result');
        const results = await resultCollection.find({}).sort({ timestamp: 1 }).toArray();
        
        if (results.length === 0) {
            return res.status(404).send('No results found');
        }
        
        const header = "participant_id,trial_number,bar_size_condition,choice,confidence,risk_probability,risk_reward,safe_probability,safe_reward,risk_position,safe_position,ev,bar_choice_time,confidence_choice_time,trial_id,is_bonus_trial,bonus_amount,timestamp";
        
        const csvRows = results.map(result => {
            return [
                result.participant_id || '',
                result.trial_number || '',
                result.bar_size_condition || '',
                result.choice || '',
                result.confidence || '',
                result.risk_probability || '',
                result.risk_reward || '',
                result.safe_probability || '',
                result.safe_reward || '',
                result.risk_position || '',
                result.safe_position || '',
                result.ev || '',
                result.bar_choice_time || '',
                result.confidence_choice_time || '',
                result.trial_id || '',
                result.is_bonus_trial ? 'TRUE' : 'FALSE',
                result.bonus_amount || '',
                result.timestamp ? result.timestamp.toISOString() : ''
            ].map(field => {
                if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            }).join(',');
        });
        
        const csvContent = [header, ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="results_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
        
    } catch (error) {
        console.error('Error generating CSV:', error);
        res.status(500).send('Error generating CSV file');
    }
}

async function serveAttentionCheckCsv(res) {
    try {
        const attentionCollection = db.collection('attention_checks');
        const results = await attentionCollection.find({}).sort({ timestamp: 1 }).toArray();
        
        if (results.length === 0) {
            return res.status(404).send('No attention check data found');
        }
        
        const header = "participant_id,attention_check_number,question_type,question_prompt,correct_answer,user_answer,is_correct,response_time,timestamp,session_id";
        
        const csvRows = results.map(result => {
            return [
                result.participant_id || '',
                result.attention_check_number || '',
                result.question_type || '',
                result.question_prompt || '',
                result.correct_answer || '',
                result.user_answer || '',
                result.is_correct || '',
                result.response_time || '',
                result.timestamp ? (typeof result.timestamp === 'object' && result.timestamp.toISOString ? result.timestamp.toISOString() : result.timestamp) : '',
                result.session_id || ''
            ].map(field => {
                if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            }).join(',');
        });
        
        const csvContent = [header, ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attention_checks_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
        
    } catch (error) {
        console.error('Error generating attention check CSV:', error);
        res.status(500).send('Error generating attention check CSV file');
    }
}

async function serveBonusPaymentsCsv(res) {
    try {
        const bonusCollection = db.collection('bonus_payments');
        const results = await bonusCollection.find({}).sort({ timestamp: 1 }).toArray();
        
        if (results.length === 0) {
            return res.status(404).send('No bonus payment data found');
        }
        
        const header = "participant_id,bonus_trial_id,bonus_trial_number,choice_on_bonus,outcome_amount,payment";
        
        const csvRows = results.map(result => {
            return [
                result.participant_id || '',
                result.bonus_trial_id || '',
                result.bonus_trial_number || '',
                result.choice_on_bonus || '',
                result.outcome_amount || '',
                result.payment || 'pending'
            ].map(field => {
                if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            }).join(',');
        });
        
        const csvContent = [header, ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="bonus_payments_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
        
    } catch (error) {
        console.error('Error generating bonus payments CSV:', error);
        res.status(500).send('Error generating bonus payments CSV file');
    }
}

async function showDownloadPage(res, urlPath, password) {
    const downloadPageHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Download Data</title>
            <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; }
                body {
                    font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0; padding: 0; background: #fff; color: #333;
                    min-height: 100vh; display: flex; align-items: center; justify-content: center;
                }
                .main-container {
                    max-width: 600px; margin: 0 auto; padding: 3rem;
                    background: #fff; border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); text-align: center;
                }
                h2 { color: #333; font-size: 24px; font-weight: 600; margin-bottom: 1rem; }
                p { color: #666; margin-bottom: 2rem; }
                .download-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 2rem 0; }
                .download-button {
                    padding: 15px 30px; border: none; border-radius: 6px;
                    font-size: 16px; font-weight: 500; cursor: pointer;
                    text-decoration: none; display: inline-block; min-width: 200px;
                }
                .trial-data-button { background: #2563eb; color: white; }
                .trial-data-button:hover { background: #1d4ed8; }
                .attention-data-button { background: #dc2626; color: white; }
                .attention-data-button:hover { background: #b91c1c; }
                .bonus-data-button { background: #16a34a; color: white; }
                .bonus-data-button:hover { background: #15803d; }
            </style>
        </head>
        <body>
            <div class="main-container">
                <h2>📊 Download Experiment Data</h2>
                <p>Access granted. Choose which dataset you would like to download:</p>
                <div class="download-buttons">
                    <a href="/${urlPath}/${password}/download-trial" class="download-button trial-data-button">
                        📈 Download Trial Data (CSV)
                    </a>
                    <a href="/${urlPath}/${password}/download-attention" class="download-button attention-data-button">
                        ⚠️ Download Attention Check Data (CSV)
                    </a>
                    <a href="/${urlPath}/${password}/download-bonus" class="download-button bonus-data-button">
                        💸 Download Bonus Payments (CSV)
                    </a>
                </div>
                <p style="font-size: 14px; color: #999; margin-top: 3rem;">
                    Trial data contains participant responses to risk choices.<br>
                    Attention check data contains validation question responses.<br>
                    Bonus payments data contains payment tracking information.
                </p>
            </div>
        </body>
        </html>
    `;
    res.send(downloadPageHTML);
}

function getPasswordPromptHTML() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Access Protected</title>
            <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; }
                body {
                    font-family: 'Nunito Sans', sans-serif; margin: 0; padding: 0;
                    background: #fff; min-height: 100vh;
                    display: flex; align-items: center; justify-content: center;
                }
                .main-container {
                    max-width: 500px; padding: 3rem; background: #fff;
                    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;
                }
                h2 { color: #333; font-size: 24px; margin-bottom: 1rem; }
                input[type="password"] {
                    width: 100%; padding: 12px 16px; border: 1px solid #e5e5e5;
                    border-radius: 4px; font-size: 16px; margin-bottom: 1.5rem;
                }
                .next-button {
                    background: #333; color: white; border: none; border-radius: 4px;
                    padding: 12px 24px; font-size: 16px; cursor: pointer;
                }
                .next-button:hover { background: #555; }
            </style>
        </head>
        <body>
            <div class="main-container">
                <h2>Please Enter Password</h2>
                <form onsubmit="submitPassword(event)">
                    <input type="password" id="password" placeholder="Enter access password..." required>
                    <br>
                    <button type="submit" class="next-button">Access Results</button>
                </form>
            </div>
            <script>
                function submitPassword(event) {
                    event.preventDefault();
                    const password = document.getElementById('password').value;
                    window.location.href = window.location.pathname + '?password=' + encodeURIComponent(password);
                }
                document.getElementById('password').focus();
            </script>
        </body>
        </html>
    `;
}

function getAccessDeniedHTML(path) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Access Denied</title>
            <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; }
                body {
                    font-family: 'Nunito Sans', sans-serif; margin: 0; padding: 0;
                    background: #fff; min-height: 100vh;
                    display: flex; align-items: center; justify-content: center;
                }
                .main-container {
                    max-width: 500px; padding: 3rem; background: #fff;
                    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;
                }
                h2 { color: #dc2626; font-size: 24px; margin-bottom: 1rem; }
                p { color: #666; margin-bottom: 2rem; }
                .next-button {
                    background: #333; color: white; border: none; border-radius: 4px;
                    padding: 12px 24px; font-size: 16px; text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="main-container">
                <h2>Access Denied</h2>
                <p>Incorrect password. Please try again.</p>
                <a href="${path}" class="next-button">Try Again</a>
            </div>
        </body>
        </html>
    `;
}

// ===========================================
// DATABASE CONNECTION & SERVER START
// ===========================================

async function connectToDb() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in your .env file');
    }
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db('risk-survey');
}

connectToDb().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`Health check available at http://localhost:${port}/health`);
    });
}).catch(err => {
    console.error('Failed to connect to the database', err);
    process.exit(1);
});
