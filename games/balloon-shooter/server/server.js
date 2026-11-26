// Balloon Shooter tracking server. Zero dependencies (Node 18+).
//   ADMIN_TOKEN=secret PORT=3000 node server/server.js
// Serves the game at /, collects events at POST /api/track, admin page at /admin.
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");

const PORT = +process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "data", "db.json");
const TOKEN = process.env.ADMIN_TOKEN || crypto.randomBytes(6).toString("hex");
const MAX_EVENTS = 50000;

// ---- JSON "database" ----
let db = { visitors: {}, visits: [], plays: [] };
try { db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) }; } catch {}
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
let dirty = false, saving = false;
function save() {
  if (!dirty || saving) return;
  dirty = false; saving = true;
  const tmp = DB_FILE + ".tmp";
  fs.writeFile(tmp, JSON.stringify(db), (e) => {
    if (!e) fs.rename(tmp, DB_FILE, () => { saving = false; });
    else saving = false;
  });
}
setInterval(save, 2000).unref();
process.on("SIGINT", () => { dirty = true; try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch {} process.exit(); });

// ---- helpers ----
const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
const num = (v, lo, hi) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, Math.round(+v))) : 0);
const device = (ua) => (/ipad|tablet/i.test(ua) ? "Tablet" : /mobi|android|iphone/i.test(ua) ? "Mobile" : "Desktop");
const hits = new Map(); // crude per-IP rate limit
function limited(ip) {
  const now = Date.now(), h = (hits.get(ip) || []).filter((t) => now - t < 60000);
  h.push(now); hits.set(ip, h); return h.length > 120;
}
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const send = (res, code, body, type = "application/json") => { res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store", ...cors }); res.end(typeof body === "string" ? body : JSON.stringify(body)); };

function track(body, req) {
  const vid = str(body.vid, 40).replace(/[^\w-]/g, ""); if (!vid) return false;
  const ua = str(req.headers["user-agent"], 300), now = new Date().toISOString();
  const v = (db.visitors[vid] ||= { id: vid, first: now, visits: 0, plays: 0, device: device(ua), ua: ua.slice(0, 120) });
  v.last = now;
  if (body.type === "visit") {
    v.visits++; db.visits.push({ vid, t: now, ref: str(body.ref, 200), device: v.device, lang: str(body.lang, 12), returning: v.visits > 1 });
    if (db.visits.length > MAX_EVENTS) db.visits.splice(0, db.visits.length - MAX_EVENTS);
  } else if (body.type === "play") {
    v.plays++; const o = body.opts || {};
    db.plays.push({ vid, t: now, mode: str(body.mode, 12), player: str(body.player, 30), group: num(body.group, 0, 9), score: num(body.score, 0, 100000), acc: num(body.acc, 0, 100), seconds: num(body.seconds, 0, 600),
      opts: Object.keys(o).filter((k) => o[k] === true).map((k) => k.slice(0, 12)).slice(0, 10) });
    if (db.plays.length > MAX_EVENTS) db.plays.splice(0, db.plays.length - MAX_EVENTS);
  } else return false;
  dirty = true; return true;
}

function stats() {
  const day = (t) => t.slice(0, 10), today = day(new Date().toISOString());
  const byDay = {}, by = (o, k) => (o[k] = (o[k] || 0) + 1);
  for (const x of db.visits) { const d = (byDay[day(x.t)] ||= { visits: 0, plays: 0 }); d.visits++; }
  for (const x of db.plays) { const d = (byDay[day(x.t)] ||= { visits: 0, plays: 0 }); d.plays++; }
  const modes = {}, opts = {}, devices = {}, players = {};
  for (const p of db.plays) {
    by(modes, p.mode); p.opts.forEach((o) => by(opts, o));
    const n = p.player || "?", r = (players[n] ||= { name: n, plays: 0, best: 0, total: 0 });
    r.plays++; r.total += p.score; r.best = Math.max(r.best, p.score);
  }
  Object.values(db.visitors).forEach((v) => by(devices, v.device));
  const scores = db.plays.map((p) => p.score);
  return {
    totals: { visitors: Object.keys(db.visitors).length, visits: db.visits.length, plays: db.plays.length,
      visitorsToday: new Set(db.visits.filter((v) => day(v.t) === today).map((v) => v.vid)).size,
      returning: Object.values(db.visitors).filter((v) => v.visits > 1).length,
      avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0, bestScore: Math.max(0, ...scores) },
    byDay, modes, opts, devices,
    players: Object.values(players).map((p) => ({ ...p, avg: Math.round(p.total / p.plays) })).sort((a, b) => b.best - a.best),
    visitors: Object.values(db.visitors).sort((a, b) => (b.last > a.last ? 1 : -1)).slice(0, 200),
    recentPlays: db.plays.slice(-100).reverse(),
  };
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png" };
http.createServer((req, res) => {
  const url = new URL(req.url, "http://x"), ip = req.socket.remoteAddress || "";
  if (req.method === "OPTIONS") return send(res, 204, "");
  if (url.pathname === "/api/track" && req.method === "POST") {
    if (limited(ip)) return send(res, 429, { ok: false });
    let raw = ""; req.on("data", (c) => { raw += c; if (raw.length > 4000) req.destroy(); });
    return req.on("end", () => { try { send(res, 200, { ok: track(JSON.parse(raw), req) }); } catch { send(res, 400, { ok: false }); } });
  }
  if (url.pathname === "/api/stats") {
    const t = req.headers["x-admin-token"] || "";
    const ok = t.length === TOKEN.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(TOKEN));
    return ok ? send(res, 200, stats()) : send(res, 401, { error: "unauthorized" });
  }
  // static files: game + admin page (never serve server/ or data)
  let p = url.pathname === "/" ? "/index.html" : url.pathname === "/admin" ? "/admin/admin.html" : decodeURIComponent(url.pathname);
  const file = path.normalize(path.join(p.startsWith("/admin/") ? __dirname : ROOT, p.startsWith("/admin/") ? p.slice(6) : p));
  const base = p.startsWith("/admin/") ? __dirname : ROOT;
  if (!file.startsWith(base) || (base === ROOT && file.startsWith(__dirname))) return send(res, 404, "Not found", "text/plain");
  fs.readFile(file, (e, data) => e ? send(res, 404, "Not found", "text/plain") : (res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" }), res.end(data)));
}).listen(PORT, () => console.log(`Balloon Shooter on http://localhost:${PORT}\nAdmin:  http://localhost:${PORT}/admin   token: ${TOKEN}\nDB:     ${DB_FILE}`));
