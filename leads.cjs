const CRM_URL = 'https://app.persoocrm.online/api/webhooks/leads';
const attempts = new Map();
function reply(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify({ ok: status === 200, message }));
}
async function handleLead(req, res, { token = process.env.CRM_API_TOKEN, fetcher = fetch } = {}) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(res, 405, 'Método não permitido.'); }
  if (req.headers.origin) {
    try { if (new URL(req.headers.origin).host !== req.headers.host) return reply(res, 403, 'Origem não permitida.'); }
    catch { return reply(res, 403, 'Origem não permitida.'); }
  }
  if (!req.headers['content-type']?.startsWith('application/json')) return reply(res, 415, 'Envie os dados em JSON.');
  if (!token) return reply(res, 503, 'O formulário está temporariamente indisponível. Tente novamente mais tarde.');
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const ip = req.socket.remoteAddress;
  const attempt = attempts.get(ip) || { count: 0, until: now + 60000 };
  if (attempt.count >= 10) return reply(res, 429, 'Muitas tentativas. Aguarde um minuto antes de tentar novamente.');
  attempt.count++; attempts.set(ip, attempt);
  let payload;
  try {
    if (req.body !== undefined) {
      const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (Buffer.byteLength(raw) > 8192) return reply(res, 413, 'Os dados enviados excedem o limite permitido.');
      payload = JSON.parse(raw);
    } else {
      const chunks = []; let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 8192) return reply(res, 413, 'Os dados enviados excedem o limite permitido.');
        chunks.push(chunk);
      }
      payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
  } catch { return reply(res, 400, 'Não foi possível ler os dados. Verifique o formulário.'); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return reply(res, 400, 'Dados inválidos.');
  const lead = {};
  for (const field of ['nome', 'email', 'telefone', 'empresa']) {
    if (typeof payload[field] !== 'string') return reply(res, 400, 'Preencha todos os campos.');
    lead[field] = payload[field].trim();
    const max = field === 'telefone' ? 30 : field === 'email' ? 254 : 150;
    if (!lead[field] || lead[field].length > max || /[\x00-\x1f]/.test(lead[field])) return reply(res, 400, 'Verifique os campos preenchidos.');
  }
  const digits = lead.telefone.replace(/\D/g, '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || !/^[+\d\s().-]+$/.test(lead.telefone) || digits.length < 10 || digits.length > 15) {
    return reply(res, 400, 'Informe um e-mail válido e um telefone com DDD.');
  }
  try {
    const upstream = await fetcher(CRM_URL, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    });
    if (!upstream.ok) return reply(res, 502, 'Não foi possível confirmar o envio. Tente novamente mais tarde.');
    return reply(res, 200, 'Solicitação enviada! A equipe TheDobra entrará em contato para conversar sobre a ferramenta.');
  } catch {
    return reply(res, 502, 'Não foi possível confirmar o envio agora. Aguarde antes de tentar novamente.');
  }
}
module.exports = { handleLead };
