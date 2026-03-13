require('dotenv').config();
const express = require("express");
const cors = require("cors");
const supabase = require("./supabase");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to detect and format table missing errors
function formatError(error) {
  if (error.message && error.message.includes('Could not find the table')) {
    const tableName = error.message.match(/'([^']+)'/)?.[1] || 'database table';
    return {
      isMissingTable: true,
      message: `Database table not found: ${tableName}`,
      hint: 'Run database setup: See DATABASE_SETUP_INSTRUCTIONS.md for manual Supabase setup',
      originalError: error.message
    };
  }
  return {
    isMissingTable: false,
    message: error.message,
    originalError: error.message
  };
}

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.send("CodeTrace Supabase Backend is running...");
});

// --- User APIs ---
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    
    console.log(`[GET USERS] Retrieved ${data.length} users from database`);
    
    res.json(data.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      role: u.role,
      createdAt: u.created_at
    })));
  } catch (error) {
    console.error(`[GET USERS ERROR] ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.warn(`[GET USER ERROR] User not found: ${id}`);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`[GET USER] Retrieved user: ${data.email}`);
    
    res.json({
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      createdAt: data.created_at
    });
  } catch (error) {
    console.error(`[GET USER FATAL ERROR] ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ name, email })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ user: {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      createdAt: data.created_at
    }});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, username, role, password } = req.body;
    
    // Validation
    if (!name || !email || !username || !role || !password) {
      console.warn(`[SIGNUP ERROR] Missing required fields:`, { name: !!name, email: !!email, username: !!username, role: !!role, password: !!password });
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password.length < 6) {
      console.warn(`[SIGNUP ERROR] Password too short for user: ${email}`);
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if (!['Student', 'Instructor'].includes(role)) {
      console.warn(`[SIGNUP ERROR] Invalid role: ${role}`);
      return res.status(400).json({ error: "Role must be 'Student' or 'Instructor'" });
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        username: username.toLowerCase().trim(), 
        role: role.trim(), 
        password: password 
      }])
      .select()
      .single();
    
    if (error) {
      console.error(`[SIGNUP DATABASE ERROR] ${error.code} - ${error.message}`, { email, username });
      if (error.code === '23505') {
        const duplicateField = error.message.includes('email') ? 'email' : 'username';
        return res.status(409).json({ error: `This ${duplicateField} is already registered` });
      }
      throw error;
    }

    console.log(`[SIGNUP SUCCESS] New user created:`, {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      createdAt: data.created_at
    });

    res.status(201).json({ user: {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      createdAt: data.created_at
    }});
  } catch (error) {
    console.error(`[SIGNUP FATAL ERROR] ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { identifier, role, password } = req.body;
    
    // Validation
    if (!identifier || !role || !password) {
      console.warn(`[LOGIN ERROR] Missing required fields`, { identifier: !!identifier, role: !!role, password: !!password });
      return res.status(400).json({ error: "Missing required fields" });
    }

    const identLower = identifier.toLowerCase().trim();
    
    console.log(`[LOGIN ATTEMPT] User login attempt:`, { identifier: identLower, role });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${identLower},username.eq.${identLower}`)
      .eq('role', role)
      .single();

    if (error || !data) {
      console.warn(`[LOGIN ERROR] User not found:`, { identifier: identLower, role, errorMsg: error?.message });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    if (data.password !== password) {
      console.warn(`[LOGIN ERROR] Invalid password for user:`, { identifier: identLower, userId: data.id });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`[LOGIN SUCCESS] User logged in:`, {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      loginTime: new Date().toISOString()
    });

    res.json({ user: {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      createdAt: data.created_at
    }});
  } catch (error) {
    console.error(`[LOGIN FATAL ERROR] ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

// --- Scans API ---
app.get("/api/scans", async (req, res) => {
  try {
    const { userId } = req.query;
    let query = supabase.from('scans').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
      console.log(`[GET SCANS] Fetching scans for user: ${userId}`);
    } else {
      console.log(`[GET SCANS] Fetching all scans`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    console.log(`[GET SCANS SUCCESS] Retrieved ${data.length} scan(s)`);
    
    res.json(data.map(s => ({
      id: s.id,
      userId: s.user_id,
      text: s.text,
      similarity: s.similarity,
      topSources: s.top_sources || [],
      createdAt: s.created_at
    })));
  } catch (error) {
    const formatted = formatError(error);
    if (formatted.isMissingTable) {
      console.error(`[GET SCANS ERROR] ${formatted.message}`, formatted.originalError);
      return res.status(500).json({ error: formatted.message, hint: formatted.hint });
    }
    console.error(`[GET SCANS ERROR] ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/scans", async (req, res) => {
  try {
    const { userId } = req.query;
    let query = supabase.from('scans').delete();
    if (userId) query = query.eq('user_id', userId);
    else query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    const { error } = await query;
    if (error) throw error;
    res.json({ message: "Scans cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/scans", async (req, res) => {
  try {
    const { userId, text, similarity, topSources } = req.body;
    
    // Validate required fields
    if (!userId || !text) {
      return res.status(400).json({ error: "Missing required fields: userId, text" });
    }
    
    // Ensure similarity is a valid number
    const sim = Math.max(0, Math.min(100, parseInt(similarity) || 0));
    
    // Ensure topSources is an array
    const sources = Array.isArray(topSources) ? topSources : [];
    
    const { data, error } = await supabase
      .from('scans')
      .insert([{ 
        user_id: userId, 
        text: text.trim(), 
        similarity: sim, 
        top_sources: sources 
      }])
      .select()
      .single();
    
    if (error) {
      console.error(`[SCAN SAVE ERROR] ${error.message}`, { userId, textLen: text.length, similarity: sim });
      throw error;
    }
    
    console.log(`[SCAN SAVED] User: ${userId}, Similarity: ${sim}%, Sources: ${sources.length}`);
    
    res.status(201).json({
      id: data.id,
      userId: data.user_id,
      text: data.text,
      similarity: data.similarity,
      topSources: data.top_sources,
      createdAt: data.created_at
    });
  } catch (error) {
    console.error(`[SCAN FATAL ERROR] ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

// --- Library / Submissions ---
app.get("/api/library", async (req, res) => {
  try {
    const { userId } = req.query;
    let query = supabase.from('library').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
      console.log(`[GET LIBRARY] Fetching library for user: ${userId}`);
    } else {
      console.log(`[GET LIBRARY] Fetching all library items`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    console.log(`[GET LIBRARY SUCCESS] Retrieved ${data.length} item(s)`);
    
    res.json(data.map(l => ({
      id: l.id,
      userId: l.user_id,
      userName: l.user_name,
      title: l.title,
      text: l.text,
      createdAt: l.created_at
    })));
  } catch (error) {
    const formatted = formatError(error);
    if (formatted.isMissingTable) {
      console.error(`[GET LIBRARY ERROR] ${formatted.message}`, formatted.originalError);
      return res.status(500).json({ error: formatted.message, hint: formatted.hint });
    }
    console.error(`[GET LIBRARY ERROR] ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/library", async (req, res) => {
  try {
    const { error } = await supabase.from('library').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    res.json({ message: "Library cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/library", async (req, res) => {
  try {
    const { userId, title, text, userName } = req.body;
    
    // Validate required fields
    if (!userId || !text) {
      return res.status(400).json({ error: "Missing required fields: userId, text" });
    }
    
    const { data, error } = await supabase
      .from('library')
      .insert([{ 
        user_id: userId, 
        user_name: (userName || "Unknown").trim(), 
        title: (title || "Untitled Submission").trim(), 
        text: text.trim() 
      }])
      .select()
      .single();
    
    if (error) {
      console.error(`[LIBRARY SAVE ERROR] ${error.message}`, { userId, titleLen: title.length, textLen: text.length });
      throw error;
    }
    
    console.log(`[LIBRARY SAVED] User: ${userId}, Title: ${title}, Size: ${text.length} chars`);
    
    res.status(201).json({
      id: data.id,
      userId: data.user_id,
      userName: data.user_name,
      title: data.title,
      text: data.text,
      createdAt: data.created_at
    });
  } catch (error) {
    console.error(`[LIBRARY FATAL ERROR] ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

// --- Analysis Results ---
app.get("/api/analysis", async (req, res) => {
  try {
    const { instructorId } = req.query;
    let query = supabase.from('analysis_results').select('*').order('created_at', { ascending: false });
    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
      console.log(`[GET ANALYSIS] Fetching analysis for instructor: ${instructorId}`);
    } else {
      console.log(`[GET ANALYSIS] Fetching all analysis results`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    console.log(`[GET ANALYSIS SUCCESS] Retrieved ${data.length} result(s)`);
    
    res.json(data.map(a => ({
      id: a.id,
      instructorId: a.instructor_id,
      userA: a.user_a,
      userB: a.user_b,
      submissionA: a.submission_a,
      submissionB: a.submission_b,
      matchingPercentage: a.matching_percentage,
      level: a.level,
      createdAt: a.created_at
    })));
  } catch (error) {
    const formatted = formatError(error);
    if (formatted.isMissingTable) {
      console.error(`[GET ANALYSIS ERROR] ${formatted.message}`, formatted.originalError);
      return res.status(500).json({ error: formatted.message, hint: formatted.hint });
    }
    console.error(`[GET ANALYSIS ERROR] ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/analysis", async (req, res) => {
  try {
    const { instructorId, userA, userB, submissionA, submissionB, matchingPercentage, level } = req.body;
    
    // Validate required fields
    if (!instructorId || !userA || !userB || !submissionA || !submissionB || matchingPercentage === undefined || !level) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Validate matching percentage
    const percentage = Math.max(0, Math.min(100, parseInt(matchingPercentage) || 0));
    
    // Validate level
    const validLevels = ['Low', 'Medium', 'High'];
    const validLevel = validLevels.includes(level) ? level : 'Low';
    
    const { data, error } = await supabase
      .from('analysis_results')
      .insert([{ 
        instructor_id: instructorId, 
        user_a: userA.trim(), 
        user_b: userB.trim(), 
        submission_a: submissionA.trim(),
        submission_b: submissionB.trim(),
        matching_percentage: percentage, 
        level: validLevel
      }])
      .select()
      .single();
    
    if (error) {
      console.error(`[ANALYSIS SAVE ERROR] ${error.message}`, { instructorId, userA, userB, percentage });
      throw error;
    }
    
    console.log(`[ANALYSIS SAVED] Instructor: ${instructorId}, ${userA} vs ${userB}, Match: ${percentage}%`);
    
    res.status(201).json({
      id: data.id,
      instructorId: data.instructor_id,
      userA: data.user_a,
      userB: data.user_b,
      submissionA: data.submission_a,
      submissionB: data.submission_b,
      matchingPercentage: data.matching_percentage,
      level: data.level,
      createdAt: data.created_at
    });
  } catch (error) {
    console.error(`[ANALYSIS FATAL ERROR] ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/analysis", async (req, res) => {
  try {
    const { instructorId } = req.query;
    let query = supabase.from('analysis_results').delete();
    if (instructorId) query = query.eq('instructor_id', instructorId);
    else query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    const { error } = await query;
    if (error) throw error;
    res.json({ message: "Analysis results cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Supabase Server is running on http://localhost:${PORT}`));
