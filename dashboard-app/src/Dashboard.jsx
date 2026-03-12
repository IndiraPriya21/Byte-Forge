import React, { useState, useEffect } from "react";

const HISTORY_KEY = "cpc_scan_history";
const LIB_KEY = "cpc_plagiarism_library";

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeText(text) {
  return (text || "")
    .replace(/\r\n/g, "\n")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text) {
  const t = normalizeText(text);
  return t ? t.split(" ") : [];
}

function shingles(tokens, size = 5) {
  const set = new Set();
  for (let i = 0; i + size <= tokens.length; i++) {
    set.add(tokens.slice(i, i + size).join(" "));
  }
  return set;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

const fakeAssignments = [
  { id: 1, title: "Array Manipulation", course: "CS101", due: "2026-03-15" },
  { id: 2, title: "Graph Traversal", course: "CS201", due: "2026-03-20" },
  { id: 3, title: "Dynamic Programming", course: "CS301", due: "2026-03-25" },
];

const fakeSubmissions = [
  { id: 1, student: "Alex Johnson", assignment: "Array Manipulation", time: "2 mins ago" },
  { id: 2, student: "Priya Singh", assignment: "Graph Traversal", time: "10 mins ago" },
  { id: 3, student: "Diego Martínez", assignment: "Dynamic Programming", time: "35 mins ago" },
];

const fakeResults = [
  { id: 1, userA: "Alex Johnson", userB: "Priya Singh", similarity: 92 },
  { id: 2, userA: "Alex Johnson", userB: "Sam Lee", similarity: 68 },
  { id: 3, userA: "Priya Singh", userB: "Diego Martínez", similarity: 43 },
  { id: 4, userA: "Sam Lee", userB: "Taylor Reed", similarity: 18 },
];

function similarityClass(score) {
  if (score > 70) return "bg-red-500/10 text-red-400";
  if (score >= 40) return "bg-amber-500/10 text-amber-400";
  return "bg-emerald-500/10 text-emerald-400";
}

export default function Dashboard() {
  const [role, setRole] = useState("instructor"); // "instructor" | "student"
  const [showModal, setShowModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDeadline, setAssignmentDeadline] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [code, setCode] = useState("// Paste your solution here\n");
  const [history, setHistory] = useState([]);
  const [library, setLibrary] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);

  useEffect(() => {
    setHistory(safeJsonParse(localStorage.getItem(HISTORY_KEY), []));
    setLibrary(safeJsonParse(localStorage.getItem(LIB_KEY), []));
  }, []);

  const handleRunCheck = (e) => {
    e.preventDefault();
    const inputRaw = code.trim();
    if (!inputRaw) return;

    const inputTokens = words(inputRaw);
    const inputSet = shingles(inputTokens, 5);

    const scoredSources = library
      .map((src) => {
        const srcSet = shingles(words(src.text), 5);
        const sim = jaccard(inputSet, srcSet);
        return { ...src, sim };
      })
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 5);

    const top = scoredSources[0];
    const overall = top ? Math.round(top.sim * 100) : 0;

    const newScan = {
      text: inputRaw,
      similarity: overall,
      date: new Date().toISOString(),
      topSources: scoredSources.map(s => ({ title: s.title, sim: Math.round(s.sim * 100) }))
    };

    const newHistory = [newScan, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    setCurrentResult(newScan);
    setShowResults(true);
  };

  const handleSubmitCode = (e) => {
    e.preventDefault();
    const inputRaw = code.trim();
    if (!inputRaw) return;

    const newSubmission = {
      id: `lib-${Date.now()}`,
      title: `Submission • ${new Date().toLocaleString()}`,
      text: inputRaw,
      date: new Date().toISOString()
    };

    const newLibrary = [newSubmission, ...library];
    setLibrary(newLibrary);
    localStorage.setItem(LIB_KEY, JSON.stringify(newLibrary));
    
    alert("Code stored in library and submitted for analysis.");
    handleRunCheck(e);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-950/70 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <img src="/Logo.png" className="h-9 w-9 object-contain" alt="Logo" />
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Code</div>
            <div className="text-sm font-semibold text-slate-100">Trace</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <button className="w-full flex items-center gap-2 rounded-xl px-3 py-2 bg-slate-800 text-slate-50 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Dashboard
          </button>
          <button className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-300 hover:bg-slate-900/80">
            <span className="h-1 w-1 rounded-full bg-slate-500"></span>
            Assignments
          </button>
          <button className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-300 hover:bg-slate-900/80">
            <span className="h-1 w-1 rounded-full bg-slate-500"></span>
            Reports
          </button>
        </nav>

        <div className="px-5 py-4 text-[11px] text-slate-500 border-t border-slate-800">
          CodeTrace - Advanced Code Integrity.
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRole("instructor")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                role === "instructor"
                  ? "bg-indigo-500 text-white border-indigo-400"
                  : "bg-slate-900 border-slate-700 text-slate-300"
              }`}
            >
              Instructor view
            </button>
            <button
              onClick={() => setRole("student")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                role === "student"
                  ? "bg-indigo-500 text-white border-indigo-400"
                  : "bg-slate-900 border-slate-700 text-slate-300"
              }`}
            >
              Student view
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Role</div>
              <div className="text-sm font-medium text-slate-100 capitalize">{role}</div>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700 hover:bg-slate-900">
                Logout
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center text-xs font-semibold text-slate-950">
                U
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 px-4 sm:px-8 py-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
          {role === "instructor" ? (
            <InstructorView
              showResults={showResults}
              onRunCheck={handleRunCheck}
              onOpenModal={() => setShowModal(true)}
              library={library}
              history={history}
              currentResult={currentResult}
            />
          ) : (
            <StudentView 
              code={code} 
              setCode={setCode} 
              onSubmitCode={handleSubmitCode}
              history={history.filter(h => h.text === code)} // simplified filter for current student
            />
          )}
        </main>
      </div>

      {/* Assignment modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-50">Create new assignment</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                <input
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Recursion Practice"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Deadline</label>
                <input
                  type="date"
                  value={assignmentDeadline}
                  onChange={(e) => setAssignmentDeadline(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-xs rounded-full border border-slate-700 text-slate-300 hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // In a real app, persist new assignment
                  setShowModal(false);
                  setAssignmentTitle("");
                  setAssignmentDeadline("");
                }}
                className="px-3 py-1.5 text-xs rounded-full bg-indigo-500 text-white font-medium hover:bg-indigo-400"
              >
                Save assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InstructorView({ showResults, onRunCheck, onOpenModal, library, history, currentResult }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total library items" value={library.length} trend="Internal database" />
        <StatCard label="Recent scans" value={history.length} trend="Analysis history" tone="warning" />
        <StatCard label="Active assignments" value="3" trend="Demo assignments" tone="muted" />
      </section>

      {/* Main row */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)] items-start">
        {/* Assignments + create */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">Assignments</h2>
              <p className="text-xs text-slate-400">Manage what students are submitting to.</p>
            </div>
            <button
              onClick={onOpenModal}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-indigo-500/40 hover:bg-indigo-400"
            >
              <span className="text-base leading-none">+</span>
              New
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {fakeAssignments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2.5"
              >
                <div>
                  <div className="font-medium text-slate-100">{a.title}</div>
                  <div className="text-[11px] text-slate-400">
                    {a.course} • Due {a.due}
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                  Open
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Submissions + run check */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">Library Items</h2>
              <p className="text-xs text-slate-400">Stored code snippets for comparison.</p>
            </div>
            <button
              onClick={onRunCheck}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 hover:bg-emerald-400"
            >
              Check Code
            </button>
          </div>

          <div className="overflow-x-auto text-sm">
            <table className="min-w-full border-separate border-spacing-y-1">
              <tbody className="divide-y divide-slate-800/50">
                {library.slice(0, 5).map((lib) => (
                  <tr key={lib.id} className="group">
                    <td className="py-2.5 px-3 rounded-l-xl bg-slate-900/40 text-slate-100 font-medium">
                      {lib.title}
                    </td>
                    <td className="py-2.5 px-3 bg-slate-900/40 text-slate-400 text-xs">
                      {new Date(lib.date || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 rounded-r-xl bg-slate-900/40 text-right">
                      <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!library.length && (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-slate-500">No items in library.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Results overlay or section */}
      {showResults && currentResult && (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-50">Analysis Result</h2>
          <div className="flex items-center gap-6">
            <div className={`h-20 w-20 rounded-full border-4 flex items-center justify-center text-xl font-bold ${similarityClass(currentResult.similarity)} border-current`}>
              {currentResult.similarity}%
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-medium text-slate-200">Top Similarity Sources</h3>
              <div className="grid gap-2">
                {currentResult.topSources.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60">
                    <span className="text-slate-300">{s.title}</span>
                    <span className="font-bold text-slate-100">{s.sim}%</span>
                  </div>
                ))}
                {!currentResult.topSources.length && <div className="text-xs text-slate-500">No matches found in library.</div>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, trend, tone }) {
  const ring =
    tone === "warning"
      ? "ring-1 ring-amber-500/40"
      : tone === "muted"
      ? "ring-1 ring-slate-500/30"
      : "ring-1 ring-emerald-500/40";

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 flex flex-col justify-between ${ring}`}
    >
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-50">{value}</div>
      <div className="mt-1 text-[11px] text-slate-400">{trend}</div>
    </div>
  );
}

function StudentView({ code, setCode, onSubmitCode, history }) {
  const latestScan = history && history[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Editor section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-50">Submit solution</h2>
          <span className="text-[11px] text-slate-500 uppercase tracking-widest">Editor</span>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-[400px] rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          placeholder="// Paste your code here..."
        ></textarea>
        <div className="flex justify-end">
          <button
            onClick={onSubmitCode}
            className="rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400"
          >
            Submit for analysis
          </button>
        </div>
      </div>

      {/* Side info */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-50">Latest Scan</h2>
          {latestScan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Similarity Score</span>
                <span className={`text-lg font-bold ${similarityClass(latestScan.similarity)}`}>
                  {latestScan.similarity}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full ${latestScan.similarity > 70 ? 'bg-red-500' : latestScan.similarity > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${latestScan.similarity}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {latestScan.similarity > 70 
                  ? "High similarity detected. Your code might be flagged for review."
                  : latestScan.similarity > 40 
                  ? "Moderate similarity. Consider revising your implementation."
                  : "Low similarity. Your code appears to be original."}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No scans yet. Submit your code to see results.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-3">
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Guidelines</h2>
          <ul className="space-y-2 text-[11px] text-slate-500 list-disc pl-4">
            <li>Ensure all logic is original</li>
            <li>Cite external sources if used</li>
            <li>Submit before the deadline</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
