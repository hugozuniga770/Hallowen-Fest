/* =====================================================================
   S&N ENTERTAINMENT · lógica compartida (inicio, eventos, staff y administración)
   Secciones: 1 Configuración · 2 Utilidades · 3 Base de datos · 4 Estado y arranque
              5 Menú y pie · 6 Inicio · 7 Página de evento · 8 Comprobante (OCR)
              9 Entrada con QR · 10 Panel del relacionador · 11 Puerta
              12 Administración · 13 Router del panel
   ===================================================================== */
(() => {
  'use strict';

  /* ======================================================================
   1. CONFIGURACIÓN  (lo único que normalmente se edita)
   ====================================================================== */
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAkgEZl0nrQB8GZkikZcDLhxty2MTcUCIA',
    authDomain: 'halloweenfest.firebaseapp.com',
    projectId: 'halloweenfest',
    storageBucket: 'halloweenfest.firebasestorage.app',
    messagingSenderId: '781666009211',
    appId: '1:781666009211:web:e6a51b236a21746bdfe2de',
  };
  const SITE = {
    name: 'S&N Entertainment',
    waGroup: 'https://chat.whatsapp.com/H3JbNW6LzYCAtrpuHzlImA?mode=gi_t', // grupo de WhatsApp
    instagram: 'https://www.instagram.com/', // pon aquí el Instagram de la productora
    phone: '59169246105',
    phoneLabel: '+591 69246105',
    email: 'hugorafelzuniga03@gmail.com',
    city: 'Santa Cruz, Bolivia',
  };
  const QR_BACKGROUND = 'qr-fondo.png'; // foto de fondo del QR
  const APP_VERSION = 'v8 · S&N Entertainment'; // se ve en la pantalla de PIN: sirve para saber si Netlify ya publicó lo último
  const DEFAULT_PIN = '1234'; // PIN inicial de relacionadores y puerta
  const DEFAULT_ADMIN = 'admin123'; // PIN inicial de administración
  const TICKET_TYPES = {
    // field = columna de precio dentro de cada tier
    man: { label: 'Hombre', seats: 1, field: 'm' },
    woman: { label: 'Mujer', seats: 1, field: 'w' },
    couple: { label: 'Pareja', seats: 2, field: 'c' },
  };
  const EVENT_ID = document.body.dataset.event || null; // viene de <body data-event="..."> en la página de cada evento
  const IS_HOME = !EVENT_ID;
  const MONTHS_ES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const SEED_RELS = [
    { name: 'Luigi Céspedes', phone: '69287516' },
    { name: 'Angelica Bravo', phone: '69046445' },
    { name: 'Aylin Ardaya', phone: '69083133' },
    { name: 'Fabio Aparicio', phone: '78427311' },
    { name: 'Matias Flores', phone: '61365550' },
    { name: 'Lucas Leibovich', phone: '71096488' },
    { name: 'Santiago Guzman', phone: '67741931' },
    { name: 'Hugo Zúñiga', phone: '69246105' },
    { name: 'Andres Paniagua', phone: '71643866' },
    { name: 'Alejandro Unzueta', phone: '69262727' },
    { name: 'Mia Constanza', phone: '61626905' },
    { name: 'César Justiniano', phone: '76051808' },
    { name: 'Juan David Solís', phone: '63449456' },
    { name: 'Janine Solís', phone: '73612425' },
    { name: 'Bruno Rossini', phone: '77645850' },
    { name: 'Gabriel Saucedo', phone: '76347086' },
  ];
  const ICON_WA =
      'M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z',
    ICON_IG =
      'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z';
  /* Evento inicial (se crea una sola vez en Firebase; después se edita desde Administración) */
  const defaultEvent = () => ({
    id: 'dark-garden-31-10-2026',
    slug: 'DARK-GARDEN-31-10-2026',
    name: 'DARK GARDEN',
    date: '2026-10-31',
    time: '21:00',
    venue: 'Lugar por confirmar',
    address: 'Santa Cruz de la Sierra, Bolivia',
    flyer: 'image1.png',
    gallery: 'image2.png',
    description:
      'Cruza las puertas del jardín más oscuro de Santa Cruz.\nUna noche de Halloween entre rosas, velas y sombras, con la mejor música y la mejor barra.\n\n¡Marquen sus calendarios! 31 de octubre.',
    lineup: 'DJ Denzel',
    sponsors: 'Casa Real Singani, 37 Lenguas, Jägermeister, Full House Bartender',
    age: '+18',
    banner: '⚠️ Siguiente Lote a las 18:00',
    mapUrl: 'https://maps.app.goo.gl/4XemLvxxDCRcvDxj9?g_st=awb',
    mapQ: 'Santa Cruz de la Sierra, Bolivia',
    published: true,
    tiers: [
      { n: 'HOT SALE', m: 80, w: 40, c: 0, end: '', sold: true },
      { n: 'TIER 1', m: 90, w: 50, c: 130, end: '2026-10-31T18:00', sold: false },
      { n: 'TIER 2', m: 100, w: 70, c: 150, end: '', sold: false },
    ],
  });
  const OVERLAY_HTML = `<div id="ov" class="ov"><div id="ov-c" class="max-w-md mx-auto p-4 pt-6 pb-16"><div class="flex justify-between items-center mb-5"><h2 id="ov-t" class="font-display text-3xl text-brand-light uppercase"></h2><button onclick="Staff.close()" class="text-4xl leading-none">&times;</button></div><div id="ov-b"></div></div></div>`;

  /* ======================================================================
         2. UTILIDADES
         ====================================================================== */
  const $ = (id) => document.getElementById(id);
  document.body.insertAdjacentHTML('beforeend', OVERLAY_HTML);
  const ov = $('ov'),
    body = $('ov-b');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
  const fmtDate = (ts) => new Date(ts).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  const uid = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

  /* Hash simple (cyrb53) para PINs y para detectar imágenes repetidas */
  function hash(str) {
    let a = 0xdeadbeef,
      b = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      a = Math.imul(a ^ c, 2654435761);
      b = Math.imul(b ^ c, 1597334677);
    }
    a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
    b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
    return (4294967296 * (2097151 & b) + (a >>> 0)).toString(16);
  }
  /* PIN: se quitan TODOS los espacios y se ignoran mayúsculas antes de comparar o guardar */
  const cleanPin = (s) =>
    String(s ?? '')
      .replace(/\s+/g, '')
      .toLowerCase();
  function hashPin(s) {
    return hash('p' + cleanPin(s));
  }

  const loaded = {}; // carga perezosa de librerías pesadas (OCR, QR, lector de QR)
  const loadScript = (src) =>
    (loaded[src] ??= new Promise((ok, fail) => {
      const e = document.createElement('script');
      e.src = src;
      e.onload = ok;
      e.onerror = fail;
      document.head.appendChild(e);
    }));

  /* ======================================================================
   3. BASE DE DATOS (Firebase: Auth anónimo + Firestore)
      kv/cfg (PINs) · kv/rels · kv/meta · events/{id} · tickets/{id}
      receipts/r{comprobante} · receipts/h{hash imagen} · pending/{id}
   ====================================================================== */
  const DB = {
    fs: null,
    async init() {
      firebase.initializeApp(FIREBASE_CONFIG);
      await firebase.auth().signInAnonymously();
      DB.fs = firebase.firestore();
    },
    async getKV(k) {
      const d = await DB.fs.doc('kv/' + k).get();
      return d.exists ? d.data().v : null;
    },
    setKV: (k, v) => DB.fs.doc('kv/' + k).set({ v }),
    /* eventos */
    async listEvents() {
      return (await DB.fs.collection('events').get()).docs.map((d) => d.data());
    },
    saveEvent: (ev) => DB.fs.doc('events/' + ev.id).set(ev),
    deleteEvent: (id) => DB.fs.doc('events/' + id).delete(),
    /* entradas */
    async listTickets() {
      return (await DB.fs.collection('tickets').get()).docs.map((d) => d.data()).sort((a, b) => b.ts - a.ts);
    },
    /* Crea las entradas de UNA compra SOLO si ni el N° de comprobante ni la imagen se usaron antes (transacción atómica).
     Si viene de un pedido pendiente, lo marca como concretado en la misma transacción. */
    createTickets(tickets, img, pendingId) {
      const { rid, hash } = tickets[0];
      return DB.fs.runTransaction(async (tx) => {
        const byId = DB.fs.doc('receipts/r' + rid),
          byImg = DB.fs.doc('receipts/h' + hash);
        const [a, b] = await Promise.all([tx.get(byId), tx.get(byImg)]);
        if (a.exists || b.exists) throw new Error('DUP');
        tx.set(byId, { id: tickets[0].id, img });
        tx.set(byImg, { id: tickets[0].id });
        tickets.forEach((t) => tx.set(DB.fs.doc('tickets/' + t.id), t));
        if (pendingId) tx.update(DB.fs.doc('pending/' + pendingId), { status: 'done', doneTs: Date.now() });
      });
    },
    /* Marca un ingreso en puerta. Devuelve {r:'ok'|'used'|'none', t} */
    useTicket(id) {
      return DB.fs.runTransaction(async (tx) => {
        const ref = DB.fs.doc('tickets/' + id),
          d = await tx.get(ref);
        if (!d.exists) return { r: 'none' };
        const t = d.data();
        if (t.used >= t.max) return { r: 'used', t };
        t.used++;
        t.scans = [...(t.scans || []), Date.now()];
        tx.update(ref, { used: t.used, scans: t.scans });
        return { r: 'ok', t };
      });
    },
    /* ventas pendientes (llegan desde la página del evento) */
    createPending: (p) => DB.fs.doc('pending/' + p.id).set(p),
    watchPending(relId, cb) {
      // tiempo real: devuelve la función para dejar de escuchar
      return DB.fs
        .collection('pending')
        .where('relId', '==', relId)
        .onSnapshot(
          (q) =>
            cb(
              q.docs
                .map((d) => d.data())
                .filter((p) => p.status === 'pending')
                .sort((a, b) => b.ts - a.ts),
            ),
          (e) => console.error(e),
        );
    },
    async getReceipt(rid) {
      const d = await DB.fs.doc('receipts/r' + rid).get();
      return d.exists ? d.data() : null;
    },
    /* Anula una entrada; si era la última de su comprobante, libera el comprobante y la imagen */
    async deleteTicket(id) {
      const d = await DB.fs.doc('tickets/' + id).get();
      if (!d.exists) return;
      const { rid, hash } = d.data();
      await DB.fs.doc('tickets/' + id).delete();
      if ((await DB.fs.collection('tickets').where('rid', '==', rid).get()).empty) {
        await DB.fs.doc('receipts/r' + rid).delete();
        await DB.fs.doc('receipts/h' + hash).delete();
      }
    },
  };

  /* ======================================================================
   4. ESTADO GLOBAL Y ARRANQUE
   ====================================================================== */
  const State = { sec: null, cfgRaw: {}, rels: [], events: [], ev: null, error: null };
  const saveSec = () => DB.setKV('cfg', { ...State.cfgRaw, apin: State.sec.apin, dpin: State.sec.dpin });
  const saveRels = () => DB.setKV('rels', State.rels);

  async function loadState() {
    State.cfgRaw = (await DB.getKV('cfg')) || {};
    State.sec = { apin: State.cfgRaw.apin || hashPin(DEFAULT_ADMIN), dpin: State.cfgRaw.dpin || hashPin(DEFAULT_PIN) };
    let rels = await DB.getKV('rels');
    if (!rels) {
      // primera vez: se siembran los relacionadores con el PIN inicial
      rels = SEED_RELS.map((r) => ({ ...r, id: uid(), pin: hashPin(DEFAULT_PIN) }));
      await DB.setKV('rels', rels);
    }
    State.rels = rels;
    if (!(await DB.getKV('meta'))) {
      // primera vez: crea Dark Garden (conserva los precios que ya existían)
      const ev = defaultEvent();
      ['tiers', 'banner', 'mapUrl', 'mapQ'].forEach((k) => {
        if (State.cfgRaw[k]) ev[k] = State.cfgRaw[k];
      });
      await DB.saveEvent(ev);
      await DB.setKV('meta', { seeded: true });
    }
    State.events = await DB.listEvents();
    State.ev = EVENT_ID ? State.events.find((e) => e.id === EVENT_ID) || null : null;
    render();
  }
  const ready = DB.init()
    .then(loadState)
    .catch((e) => {
      console.error(e);
      State.error = e;
      render();
    });
  function render() {
    IS_HOME ? renderHome() : renderEvent();
  }

  /* ======================================================================
   5. MENÚ Y PIE (iguales en todas las páginas)
   ====================================================================== */
  const icon = (path, cls = 'w-5 h-5') => `<svg class="${cls}" fill="currentColor" viewBox="0 0 24 24"><path d="${path}"/></svg>`;
  function navHTML() {
    return `<nav class="nav-bar fixed top-0 w-full z-50"><div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
    <div class="flex items-center min-w-0">
      <a href="/" class="flex items-center gap-3"><img src="logo-sn.svg" alt="S&N" class="w-10 h-10"><span class="leading-tight"><b class="block font-serif tracking-[.25em] text-sm">S&amp;N</b><span class="block text-[10px] tracking-[.4em] text-bone/70 uppercase">Entertainment</span></span></a>
      ${
        EVENT_ID
          ? '<span class="hidden md:flex items-center gap-3 ml-5 pl-5 border-l border-white/10"><span class="text-[10px] uppercase tracking-widest text-bone/60">Presenta</span><b id="nav-ev" class="font-display text-2xl tracking-wide"></b></span>'
          : '<div class="hidden md:flex items-center gap-6 ml-8 text-xs uppercase tracking-widest text-bone/80"><a href="#eventos" class="hover:text-white">Eventos</a><a href="#contacto" class="hover:text-white">Contacto</a></div>'
      }
    </div>
    <div class="flex items-center gap-2">
      <button onclick="Staff.open('rel')" class="nav-btn bg-brand text-white">🎃<span class="hidden md:inline">Relacionador</span></button>
      <button onclick="Staff.open('gate')" class="nav-btn bg-white/10 border border-white/20 text-white">🚪<span class="hidden md:inline">Puerta</span></button>
      <a href="${SITE.waGroup}" target="_blank" rel="noopener" class="nav-btn bg-[#25D366] text-black">${icon(ICON_WA, 'w-4 h-4')}<span class="hidden md:inline">Grupo WA</span></a>
      <a href="${SITE.instagram}" target="_blank" rel="noopener" class="nav-btn bg-white text-black">${icon(ICON_IG, 'w-4 h-4')}<span class="hidden md:inline">Instagram</span></a>
    </div></div></nav>`;
  }
  function footerHTML() {
    const li = (t, extra = '') => `<li><a href="#" class="hover:text-white transition" ${extra}>${t}</a></li>`;
    return `<footer id="contacto" class="relative z-10 mt-10 border-t border-brand/30 bg-black/60"><div class="max-w-6xl mx-auto px-4 py-14">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
      <div class="col-span-2 md:col-span-1"><h3 class="font-serif font-bold tracking-[.25em] text-lg mb-3">S&amp;N</h3><p class="text-xs text-bone/60 leading-relaxed uppercase tracking-wider">Plataforma oficial.<br>Seguridad garantizada.<br>Est. 2026</p>
        <div class="mt-5 text-sm text-bone/70"><p class="font-bold text-white">¿Necesitas una web así?</p><p>Diseño profesional y venta online.<br><a href="#contacto-dev" class="text-brand-light hover:underline">Cotiza tu proyecto aquí</a></p></div></div>
      <div id="contacto-dev"><h4 class="lb">Contacto directo</h4><ul class="space-y-2 text-sm text-bone/80">
        <li><a class="hover:text-white" target="_blank" href="https://wa.me/${SITE.phone}?text=Hola,%20me%20interesa%20el%20servicio%20de%20p%C3%A1ginas%20web%20de%20este%20estilo">📱 ${SITE.phoneLabel}</a></li>
        <li><a class="hover:text-white" href="mailto:${SITE.email}?subject=Inter%C3%A9s%20en%20Servicio%20Web&body=Hola,%20me%20interesa%20el%20servicio%20de%20p%C3%A1ginas%20web%20de%20este%20estilo.">✉️ ${SITE.email}</a></li>
        <li>📍 ${SITE.city}</li></ul></div>
      <div><h4 class="lb">Social</h4><div class="flex gap-3"><a href="${SITE.waGroup}" target="_blank" rel="noopener" class="w-10 h-10 grid place-items-center bg-white/10 hover:bg-brand transition">${icon(ICON_WA)}</a><a href="${SITE.instagram}" target="_blank" rel="noopener" class="w-10 h-10 grid place-items-center bg-white/10 hover:bg-brand transition">${icon(ICON_IG)}</a></div></div>
      <div><h4 class="lb">Legal</h4><ul class="space-y-2 text-sm text-bone/80">${li('Términos y Condiciones')}${li('Política de Privacidad')}${li('Reembolsos')}${IS_HOME ? li('Administración', `onclick="Staff.open('admin');return false"`) : ''}</ul></div>
    </div><div class="divider mb-6"></div>
    <div class="flex flex-col md:flex-row justify-between gap-2 text-xs text-bone/50"><p>&copy; 2026 S&amp;N Entertainment.</p><p>Desarrollado con ❤️ en Bolivia</p></div></div></footer>`;
  }
  $('site-nav').innerHTML = navHTML();
  $('site-footer').innerHTML = footerHTML();

  /* ======================================================================
   6. INICIO (lista de eventos al estilo Ventik)
   ====================================================================== */
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const evDay = (ev) => new Date(ev.date + 'T12:00:00');
  const today0 = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const isPast = (ev) => evDay(ev) < today0();
  const longDate = (ev) => cap(evDay(ev).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  const dayLabel = (ev) => evDay(ev).toLocaleDateString('es-BO', { day: 'numeric', month: 'long' }).toUpperCase(); // "31 DE OCTUBRE"
  const tierOf = (ev) => (ev.tiers || []).find((t) => !t.sold && !(t.end && Date.now() > new Date(t.end))); // lote activo
  const pricesOf = (ev) => {
    const t = tierOf(ev);
    return { tier: t || null, man: t ? +t.m || 0 : 0, woman: t ? +t.w || 0 : 0, couple: t ? +t.c || 0 : 0 };
  };
  const fromPrice = (ev) => {
    const p = pricesOf(ev),
      v = [p.man, p.woman, p.couple].filter(Boolean);
    return v.length ? Math.min(...v) : 0;
  };
  const chips = (s) =>
    (s || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => `<span class="tag">${esc(x)}</span>`)
      .join('');

  let homeFilter = 'all';
  function inRange(ev) {
    const d = evDay(ev),
      t = today0();
    if (homeFilter === 'today') return d.toDateString() === new Date().toDateString();
    if (homeFilter === 'week') return d >= t && d < new Date(t.getTime() + 7 * 864e5);
    if (homeFilter === 'month') return d >= t && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
    return true;
  }
  function cardHTML(ev) {
    const past = isPast(ev),
      price = fromPrice(ev),
      d = evDay(ev),
      badge = past ? 'Finalizado' : price ? '' : 'Agotado';
    return `<a href="${esc(ev.slug)}" class="ev-card${past ? ' is-past' : ''}"><div class="ev-img"><img src="${esc(ev.flyer)}" alt="${esc(ev.name)}" loading="lazy">${badge ? `<span class="badge">${badge}</span>` : ''}</div>
    <div class="ev-body"><div class="ev-date"><b>${d.getDate()}</b><span>${MONTHS_ES[d.getMonth()]}</span></div><div class="min-w-0"><h3 class="font-display text-2xl truncate">${esc(ev.name)}</h3><p class="text-xs text-bone/60 truncate">${esc(ev.venue)}${ev.time ? ' · ' + esc(ev.time) + ' hrs' : ''}</p><p class="ev-price">${price ? 'Desde Bs ' + price : badge}</p></div></div></a>`;
  }
  function featHTML(ev) {
    const price = fromPrice(ev);
    return `<div class="feat glow"><a href="${esc(ev.slug)}"><img src="${esc(ev.flyer)}" alt="${esc(ev.name)}" class="flyer w-full max-w-xs mx-auto"></a>
    <div><p class="lb">Próximo evento</p><h2 class="title-gothic text-5xl md:text-7xl mb-4">${esc(ev.name)}</h2>
    <p class="font-bold">${esc(longDate(ev))}${ev.time ? ' · ' + esc(ev.time) + ' hrs' : ''}</p><p class="text-bone/70 mb-5">${esc(ev.venue)} — ${esc(ev.address)}</p>
    <div class="flex flex-wrap items-center gap-4"><a href="${esc(ev.slug)}" class="cta">${price ? 'Comprar entradas' : 'Ver evento'}</a><span class="font-display text-3xl text-brand-light">${price ? 'Desde Bs ' + price : 'Agotado'}</span></div></div></div>`;
  }
  function renderHome() {
    if (State.error) {
      $('ev-grid').innerHTML = '<p class="text-brand-light">No se pudo conectar con la base de datos. Revisa tu conexión y recarga.</p>';
      return;
    }
    const evs = State.events.filter((e) => e.published !== false).sort((a, b) => a.date.localeCompare(b.date));
    const feat = evs.find((e) => !isPast(e));
    $('featured').innerHTML = feat ? featHTML(feat) : '';
    const shown = evs.filter(inRange),
      list = [...shown.filter((e) => !isPast(e)), ...shown.filter(isPast).reverse()];
    $('ev-grid').innerHTML = list.length ? list.map(cardHTML).join('') : '<p class="text-bone/60">No hay eventos para este filtro.</p>';
    document.querySelectorAll('#chips .chip').forEach((c) => c.classList.toggle('on', c.dataset.f === homeFilter));
  }
  if (IS_HOME)
    $('chips').addEventListener('click', (e) => {
      const c = e.target.closest('.chip');
      if (c) {
        homeFilter = c.dataset.f;
        renderHome();
      }
    });

  /* ======================================================================
   7. PÁGINA DE EVENTO (lotes, carrito, contacto con relacionadores)
   ====================================================================== */
  const Cart = { man: 0, woman: 0, couple: 0 };
  const labelOf = (k, tier) => (k === 'couple' ? 'PAREJA' : `${tier.n} (${k === 'man' ? 'H' : 'M'})`);
  const soldCard = (t, price) =>
    `<div class="ticket-card sold-out p-4 flex justify-between items-center"><div><span class="bg-red-700 text-white text-[10px] font-bold px-1 uppercase">Agotado</span><div class="font-bold text-gray-400">${esc(t.n)}</div></div><div class="text-xl font-bold text-gray-500">${price} Bs</div></div>`;
  const qtyControls = (k) =>
    `<div class="flex items-center gap-4"><button onclick="changeQty('${k}',-1)" class="qty-btn">-</button><span class="font-bold w-4 text-center" id="qty-${k}">${Cart[k]}</span><button onclick="changeQty('${k}',1)" class="qty-btn">+</button></div>`;
  const buyCard = (k, t, badge) =>
    `<div class="ticket-card p-4 flex flex-col gap-3"><div class="flex justify-between items-start"><div><span class="${badge} text-[10px] font-bold px-1 uppercase">Disponible</span><div class="font-display text-3xl text-white">${esc(t.n)}</div></div><div class="text-2xl font-bold text-white">${t[TICKET_TYPES[k].field]} Bs</div></div><div class="flex items-center justify-between bg-black p-2 border border-white/10"><span class="text-xs text-bone/60 uppercase">Cantidad</span>${qtyControls(k)}</div></div>`;

  function renderEvent() {
    const ev = State.ev;
    $('ev-missing').classList.toggle('hidden', !!ev);
    $('ev-main').classList.toggle('hidden', !ev);
    if (!ev) {
      $('ev-missing').querySelector('h1').textContent = State.error ? 'Sin conexión' : 'Evento no encontrado';
      return;
    }
    const T = (id, v) => {
      const e = $(id);
      if (e) e.textContent = v;
    };
    document.title = `${ev.name} | ${SITE.name}`;
    $('cover-bg').style.backgroundImage = `url("${ev.flyer}")`;
    $('ev-flyer').src = ev.flyer;
    $('ev-flyer').alt = ev.name;
    T('ev-name', ev.name);
    T('nav-ev', ev.name);
    T('ev-org', SITE.name);
    const d = evDay(ev);
    T('ev-mon', MONTHS_ES[d.getMonth()]);
    T('ev-day', d.getDate());
    T('ev-date-long', longDate(ev));
    T('ev-time', ev.time ? `${ev.time} hrs` : '');
    T('ev-venue', ev.venue);
    T('ev-address', ev.address);
    T('ev-desc', ev.description);
    T('ev-map-addr', ev.address);
    $('ev-age').classList.toggle('hidden', !ev.age);
    T('ev-age', `Este es un evento ${ev.age}`);
    $('ev-lineup').innerHTML = chips(ev.lineup);
    $('ev-sponsors').innerHTML = chips(ev.sponsors);
    $('sec-gallery').classList.toggle('hidden', !ev.gallery);
    $('gallery').innerHTML = (ev.gallery || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((src) => `<img src="${esc(src)}" alt="" loading="lazy" class="w-full border border-white/10">`)
      .join('');
    $('map-link').href = ev.mapUrl;
    const f = $('map-f');
    if (f.dataset.q !== ev.mapQ) {
      f.dataset.q = ev.mapQ;
      f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(ev.mapQ) + '&z=16&output=embed';
    }
    $('banner').textContent = ev.banner || '';
    $('banner').style.display = ev.banner ? '' : 'none';

    /* lotes: se muestran los agotados y el activo */
    const pr = pricesOf(ev),
      act = pr.tier,
      tiers = ev.tiers || [],
      visible = act ? tiers.slice(0, tiers.indexOf(act) + 1) : tiers;
    for (const k of Object.keys(Cart)) if (!pr[k]) Cart[k] = 0;
    const column = (k, title, badge, color) =>
      `<div class="space-y-4"><h3 class="${color} font-display text-3xl uppercase border-b border-white/10 pb-2">${title}</h3>${visible
        .filter((t) => +t[TICKET_TYPES[k].field])
        .map((t) => (t === act ? buyCard(k, t, badge) : soldCard(t, t[TICKET_TYPES[k].field])))
        .join('')}</div>`;
    const couple =
      act && pr.couple
        ? `<div class="mt-8 border-t border-white/10 pt-6"><div class="ticket-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4"><div class="flex items-center gap-4"><div class="bg-white text-black p-2 font-bold text-xl">2x</div><div><div class="font-display text-3xl text-white">PAREJA</div><div class="text-xs text-bone/60 uppercase">Acceso doble</div></div></div><div class="flex items-center gap-6 w-full sm:w-auto justify-between"><div class="text-2xl font-bold text-white">${pr.couple} Bs</div>${qtyControls('couple')}</div></div></div>`
        : '';
    $('tiers').innerHTML =
      (act ? '' : '<p class="text-center text-brand-light font-bold uppercase tracking-widest text-sm mb-6">Entradas agotadas</p>') +
      `<div class="grid grid-cols-1 md:grid-cols-2 gap-8">${column('man', 'Hombres', 'bg-brand text-white', 'text-brand-light')}${column('woman', 'Mujeres', 'bg-white text-black', 'text-white')}</div>` +
      couple;
    const ua = $('urgent-alert');
    ua.classList.toggle('hidden', !(act && act.end));
    ua.firstElementChild.textContent = act ? `⚠️ Últimas entradas ${act.n} - ¡Corre!` : '';
    updateCart();
    tickCountdown();
  }
  function updateCart() {
    const ev = State.ev;
    if (!ev) return;
    const pr = pricesOf(ev);
    let total = 0,
      n = 0,
      html = '';
    for (const k of Object.keys(Cart))
      if (Cart[k] > 0) {
        n += Cart[k];
        total += Cart[k] * pr[k];
        html += `<div class="flex justify-between items-center border-b border-white/10 pb-2"><div><p class="font-bold uppercase text-sm">${esc(labelOf(k, pr.tier))}</p><p class="text-xs text-bone/60">${Cart[k]} x ${pr[k]} Bs</p></div><p class="font-bold text-brand-light">${Cart[k] * pr[k]} Bs</p></div>`;
      }
    $('cart-items').innerHTML = html;
    $('cart-content').classList.toggle('hidden', !n);
    $('empty-cart').classList.toggle('hidden', !!n);
    $('total').textContent = `${total} Bs`;
    const min = fromPrice(ev);
    $('buybar-label').textContent = n ? `${n} entrada${n > 1 ? 's' : ''} · Total` : min ? 'Desde' : '';
    $('buybar-price').textContent = n ? `${total} Bs` : min ? `Bs ${min}` : 'Agotado';
    $('buybar-btn').textContent = n ? 'Continuar' : 'Ver entradas';
    $('buybar').style.display = min || n ? '' : 'none';
  }
  function tickCountdown() {
    if (!State.ev) return;
    const act = tierOf(State.ev),
      left = act && act.end ? new Date(act.end) - Date.now() : 0;
    $('countdown-container').style.display = left > 0 ? '' : 'none';
    if (left > 0) {
      $('h').textContent = String(Math.floor(left / 36e5)).padStart(2, '0');
      $('m').textContent = String(Math.floor((left % 36e5) / 6e4)).padStart(2, '0');
      $('s').textContent = String(Math.floor((left % 6e4) / 1e3)).padStart(2, '0');
    }
  }
  if (EVENT_ID) {
    setInterval(tickCountdown, 1000);
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div id="relacionadores-modal" class="fixed inset-0 z-[100] hidden flex items-center justify-center p-4 modal-bg"><div id="modal-content" class="panel glow w-full max-w-sm p-6 shadow-2xl scale-95 opacity-0 transition-all duration-300 relative"><div class="absolute top-0 left-0 w-full h-1 bg-brand"></div><div class="flex justify-between items-center mb-4 border-b border-white/10 pb-2"><h3 class="font-display text-2xl uppercase tracking-wide">Contactar staff</h3><button onclick="closeModal()" class="text-2xl font-bold hover:text-brand-light">&times;</button></div><p class="text-xs text-bone/60 mb-3">Elige a tu relacionador: se abrirá WhatsApp con tu pedido.</p><div id="relacionadores-list" class="overflow-y-auto max-h-[50vh] space-y-1 pr-1 custom-scroll"></div></div></div>`,
    );
  }
  window.changeQty = (k, d) => {
    Cart[k] = Math.max(0, Cart[k] + d);
    const e = $('qty-' + k);
    if (e) e.textContent = Cart[k];
    updateCart();
  };
  window.buyBar = () => (Object.values(Cart).some(Boolean) ? openModal() : $('tickets').scrollIntoView({ behavior: 'smooth' }));
  window.shareEvent = () => {
    const ev = State.ev,
      url = location.href,
      text = `${ev.name} · ${longDate(ev)} — ${SITE.name}`;
    navigator.share
      ? navigator.share({ title: ev.name, text, url }).catch(() => {})
      : window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank');
  };
  window.openModal = () => {
    const list = $('relacionadores-list');
    list.innerHTML = '';
    State.rels.forEach((rel) => {
      const b = document.createElement('button');
      b.className = 'w-full p-3 flex items-center justify-between text-left border-b border-white/10 hover:bg-brand transition-colors';
      b.innerHTML = `<span class="font-bold text-sm uppercase">${esc(rel.name)}</span><span>›</span>`;
      b.onclick = () => sendToWhatsapp(rel);
      list.appendChild(b);
    });
    $('relacionadores-modal').classList.remove('hidden');
    setTimeout(() => {
      $('modal-content').classList.remove('scale-95', 'opacity-0');
    }, 10);
    document.body.style.overflow = 'hidden';
  };
  window.closeModal = () => {
    $('modal-content').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      $('relacionadores-modal').classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  };
  /* Arma el mensaje de WhatsApp y registra la VENTA PENDIENTE para ese relacionador (sin frenar el envío si falla) */
  function sendToWhatsapp(rel) {
    const ev = State.ev,
      pr = pricesOf(ev),
      items = [];
    let total = 0;
    for (const k of Object.keys(Cart))
      if (Cart[k] > 0) {
        items.push({ k, label: labelOf(k, pr.tier), qty: Cart[k], price: pr[k] });
        total += Cart[k] * pr[k];
      }
    if (!items.length) return;
    const pid = uid();
    let text = `Hola ${rel.name}, quiero comprar entradas para *${ev.name}*:\n\n`;
    items.forEach((i) => {
      text += `▫️ ${i.qty} x ${i.label} (${i.qty * i.price} Bs)\n`;
    });
    text += `\n*TOTAL: ${total} Bs*\n_Pedido #${pid}_`;
    ready
      .then(() => {
        if (!State.error && rel.id)
          return DB.createPending({ id: pid, relId: rel.id, rel: rel.name, eventId: ev.id, event: ev.name, items, total, ts: Date.now(), status: 'pending' });
      })
      .catch((e) => console.error('No se pudo registrar el pedido', e));
    window.open(`https://wa.me/591${rel.phone}?text=${encodeURIComponent(text)}`, '_blank');
    closeModal();
  }

  /* ======================================================================
         8. LECTURA DEL COMPROBANTE (OCR + validaciones)
         ====================================================================== */
  const loadImage = (file) =>
    new Promise((ok, fail) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = fail;
      i.src = URL.createObjectURL(file);
    });
  function scaleImage(img, maxW) {
    const k = Math.min(1, maxW / img.width),
      c = document.createElement('canvas');
    c.width = img.width * k;
    c.height = img.height * k;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  async function ocr(canvas) {
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
    return (await Tesseract.recognize(canvas, 'spa+eng')).data.text;
  }
  /* Busca montos (junto a Bs/monto/importe/total) y el N° de comprobante en el texto leído */
  function parseReceipt(text, expected) {
    const amounts = [...text.matchAll(/(?:bs\.?|bob|monto|importe|total)\D{0,12}?(\d{1,6}(?:[.,]\d{1,2})?)|(\d{1,6}[.,]\d{2})\s*(?:bs|bob)/gi)].map((m) =>
      parseFloat((m[1] || m[2]).replace(',', '.')),
    );
    const id = text.match(/(?:comprobante|transacci[oó]n|operaci[oó]n|referencia|\bnro\.?|n[°º]|\bid\b)\D{0,12}?((?=[A-Z0-9]*\d)[A-Z0-9]{6,})/i);
    return { amountOk: amounts.some((n) => Math.abs(n - expected) < 0.01), amounts: [...new Set(amounts)], receiptId: id ? id[1].toUpperCase() : '' };
  }

  /* Fecha/hora impresa en el comprobante: dd/mm/aaaa, aaaa-mm-dd o "12 oct 2026", con hora hh:mm. Devuelve null si no la entiende */
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function parseReceiptDate(text) {
    const t = text.toLowerCase().replace(/,/g, ' ');
    const forms = [
      [/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4}|\d{2})\b/, (r) => [+r[1], +r[2], +r[3]]],
      [/(\d{4})-(\d{1,2})-(\d{1,2})/, (r) => [+r[3], +r[2], +r[1]]],
      [/(\d{1,2})\s*(?:de\s+)?(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\.?\s*(?:de\s+)?(\d{4})/, (r) => [+r[1], MONTHS.indexOf(r[2]) + 1, +r[3]]],
    ];
    for (const [re, pick] of forms) {
      const r = t.match(re);
      if (!r) continue;
      let [d, m, y] = pick(r);
      if (y < 100) y += 2000;
      if (m < 1 || m > 12 || d < 1 || d > 31) continue;
      const near = t.slice(Math.max(0, r.index - 40), r.index + r[0].length + 40); // la hora suele estar junto a la fecha
      const hm = near.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?/);
      let h = hm ? +hm[1] : 0;
      const min = hm ? +hm[2] : 0;
      if (hm && hm[3]) {
        if (/^p/.test(hm[3]) && h < 12) h += 12;
        if (/^a/.test(hm[3]) && h === 12) h = 0;
      }
      return { ts: new Date(y, m - 1, d, h, min).getTime(), hasTime: !!hm };
    }
    return null;
  }
  /* Compara con la hora del pedido. NUNCA bloquea: devuelve un texto de advertencia ('' si todo bien).
         Tolerancia de 10 min porque el reloj del celular del comprador puede no coincidir con el del banco. */
  function dateWarning(text, pendingTs) {
    const f = parseReceiptDate(text),
      tol = 10 * 60e3;
    if (!f) return `⚠️ No pude leer la fecha del comprobante: revísala a ojo (el pedido llegó ${fmtDate(pendingTs)}).`;
    const ok = f.hasTime ? f.ts >= pendingTs - tol : f.ts + 864e5 >= pendingTs - tol; // sin hora: se compara por día
    return ok
      ? ''
      : `⚠️ Parece que la fecha del comprobante (${fmtDate(f.ts)}) es ANTERIOR al pedido (${fmtDate(pendingTs)}). Verifica que sea el pago correcto.`;
  }

  /* ======================================================================
         9. ENTRADA CON QR (imagen para compartir)
         ====================================================================== */
  /* Imagen compartible (estilo ticket): tu fondo, QR en tarjeta blanca, ID, nombre y datos del evento */
  async function drawTicket(t) {
    await Promise.all([document.fonts.load('80px "Pirata One"'), document.fonts.load('700 28px Cinzel')]);
    await loadScript('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js');
    const W = 720,
      H = 1280,
      cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const x = cv.getContext('2d');
    const bg = await new Promise((r) => {
      const i = new Image();
      i.onload = () => r(i);
      i.onerror = () => r(null);
      i.src = QR_BACKGROUND;
    });
    if (bg) {
      const k = Math.max(W / bg.width, H / bg.height);
      x.drawImage(bg, (W - bg.width * k) / 2, (H - bg.height * k) / 2, bg.width * k, bg.height * k);
    } else {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#12040a');
      g.addColorStop(1, '#7d0a1c');
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
    }
    x.fillStyle = 'rgba(0,0,0,.4)';
    x.fillRect(0, 0, W, H);
    x.textAlign = 'center';
    x.fillStyle = '#eadfce';
    x.font = '700 28px Cinzel,Georgia,serif';
    x.fillText('S&N ENTERTAINMENT', W / 2, 150);
    x.fillStyle = '#fff';
    x.beginPath();
    x.roundRect(170, 250, 380, 470, 32);
    x.fill();
    const qr = qrcode(0, 'M');
    qr.addData('SNE:' + t.id);
    qr.make();
    const n = qr.getModuleCount(),
      m = Math.floor(320 / n),
      left = (W - m * n) / 2;
    x.fillStyle = '#000';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) x.fillRect(left + c * m, 280 + r * m, m, m);
    x.font = '800 44px Inter,sans-serif';
    x.fillText('#' + t.id, W / 2, 675);
    x.fillStyle = '#fff';
    x.font = '600 32px Inter,sans-serif';
    x.fillText(t.name, W / 2, 790, 620);
    x.fillStyle = '#eadfce';
    x.font = '130px "Pirata One",serif';
    x.fillText((t.event || '').toUpperCase(), W / 2, 960, 640);
    x.fillStyle = '#ff3b57';
    x.font = '700 30px Cinzel,Georgia,serif';
    x.fillText(`${t.eventDate || ''} · ${t.type.toUpperCase()}`, W / 2, 1050);
    x.fillStyle = '#fff';
    x.font = '600 26px Inter,sans-serif';
    x.fillText(`Válida para ${t.max > 1 ? t.max + ' ingresos' : '1 solo ingreso'}`, W / 2, 1110);
    return cv;
  }
  async function shareTicket(cv, t) {
    const file = new File([await toBlob(cv)], `entrada-${t.id}.png`, { type: 'image/png' });
    const text = `🎟️ Entrada ${t.event} — ${t.eventDate}\n${t.name}\nVálida para ${t.max > 1 ? t.max + ' ingresos' : '1 solo ingreso'}. Presentá este QR en puerta.`;
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      // celular: menú de compartir (WhatsApp)
      try {
        await navigator.share({ files: [file], text });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    await saveImage(cv, t); // computadora: descarga + abre WhatsApp
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }

  const toBlob = (cv) => new Promise((r) => cv.toBlob(r, 'image/png'));
  const saveImage = async (cv, t) => download(await toBlob(cv), `entrada-${t.id}.png`);

  const warnBox = (w) => (w ? `<p class="border border-yellow-500 text-yellow-300 text-sm p-3 mb-3">${esc(w)}</p>` : '');
  function ticketRow(t) {
    const b = document.createElement('button');
    b.className = 'w-full text-left border border-white/10 p-3 mb-2 flex justify-between gap-2 text-sm';
    b.innerHTML = `<span><b>${esc(t.name)}</b> · ${esc(t.type)}<br><span class="text-gray-400">#${t.id} · ${fmtDate(t.ts)}</span></span><span>${t.used >= t.max ? '✅ usada' : '🎟️ ver QR'}</span>`;
    b.onclick = () => ticketView(t);
    return b;
  }
  async function ticketView(t) {
    setTitle('🎟️ Entrada lista');
    body.innerHTML = '<p class="text-center text-gray-400">Generando…</p>';
    const cv = await drawTicket(t);
    cv.className = 'w-full max-w-xs mx-auto border-2 border-brand';
    body.innerHTML =
      warnBox(t.warn) +
      '<div id="t-c"></div><button id="t-s" class="btn mt-4" style="background:#25D366">📲 Compartir por WhatsApp</button><button id="t-d" class="btn2 mt-2">⬇️ Descargar imagen</button><button id="t-n" class="btn2 mt-2">← Volver</button>';
    $('t-c').appendChild(cv);
    $('t-s').onclick = () => shareTicket(cv, t);
    $('t-d').onclick = () => saveImage(cv, t);
    $('t-n').onclick = relView;
  }
  /* Compra con varias entradas: una lista; cada una abre su propio QR para compartir */
  function ticketsView(list) {
    setTitle('🎟️ ' + list.length + ' entradas');
    body.innerHTML =
      warnBox(list[0].warn) +
      '<p class="text-sm text-gray-300 mb-3">Toca cada entrada para compartir su QR.</p><div id="t-l"></div><button id="t-n" class="btn2 mt-3">← Volver</button>';
    list.forEach((t) => $('t-l').appendChild(ticketRow(t)));
    $('t-n').onclick = relView;
  }

  /* ======================================================================
         10. PANEL: acceso y vista del RELACIONADOR
         ====================================================================== */
  const setTitle = (t, wide) => {
    $('ov-t').textContent = t;
    $('ov-c').className = (wide ? 'max-w-3xl' : 'max-w-md') + ' mx-auto p-4 pt-6 pb-16';
  };

  function loginView(view, tab) {
    setTitle({ rel: '🎃 Relacionador', gate: '🚪 Puerta', admin: '⚙️ Administración' }[view]);
    body.innerHTML =
      (view === 'rel'
        ? `<label class="lb">Tu nombre</label><select id="l-n" class="fld mb-3">${State.rels.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select>`
        : '') +
      '<label class="lb">PIN</label><input id="pin" type="password" autocomplete="off" autocapitalize="off" class="fld mb-1"><label class="text-xs text-gray-400 block mb-3"><input id="pin-s" type="checkbox"> Mostrar PIN</label><button id="pin-b" class="btn">Entrar</button><p id="pin-e" class="text-red-400 text-sm mt-2"></p><p class="text-[10px] text-gray-600 mt-8">Versión ' +
      APP_VERSION +
      '</p>';
    $('pin-b').onclick = () => {
      const pin = hashPin($('pin').value);
      let ok = false;
      if (view === 'rel') {
        const r = State.rels.find((r) => r.id === $('l-n').value);
        ok = !!r && r.pin === pin;
        if (ok) sessionStorage.setItem('rel', r.id);
      } else {
        ok = pin === (view === 'gate' ? State.sec.dpin : State.sec.apin);
        if (ok) sessionStorage.setItem(view, '1');
      }
      ok ? route(view, tab) : ($('pin-e').textContent = 'PIN incorrecto');
    };
    $('pin').onkeydown = (e) => {
      if (e.key === 'Enter') $('pin-b').click();
    }; // sin 'return false': eso bloqueaba las teclas
    $('pin-s').onchange = (e) => {
      $('pin').type = e.target.checked ? 'text' : 'password';
    };
  }

  let me = null,
    lastReceipt = null,
    pendingSel = null,
    pendingList = [],
    unsubPending = null;
  const stopPendingWatch = () => {
    if (unsubPending) {
      unsubPending();
      unsubPending = null;
    }
  };

  function relView() {
    me = State.rels.find((r) => r.id === sessionStorage.getItem('rel'));
    if (!me) return loginView('rel');
    stopPendingWatch();
    pendingList = [];
    if (pendingSel && pendingSel.relId !== me.id) pendingSel = null;
    setTitle('🎃 ' + me.name);
    body.innerHTML = `<h3 class="font-display text-xl mb-2">📥 Ventas pendientes</h3><div id="r-pend" class="mb-6"></div><div id="r-form"></div>
    <h3 class="font-display text-xl mt-6 mb-2">Mis entradas</h3><div id="r-list"></div>
    <details class="mt-6 border border-white/10 p-3"><summary class="lb cursor-pointer">Cambiar mi PIN</summary><input id="o-p" type="password" class="fld my-2" placeholder="PIN actual"><input id="n-p" type="password" class="fld mb-2" placeholder="Nuevo PIN (mín. 4)"><button id="p-go" class="btn2">Guardar PIN</button></details>
    <button class="btn2 mt-4" onclick="Staff.logout()">Cerrar sesión</button>`;
    renderForm();
    renderPending();
    unsubPending = DB.watchPending(me.id, (list) => {
      pendingList = list;
      renderPending();
    }); // llegan en vivo
    $('p-go').onclick = async () => {
      if (hashPin($('o-p').value) !== me.pin) return alert('PIN actual incorrecto');
      if (cleanPin($('n-p').value).length < 4) return alert('Mínimo 4 caracteres');
      me.pin = hashPin($('n-p').value);
      await saveRels();
      alert('PIN cambiado ✔');
      relView();
    };
    DB.listTickets().then((all) => {
      // solo se muestran SUS entradas
      const box = $('r-list');
      if (!box) return;
      const mine = all.filter((t) => t.relId === me.id);
      box.innerHTML = mine.length ? '' : '<p class="text-gray-500 text-sm">Aún no hay entradas.</p>';
      mine.forEach((t) => box.appendChild(ticketRow(t)));
    });
  }
  const itemsText = (items) => items.map((i) => `${i.qty}× ${esc(i.label)}`).join(' · ');

  /* Lista de pedidos pendientes de este relacionador */
  function renderPending() {
    const box = $('r-pend');
    if (!box) return;
    if (pendingSel && !pendingList.some((p) => p.id === pendingSel.id)) {
      pendingSel = null;
      renderForm();
    } // ya se concretó
    box.innerHTML = pendingList.length ? '' : '<p class="text-gray-500 text-sm">No hay pedidos nuevos.</p>';
    pendingList.forEach((p) => {
      const b = document.createElement('button');
      b.className = 'w-full text-left border p-3 mb-2 text-sm ' + (pendingSel && pendingSel.id === p.id ? 'border-brand bg-black' : 'border-white/10');
      b.innerHTML = `<b class="text-brand">#${p.id}</b> · ${fmtDate(p.ts)} · <b>${p.total} Bs</b><br><span class="text-gray-300">${esc(p.event || '')} · ${itemsText(p.items)}</span>`;
      b.onclick = () => {
        pendingSel = p;
        lastReceipt = null;
        renderForm();
        renderPending();
      };
      box.appendChild(b);
    });
  }
  /* Formulario: concretar el pedido elegido, o venta directa (sin pedido previo) */
  let directEv = null;
  function renderForm() {
    const f = $('r-form');
    if (!f) return;
    const evs = State.events.filter((e) => e.published !== false && pricesOf(e).tier);
    if (!evs.some((e) => e.id === directEv)) directEv = (evs.find((e) => e.id === EVENT_ID) || evs[0] || {}).id;
    const ev = evs.find((e) => e.id === directEv),
      pr = ev ? pricesOf(ev) : null;
    const options = pr
      ? Object.entries(TICKET_TYPES)
          .filter(([k]) => pr[k])
          .map(([k, T]) => `<option value="${k}">${T.label} · ${pr[k]} Bs</option>`)
          .join('')
      : '';
    const what = pendingSel
      ? `<div class="border border-brand p-3 mb-3 text-sm"><b>Pedido #${pendingSel.id}</b> · ${esc(pendingSel.event || '')} · ${pendingSel.total} Bs<br>${itemsText(pendingSel.items)}<br><a href="#" id="r-cancel" class="text-xs text-gray-400 underline">Cancelar y hacer venta directa</a></div>`
      : `<label class="lb">Venta directa · evento</label><select id="r-ev" class="fld mb-3">${evs.map((e) => `<option value="${e.id}" ${e.id === directEv ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select><label class="lb">Tipo de entrada</label><select id="r-type" class="fld mb-3">${options}</select>`;
    f.innerHTML =
      pendingSel || options
        ? what +
          `
    <label class="lb">Nombre completo del comprador</label><input id="r-name" class="fld mb-3" placeholder="Ej: María José Sarabia">
    <label class="lb">Comprobante de pago</label><input id="r-file" type="file" accept="image/*" class="fld mb-3">
    <div id="r-rid-w" class="hidden"><label class="lb">N° de comprobante (no se pudo leer)</label><input id="r-rid" class="fld mb-3"></div>
    <button id="r-go" class="btn">Comprobar y generar QR</button><p id="r-msg" class="text-sm mt-3"></p>`
        : '<p class="text-brand-light font-bold">Entradas agotadas.</p>';
    if ($('r-go')) $('r-go').onclick = submitReceipt;
    if ($('r-ev'))
      $('r-ev').onchange = (e) => {
        directEv = e.target.value;
        lastReceipt = null;
        renderForm();
      };
    if ($('r-cancel'))
      $('r-cancel').onclick = (e) => {
        e.preventDefault();
        pendingSel = null;
        lastReceipt = null;
        renderForm();
        renderPending();
      };
  }

  /* Flujo: validar datos → leer comprobante → comprobar monto → comprobar duplicados → (aviso de fecha) → crear entradas */
  async function submitReceipt() {
    const msg = (html) => ($('r-msg').innerHTML = html);
    const name = $('r-name').value.trim().replace(/\s+/g, ' '),
      file = $('r-file').files[0];
    let sale; // qué se está cobrando: el pedido pendiente elegido o una venta directa
    if (pendingSel)
      sale = {
        pid: pendingSel.id,
        ts: pendingSel.ts,
        eventId: pendingSel.eventId,
        eventName: pendingSel.event,
        expected: pendingSel.total,
        units: pendingSel.items.flatMap((i) => Array(i.qty).fill({ k: i.k, price: i.price })),
      };
    else {
      const k = $('r-type').value,
        ev = State.events.find((e) => e.id === directEv),
        price = pricesOf(ev)[k];
      sale = { eventId: ev.id, expected: price, units: [{ k, price }] };
    }
    if (name.split(' ').length < 2) return msg('⚠️ Escribe nombre y apellido.');
    if (!file) return msg('⚠️ Sube el comprobante.');
    $('r-go').disabled = true;
    try {
      msg('⏳ Leyendo comprobante… (puede tardar unos segundos)');
      const img = await loadImage(file),
        small = scaleImage(img, 720).toDataURL('image/jpeg', 0.6);
      if (!lastReceipt || lastReceipt.file !== file || lastReceipt.expected !== sale.expected) {
        const text = await ocr(scaleImage(img, 1600));
        lastReceipt = { file, expected: sale.expected, text, parsed: parseReceipt(text, sale.expected) };
      }
      const p = lastReceipt.parsed;
      if (!p.amountOk)
        return msg(
          `❌ El monto no coincide. Se esperan <b>${sale.expected} Bs</b>. Leído: ${p.amounts.join(', ') || 'ningún monto'}. Prueba con una captura más clara.`,
        );
      const rid = ($('r-rid').value || p.receiptId).replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (!rid) {
        $('r-rid-w').classList.remove('hidden');
        return msg('✍️ Monto correcto ✔. Escribe el N° de comprobante y toca de nuevo el botón.');
      }
      const warn = sale.pid ? dateWarning(lastReceipt.text, sale.ts) : ''; // solo advertencia, no bloquea
      const ev = State.events.find((e) => e.id === sale.eventId),
        now = Date.now(),
        imgHash = hash(small);
      const info = { eventId: sale.eventId || '', event: ev ? ev.name : sale.eventName || '', eventDate: ev ? dayLabel(ev) : '' };
      const tickets = sale.units.map((u) => ({
        id: uid(),
        name,
        relId: me.id,
        rel: me.name,
        type: TICKET_TYPES[u.k].label,
        max: TICKET_TYPES[u.k].seats,
        used: 0,
        amount: u.price,
        rid,
        hash: imgHash,
        ts: now,
        ...info,
        ...(sale.pid && { pid: sale.pid }),
        ...(warn && { warn }),
      }));
      await DB.createTickets(tickets, small, sale.pid);
      pendingSel = null;
      tickets.length === 1 ? ticketView(tickets[0]) : ticketsView(tickets);
    } catch (e) {
      msg(e.message === 'DUP' ? '❌ Este comprobante ya fue utilizado.' : '⚠️ Error: ' + esc(e.message));
    } finally {
      if ($('r-go')) $('r-go').disabled = false;
    }
  }

  /* ======================================================================
         11. PUERTA (cámara + verificación contra Firestore)
         ====================================================================== */
  let stream = null,
    rafId = 0,
    scanLocked = false;
  function stopCamera() {
    cancelAnimationFrame(rafId);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  function scanResult(ok, title, detail) {
    const r = $('g-r');
    r.className = 'mt-3 p-5 text-center font-bold ' + (ok ? 'bg-green-700' : 'bg-red-700');
    r.innerHTML = `<div class="text-2xl">${title}</div><div class="text-base font-normal mt-1">${detail}</div>`;
    if (navigator.vibrate) navigator.vibrate(ok ? 120 : [200, 80, 200]);
  }
  async function checkTicket(raw) {
    const id = raw
      .replace(/^[A-Za-z]+:/, '')
      .replace(/[^A-Fa-f0-9]/g, '')
      .toUpperCase();
    if (!id) return scanResult(false, '❌ QR NO REGISTRADO', 'Código inválido');
    try {
      const res = await DB.useTicket(id);
      if (res.r === 'ok') scanResult(true, '✅ ENTRADA VÁLIDA', `${esc(res.t.name)} · ${esc(res.t.event || '')}<br>Ingreso ${res.t.used} de ${res.t.max}`);
      else if (res.r === 'used')
        scanResult(
          false,
          '⛔ YA UTILIZADA',
          `${esc(res.t.name)} · ${esc(res.t.event || '')}<br>Último ingreso: ${fmtDate(res.t.scans[res.t.scans.length - 1])}`,
        );
      else scanResult(false, '❌ QR NO REGISTRADO', 'No existe en la base de datos');
    } catch (e) {
      scanResult(false, '⚠️ Error', esc(e.message));
    }
  }
  async function startCamera() {
    if (!navigator.mediaDevices) return scanResult(false, '📷 Sin cámara', 'La cámara requiere https (Netlify lo da) o localhost');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch (e) {
      return scanResult(false, '📷 Sin cámara', 'Permite el acceso a la cámara en el navegador');
    }
    const video = $('g-v');
    video.srcObject = stream;
    await video.play();
    await loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js');
    const cv = document.createElement('canvas'),
      x = cv.getContext('2d', { willReadFrequently: true });
    const loop = () => {
      if (!stream) return;
      if (!scanLocked && video.videoWidth) {
        const k = Math.min(1, 640 / video.videoWidth);
        cv.width = video.videoWidth * k;
        cv.height = video.videoHeight * k;
        x.drawImage(video, 0, 0, cv.width, cv.height);
        const code = jsQR(x.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data.startsWith('SNE:')) {
          scanLocked = true;
          checkTicket(code.data).then(() => setTimeout(() => (scanLocked = false), 2500));
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    loop();
  }
  function gateView() {
    setTitle('🚪 Puerta');
    body.innerHTML =
      '<video id="g-v" playsinline muted class="w-full bg-black aspect-square object-cover border-2 border-brand"></video><button id="g-b" class="btn mt-3">📷 Activar cámara</button><div id="g-r" class="mt-3 p-5 text-center hidden"></div><div class="mt-4 flex gap-2"><input id="g-m" class="fld" placeholder="o escribe el ID (ej: 3C5AE2)"><button id="g-mb" class="btn2" style="width:auto;padding:0 18px">OK</button></div><button class="btn2 mt-4" onclick="Staff.logout()">Cerrar sesión</button>';
    $('g-b').onclick = startCamera;
    $('g-mb').onclick = () => checkTicket($('g-m').value);
  }

  /* ======================================================================
   12. ADMINISTRACIÓN (solo en el inicio): eventos · relacionadores · entradas · seguridad
   ====================================================================== */
  let adminTab = 'ev',
    draft = null,
    tkEv = '';
  const ADMIN_TABS = [
    ['ev', 'Eventos'],
    ['rel', 'Relacionadores'],
    ['tk', 'Entradas'],
    ['sec', 'Seguridad'],
  ];
  async function adminView(tab) {
    adminTab = tab || adminTab;
    setTitle('⚙️ Administración', true);
    body.innerHTML = `<div class="flex flex-wrap gap-2 mb-4">${ADMIN_TABS.map(([k, n]) => `<button class="${k === adminTab ? 'btn' : 'btn2'}" style="width:auto;padding:8px 12px" onclick="A.go('${k}')">${n}</button>`).join('')}<button class="btn2" style="width:auto;padding:8px 12px" onclick="Staff.logout()">Salir</button></div><div id="ab"></div>`;
    $('ab').innerHTML = await { ev: tabEvents, rel: tabRels, tk: tabTickets, sec: tabSecurity }[adminTab]();
    if (State.sec.apin === hashPin(DEFAULT_ADMIN))
      $('ab').insertAdjacentHTML(
        'afterbegin',
        '<p class="border border-yellow-500 text-yellow-300 text-sm p-3 mb-3">⚠️ Sigues usando el PIN de fábrica. Cámbialo en la pestaña <b>Seguridad</b>.</p>',
      );
  }
  const small = 'style="width:auto;padding:8px 12px"';
  const inp = (id, label, val, type = 'text') =>
    `<div><label class="lb">${label}</label><input id="${id}" type="${type}" class="fld mb-3" value="${esc(val)}"></div>`;
  const tierRow = (t, i) =>
    `<div class="border border-white/10 p-2 mb-2 grid grid-cols-2 gap-2" data-t="${i}"><input class="fld col-span-2" data-f="n" value="${esc(t.n)}" placeholder="Nombre (TIER 1)"><div><span class="lb">Hombre Bs</span><input class="fld" type="number" data-f="m" value="${t.m}"></div><div><span class="lb">Mujer Bs</span><input class="fld" type="number" data-f="w" value="${t.w}"></div><div><span class="lb">Pareja Bs</span><input class="fld" type="number" data-f="c" value="${t.c}"></div><div><span class="lb">Termina</span><input class="fld" type="datetime-local" data-f="end" value="${t.end}"></div><label class="text-sm"><input type="checkbox" data-f="sold" ${t.sold ? 'checked' : ''}> Agotado</label><button class="btn2" onclick="A.tierDel(${i})">🗑 Quitar</button></div>`;

  function tabEvents() {
    if (!draft)
      return (
        `<button class="btn mb-3" onclick="A.evNew()">+ Nuevo evento</button>` +
        (State.events
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(
            (ev) =>
              `<div class="border border-white/10 p-3 mb-2 text-sm flex justify-between items-center gap-2"><span class="min-w-0"><b>${esc(ev.name)}</b>${ev.published === false ? ' 🙈' : ''}<br><span class="text-gray-400">${esc(ev.date)} · ${esc(ev.slug)}</span></span><span class="flex gap-2 flex-none"><a class="btn2" ${small} href="${esc(ev.slug)}" target="_blank">Abrir</a><button class="btn2" ${small} onclick="A.evEdit('${ev.id}')">Editar</button></span></div>`,
          )
          .join('') || '<p class="text-gray-500">Aún no hay eventos.</p>')
      );
    const d = draft;
    return `<h3 class="font-display text-2xl mb-3">${d.isNew ? 'Nuevo evento' : 'Editar: ' + esc(d.name)}</h3>
    <div class="grid md:grid-cols-2 gap-x-4">${inp('e-name', 'Nombre del evento', d.name)}${inp('e-slug', 'Enlace de la página (nombre del archivo, sin .html)', d.slug)}${inp('e-date', 'Fecha', d.date, 'date')}${inp('e-time', 'Hora (ej: 21:00)', d.time)}${inp('e-venue', 'Lugar', d.venue)}${inp('e-address', 'Dirección / ciudad', d.address)}${inp('e-flyer', 'Imagen del flyer (archivo)', d.flyer)}${inp('e-gallery', 'Galería (archivos separados por coma)', d.gallery)}${inp('e-lineup', 'Line up (separado por comas)', d.lineup)}${inp('e-sponsors', 'Auspiciadores (separados por comas)', d.sponsors)}${inp('e-age', 'Edad (ej: +18; vacío = sin aviso)', d.age)}${inp('e-banner', 'Aviso del lote (vacío = oculto)', d.banner)}${inp('e-mapurl', 'Link del botón "Ver ubicación"', d.mapUrl)}${inp('e-mapq', 'Dirección o coordenadas del mini mapa', d.mapQ)}</div>
    <label class="lb">Descripción</label><textarea id="e-desc" rows="5" class="fld mb-3">${esc(d.description)}</textarea>
    <label class="text-sm block mb-5"><input id="e-pub" type="checkbox" ${d.published !== false ? 'checked' : ''}> Visible en el inicio</label>
    <h4 class="font-display text-xl mb-1">Lotes y precios</h4><p class="text-xs text-gray-400 mb-2">El lote activo es el primero que no esté agotado ni vencido. Al marcar "Agotado" o pasar su fecha, pasa al siguiente.</p>
    ${d.tiers.map(tierRow).join('')}<button class="btn2 mb-4" onclick="A.tierAdd()">+ Añadir tier / lote</button>
    <div class="flex gap-2"><button class="btn" onclick="A.evSave()">Guardar</button><button class="btn2" onclick="A.evBack()">Volver</button></div>
    ${d.isNew ? '<p class="text-xs text-gray-400 mt-4">Para que este evento tenga página propia: duplica <b>DARK-GARDEN-31-10-2026.html</b>, ponle el nombre del enlace y cambia el <b>data-event</b> del &lt;body&gt; por el identificador (el enlace en minúsculas).</p>' : `<button class="btn2 mt-4" style="border-color:#b91c1c;color:#f87171" onclick="A.evDel()">🗑 Eliminar evento</button>`}`;
  }
  function readDraft() {
    // vuelca el formulario al borrador (antes de añadir/quitar lotes o guardar)
    const v = (id) => $(id).value.trim();
    Object.assign(draft, {
      name: v('e-name'),
      slug: v('e-slug'),
      date: v('e-date'),
      time: v('e-time'),
      venue: v('e-venue'),
      address: v('e-address'),
      flyer: v('e-flyer'),
      gallery: v('e-gallery'),
      lineup: v('e-lineup'),
      sponsors: v('e-sponsors'),
      age: v('e-age'),
      banner: v('e-banner'),
      mapUrl: v('e-mapurl'),
      mapQ: v('e-mapq'),
      description: $('e-desc').value.trim(),
      published: $('e-pub').checked,
    });
    draft.tiers = [...document.querySelectorAll('[data-t]')].map((r) => {
      const o = {};
      r.querySelectorAll('[data-f]').forEach((e) => {
        o[e.dataset.f] = e.type === 'checkbox' ? e.checked : e.value;
      });
      return o;
    });
  }
  const tabRels = () =>
    `<div id="ar">${State.rels.map((r, i) => `<div class="border border-white/10 p-2 mb-2"><input class="fld mb-1" data-i="${i}" data-f="name" value="${esc(r.name)}"><input class="fld mb-2" data-i="${i}" data-f="phone" value="${esc(r.phone)}" placeholder="Teléfono"><div class="flex gap-2"><button class="btn2" onclick="A.relReset(${i})">Reset PIN → ${DEFAULT_PIN}</button><button class="btn2" onclick="A.relDel(${i})">🗑 Quitar</button></div></div>`).join('')}</div><button class="btn2 mb-2" onclick="A.relAdd()">+ Añadir relacionador</button><button class="btn" onclick="A.relSave()">Guardar cambios</button>`;
  async function tabTickets() {
    const all = (await DB.listTickets()).filter((t) => !tkEv || t.eventId === tkEv);
    const opts =
      '<option value="">Todos los eventos</option>' +
      State.events.map((e) => `<option value="${e.id}" ${e.id === tkEv ? 'selected' : ''}>${esc(e.name)}</option>`).join('');
    return (
      `<select class="fld mb-3" onchange="A.tkFilter(this.value)">${opts}</select><p class="text-sm text-gray-400 mb-3">${all.length} entradas · ${all.reduce((s, t) => s + t.amount, 0)} Bs</p>` +
      (all
        .map(
          (t) =>
            `<div class="border border-white/10 p-3 mb-2 text-sm"><b class="text-brand-light">#${t.id}</b> · ${esc(t.type)} · ${t.amount} Bs · <span class="text-bone/70">${esc(t.event || '—')}</span><br>Comprador: <b>${esc(t.name)}</b><br>Vendió: ${esc(t.rel)}<br><span class="text-gray-400">${fmtDate(t.ts)} · ingresos ${t.used}/${t.max}</span>${t.warn ? `<br><span class="text-yellow-300">${esc(t.warn)}</span>` : ''}<div class="flex gap-2 mt-2"><button class="btn2" onclick="A.tkImg('${t.rid}')">Ver comprobante</button><button class="btn2" onclick="A.tkDel('${t.id}')">Anular</button></div></div>`,
        )
        .join('') || '<p class="text-gray-500">Aún no hay entradas.</p>')
    );
  }
  const tabSecurity = () => `
  <h3 class="font-display text-xl mb-2">🔑 PIN de administrador</h3>
  <input id="s-oa" type="password" class="fld mb-2" placeholder="PIN actual"><input id="s-a" type="password" class="fld mb-2" placeholder="Nuevo PIN (mín. 4)"><input id="s-a2" type="password" class="fld mb-3" placeholder="Repite el nuevo PIN">
  <button class="btn mb-8" onclick="A.adminPinSave()">Cambiar PIN de administrador</button>
  <h3 class="font-display text-xl mb-2">🚪 PIN de la puerta</h3>
  <input id="s-d" type="password" class="fld mb-3" placeholder="Nuevo PIN de puerta (mín. 4)"><button class="btn" onclick="A.gatePinSave()">Guardar PIN de puerta</button>
  <p class="text-xs text-green-400 mt-4">✅ Los PINs se guardan en Firebase (no en texto plano), igual que los de los relacionadores. Los relacionadores cambian el suyo desde su panel; aquí puedes resetearlos (pestaña Relacionadores).</p>
  <p class="text-[10px] text-gray-600 mt-6">Versión ${APP_VERSION}</p>`;

  /* Acciones de los botones del panel (se llaman desde onclick="A.xxx()") */
  const A = (window.A = {
    go: (tab) => {
      draft = null;
      adminView(tab);
    },
    /* eventos */
    evNew() {
      draft = {
        isNew: true,
        name: '',
        slug: '',
        date: '',
        time: '21:00',
        venue: '',
        address: '',
        flyer: 'image1.png',
        gallery: '',
        lineup: '',
        sponsors: '',
        age: '+18',
        banner: '',
        mapUrl: '',
        mapQ: '',
        description: '',
        published: true,
        tiers: [{ n: 'TIER 1', m: 0, w: 0, c: 0, end: '', sold: false }],
      };
      adminView('ev');
    },
    evEdit(id) {
      draft = JSON.parse(JSON.stringify(State.events.find((e) => e.id === id)));
      adminView('ev');
    },
    evBack() {
      draft = null;
      adminView('ev');
    },
    tierAdd() {
      readDraft();
      draft.tiers.push({ n: 'TIER ' + (draft.tiers.length + 1), m: 0, w: 0, c: 0, end: '', sold: false });
      adminView('ev');
    },
    tierDel(i) {
      readDraft();
      draft.tiers.splice(i, 1);
      adminView('ev');
    },
    async evSave() {
      readDraft();
      const d = draft;
      if (!d.name || !d.date || !/^[A-Za-z0-9-]+$/.test(d.slug)) return alert('Completa nombre y fecha. El enlace solo puede tener letras, números y guiones.');
      if (d.isNew) {
        d.id = d.slug.toLowerCase();
        if (State.events.some((e) => e.id === d.id)) return alert('Ya existe un evento con ese enlace.');
      }
      const { isNew, ...ev } = d;
      await DB.saveEvent(ev);
      State.events = await DB.listEvents();
      draft = null;
      render();
      alert('Evento guardado en Firebase ✔');
      adminView('ev');
    },
    async evDel() {
      if (!confirm('¿Eliminar "' + draft.name + '"? Las entradas ya vendidas se conservan.')) return;
      await DB.deleteEvent(draft.id);
      State.events = await DB.listEvents();
      draft = null;
      render();
      adminView('ev');
    },
    /* relacionadores */
    readRels() {
      document.querySelectorAll('#ar [data-i]').forEach((e) => {
        State.rels[e.dataset.i][e.dataset.f] = e.value.trim();
      });
    },
    relAdd() {
      A.readRels();
      State.rels.push({ id: uid(), name: 'Nuevo relacionador', phone: '', pin: hashPin(DEFAULT_PIN) });
      adminView();
    },
    relDel(i) {
      A.readRels();
      if (confirm('¿Quitar a ' + State.rels[i].name + '?')) {
        State.rels.splice(i, 1);
        adminView();
      }
    },
    async relReset(i) {
      A.readRels();
      State.rels[i].pin = hashPin(DEFAULT_PIN);
      await saveRels();
      alert('PIN restablecido a ' + DEFAULT_PIN);
    },
    async relSave() {
      A.readRels();
      await saveRels();
      alert('Guardado ✔');
    },
    /* entradas */
    tkFilter(v) {
      tkEv = v;
      adminView('tk');
    },
    async tkImg(rid) {
      const r = await DB.getReceipt(rid);
      if (!r || !r.img) return alert('Sin comprobante');
      window.open('').document.write(`<img src="${r.img}" style="max-width:100%">`);
    },
    async tkDel(id) {
      if (confirm('¿Anular la entrada #' + id + '? Se libera su comprobante.')) {
        await DB.deleteTicket(id);
        adminView();
      }
    },
    /* PINs */
    async adminPinSave() {
      if (hashPin($('s-oa').value) !== State.sec.apin) return alert('El PIN actual no es correcto');
      const n = cleanPin($('s-a').value);
      if (n.length < 4) return alert('El nuevo PIN debe tener mínimo 4 caracteres');
      if (n !== cleanPin($('s-a2').value)) return alert('Los dos PIN nuevos no coinciden');
      State.sec.apin = hashPin(n);
      await saveSec();
      alert('PIN de administrador cambiado y guardado en Firebase ✔');
      adminView();
    },
    async gatePinSave() {
      const n = cleanPin($('s-d').value);
      if (n.length < 4) return alert('Mínimo 4 caracteres');
      State.sec.dpin = hashPin(n);
      await saveSec();
      alert('PIN de puerta guardado en Firebase ✔');
      adminView();
    },
  });

  /* cada minuto: relee eventos y lotes (si no hay un panel abierto) para que todos vean los cambios */
  setInterval(() => {
    if (!State.error && !ov.classList.contains('on')) loadState().catch(console.error);
    else render();
  }, 60000);
  /* ======================================================================
         13. ROUTER DEL PANEL (abrir / cerrar / sesión)
         ====================================================================== */
  function route(view, tab) {
    stopCamera();
    stopPendingWatch();
    ({ rel: relView, gate: gateView, admin: adminView })[view](tab);
  }
  function connectionError() {
    setTitle('⚠️ Sin conexión');
    body.innerHTML = `<p class="text-red-400 mb-3">No se pudo conectar con la base de datos.</p><p class="text-sm text-gray-400">Revisa que <b>Authentication → Anónimo</b> esté activado y que las reglas de Firestore estén publicadas.<br><br><code>${esc(State.error && State.error.message)}</code></p>`;
  }
  window.Staff = {
    async open(view, tab) {
      if (view === 'admin' && !IS_HOME) return; // el administrador solo existe en el inicio
      await ready;
      ov.classList.add('on');
      document.body.style.overflow = 'hidden';
      if (State.error) return connectionError();
      sessionStorage.getItem(view) ? route(view, tab) : loginView(view, tab);
    },
    close() {
      stopCamera();
      stopPendingWatch();
      ov.classList.remove('on');
      document.body.style.overflow = '';
    },
    logout() {
      sessionStorage.clear();
      Staff.close();
    },
  };
})();
