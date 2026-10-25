// Cloudflare worker stub. Not deployed.
// POST { chapter, choice, option } increments an anonymous counter.
// GET ?chapter=&choice=&option= returns { count, total } for that question.
// Wire COMMERCE.STATS_URL only after this is deployed. The game shows a
// device tally until then. It does not invent a world percent.

export default {
  async fetch(request, env){
    const url = new URL(request.url);
    if (request.method === 'GET'){
      const chapter = url.searchParams.get('chapter') || '';
      const choice = url.searchParams.get('choice') || '';
      const option = url.searchParams.get('option') || '';
      const key = chapter + '|' + choice + '|' + option;
      const totalKey = chapter + '|' + choice;
      const count = Number(await env.CHOICES.get(key)) || 0;
      const total = Number(await env.CHOICES.get(totalKey)) || 0;
      return Response.json({ count, total });
    }
    if (request.method !== 'POST') return new Response('no', { status: 405 });
    const body = await request.json();
    const chapter = String(body.chapter || '').slice(0, 40);
    const choice = String(body.choice || '').slice(0, 120);
    const option = String(body.option || '').slice(0, 120);
    if (!chapter || !choice || !option) return new Response('bad', { status: 400 });
    const key = chapter + '|' + choice + '|' + option;
    const totalKey = chapter + '|' + choice;
    const count = (Number(await env.CHOICES.get(key)) || 0) + 1;
    const total = (Number(await env.CHOICES.get(totalKey)) || 0) + 1;
    await env.CHOICES.put(key, String(count));
    await env.CHOICES.put(totalKey, String(total));
    return Response.json({ count, total });
  },
};
