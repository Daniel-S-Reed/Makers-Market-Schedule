/* shared.js — used by index.html (sign-up) and manager.html.
   Holds: time helpers, the original schedule (used to set up the first event),
   the data connection (Firebase, or a preview store in this browser), and the PDF / calendar exports.
   Pages define a global `state` with `claims` (slotId -> {name,...}) before calling the exports. */

/* ---------- small helpers ---------- */
const T = s => { const m = s.match(/(\d+):(\d+)\s*(a|p)/i); let h = +m[1] % 12; if (m[3].toLowerCase() === "p") h += 12; return h * 60 + +m[2]; };
const pad = n => String(n).padStart(2, "0");
const fmt = m => { let h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + pad(mm) + " " + ap; };
const toHM = m => pad(Math.floor(m / 60)) + ":" + pad(m % 60);          // for <input type=time>
const fromHM = s => { const [h, m] = String(s || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
const norm = s => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
const slug = s => String(s).replace(/['’]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const uid8 = () => Math.random().toString(36).slice(2, 10);
const range = sh => fmt(sh.start) + " – " + fmt(sh.end);
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function toast(msg, undo) {
  let host = document.getElementById("toastHost"); if (!host) { host = el("div"); host.id = "toastHost"; document.body.append(host); }
  host.textContent = ""; const t = el("div", "toast"); t.setAttribute("role", "status"); t.append(el("span", null, msg));
  if (undo) { const b = el("button", null, "Undo"); b.onclick = () => { host.textContent = ""; undo(); }; t.append(b); }
  host.append(t); clearTimeout(toast._t); toast._t = setTimeout(() => { host.textContent = ""; }, 6000);
}
function saveBlob(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }

/* ---------- the original planning document, as a starting setup ---------- */
const S = (n, r, p) => Array.from({ length: n }, (_, i) => ({ role: r, key: p + (i + 1) }));
const TXT = {
  LOAD: "Help with the two hand trucks/carts and make sure cars are spaced out well and move once unloaded. Help vendors get their items to their tables, find their tables, and know where the bathrooms are. Vendors pull straight up on 12th Street and exit by the back alley to 11th Street to park in the parking deck.",
  FLOAT: "Vendor floaters: check whether vendors need a break (someone to cover their station), water, or directions to the restroom. They may also help guests but must make sure every vendor has been asked. Guest floaters: check whether guests need the bathroom or help finding something, and encourage them to visit vendors.",
  ENTR: "Direct people to the main event and keep extra badges on hand.",
  MAIN: "Keep count of how many people attend and make sure everyone gets a badge sticker. 10-minute overlap with the next shift.",
  BREAK: "Line up cars in order and safely outside. Help vendors with the hand trucks/carts. As vendor tables clear, wipe them down, break them down and stack them on racks. Each vendor group gets 15 minutes; we suggest they pack at their station and load everything on the cart at once."
};
const DEFAULT_SETUP = {
  name: "Holiday Maker's Market", date: "", location: "",
  areas: [
    { key: "craft", label: "Craft Fair", color: "#7a4fb0" },
    { key: "checkin", label: "Main Check-In", color: "#1f6fa8" },
    { key: "food", label: "Food Trucks", color: "#b4561c" },
    { key: "float", label: "Floaters", color: "#1f7a5a" },
    { key: "way", label: "Wayfinding", color: "#9c3d6e" }
  ],
  shifts: [
    ["s01", "craft", "Set-Up Checklist & Early Arrival", "7:30a", "8:00a", "Put out loading signs on 12th. Make sure the Shaff Mac is ready to go and labeled.", S(1, "Staff", "st")],
    ["s02", "food", "Set-Up Checklist & Early Arrival", "7:30a", "8:00a", "Put out street closure signs and barricades at the circular driveway. Make sure ADA signs are on the reserved parking spaces. Put out cones marking where food trucks pull up. Pull out the podium for the check-in/greet spot.", S(2, "Staff", "st")],
    ["s03", "craft", "Craft Vendor Loading & Set-Up", "8:00a", "9:00a", TXT.LOAD, [...S(2, "Inside · staff", "in"), ...S(2, "Inside · volunteer", "iv"), ...S(1, "Outside · staff", "out")]],
    ["s04", "checkin", "Check-In Early Set-Up", "8:00a", "8:20a", "Set up and move tables outside in the morning for check-in. Needs 1–2 people.", [{ role: "Staff", key: "st1" }, { role: "Staff (if available)", key: "st2" }]],
    ["s05", "food", "Food Truck Check-In & Close Off Grace Hopper", "8:00a", "8:30a", "Move signs to close the street once the trucks are in. Check in food trucks and place them at the coned spots. Move cones if needed to get the food trailer's truck out of the driveway.", S(2, "Staff", "st")],
    ["s06", "craft", "Craft Vendor Loading & Set-Up", "9:00a", "10:00a", TXT.LOAD, [...S(2, "Inside · staff", "in"), ...S(2, "Inside · volunteer", "iv"), ...S(1, "Outside · staff", "out")]],
    ["s07", "craft", "Craft Fair “Babysitter”", "10:00a", "11:00a", "Stay on site at the craft fair in case vendors have more questions. At least one staff member.", S(2, "Staff", "st")],
    ["s08", "checkin", "Final Check-In Set-Up", "10:00a", "10:30a", "Whatever it takes to be ready to receive guests. Needs 1–2 people.", [{ role: "Staff", key: "st1" }, { role: "Volunteer", key: "v1" }]],
    ["s09", "float", "Floater Shift 1", "10:00a", "11:00a", TXT.FLOAT, [...S(2, "Guest floater", "g"), ...S(2, "Vendor floater", "v")]],
    ["s10", "food", "Food Truck Set-Up Check-In", "10:15a", "10:35a", "Check in with each food truck and make sure they are ready to serve.", S(1, "Staff", "st")],
    ["s11", "checkin", "Early Bird Greeting & Check-In", "10:30a", "11:00a", "Greet early arrivals and start check-in.", [...S(2, "Staff", "st"), { role: "Volunteer", key: "v1" }]],
    ["s12", "way", "Entrance Check-In & Welcome", "10:30a", "10:55a", TXT.ENTR, S(1, "Staff", "st")],
    ["s13", "way", "Entrance Check-In & Welcome", "10:55a", "11:30a", TXT.ENTR, S(1, "Staff", "st")],
    ["s14", "checkin", "Main Check-In 1", "11:00a", "12:30p", TXT.MAIN, [...S(2, "Staff", "st"), { role: "Volunteer", key: "v1" }]],
    ["s15", "float", "Floater Shift 2", "11:00a", "12:00p", TXT.FLOAT, [...S(2, "Guest floater", "g"), ...S(2, "Vendor floater", "v")]],
    ["s16", "way", "Entrance Check-In & Welcome", "11:30a", "12:00p", TXT.ENTR, S(1, "Staff", "st")],
    ["s17", "float", "Floater Shift 3", "12:00p", "1:00p", TXT.FLOAT, [...S(2, "Guest floater", "g"), ...S(2, "Vendor floater", "v")]],
    ["s18", "way", "Entrance Check-In & Welcome", "12:00p", "12:30p", TXT.ENTR, S(1, "Staff", "st")],
    ["s19", "checkin", "Main Check-In 2", "12:20p", "1:40p", TXT.MAIN, [...S(2, "Staff", "st"), { role: "Volunteer", key: "v1" }]],
    ["s20", "way", "Entrance Check-In & Welcome", "12:30p", "1:00p", TXT.ENTR, S(1, "Staff", "st")],
    ["s21", "float", "Floater Shift 4", "1:00p", "2:00p", TXT.FLOAT, [...S(2, "Guest floater", "g"), ...S(2, "Vendor floater", "v")]],
    ["s22", "way", "Entrance Check-In & Welcome", "1:00p", "1:30p", TXT.ENTR, S(1, "Staff", "st")],
    ["s23", "checkin", "Main Check-In 3", "1:30p", "3:00p", TXT.MAIN, [...S(2, "Staff", "st"), { role: "Volunteer", key: "v1" }]],
    ["s24", "way", "Entrance Check-In & Welcome", "1:30p", "2:00p", TXT.ENTR, S(1, "Staff", "st")],
    ["s25", "float", "Floater Shift 5", "2:00p", "3:00p", TXT.FLOAT, [...S(2, "Guest floater", "g"), ...S(2, "Vendor floater", "v")]],
    ["s26", "way", "Entrance Check-In & Welcome", "2:00p", "2:30p", TXT.ENTR, S(1, "Staff", "st")],
    ["s27", "way", "Entrance Check-In & Welcome", "2:30p", "3:00p", TXT.ENTR, S(1, "Staff", "st")],
    ["s28", "craft", "Craft Vendor Breakdown", "3:00p", "4:00p", TXT.BREAK, [...S(4, "Inside · staff", "in"), ...S(2, "Outside · volunteer", "ov")]],
    ["s29", "food", "Food Truck Breakdown Check-In", "3:00p", "3:20p", "Check on each truck's breakdown needs and expected departure time. Pass those needs on to the next shift if it's a different person.", S(1, "Staff", "st")],
    ["s30", "food", "Food Truck Exit Assist", "3:20p", "4:05p", "Coordinate moving the lane closure signs and trucks leaving the driveway around pedestrian traffic and parking-deck exit traffic.", S(2, "Staff", "st")],
    ["s31", "craft", "Overflow Unload (just in case)", "4:00p", "4:35p", TXT.BREAK, [...S(2, "Staff", "st"), { role: "Volunteer", key: "v1" }]]
  ].map(([id, a, t, s, e, d, slots]) => ({ id, a, t, start: T(s), end: T(e), d, slots })),
  vendors: {
    perWindow: 5, deadline: T("10:30a"),
    setup: [["8:00a", "8:20a"], ["8:20a", "8:40a"], ["8:40a", "9:00a"], ["9:00a", "9:20a"], ["9:20a", "9:40a"]].map(([s, e]) => ({ start: T(s), end: T(e) })),
    unload: [["3:00p", "3:15p"], ["3:15p", "3:30p"], ["3:30p", "3:45p"], ["3:45p", "4:00p"], ["4:00p", "4:15p"]].map(([s, e]) => ({ start: T(s), end: T(e) })),
    note: "Vendors pull straight up on 12th Street and exit by the back alley to 11th Street."
  },
  agenda: [
    ["7:30a", "8:00a", "Reservation start / organizer arrival"],
    ["8:00a", "10:30a", "Food truck & craft vendor set-up start"],
    ["10:30a", "11:00a", "Food truck & craft vendor set-up deadline"],
    ["11:00a", "3:00p", "Main event start: open to the public"],
    ["3:00p", "4:00p", "Main event end: vendor breakdown begins"],
    ["4:00p", "5:00p", "4:00 All vendor tables broken down; load tables & chairs, wipe down. 4:05 ES cleaning starts"]
  ].map(([s, e, text]) => ({ start: T(s), end: T(e), text })),
  footnote: "Floaters also act as evacuation directors: the floater group carries the megaphones to direct each event section to its evacuation location in an emergency."
};
/* names already assigned in the original document */
const SEED = { "s01-st1": "Lynsey Steinberg", "s02-st1": "Aidan Manahan", "s02-st2": "Aaron Cummings", "s03-in1": "Lynsey Steinberg", "s03-in2": "Janiyah Smith",
  "s05-st1": "Aidan Manahan", "s05-st2": "Aaron Cummings", "s06-in1": "Lynsey Steinberg", "s06-in2": "Aidan Manahan", "s07-st1": "Lynsey Steinberg", "s08-st1": "Janiyah Smith",
  "s09-v1": "Nayaab Sanjish", "s09-v2": "Daniel Reed", "s10-st1": "Aidan Manahan", "s11-st1": "Anna Freeman", "s12-st1": "Katirah Johnson", "s13-st1": "Katirah Johnson",
  "s14-st1": "Nayaab Sanjish", "s14-st2": "Anna Freeman", "s15-g1": "Amanda Richardson", "s15-g2": "Aidan Manahan", "s15-v1": "Lynsey Steinberg", "s15-v2": "Aaron Cummings",
  "s16-st1": "Katirah Johnson", "s17-v1": "Lynsey Steinberg", "s17-v2": "Aidan Manahan", "s19-st1": "Daniel Reed", "s21-v1": "Brooke Childers", "s21-v2": "Nayaab Sanjish",
  "s25-g1": "Nayaab Sanjish", "s25-g2": "Katirah Johnson", "s25-v1": "Brooke Childers", "s25-v2": "Aidan Manahan", "s28-in1": "Lynsey Steinberg", "s28-in2": "Brooke Childers",
  "s29-st1": "Aidan Manahan", "s30-st1": "Aidan Manahan", "s30-st2": "Aaron Cummings", "s31-st1": "Lynsey Steinberg" };

/* ---------- the event currently loaded (set by applyEvent) ---------- */
let EV = null, AREAS = {}, AREA_ORDER = [], SHIFTS = [];
function applyEvent(ev) {
  EV = ev;
  AREA_ORDER = (ev.areas || []).map(a => a.key);
  AREAS = {}; (ev.areas || []).forEach(a => AREAS[a.key] = { label: a.label, color: a.color || "#5d6470" });
  SHIFTS = (ev.shifts || []).filter(s => AREAS[s.a]).slice()
    .sort((a, b) => a.start - b.start || AREA_ORDER.indexOf(a.a) - AREA_ORDER.indexOf(b.a));
}
const slotId = (sh, sl) => sh.id + "-" + sl.key;
const claimOf = id => state.claims[id];
function dateLabel() {
  if (!EV || !EV.date) return "";
  const [y, mo, d] = EV.date.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
const team = sh => sh.slots.map(sl => { const c = claimOf(slotId(sh, sl)); return sl.role + ": " + (c ? c.name : "open"); }).join("\n");
function assignments() {
  const by = {};
  SHIFTS.forEach(sh => sh.slots.forEach(sl => { const c = claimOf(slotId(sh, sl)); if (!c) return; const k = norm(c.name); (by[k] = by[k] || { name: c.name, items: [] }).items.push({ sh, sl }); }));
  return Object.values(by).sort((a, b) => a.name.localeCompare(b.name));
}
function vendorSummary() {
  const v = (EV && EV.vendors) || {}, list = w => (w || []).map(x => fmt(x.start).replace(/ [AP]M/, "")).join(", ");
  const out = [];
  if ((v.setup || []).length) out.push("Set-up: " + list(v.setup) + (v.deadline != null ? ". All vendors set up by " + fmt(v.deadline) + "." : ""));
  if ((v.unload || []).length) out.push("Unload: " + list(v.unload) + ".");
  return out;
}

/* ---------- data connection ---------- */
const P = {
  current: "hm_config/current",
  events: "hm_events",
  ev: id => "hm_events/" + id,
  slots: id => "hm_events/" + id + "/slots",
  log: id => "hm_events/" + id + "/log"
};
function connectData() {
  const cfg = window.FIREBASE_CONFIG;
  if (!window.firebase || !cfg || !cfg.apiKey || /PASTE/.test(cfg.apiKey)) return previewConn();
  return liveConn(cfg);
}
/* Preview: everything lives in this browser's storage so both pages can be tried before Firebase is set up. */
function previewConn() {
  const KEY = "hm-preview-db", subs = new Set(), userSubs = new Set();
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} subs.forEach(f => f()); };
  window.addEventListener("storage", e => { if (e.key === KEY) subs.forEach(f => f()); if (e.key === "hm-preview-mgr") userSubs.forEach(f => f()); });
  const parent = p => p.split("/").slice(0, -1).join("/");
  let uid; try { uid = localStorage.getItem("hm-preview-uid") || ("p" + uid8()); localStorage.setItem("hm-preview-uid", uid); } catch (e) { uid = "p" + uid8(); }
  const isMgr = () => { try { return localStorage.getItem("hm-preview-mgr") === "1"; } catch (e) { return false; } };
  const user = () => ({ uid, isManager: isMgr(), email: isMgr() ? "preview manager" : "" });
  const sub = f => { subs.add(f); f(); return () => subs.delete(f); };
  return {
    preview: true,
    db: {
      get: async p => { const v = load()[p]; return v ? JSON.parse(JSON.stringify(v)) : null; },
      onDoc: (p, f) => sub(() => { const v = load()[p]; f(v ? JSON.parse(JSON.stringify(v)) : null); }),
      onCol: (c, f) => sub(() => { const d = load(); f(Object.keys(d).filter(k => parent(k) === c).map(k => ({ id: k.split("/").pop(), data: d[k] }))); }),
      commit: async ops => { const d = load(); ops.forEach(o => { if (o.op === "set") d[o.path] = o.data; else if (o.op === "delete") delete d[o.path]; else if (o.op === "add") d[o.coll + "/" + uid8() + uid8()] = o.data; }); save(d); }
    },
    onUser: f => { const g = () => f(user()); userSubs.add(g); g(); },
    signIn: async pw => { if (!pw) throw { code: "auth/missing-password" }; try { localStorage.setItem("hm-preview-mgr", "1"); } catch (e) {} userSubs.forEach(f => f()); },
    signOut: async () => { try { localStorage.removeItem("hm-preview-mgr"); } catch (e) {} userSubs.forEach(f => f()); },
    managerEmail: "preview manager"
  };
}
/* Live: Firebase. Volunteers are signed in anonymously and invisibly; the manager signs in with the manager email + password. */
function liveConn(cfg) {
  firebase.initializeApp(cfg);
  const auth = firebase.auth(), fs = firebase.firestore();
  const mgrEmail = (window.MANAGER_EMAIL || "").trim().toLowerCase();
  return {
    preview: false,
    db: {
      get: async p => { const s = await fs.doc(p).get(); return s.exists ? s.data() : null; },
      onDoc: (p, f, err) => fs.doc(p).onSnapshot(s => f(s.exists ? s.data() : null), err || (() => {})),
      onCol: (c, f, err) => fs.collection(c).onSnapshot(s => f(s.docs.map(d => ({ id: d.id, data: d.data() }))), err || (() => {})),
      commit: async ops => {
        for (let i = 0; i < ops.length; i += 450) {
          const b = fs.batch();
          ops.slice(i, i + 450).forEach(o => {
            if (o.op === "set") b.set(fs.doc(o.path), o.data);
            else if (o.op === "delete") b.delete(fs.doc(o.path));
            else if (o.op === "add") b.set(fs.collection(o.coll).doc(), o.data);
          });
          await b.commit();
        }
      }
    },
    onUser: f => auth.onAuthStateChanged(u => {
      if (!u) { auth.signInAnonymously().catch(() => f(null)); return; }
      const email = (u.email || "").toLowerCase();
      f({ uid: u.uid, email, isManager: !u.isAnonymous && !!mgrEmail && email === mgrEmail });
    }),
    signIn: pw => auth.signInWithEmailAndPassword(mgrEmail, pw),
    signOut: () => auth.signOut(),
    managerEmail: mgrEmail
  };
}
/* calls cb(eventId, eventDoc) now and whenever the current event or its setup changes */
function watchCurrentEvent(db, cb) {
  let unsub = null;
  db.onDoc(P.current, c => {
    const id = c && c.eventId; if (unsub) { unsub(); unsub = null; }
    if (!id) { cb(null, null); return; }
    unsub = db.onDoc(P.ev(id), ev => cb(id, ev));
  });
}

/* ---------- PDFs ---------- */
const PINE = [31, 90, 61], INK = [24, 36, 29], MUTED = [91, 106, 96], RED = [163, 36, 59];
const hexRGB = h => { const m = String(h || "#5d6470").replace("#", ""); return [0, 2, 4].map(i => parseInt(m.slice(i, i + 2), 16) || 0); };
const tint = (c, a) => c.map(v => Math.round(255 - (255 - v) * a));
function pdfReady() { if (!window.jspdf || !window.jspdf.jsPDF) { toast("The PDF tool didn't load. Reload the page and try again."); return false; } return true; }
function drawHeader(doc, title) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...PINE);
  doc.text(EV.name.toUpperCase() + (EV.date ? "  ·  " + dateLabel().toUpperCase() : ""), 48, 54);
  doc.setFontSize(20); doc.setTextColor(...INK); doc.text(title, 48, 80);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...MUTED);
  if (EV.location) doc.text(EV.location, 48, 96);
  return EV.location ? 116 : 104;
}
function newPdf(title) { const doc = new window.jspdf.jsPDF({ unit: "pt", format: "letter" }); return { doc, y: drawHeader(doc, title) }; }
const tableStyle = { styles: { font: "helvetica", fontSize: 9.5, cellPadding: 5, textColor: INK, lineColor: [217, 224, 218], lineWidth: .5, valign: "top" }, headStyles: { fillColor: PINE, textColor: 255, fontStyle: "bold" }, alternateRowStyles: { fillColor: [243, 245, 242] }, margin: { left: 48, right: 48 } };
const openRed = d => { if (d.section === "body" && d.cell.raw === "OPEN") { d.cell.styles.textColor = RED; d.cell.styles.fontStyle = "bold"; } };
function finishPdf(doc, filename) {
  const n = doc.getNumberOfPages(), stamp = "Printed " + new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight(), mx = w > h ? 24 : 48;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text(stamp, mx, h - 20); doc.text("Page " + i + " of " + n, w - mx, h - 20, { align: "right" });
  }
  try { doc.save(filename); } catch (e) { toast("Couldn't create the PDF. Try again in a moment."); }
}
function shiftPdf(sh) {
  if (!pdfReady()) return;
  const { doc, y } = newPdf(sh.t);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...INK);
  doc.text(range(sh) + "   ·   " + AREAS[sh.a].label, 48, y);
  doc.setFontSize(10); doc.text("What you'll do", 48, y + 26);
  doc.setFont("helvetica", "normal"); const lines = doc.splitTextToSize(sh.d || "", 516); doc.text(lines, 48, y + 42, { lineHeightFactor: 1.4 });
  doc.autoTable({ ...tableStyle, startY: y + 52 + lines.length * 14, head: [["Role", "Name"]], body: sh.slots.map(sl => { const c = claimOf(slotId(sh, sl)); return [sl.role, c ? c.name : "OPEN"]; }), didParseCell: openRed });
  finishPdf(doc, slug(EV.name) + "-" + fmt(sh.start).replace(":", "").replace(" ", "") + "-" + slug(sh.t) + ".pdf");
}
function personPdf(name) {
  if (!pdfReady()) return;
  const me = assignments().find(p => norm(p.name) === norm(name));
  if (!me) { toast("You're not on any shifts yet."); return; }
  const { doc, y } = newPdf(me.name + "'s schedule");
  me.items.sort((a, b) => a.sh.start - b.sh.start);
  const mates = sh => sh.slots.map(sl => claimOf(slotId(sh, sl))).filter(c => c && norm(c.name) !== norm(me.name)).map(c => c.name).join(", ") || "—";
  doc.autoTable({ ...tableStyle, startY: y, head: [["Time", "Shift & role", "What you'll do", "Working with"]],
    columnStyles: { 0: { cellWidth: 78 }, 1: { cellWidth: 120, fontStyle: "bold" }, 3: { cellWidth: 100 } },
    body: me.items.map(({ sh, sl }) => [range(sh), sh.t + "\n" + sl.role + " · " + AREAS[sh.a].label, sh.d || "", mates(sh)]) });
  finishPdf(doc, slug(me.name) + "-" + slug(EV.name) + "-schedule.pdf");
}

/* Day-at-a-glance grid laid out like the original planning document */
function gridBlocks() {
  const B = [], v = EV.vendors || {};
  (EV.agenda || []).forEach(a => B.push({ col: "agenda", start: a.start, end: a.end, title: a.text, lines: [] }));
  (v.setup || []).forEach((w, i) => B.push({ col: "vendor", start: w.start, end: w.end, title: "Set-up window " + (i + 1), lines: [{ text: (v.perWindow || 0) + " vendors" }] }));
  (v.unload || []).forEach((w, i) => B.push({ col: "vendor", start: w.start, end: w.end, title: "Unload group " + (i + 1), lines: [{ text: (v.perWindow || 0) + " vendors" }] }));
  const SHORT = { "Staff": "", "Staff (if available)": "", "Volunteer": "V", "Inside · staff": "In", "Inside · volunteer": "In V", "Outside · staff": "Out", "Outside · volunteer": "Out V", "Guest floater": "Guest", "Vendor floater": "Vendor" };
  SHIFTS.forEach(sh => B.push({ col: sh.a, start: sh.start, end: sh.end, title: sh.t, time: true,
    lines: sh.slots.map(sl => { const c = claimOf(slotId(sh, sl)), p = SHORT[sl.role] != null ? SHORT[sl.role] : sl.role; return { text: (p ? p + ": " : "") + (c ? c.name : "OPEN"), open: !c }; }) }));
  ["agenda", "vendor", ...AREA_ORDER].forEach(k => {
    const col = B.filter(b => b.col === k).sort((a, b) => a.start - b.start), ends = [];
    col.forEach(b => { let l = ends.findIndex(e => e <= b.start); if (l < 0) { l = ends.length; ends.push(0); } ends[l] = b.end; b.lane = l; });
    col.forEach(b => { b.lanes = col.some(o => o !== b && o.start < b.end && b.start < o.end) ? ends.length : 1; if (b.lanes === 1) b.lane = 0; });
  });
  return B;
}
function gridPages(doc) {
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), X0 = 24, TW = 40, top = 86, bottom = H - 46;
  const blocks = gridBlocks(); if (!blocks.length) return;
  const first = Math.floor(Math.min(...blocks.map(b => b.start)) / 30) * 30, last = Math.ceil(Math.max(...blocks.map(b => b.end)) / 30) * 30;
  const n = Math.max(1, Math.ceil((last - first) / 210)), size = Math.ceil((last - first) / n / 30) * 30;
  const RGB = { agenda: INK, vendor: [93, 100, 112] }; AREA_ORDER.forEach(k => RGB[k] = hexRGB(AREAS[k].color));
  const hasV = blocks.some(b => b.col === "vendor");
  const COLS = [["agenda", "Agenda", 78], ...(hasV ? [["vendor", "Vendor Loading & Unloading", 86]] : []), ...AREA_ORDER.map(k => [k, AREAS[k].label])];
  const fixed = COLS.reduce((s, c) => s + (c[2] || 0), 0), flexN = COLS.filter(c => !c[2]).length, flex = (W - 2 * X0 - TW - fixed) / Math.max(1, flexN);
  let x = X0 + TW; const cx = {}; COLS.forEach(c => { cx[c[0]] = { x, w: c[2] || flex, label: c[1] }; x += c[2] || flex; });
  for (let pi = 0; pi < n; pi++) {
    const P0 = first + pi * size, P1 = Math.min(last, P0 + size); if (P0 >= last) break;
    const K = (bottom - top) / (P1 - P0), yOf = m => top + (m - P0) * K, gb = yOf(P1);
    if (pi > 0) doc.addPage("letter", "landscape");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...PINE);
    doc.text(EV.name.toUpperCase() + (EV.date ? "  ·  " + dateLabel().toUpperCase() : ""), X0, 30);
    doc.setFontSize(15); doc.setTextColor(...INK); doc.text("Day-of schedule  ·  " + fmt(P0) + " – " + fmt(P1), X0, 48);
    COLS.forEach(([k]) => { const c = cx[k]; doc.setFillColor(...tint(RGB[k], .14)); doc.rect(c.x, 58, c.w, top - 58, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...RGB[k]); doc.text(doc.splitTextToSize(c.label, c.w - 8), c.x + 4, 68); });
    for (let m = P0; m <= P1; m += 15) {
      const y = yOf(m), hr = m % 60 === 0;
      doc.setDrawColor(...(hr ? [170, 180, 172] : [226, 231, 227])); doc.setLineWidth(hr ? .6 : .4); doc.line(X0 + TW - 4, y, W - X0, y);
      if (m < P1) { doc.setFont("helvetica", hr ? "bold" : "normal"); doc.setFontSize(hr ? 7.5 : 6.5); doc.setTextColor(...(hr ? INK : MUTED)); doc.text(fmt(m).replace(/ [AP]M/, ""), X0 + TW - 7, y + 7, { align: "right" }); }
    }
    doc.setDrawColor(200, 208, 202); doc.setLineWidth(.5); COLS.forEach(([k]) => doc.line(cx[k].x, 58, cx[k].x, gb)); doc.line(W - X0, 58, W - X0, gb);
    blocks.filter(b => b.start < P1 && b.end > P0 && !(b.start < P0 && b.end - P0 < 12)).forEach(b => {
      const c = cx[b.col]; if (!c) return;
      const lw = c.w / b.lanes, bx = c.x + b.lane * lw + 1.5, bw = lw - 3, y1 = yOf(Math.max(b.start, P0)) + 1.2, y2 = yOf(Math.min(b.end, P1)) - 1.2, col = RGB[b.col];
      doc.setFillColor(...tint(col, b.col === "agenda" ? .06 : .1)); doc.setDrawColor(...tint(col, .45)); doc.setLineWidth(.6); doc.rect(bx, y1, bw, y2 - y1, "FD");
      doc.setFillColor(...col); doc.rect(bx, y1, 2.2, y2 - y1, "F");
      const tx = bx + 5, maxw = bw - 8; let ty = y1 + 8.5; const room = () => ty < y2 - 2;
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...INK);
      doc.splitTextToSize((b.start < P0 ? "(cont.) " : "") + b.title, maxw).slice(0, b.col === "agenda" ? 6 : 2).forEach(l => { if (room()) { doc.text(l, tx, ty); ty += 8; } });
      if (b.time && room()) { doc.setFont("helvetica", "normal"); doc.setFontSize(6.3); doc.setTextColor(...MUTED); const hm = m => fmt(m).replace(/ [AP]M/, ""); doc.text(doc.splitTextToSize(bw > 80 ? range(b) : hm(b.start) + "–" + hm(b.end), maxw)[0], tx, ty); ty += 8; }
      doc.setFontSize(6.8);
      for (let i = 0; i < b.lines.length; i++) {
        if (ty + 7.6 > y2 - 1 && i < b.lines.length - 1) { doc.setFont("helvetica", "italic"); doc.setTextColor(...MUTED); doc.text("+" + (b.lines.length - i) + " more", tx, ty); break; }
        if (!room()) break;
        const L = b.lines[i]; doc.setFont("helvetica", L.open ? "bold" : "normal"); doc.setTextColor(...(L.open ? RED : INK));
        doc.splitTextToSize(L.text, maxw).forEach((t, j) => { if (room()) { doc.text(t, tx + (j ? 4 : 0), ty); ty += 7.6; } });
      }
    });
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize((EV.footnote ? EV.footnote + "   " : "") + "V = volunteer slot.   OPEN = still needs someone.", W - 2 * X0)[0], X0, H - 32);
  }
}
function allPdf() {
  if (!pdfReady()) return;
  const doc = new window.jspdf.jsPDF({ unit: "pt", format: "letter", orientation: "landscape" });
  gridPages(doc);
  doc.addPage("letter", "portrait");
  const y = drawHeader(doc, "Everyone's assignments"), body = [];
  assignments().forEach(p => { p.items.sort((a, b) => a.sh.start - b.sh.start); p.items.forEach(({ sh, sl }, i) => body.push([i ? "" : p.name, range(sh), AREAS[sh.a].label, sh.t, sl.role])); });
  doc.autoTable({ ...tableStyle, startY: y, head: [["Name", "Time", "Area", "Shift", "Role"]], body: body.length ? body : [["Nobody has signed up yet.", "", "", "", ""]],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 110 }, 1: { cellWidth: 86 } },
    didParseCell: d => { if (d.section === "body" && d.row.raw[0]) { d.cell.styles.lineWidth = { top: 1.2, bottom: .5, left: 0, right: 0 }; d.cell.styles.lineColor = MUTED; } } });
  doc.addPage();
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(...INK); doc.text("Shift roster", 48, 60);
  const rows = [];
  SHIFTS.forEach(sh => sh.slots.forEach((sl, i) => { const c = claimOf(slotId(sh, sl)); rows.push([i ? "" : range(sh), i ? "" : AREAS[sh.a].label, i ? "" : sh.t, sl.role, c ? c.name : "OPEN"]); }));
  doc.autoTable({ ...tableStyle, startY: 76, head: [["Time", "Area", "Shift", "Role", "Name"]], body: rows, columnStyles: { 0: { cellWidth: 86 }, 2: { fontStyle: "bold" } }, didParseCell: openRed });
  const vs = vendorSummary();
  if (vs.length) {
    let yy = doc.lastAutoTable.finalY + 28; if (yy > 660) { doc.addPage(); yy = 60; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Vendor times (" + (EV.vendors.perWindow || 0) + " vendors per window)", 48, yy);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); vs.forEach((t, i) => doc.text(doc.splitTextToSize(t, 516)[0], 48, yy + 18 + i * 15));
  }
  finishPdf(doc, slug(EV.name) + "-assignments.pdf");
}

/* ---------- one .ics with every shift under a name ---------- */
function icsEsc(v) { return String(v).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function icsFold(line) { const out = []; while (line.length > 73) { out.push(line.slice(0, 73)); line = " " + line.slice(73); } out.push(line); return out.join("\r\n"); }
function personIcs(name) {
  if (!EV.date) { toast("The event date hasn't been set yet."); return; }
  const me = assignments().find(p => norm(p.name) === norm(name));
  if (!me) { toast("You're not on any shifts yet."); return; }
  const d = EV.date.replace(/-/g, ""), t = m => d + "T" + pad(Math.floor(m / 60)) + pad(m % 60) + "00";
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Holiday Makers Market//Sign-Up//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE", "TZID:America/New_York",
    "BEGIN:DAYLIGHT", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0400", "TZNAME:EDT", "DTSTART:19700308T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "END:DAYLIGHT",
    "BEGIN:STANDARD", "TZOFFSETFROM:-0400", "TZOFFSETTO:-0500", "TZNAME:EST", "DTSTART:19701101T020000", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU", "END:STANDARD",
    "END:VTIMEZONE"];
  me.items.sort((a, b) => a.sh.start - b.sh.start).forEach(({ sh, sl }) => {
    L.push("BEGIN:VEVENT", "UID:" + sh.id + "-" + sl.key + "-" + d + "@holiday-maker-signup", "DTSTAMP:" + now,
      "DTSTART;TZID=America/New_York:" + t(sh.start), "DTEND;TZID=America/New_York:" + t(sh.end),
      "SUMMARY:" + icsEsc(EV.name + ": " + sh.t + " (" + sl.role + ")"), "DESCRIPTION:" + icsEsc((sh.d || "") + "\n\nTeam\n" + team(sh)));
    if (EV.location) L.push("LOCATION:" + icsEsc(EV.location));
    L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc(sh.t), "TRIGGER:-PT30M", "END:VALARM", "END:VEVENT");
  });
  L.push("END:VCALENDAR");
  saveBlob(new Blob([L.map(icsFold).join("\r\n") + "\r\n"], { type: "text/calendar" }), slug(me.name) + "-" + slug(EV.name) + "-shifts.ics");
  toast("Saved " + me.items.length + " shift" + (me.items.length > 1 ? "s" : "") + ". Open the file to add them to your calendar.");
}
