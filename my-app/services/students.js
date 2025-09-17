// services/students.js
import { db } from "@/services/firebase"; // 🔁 adjust path if different
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  serverTimestamp,
  doc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { PAGE_SIZE_DEFAULT } from "@/lib/constants";

// Utility: merge + unique by id
function uniqById(rows) {
  const map = new Map();
  rows.forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
}

// QUICK FILTER helpers (some need client-side post-filtering)
function applyQuickFilterClient(rows, quick) {
  if (!quick) return rows;
  const now = Date.now();
  switch (quick) {
    case "stale7":
      return rows.filter(
        (r) =>
          !r.lastContactedAt ||
          now - (r.lastContactedAt?.toMillis?.() ?? r.lastContactedAt) >
            7 * 24 * 60 * 60 * 1000
      );
    case "highIntent":
      return rows.filter((r) => (r.intentScore ?? 0) >= 70);
    case "needsEssay":
      return rows.filter((r) => !!r.needsEssayHelp);
    default:
      return rows;
  }
}

/**
 * Cursor-based listing from Firestore.
 * @param {Object} params
 * @param {string} params.q - search text (prefix on name/email)
 * @param {string} params.status - status filter
 * @param {string} params.quick - quick filter key
 * @param {number} params.pageSize - items per page
 * @param {any} params.cursor - Firestore DocumentSnapshot (or null) to start after
 * @returns {Promise<{rows, nextCursor, totalApprox, stats}>}
 */
export async function listStudents({
  q,
  status,
  quick,
  pageSize = PAGE_SIZE_DEFAULT,
  cursor = null,
}) {
  const col = collection(db, "students");

  // Base query: sort by lastActive desc for good recency UX
  const baseClauses = [orderBy("lastActive", "desc"), limit(pageSize)];
  if (cursor) baseClauses.push(startAfter(cursor));

  // If only status filter (no text search), we can do it server-side:
  let q1 = query(col, ...(status ? [where("status", "==", status)] : []), ...baseClauses);
  let snap1 = await getDocs(q1);
  let rows1 = snap1.docs.map((d) => ({ id: d.id, ...d.data(), __snap: d }));

  // If text search present, do a separate prefix query on name_lower and email_lower and merge
  if (q) {
    const text = q.toLowerCase();
    // because Firestore needs orderBy on the field we prefix search
    const nameQ = query(
      col,
      orderBy("name_lower"),
      // name_lower >= text AND name_lower < text + \uf8ff
      // Next.js app router client SDK lacks composite operators, so we emulate with two range conditions:
      where("name_lower", ">=", text),
      where("name_lower", "<", text + "\uf8ff"),
      limit(pageSize)
    );
    const emailQ = query(
      col,
      orderBy("email_lower"),
      where("email_lower", ">=", text),
      where("email_lower", "<", text + "\uf8ff"),
      limit(pageSize)
    );
    const [nameSnap, emailSnap] = await Promise.all([getDocs(nameQ), getDocs(emailQ)]);
    const nameRows = nameSnap.docs.map((d) => ({ id: d.id, ...d.data(), __snap: d }));
    const emailRows = emailSnap.docs.map((d) => ({ id: d.id, ...d.data(), __snap: d }));

    // merge with recency preference
    const merged = uniqById([...nameRows, ...emailRows, ...rows1])
      .sort((a, b) => (b.lastActive?.toMillis?.() ?? 0) - (a.lastActive?.toMillis?.() ?? 0))
      .slice(0, pageSize);

    // apply status + quick filters post-merge if needed
    let filtered = merged;
    if (status) filtered = filtered.filter((r) => r.status === status);
    filtered = applyQuickFilterClient(filtered, quick);

    // nextCursor is from the last doc of the recency-ordered batch (if any)
    const nextCursor = filtered.length ? filtered[filtered.length - 1].__snap : null;

    // simple stats (approximate: cheap aggregate by extra small queries)
    const stats = await getStatsApprox();

    return {
      rows: filtered.map(stripSnap),
      nextCursor,
      totalApprox: undefined, // Firestore doesn't provide cheap count without count() aggregation
      stats,
    };
  }

  // No text search case: we already got snap1
  let filtered = applyQuickFilterClient(rows1, quick);
  const nextCursor = snap1.docs.length ? snap1.docs[snap1.docs.length - 1] : null;
  const stats = await getStatsApprox();

  return {
    rows: filtered.map(stripSnap),
    nextCursor,
    totalApprox: undefined,
    stats,
  };
}

function stripSnap(r) {
  const copy = { ...r };
  delete copy.__snap;
  return copy;
}

// Approx stats (fast & cheap). For accurate counts use Firestore count() aggregation (requires v9.21+).
async function getStatsApprox() {
  // You can upgrade to use count() with aggregate queries if enabled on your project.
  // Here we fetch small windows to avoid heavy reads; feel free to replace with aggregate().
  return {
    active: undefined,    // optional, can compute client-side if you fetch enough
    essay: undefined,
    submitted: undefined,
  };
}

export async function getStudent(id) {
  const ref = doc(db, "students", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Student not found");

  const base = { id: snap.id, ...snap.data() };

  // subcollections (optional)
  const [commSnap, notesSnap, timelineSnap] = await Promise.all([
    getDocs(query(collection(ref, "commLog"), orderBy("at", "desc"), limit(50))),
    getDocs(query(collection(ref, "notes"), orderBy("at", "desc"), limit(50))),
    getDocs(query(collection(ref, "timeline"), orderBy("at", "desc"), limit(50))),
  ]);

  const commLog = commSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const notes = notesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const timeline = timelineSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    ...base,
    commLog,
    notes,
    timeline,
  };
}

export async function addNote(id, { note }) {
  const ref = collection(doc(db, "students", id), "notes");
  await addDoc(ref, { note, at: serverTimestamp() });
  return { ok: true };
}

export async function logComm(id, payload) {
  const ref = collection(doc(db, "students", id), "commLog");
  await addDoc(ref, { ...payload, at: serverTimestamp() });
  return { ok: true };
}

// mock action placeholders (keep your UI working)
export async function triggerFollowUp() {
  return { ok: true };
}
export async function scheduleTask() {
  return { ok: true };
}
