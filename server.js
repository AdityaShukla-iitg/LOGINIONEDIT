require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Custom CORS middleware to prevent local cross-origin network errors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-password');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Initialize Google Auth with scopes for Sheets and Drive
const auth = new google.auth.GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
  ],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

let cachedSpreadsheetId = null;

// Helper function to resolve Google Spreadsheet ID
async function getSpreadsheetId() {
  if (process.env.SPREADSHEET_ID) {
    return process.env.SPREADSHEET_ID;
  }
  if (cachedSpreadsheetId) {
    return cachedSpreadsheetId;
  }

  try {
    const response = await drive.files.list({
      q: "name = 'Aditya Projects' and mimeType = 'application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name)',
      pageSize: 1,
    });

    const files = response.data.files;
    if (!files || files.length === 0) {
      throw new Error("Could not find a Google Sheet named 'Aditya Projects' in Google Drive.");
    }

    cachedSpreadsheetId = files[0].id;
    console.log(`Found spreadsheet 'Aditya Projects' with ID: ${cachedSpreadsheetId}`);
    return cachedSpreadsheetId;
  } catch (error) {
    console.error("Error searching for spreadsheet by name:", error.message);
    throw error;
  }
}

// Log credentials info at startup to help debugging
auth.getClient().then(client => {
  if (client.email) {
    console.log(`Authenticated Google Client Email: ${client.email}`);
  } else {
    console.log("Authenticated Google Client loaded (Application Default Credentials).");
  }
}).catch(err => {
  console.warn("Could not check Google Client credentials:", err.message);
});

// Middleware for password validation
function validatePassword(req, res, next) {
  const password = req.headers['x-password'];
  const correctPassword = process.env.ACCESS_PASSWORD;

  if (!correctPassword) {
    console.error("ACCESS_PASSWORD environment variable is not defined.");
    return res.status(500).json({ success: false, error: "Server configuration error. Please contact administrator." });
  }

  if (password === correctPassword) {
    next();
  } else {
    res.status(401).json({ success: false, error: "Unauthorized. Invalid password." });
  }
}

// Route to verify password
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const correctPassword = process.env.ACCESS_PASSWORD;

  if (!correctPassword) {
    console.error("ACCESS_PASSWORD environment variable is not defined.");
    return res.status(500).json({ success: false, error: "Server configuration error." });
  }

  if (password === correctPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Wrong password. Try again." });
  }
});

const https = require('https');

// Helper to fetch Google Sheet CSV export if credentials are not present, following redirects automatically
function fetchPublicSheetCsv(urlOrId) {
  return new Promise((resolve, reject) => {
    const url = urlOrId.startsWith('http')
      ? urlOrId
      : `https://docs.google.com/spreadsheets/d/${urlOrId}/export?format=csv`;

    https.get(url, (res) => {
      // Follow redirect status codes (301, 302, 303, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPublicSheetCsv(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch CSV, status code: ${res.statusCode}`));
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Simple CSV parser that handles quotes and commas
function parseCsv(csvText) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    const next = csvText[i+1];
    
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

// Route to fetch projects from Google Sheet
app.get('/api/projects', validatePassword, async (req, res) => {
  try {
    const spreadsheetId = await getSpreadsheetId();
    let rows;

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A:H',
      });
      rows = response.data.values;
    } catch (apiError) {
      console.log("Google Sheets API fetch failed (likely missing credentials). Attempting public CSV fetch fallback...");
      const csvText = await fetchPublicSheetCsv(spreadsheetId);
      rows = parseCsv(csvText);
    }

    if (!rows || rows.length <= 1) {
      // Empty sheet or headers only
      return res.json({ success: true, projects: [] });
    }

    // Parse project details from row data (skipping row 0 headers)
    const projects = rows.slice(1).map((row) => {
      return {
        name: row[0] || '',
        videoType: row[1] || '',
        date: row[2] || '',
        price: row[3] || '',
        driveLink: row[4] || '',
        deliveryStatus: row[5] || '',
        paymentStatus: row[6] || '',
        notes: row[7] || '',
      };
    });

    res.json({ success: true, projects });
  } catch (error) {
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log("Using mock data fallback for local testing.");
      return res.json({
        success: true,
        projects: [
          {
            name: "Project Alpha",
            videoType: "Explainer",
            date: "2026-06-01",
            price: "$500",
            driveLink: "http://drive.google.com/link1",
            deliveryStatus: "Delivered",
            paymentStatus: "Paid",
            notes: "Good feedback"
          },
          {
            name: "Project Beta",
            videoType: "Promo",
            date: "2026-06-03",
            price: "$300",
            driveLink: "http://drive.google.com/link2",
            deliveryStatus: "Pending",
            paymentStatus: "Unpaid",
            notes: "Waiting for assets"
          },
          {
            name: "Project Gamma",
            videoType: "Tutorial",
            date: "2026-06-05",
            price: "$400",
            driveLink: "http://drive.google.com/link3",
            deliveryStatus: "In Progress",
            paymentStatus: "Partial",
            notes: ""
          },
          {
            name: "Project Delta",
            videoType: "Ad",
            date: "2026-06-07",
            price: "$600",
            driveLink: "http://drive.google.com/link4",
            deliveryStatus: "Not Started",
            paymentStatus: "Unpaid",
            notes: "Script pending"
          },
          {
            name: "Project Epsilon",
            videoType: "Vlog Edit",
            date: "2026-06-09",
            price: "$250",
            driveLink: "http://drive.google.com/link5",
            deliveryStatus: "Delivered",
            paymentStatus: "Paid",
            notes: ""
          }
        ]
      });
    }
    console.error("Failed to load projects from sheet:", error.message);
    res.status(500).json({ success: false, error: "Could not load projects. Please refresh." });
  }
});

// Serve frontend SPA index for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
