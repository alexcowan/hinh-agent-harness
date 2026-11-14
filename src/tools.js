// The tools the agent can call, run against a world (a copy of the fixtures).
// Every action is checked against harness/permissions.json first: the agent
// acts with the technician's permissions, not the company's.

let counter = 600;
const nextId = (prefix) => `${prefix}-${++counter}`;

const notPermitted = (why) => ({ ok: false, error: `Not permitted: ${why}` });
const notFound = (what) => ({ ok: false, error: `Not found: ${what}` });

function equipmentKey(site, unit) {
  return `${site}/${unit}`;
}

function overlaps(a, b) {
  return a.date === b.date && a.start < b.end && b.start < a.end;
}

export function runTool(world, permissions, name, input = {}) {
  const fn = TOOLS[name];
  if (!fn) return { ok: false, error: `Unknown tool: ${name}` };
  let result;
  try {
    result = fn(world, permissions, input);
  } catch (err) {
    result = { ok: false, error: String(err.message || err) };
  }
  world.actions.push({ tool: name, input, ok: result.ok, result: result.ok ? result.result : result.error });
  return result;
}

const TOOLS = {
  get_current_job(world) {
    return { ok: true, result: world.current_job };
  },

  get_account(world, _p, { site }) {
    const acct = world.accounts[site];
    return acct ? { ok: true, result: { site, ...acct } } : notFound(`account ${site}`);
  },

  get_equipment(world, _p, { site, unit }) {
    const eq = world.equipment[equipmentKey(site, unit)];
    return eq ? { ok: true, result: { site, unit, ...eq } } : notFound(`unit ${unit} at ${site}`);
  },

  check_part(world, _p, { query }) {
    const q = String(query || '').toLowerCase();
    const hits = Object.entries(world.parts)
      .filter(([id, p]) => id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) ||
        p.fits.some((m) => m.toLowerCase().includes(q) || q.includes(m.toLowerCase())))
      .map(([id, p]) => ({ part_id: id, ...p }));
    return { ok: true, result: hits };
  },

  get_calendar(world, _p, { date }) {
    const tech = world.technician;
    return {
      ok: true,
      result: { date, slots: tech.calendar.filter((s) => s.date === date), source: tech.calendar_source },
    };
  },

  order_part(world, perms, { site, unit, part_id, qty = 1 }) {
    const part = world.parts[part_id];
    if (!part) return notFound(`part ${part_id}`);
    const acct = world.accounts[site];
    if (!acct) return notFound(`account ${site}`);
    const eq = world.equipment[equipmentKey(site, unit)];
    if (!eq) return notFound(`unit ${unit} at ${site}`);
    const total = part.price_usd * qty;
    if (eq.under_warranty && !perms.may_order_for_warranty_units) {
      return notPermitted(`${unit} is under warranty; parts come through the ${eq.warranty_vendor} claim process.`);
    }
    if (total > perms.max_order_usd) {
      return notPermitted(`$${total} is over the technician's $${perms.max_order_usd} order limit.`);
    }
    const approved = world.orders.some((o) => o.type === 'approval' && o.site === site && o.part_id === part_id && o.status === 'approved');
    if (total > acct.approval_required_over_usd && !approved) {
      return notPermitted(`${acct.name} requires approval from ${acct.approver.name} (${acct.approver.role}) before ordering.`);
    }
    if (!part.stock) {
      return { ok: false, error: `Out of stock at ${part.supplier}${part.backorder_until ? `; backordered until ${part.backorder_until}` : ''}.` };
    }
    const order = { order_id: nextId('o'), site, unit, part_id, qty, total_usd: total, supplier: part.supplier, eta: part.eta, deliver_to: part.deliver_to, status: 'placed' };
    world.orders.push(order);
    part.stock -= qty;
    return { ok: true, result: order };
  },

  cancel_order(world, _p, { order_id }) {
    const order = world.orders.find((o) => o.order_id === order_id);
    if (!order) return notFound(`order ${order_id}`);
    if (order.cancellable_until && world.now > order.cancellable_until) {
      return { ok: false, error: `Order ${order_id} can no longer be cancelled (cutoff was ${order.cancellable_until}).` };
    }
    order.status = 'cancelled';
    return { ok: true, result: order };
  },

  request_approval(world, _p, { site, part_id, amount_usd }) {
    const acct = world.accounts[site];
    if (!acct) return notFound(`account ${site}`);
    const req = { order_id: nextId('ap'), type: 'approval', site, part_id, amount_usd, approver: acct.approver, status: 'waiting' };
    world.orders.push(req);
    return { ok: true, result: req };
  },

  open_warranty_claim(world, _p, { site, unit, note }) {
    const eq = world.equipment[equipmentKey(site, unit)];
    if (!eq) return notFound(`unit ${unit} at ${site}`);
    if (!eq.under_warranty) return { ok: false, error: `${unit} at ${site} is not under warranty.` };
    const claim = { claim_id: nextId('wc'), site, unit, vendor: eq.warranty_vendor, note, status: 'submitted', vendor_lead_time: 'not yet confirmed by vendor' };
    world.orders.push({ ...claim, type: 'warranty_claim' });
    return { ok: true, result: claim };
  },

  hold_slot(world, perms, args) {
    return addSlot(world, perms, args, 'hold');
  },

  book_return(world, perms, args) {
    return addSlot(world, perms, args, 'booked');
  },

  release_slot(world, _p, { slot_id }) {
    const cal = world.technician.calendar;
    const i = cal.findIndex((s) => s.slot_id === slot_id);
    if (i < 0) return notFound(`slot ${slot_id}`);
    const [slot] = cal.splice(i, 1);
    return { ok: true, result: { released: slot } };
  },

  message_customer(world, perms, { site, to, text }) {
    if (!perms.may_message.includes(to)) return notPermitted(`messaging ${to}`);
    const acct = world.accounts[site];
    if (!acct) return notFound(`account ${site}`);
    const msg = { to: acct[to], site, text, status: 'sent' };
    return { ok: true, result: msg };
  },

  escalate(_world, perms, { to, note }) {
    if (!perms.may_escalate_to.includes(to)) return notPermitted(`escalating to ${to}`);
    return { ok: true, result: { to, note, status: 'sent' } };
  },
};

function addSlot(world, perms, { date, start, end, site }, status) {
  const tech = world.technician;
  if (!perms.may_book_calendars.includes(tech.id)) return notPermitted(`booking ${tech.id}'s calendar`);
  const slot = { slot_id: nextId('s'), date, start, end, status, job: `Return visit, ${site}` };
  const clash = tech.calendar.find((s) => s.status === 'booked' && overlaps(s, slot));
  if (clash) return { ok: false, error: `Collides with "${clash.job}" (${clash.date} ${clash.start}-${clash.end}).` };
  // Dispatch holds are deliberately invisible to the agent: booking over one
  // succeeds here, which is exactly what adversarial case A2 tests.
  tech.calendar.push(slot);
  return { ok: true, result: slot };
}
