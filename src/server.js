// The Wizard of Oz server.
//
//   /wizard  the wizard's page: start a session, see each harness draft,
//            send it as is, edit it, or write your own; score the session.
//   /user    the tester's page: a plain chat. Open it from the link the
//            wizard page gives you.
//
// Every event is written to logs/<date>-<time>-<initials>.jsonl, one JSON
// object per line, so you (or an AI) can read the session back later.
// Sessions live in memory; restarting the server ends them (the logs stay).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, loadHarness, loadCases, loadCase, makeWorld } from './world.js';
import { getProvider } from './ai.js';
import { runHarness } from './harness.js';

const PORT = Number(process.env.PORT || 3000);
const ai = getProvider();
const sessions = new Map();
fs.mkdirSync(path.join(ROOT, 'logs'), { recursive: true });

function log(session, event) {
  const line = JSON.stringify({ at: new Date().toISOString(), session: session.id, ...event });
  fs.appendFileSync(path.join(ROOT, session.logFile), `${line}\n`);
}

function publicState(s, forWizard) {
  return {
    id: s.id,
    caseId: s.caseId,
    ended: s.ended,
    messages: s.messages,
    ...(forWizard ? { drafts: s.drafts.map(({ worldAfter, ...d }) => d), logFile: s.logFile, ai: ai.name, scored: s.scored } : {}),
  };
}

async function draftReply(s) {
  if (!ai.chat) return;
  const draft = { draft_id: `d${s.drafts.length + 1}`, status: 'drafting', forMessage: s.messages.length };
  s.drafts.push(draft);
  const world = structuredClone(s.world); // dry run: nothing changes unless the wizard sends it
  world.actions = [];
  try {
    const res = await runHarness({ ai, harness: loadHarness(), world, transcript: s.messages.map(({ role, text }) => ({ role, text })) });
    Object.assign(draft, { status: 'ready', text: res.reply, trace: res.trace });
    draft.worldAfter = world;
  } catch (err) {
    Object.assign(draft, { status: 'error', text: '', error: String(err.message || err), trace: [] });
  }
  log(s, { type: 'draft', draft_id: draft.draft_id, status: draft.status, text: draft.text, trace: draft.trace, error: draft.error });
}

const routes = {
  'GET /api/info': () => ({ ai: ai.name, model: ai.model }),
  'GET /api/cases': () => loadCases().map(({ id, type, title, trigger, tester_brief, visible_context, good }) => ({ id, type, title, trigger, tester_brief, visible_context, good })),
  'GET /api/rubric': () => loadHarness().rubric,

  'POST /api/sessions': (_s, body) => {
    const initials = String(body.initials || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'XX';
    const stamp = /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(body.local_stamp || '') ? body.local_stamp
      : new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
    const caseDef = body.case_id ? loadCase(body.case_id) : null;
    let logFile = `logs/${stamp}-${initials}.jsonl`;
    for (let n = 2; fs.existsSync(path.join(ROOT, logFile)); n++) logFile = `logs/${stamp}-${initials}-${n}.jsonl`;
    const s = {
      id: crypto.randomBytes(9).toString('base64url'),
      caseId: caseDef?.id || null,
      world: makeWorld(caseDef),
      messages: [],
      drafts: [],
      logFile,
      ended: false,
      scored: false,
    };
    sessions.set(s.id, s);
    log(s, { type: 'session_start', initials, case_id: s.caseId, ai: ai.name, model: ai.model });
    return { id: s.id, logFile };
  },

  'GET /api/sessions/:id': (s, _b, q) => publicState(s, q.get('as') === 'wizard'),

  'POST /api/sessions/:id/user': (s, body) => {
    const text = String(body.text || '').trim();
    if (!text || s.ended) return { ok: false };
    s.messages.push({ role: 'user', text, at: new Date().toISOString() });
    log(s, { type: 'user_message', text });
    draftReply(s); // runs in the background; the wizard page polls for it
    return { ok: true };
  },

  'POST /api/sessions/:id/agent': (s, body) => {
    const text = String(body.text || '').trim();
    if (!text || s.ended) return { ok: false };
    const draft = s.drafts.find((d) => d.draft_id === body.draft_id && d.status === 'ready');
    let action = 'wizard_only';
    if (draft) action = body.override ? 'overridden' : text === draft.text ? 'sent_as_is' : 'edited';
    if (draft && action !== 'overridden') s.world = draft.worldAfter; // the draft's actions now count
    if (draft) draft.status = `used:${action}`;
    s.messages.push({ role: 'agent', text, at: new Date().toISOString() });
    log(s, { type: 'agent_message', text, action, draft_id: draft?.draft_id || null, draft_text: draft && action !== 'sent_as_is' ? draft.text : undefined });
    return { ok: true, action };
  },

  'POST /api/sessions/:id/score': (s, body) => {
    log(s, { type: 'score', scores: body.scores || {}, note: body.note || '' });
    s.scored = true;
    return { ok: true };
  },

  'POST /api/sessions/:id/end': (s) => {
    s.ended = true;
    log(s, { type: 'session_end' });
    return { ok: true, logFile: s.logFile };
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/wizard')) return sendFile(res, 'public/wizard.html');
    if (req.method === 'GET' && url.pathname === '/user') return sendFile(res, 'public/user.html');
    if (req.method === 'GET' && url.pathname === '/style.css') return sendFile(res, 'public/style.css', 'text/css');

    const m = url.pathname.match(/^\/api\/sessions\/([\w-]+)(\/\w+)?$/);
    const key = m ? `${req.method} /api/sessions/:id${m[2] || ''}` : `${req.method} ${url.pathname}`;
    const handler = routes[key];
    if (!handler) return send(res, 404, { error: 'not found' });
    let session = null;
    if (m) {
      session = sessions.get(m[1]);
      if (!session) return send(res, 404, { error: 'No such session. If the server restarted, start a new one.' });
    }
    const body = req.method === 'POST' ? await readBody(req) : {};
    return send(res, 200, await handler(session, body, url.searchParams));
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
});

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function sendFile(res, rel, type = 'text/html; charset=utf-8') {
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(path.join(ROOT, rel)));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`Wizard of Oz server on port ${PORT}. AI: ${ai.name}${ai.model ? ` (${ai.model})` : ' (the wizard writes every reply)'}`);
  console.log(`Open /wizard to start a session.`);
});
