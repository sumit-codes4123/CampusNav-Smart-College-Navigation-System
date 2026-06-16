// controllers/aiController.js
// AI Assistant for CampusNav — 100% offline, no paid APIs
// Uses Fuse.js fuzzy search + synonym mapping + NLP keyword extraction

const Location = require('../models/Location');

// ─── SYNONYM DICTIONARY ───────────────────────────────────────────────────────
// Maps natural language phrases → canonical search keywords
// Add more entries here to improve understanding over time
const SYNONYMS = {
  // HOD / Head of Department
  'hod':                    ['hod', 'head of department'],
  'head of department':     ['hod', 'head of department'],
  'department head':        ['hod', 'head of department'],
  'head':                   ['hod', 'head of department'],

  // Principal
  'principal':              ['principal'],
  'principal office':       ['principal'],
  'principal cabin':        ['principal'],
  'vice principal':         ['vice principal'],

  // Canteen / Food
  'canteen':                ['canteen', 'food', 'cafeteria'],
  'cafeteria':              ['canteen', 'cafeteria'],
  'food':                   ['canteen', 'food', 'cafeteria'],
  'mess':                   ['canteen', 'cafeteria', 'mess'],
  'eat':                    ['canteen', 'food'],
  'lunch':                  ['canteen', 'food', 'lunch'],
  'snacks':                 ['canteen', 'snacks'],

  // Library
  'library':                ['library', 'books', 'reading'],
  'lib':                    ['library'],
  'reading room':           ['library', 'reading room'],
  'books':                  ['library', 'books'],

  // Labs
  'lab':                    ['lab', 'laboratory'],
  'laboratory':             ['lab', 'laboratory'],
  'computer lab':           ['computer lab', 'cse lab'],
  'cse lab':                ['cse lab', 'computer lab', 'programming lab'],
  'ai lab':                 ['ai lab', 'artificial intelligence lab'],
  'artificial intelligence lab': ['ai lab', 'artificial intelligence'],
  'ml lab':                 ['machine learning', 'ml lab'],
  'physics lab':            ['physics lab', 'science lab'],
  'chemistry lab':          ['chemistry lab'],
  'ece lab':                ['ece lab', 'electronics lab'],
  'electronics lab':        ['electronics lab', 'ece lab', 'circuits lab'],

  // Placement / Training
  'placement':              ['placement', 'training and placement', 'tpo'],
  'placement cell':         ['placement', 'training and placement'],
  'tpo':                    ['placement', 'tpo', 'training placement officer'],
  'training and placement': ['placement', 'training and placement'],

  // Examination
  'exam':                   ['exam', 'examination'],
  'examination':            ['examination', 'exam'],
  'exam office':            ['exam', 'examination', 'controller'],
  'hall ticket':            ['examination', 'hall ticket'],
  'result':                 ['examination', 'result'],

  // Faculty / Professor
  'professor':              ['professor', 'faculty', 'prof'],
  'faculty':                ['faculty', 'professor', 'teacher'],
  'teacher':                ['faculty', 'teacher'],
  'cabin':                  ['office', 'room', 'cabin'],
  'room':                   ['room'],
  'office':                 ['office'],

  // Departments
  'cse':                    ['cse', 'computer science', 'computer science engineering'],
  'computer science':       ['cse', 'computer science'],
  'ece':                    ['ece', 'electronics', 'electronics and communication'],
  'electronics':            ['ece', 'electronics'],
  'eee':                    ['eee', 'electrical engineering'],
  'mech':                   ['mechanical', 'mech'],
  'mechanical':             ['mechanical', 'mech'],
  'civil':                  ['civil engineering', 'civil'],
  'it':                     ['it', 'information technology'],
  'maths':                  ['mathematics', 'maths'],
  'mathematics':            ['mathematics', 'maths'],
  'physics':                ['physics'],
  'chemistry':              ['chemistry'],

  // General navigation
  'where':                  [],   // filler — stripped
  'find':                   [],
  'show':                   [],
  'locate':                 [],
  'visit':                  [],
  'go to':                  [],
  'need':                   [],
  'want':                   [],
  'looking for':            [],
  'tell me':                [],
  'how to reach':           [],
  'can you tell':           [],
  'please':                 [],
  'i want':                 [],
  'i need':                 [],
  'take me to':             [],
};

// ─── STOP WORDS — stripped before search ─────────────────────────────────────
const STOP_WORDS = new Set([
  'the','is','are','was','were','a','an','in','on','at','to','of','for','and',
  'or','but','with','by','from','as','this','that','it','be','do','can','could',
  'where','find','show','locate','visit','need','want','please','how','me','my',
  'tell','get','reach','go','i','you','your','we','our','they','their','its',
]);

// ─── KEYWORD EXTRACTOR ────────────────────────────────────────────────────────
// Pulls meaningful tokens from a natural language query
function extractKeywords(query) {
  const q = query.toLowerCase().trim();
  const extracted = new Set();

  // 1. Check multi-word phrases first (longer matches take priority)
  const sortedPhrases = Object.keys(SYNONYMS).sort((a, b) => b.length - a.length);
  let remaining = q;

  for (const phrase of sortedPhrases) {
    if (remaining.includes(phrase)) {
      const synonyms = SYNONYMS[phrase];
      synonyms.forEach(s => s && extracted.add(s));
      remaining = remaining.replace(phrase, ' ');
    }
  }

  // 2. Single word pass on what remains
  remaining.split(/\s+/).forEach(word => {
    word = word.replace(/[^a-z0-9]/g, '');
    if (!word || STOP_WORDS.has(word)) return;
    extracted.add(word);
    if (SYNONYMS[word]) SYNONYMS[word].forEach(s => s && extracted.add(s));
  });

  return [...extracted].filter(Boolean);
}

// ─── SCORE A LOCATION against extracted keywords ──────────────────────────────
function scoreLocation(loc, keywords) {
  const targets = [
    loc.name.toLowerCase(),
    loc.type.toLowerCase(),
    loc.department ? loc.department.toLowerCase() : '',
    loc.description ? loc.description.toLowerCase() : '',
    loc.block ? loc.block.toLowerCase() : '',
    ...(loc.keywords || []).map(k => k.toLowerCase()),
  ].join(' ');

  let score = 0;
  for (const kw of keywords) {
    if (targets.includes(kw)) {
      // Exact keyword match in name = highest score
      if (loc.name.toLowerCase().includes(kw)) score += 10;
      // Match in keywords array
      else if ((loc.keywords || []).some(k => k.toLowerCase().includes(kw))) score += 7;
      // Match in department
      else if (loc.department && loc.department.toLowerCase().includes(kw)) score += 6;
      // Match in description
      else if (loc.description && loc.description.toLowerCase().includes(kw)) score += 3;
      // Match in block or type
      else score += 2;
    }
  }
  return score;
}

// ─── FUSE.JS FUZZY SEARCH (loaded lazily from npm) ───────────────────────────
// Handles typos: "cannteen" → "canteen", "Profesor" → "Professor"
async function fuseSearch(query, locations) {
  try {
    const Fuse = require('fuse.js');
    const fuse = new Fuse(locations, {
      keys: [
        { name: 'name',        weight: 0.5 },
        { name: 'keywords',    weight: 0.3 },
        { name: 'department',  weight: 0.15 },
        { name: 'description', weight: 0.05 },
      ],
      threshold:        0.45,   // 0=exact, 1=match anything
      includeScore:     true,
      minMatchCharLength: 2,
      ignoreLocation:   true,
    });
    return fuse.search(query).map(r => ({ ...r.item.toObject(), _fuseScore: r.score }));
  } catch (e) {
    // Fuse.js not installed — graceful fallback
    return [];
  }
}

// ─── MAIN AI SEARCH HANDLER ───────────────────────────────────────────────────
// POST /api/ai/search
// Body: { query: "Where is the HOD of CSE?" }
const aiSearch = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    // Fetch all locations (small dataset — fine to load in memory)
    const allLocations = await Location.find().select('-__v');

    if (!allLocations.length) {
      return res.status(200).json({ success: false, message: 'No locations in database yet' });
    }

    // ── Step 1: Keyword extraction + synonym expansion ──────────────────────
    const keywords = extractKeywords(query);

    // ── Step 2: Score every location against extracted keywords ─────────────
    const scored = allLocations
      .map(loc => ({ loc, score: scoreLocation(loc, keywords) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    // ── Step 3: If keyword scoring found results, return top match ───────────
    if (scored.length > 0) {
      const topScore = scored[0].score;
      // Return all results with score within 60% of the best (for "show all" list)
      const relevant = scored
        .filter(item => item.score >= topScore * 0.4)
        .slice(0, 5)
        .map(item => item.loc);

      return res.status(200).json({
        success:   true,
        method:    'keyword',
        query:     query,
        keywords:  keywords,
        count:     relevant.length,
        location:  relevant[0],        // best single match
        locations: relevant,           // all relevant matches
      });
    }

    // ── Step 4: Fallback — Fuse.js fuzzy search on raw query ─────────────────
    const fuzzyResults = await fuseSearch(query, allLocations);
    if (fuzzyResults.length > 0) {
      return res.status(200).json({
        success:   true,
        method:    'fuzzy',
        query:     query,
        keywords:  keywords,
        count:     Math.min(fuzzyResults.length, 3),
        location:  fuzzyResults[0],
        locations: fuzzyResults.slice(0, 3),
      });
    }

    // ── Step 5: Nothing found ────────────────────────────────────────────────
    return res.status(200).json({
      success:  false,
      method:   'none',
      query:    query,
      keywords: keywords,
      message:  "Sorry, I couldn't find that location. Try different keywords.",
    });

  } catch (error) {
    console.error('AI Search Error:', error.message);
    res.status(500).json({ success: false, message: 'AI search error', error: error.message });
  }
};

module.exports = { aiSearch };
