import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import admin from "firebase-admin";
import mammoth from "mammoth";
import AdmZip from "adm-zip";
import { parse as parseCsv } from "csv-parse/sync";
import { convert as convertHtml } from "html-to-text";
import { createRequire } from "module";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

dotenv.config();

// Initialize Firebase Admin for server-side DB access
let adminApp: any = null;

if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "speclq";
    const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;

    if (serviceAccountStr) {
      try {
        const serviceAccount = JSON.parse(serviceAccountStr);
        adminApp = initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL
        });
        console.log("Firebase Admin initialized with service account.");
      } catch (parseError) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", parseError);
      }
    } else {
      console.warn("No FIREBASE_SERVICE_ACCOUNT found. Gmail token storage may fail if not in a GCP environment.");
      // We don't call initializeApp with applicationDefault() here to avoid immediate crash if not on GCP
      // Instead, we'll try it only if needed or let it fail gracefully
    }
  } catch (e) {
    console.error("Firebase Admin initialization failed:", e);
  }
} else {
  adminApp = admin.apps[0]!;
}

const getAdminDb = () => {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin is not initialized. Please provide FIREBASE_SERVICE_ACCOUNT.");
  }
  return getDatabase();
};

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir));

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Local File Upload API
app.post("/api/upload", upload.single("file"), async (req: any, res) => {
  const { projectId } = req.body;
  if (!req.file || !projectId) {
    return res.status(400).json({ error: "Missing file or projectId" });
  }

  try {
    const redirectUri = getRedirectUri(req);
    const baseUrl = redirectUri.replace("/auth/callback", "");
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    res.json({
      url: fileUrl,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      filename: req.file.filename
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Check for required environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set. Gmail integration will not work.");
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
);

const getRedirectUri = (req: express.Request) => {
  let url = process.env.APP_URL;
  if (!url) {
    const protocol = req.get('x-forwarded-proto') || 'https';
    const host = req.get('host');
    url = `${protocol}://${host}`;
  }
  // Remove trailing slash if present
  url = url.replace(/\/$/, "");
  return `${url}/auth/callback`;
};

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// API Routes
app.get("/api/auth/url", (req, res) => {
  const { projectId, userId } = req.query;
  if (!projectId || !userId) {
    return res.status(400).json({ error: "Missing projectId or userId" });
  }

  const missing = [];
  if (!GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!APP_URL) missing.push("APP_URL");

  if (missing.length > 0) {
    return res.status(500).json({ 
      error: `Server OAuth configuration is incomplete. Missing: ${missing.join(", ")}. Please set these in your environment variables/secrets.` 
    });
  }

  const redirectUri = getRedirectUri(req);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: JSON.stringify({ projectId, userId }),
    redirect_uri: redirectUri
  });
  res.json({ url: authUrl });
});

app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.send("Error: Missing code or state");
  }

  try {
    const { projectId, userId } = JSON.parse(state as string);
    const redirectUri = getRedirectUri(req);
    const { tokens } = await oauth2Client.getToken({
      code: code as string,
      redirect_uri: redirectUri
    });
    
    // Store tokens in RTDB
    const db = getAdminDb();
    await db.ref(`users/${userId}/projects/${projectId}/gmailTokens`).set(tokens);
    await db.ref(`projects/${projectId}/gmailConnected`).set(true);

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', projectId: '${projectId}' }, '*');
              window.close();
            } else {
              window.location.href = '/dashboard/project/${projectId}';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("OAuth Callback Error:", error);
    res.status(500).send("Authentication failed");
  }
});

// Text Cleaning Utility
const cleanText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags (fallback)
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n') // Remove excessive line breaks
    .trim();
};

const extractEmailBody = (payload: any): string => {
  if (!payload) return "";
  let body = "";
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain') {
        body += Buffer.from(part.body.data, 'base64').toString();
      } else if (part.mimeType === 'text/html') {
        const html = Buffer.from(part.body.data, 'base64').toString();
        body += convertHtml(html);
      } else if (part.parts) {
        body += extractEmailBody(part);
      }
    }
  } else if (payload.body && payload.body.data) {
    const data = Buffer.from(payload.body.data, 'base64').toString();
    if (payload.mimeType === 'text/html') {
      body += convertHtml(data);
    } else {
      body += data;
    }
  }
  return body;
};

// Parsing Engine
const parseFile = async (fileData: any): Promise<string> => {
  const { url, name, type, filename } = fileData;
  console.log(`Parsing file: ${name} (filename: ${filename})`);
  
  try {
    let buffer: Buffer;
    
    // If it's a local file, read it directly from disk
    if (filename) {
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        buffer = fs.readFileSync(filePath);
      } else {
        throw new Error(`File not found on disk: ${filename}`);
      }
    } else {
      // Fallback to fetching via URL
      console.log(`Fetching file via URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
      buffer = Buffer.from(await response.arrayBuffer());
    }

    const lowerName = name.toLowerCase();
    if (lowerName.endsWith('.pdf')) {
      const data = await pdf(buffer);
      return data.text;
    } else if (lowerName.endsWith('.docx')) {
      const data = await mammoth.extractRawText({ buffer });
      return data.value;
    } else if (lowerName.endsWith('.txt')) {
      return buffer.toString('utf-8');
    } else if (lowerName.endsWith('.csv')) {
      const records = parseCsv(buffer);
      return records.map((row: any) => Object.values(row).join(' ')).join('\n');
    } else if (lowerName.endsWith('.json')) {
      const json = JSON.parse(buffer.toString('utf-8'));
      return JSON.stringify(json, null, 2);
    } else if (lowerName.endsWith('.zip')) {
      const zip = new AdmZip(buffer);
      let combinedText = "";
      zip.getEntries().forEach(entry => {
        if (!entry.isDirectory && (entry.entryName.toLowerCase().endsWith('.txt') || entry.entryName.toLowerCase().endsWith('.csv'))) {
          combinedText += `\n--- File: ${entry.entryName} ---\n`;
          combinedText += entry.getData().toString('utf8');
        }
      });
      return combinedText;
    }
    console.warn(`Unsupported file type for: ${name}`);
    return "";
  } catch (error) {
    console.error(`Error parsing file ${name}:`, error);
    throw error;
  }
};

app.post("/api/projects/:projectId/process", async (req, res) => {
  const { projectId } = req.params;
  const { userId } = req.body;

  try {
    const db = getAdminDb();
    
    // 1. Process Pending Files
    const filesSnapshot = await db.ref(`projects/${projectId}/files`).get();
    if (filesSnapshot.exists()) {
      const files = filesSnapshot.val();
      for (const fileId in files) {
        const file = files[fileId];
        if (file.processingStatus === 'pending') {
          try {
            await db.ref(`projects/${projectId}/files/${fileId}/processingStatus`).set('parsing');
            
            const extractedText = await parseFile(file);
            const cleanedText = cleanText(extractedText);
            
            const parsedId = db.ref(`projects/${projectId}/parsedData`).push().key;
            await db.ref(`projects/${projectId}/parsedData/${parsedId}`).set({
              sourceType: 'file',
              sourceId: fileId,
              extractedText,
              cleanedText,
              extractionTimestamp: Date.now(),
              processingStatus: 'parsed',
              readyForAI: true
            });
            
            await db.ref(`projects/${projectId}/files/${fileId}/processingStatus`).set('parsed');
          } catch (err) {
            console.error(`Failed to process file ${fileId}:`, err);
            await db.ref(`projects/${projectId}/files/${fileId}/processingStatus`).set('error');
          }
        }
      }
    }

    // 2. Process Pending Emails
    const emailsSnapshot = await db.ref(`projects/${projectId}/emails`).get();
    if (emailsSnapshot.exists()) {
      const emails = emailsSnapshot.val();
      
      // We need tokens to fetch full body if not already stored
      const tokenSnapshot = await db.ref(`users/${userId}/projects/${projectId}/gmailTokens`).get();
      let gmail: any = null;
      if (tokenSnapshot.exists()) {
        const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
        auth.setCredentials(tokenSnapshot.val());
        gmail = google.gmail({ version: 'v1', auth });
      }

      for (const emailId in emails) {
        const email = emails[emailId];
        if (email.processingStatus === 'pending') {
          try {
            await db.ref(`projects/${projectId}/emails/${emailId}/processingStatus`).set('parsing');
            
            let fullBody = "";
            if (gmail) {
              const msg = await gmail.users.messages.get({ userId: 'me', id: emailId });
              fullBody = extractEmailBody(msg.data.payload);
            }

            const cleanedText = cleanText(`${email.subject}\n\n${fullBody || email.snippet}`);
            
            const parsedId = db.ref(`projects/${projectId}/parsedData`).push().key;
            await db.ref(`projects/${projectId}/parsedData/${parsedId}`).set({
              sourceType: 'email',
              sourceId: emailId,
              subject: email.subject,
              sender: email.sender,
              timestamp: email.timestamp,
              cleanedText,
              extractionTimestamp: Date.now(),
              processingStatus: 'parsed',
              readyForAI: true
            });
            
            await db.ref(`projects/${projectId}/emails/${emailId}/processingStatus`).set('parsed');
          } catch (err) {
            console.error(`Failed to process email ${emailId}:`, err);
            await db.ref(`projects/${projectId}/emails/${emailId}/processingStatus`).set('error');
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Processing Error:", error);
    res.status(500).json({ error: "Failed to process project data" });
  }
});

app.post("/api/projects/:projectId/insights", async (req, res) => {
  const { projectId } = req.params;
  const { sourceId, sourceType, insights } = req.body;

  if (!sourceId || !insights) {
    return res.status(400).json({ error: "Missing sourceId or insights" });
  }

  try {
    const db = getAdminDb();
    
    // 1. Store individual insight
    const insightId = db.ref(`projects/${projectId}/insights`).push().key;
    const insightData = {
      sourceId,
      sourceType,
      ...insights,
      extractionTimestamp: Date.now()
    };
    await db.ref(`projects/${projectId}/insights/${insightId}`).set(insightData);

    // 2. Update source status
    await db.ref(`projects/${projectId}/parsedData/${sourceId}`).update({
      readyForAI: false,
      analysisStatus: "completed"
    });

    // 3. Update Aggregated Insights
    const aggRef = db.ref(`projects/${projectId}/aggregatedInsights`);
    const aggSnapshot = await aggRef.get();
    let aggregated = aggSnapshot.exists() ? aggSnapshot.val() : {
      allFunctionalRequirements: [],
      allNonFunctionalRequirements: [],
      allStakeholders: [],
      allDeadlines: [],
      allDecisions: [],
      allRisks: [],
      allAssumptions: []
    };

    const mergeUnique = (existing: string[], newItems: string[]) => {
      const combined = [...(existing || []), ...(newItems || [])];
      return Array.from(new Set(combined.map(s => s.trim()).filter(Boolean)));
    };

    aggregated.allFunctionalRequirements = mergeUnique(aggregated.allFunctionalRequirements, insights.functionalRequirements);
    aggregated.allNonFunctionalRequirements = mergeUnique(aggregated.allNonFunctionalRequirements, insights.nonFunctionalRequirements);
    aggregated.allStakeholders = mergeUnique(aggregated.allStakeholders, insights.stakeholders);
    aggregated.allDeadlines = mergeUnique(aggregated.allDeadlines, insights.deadlines);
    aggregated.allDecisions = mergeUnique(aggregated.allDecisions, insights.decisions);
    aggregated.allRisks = mergeUnique(aggregated.allRisks, insights.risks);
    aggregated.allAssumptions = mergeUnique(aggregated.allAssumptions, insights.assumptions);

    await aggRef.set(aggregated);

    res.json({ success: true, insightId });
  } catch (error) {
    console.error("Error storing insights:", error);
    res.status(500).json({ error: "Failed to store insights" });
  }
});

app.post("/api/gmail/sync", async (req, res) => {
  const { projectId, userId } = req.body;
  if (!projectId || !userId) {
    return res.status(400).json({ error: "Missing projectId or userId" });
  }

  try {
    const db = getAdminDb();
    const tokenSnapshot = await db.ref(`users/${userId}/projects/${projectId}/gmailTokens`).get();
    
    if (!tokenSnapshot.exists()) {
      return res.status(401).json({ error: "Gmail not connected" });
    }

    const tokens = tokenSnapshot.val();
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials(tokens);

    // Refresh token if needed
    auth.on('tokens', (newTokens) => {
      db.ref(`users/${userId}/projects/${projectId}/gmailTokens`).update(newTokens);
    });

    const gmail = google.gmail({ version: 'v1', auth });
    
    // Fetch messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
    });

    const messages = response.data.messages || [];
    const syncedEmails = [];

    for (const msg of messages) {
      const msgDetails = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
      });

      const payload = msgDetails.data.payload;
      const headers = payload?.headers || [];
      
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const to = headers.find(h => h.name === 'To')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      const timestamp = date ? new Date(date).getTime() : Date.now();

      const emailData = {
        messageId: msg.id,
        threadId: msg.threadId,
        subject,
        sender: from,
        recipient: to,
        timestamp,
        snippet: msgDetails.data.snippet || '',
        syncTimestamp: Date.now(),
        processingStatus: 'pending'
      };

      // Store in RTDB (avoid duplicates by using messageId as key)
      await db.ref(`projects/${projectId}/emails/${msg.id}`).set(emailData);
      syncedEmails.push(emailData);
    }

    res.json({ success: true, count: syncedEmails.length });
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: "Failed to sync emails" });
  }
});

app.post("/api/gmail/disconnect", async (req, res) => {
  const { projectId, userId } = req.body;
  try {
    const db = getAdminDb();
    await db.ref(`users/${userId}/projects/${projectId}/gmailTokens`).remove();
    await db.ref(`projects/${projectId}/gmailConnected`).set(false);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  app.get("*", (req, res) => {
    res.sendFile("dist/index.html", { root: "." });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
