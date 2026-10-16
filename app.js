/* =====================================================================
   S&N ENTERTAINMENT · lógica compartida (inicio, eventos, compra, puerta y administración)
   Secciones: 1 Configuración · 2 Utilidades · 3 Base de datos y sesión · 4 Estado y arranque
              5 Menú, pie y textos legales · 6 Inicio · 7 Página de evento · 8 Compra (pasarela)
              9 Verificación del comprobante · 10 Entrada con QR · 11 Acceso del personal
              12 Puerta · 13 Administración
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
  const APPCHECK_SITE_KEY = ''; // opcional: clave reCAPTCHA v3 de Firebase App Check (ver LEEME)
  const ADMIN_EMAIL = 'sn.entertainment.bo@gmail.com'; // cuenta del administrador (debe existir en Firebase Authentication)
  const DOOR_EMAIL = 'puerta@sn-entertainment.bo'; // cuenta de la puerta (también en Authentication)
  /* Titular del QR de pago. El archivo debe coincidir con esta huella SHA-256 o NO se muestra. */
  const PAYEE = {
    name: 'HUGO RAFAEL ZUÑIGA DAZA',
    tokens: ['HUGO', 'RAFAEL', 'ZUNIGA', 'DAZA'],
    qr: 'qr-entrada.png',
    sha256: 'ef1b34c8fd1157f39ae3f0b33f4809a10ada8a40476e2266c745054974c95fdb',
  };
  const FEE_PER_ENTRY = 2; // Bs de ganancia de Hugo por entrada (por persona)
  const MAX_PER_ORDER = 8; // entradas máximas por compra
  const SITE = {
    name: 'S&N Entertainment',
    group: 'SOL & NOX HOSPITALITY GROUP — BOLIVIA',
    city: 'Santa Cruz, Bolivia',
    phones: [
      { label: '+591 69246105', wa: '59169246105' },
      { label: '+591 78725429', wa: '59178725429' },
      { label: '+591 68812583', wa: '59168812583' },
    ],
    email: 'sn.entertainment.bo@gmail.com',
    facebook: 'https://www.facebook.com/', // pon aquí los enlaces reales de las redes
    instagram: 'https://www.instagram.com/',
    tiktok: 'https://www.tiktok.com/',
  };
  const QR_BACKGROUND = 'qr-fondo.png'; // fondo de la imagen de cada entrada
  const APP_VERSION = 'v9 · S&N Entertainment'; // sello visible en el acceso del personal
  const TICKET_TYPES = {
    // field = columna de precio dentro de cada lote
    man: { label: 'Hombre', plural: 'Hombres', seats: 1, field: 'm' },
    woman: { label: 'Mujer', plural: 'Mujeres', seats: 1, field: 'w' },
    couple: { label: 'Pareja', plural: 'Parejas', seats: 2, field: 'c' },
  };
  const EVENT_ID = document.body.dataset.event || null; // viene de <body data-event="..."> en la página de cada evento
  const IS_HOME = !EVENT_ID;
  const MONTHS_ES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const ICON = {
    wa: 'M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z',
    ig: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
    fb: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
    tt: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  };
  /* Evento inicial: lo crea el administrador la primera vez que entra (después se edita desde Administración) */
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
  /* Textos legales base (revísalos con tu asesor legal) */
  const LEGAL = {
    terminos: {
      t: 'Términos y condiciones',
      h: '<p>Cada entrada incluye un código QR único, válido para un solo ingreso (las parejas, para dos). El pago se realiza únicamente al QR oficial de S&N Entertainment que se muestra al comprar, a nombre del titular indicado.</p><p>La organización puede desactivar cualquier entrada ante irregularidades en el pago o en el comprobante. Se reserva el derecho de admisión. Los eventos pueden tener restricción de edad.</p>',
    },
    privacidad: {
      t: 'Política de privacidad',
      h:
        '<p>Pedimos tu nombre, correo y teléfono solo para gestionar tu compra y contactarte si hay un problema con tu comprobante. No vendemos ni compartimos tus datos con terceros.</p><p>El comprobante se conserva para verificar el pago. Puedes pedir que eliminemos tus datos escribiendo a ' +
        SITE.email +
        '.</p>',
    },
    reembolsos: {
      t: 'Reembolsos',
      h: '<p>Las entradas no son reembolsables, salvo cancelación del evento por parte de la organización. En ese caso nos comunicaremos contigo por WhatsApp o correo para devolverte el monto.</p>',
    },
  };
  const OVERLAY_HTML = `<div id="ov" class="ov"><div id="ov-c" class="max-w-md mx-auto p-4 pt-6 pb-16"><div class="flex justify-between items-center mb-5"><h2 id="ov-t" class="font-serif text-4xl"></h2><button onclick="Staff.close()" class="text-4xl leading-none" aria-label="Cerrar">&times;</button></div><div id="ov-b"></div></div></div>
<div id="lg" class="fixed inset-0 z-[130] hidden items-center justify-center p-4 bg-black/85"><div class="panel glow max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"><div class="flex justify-between items-center mb-3"><h3 id="lg-t" class="font-serif text-3xl"></h3><button onclick="Legal()" class="text-3xl leading-none">&times;</button></div><div id="lg-b" class="text-sm text-bone/80 space-y-3"></div></div></div>`;

  /* ======================================================================
   2. UTILIDADES
   ====================================================================== */
  const $ = (id) => document.getElementById(id);
  document.body.insertAdjacentHTML('beforeend', OVERLAY_HTML);
  const ov = $('ov'),
    body = $('ov-b');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
  const ms = (x) => (x && x.toMillis ? x.toMillis() : Number(x) || 0); // Timestamp de Firestore → milisegundos
  const fmtDate = (x) => new Date(ms(x)).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  const rand = (n) =>
    Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  const uid = () => rand(4); // ID de entrada (8 caracteres)
  const oid = () => rand(10); // ID secreto de pedido (20 caracteres)
  const intl = (p) => {
    const d = String(p).replace(/\D/g, '');
    return d.length === 8 ? '591' + d : d;
  }; // teléfono → formato WhatsApp
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
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
  const sha256Hex = async (buf) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buf)), (b) => b.toString(16).padStart(2, '0')).join('');
  const setTitle = (t, wide) => {
    $('ov-t').textContent = t;
    $('ov-c').className = (wide ? 'max-w-4xl' : 'max-w-md') + ' mx-auto p-4 pt-6 pb-16';
  };
  const openOv = () => {
    ov.classList.add('on');
    document.body.style.overflow = 'hidden';
  };
  window.Legal = (k) => {
    const l = $('lg');
    if (!k) {
      l.classList.add('hidden');
      l.classList.remove('flex');
      return;
    }
    $('lg-t').textContent = LEGAL[k].t;
    $('lg-b').innerHTML = LEGAL[k].h;
    l.classList.remove('hidden');
    l.classList.add('flex');
  };

  /* ======================================================================
   3. BASE DE DATOS Y SESIÓN (Firebase Auth + Firestore)
      events · config/settings · orders · tickets · receipts · rkeys (comprobantes ya usados)
   ====================================================================== */
  const DB = {
    fs: null,
    auth: null,
    async init() {
      firebase.initializeApp(FIREBASE_CONFIG);
      if (APPCHECK_SITE_KEY && firebase.appCheck) firebase.appCheck().activate(APPCHECK_SITE_KEY, true);
      DB.auth = firebase.auth();
      DB.fs = firebase.firestore();
      await new Promise((r) => {
        const off = DB.auth.onAuthStateChanged((u) => {
          off();
          r(u);
        });
      }); // restaura la sesión del personal si existe
    },
    user: () => DB.auth.currentUser,
    role() {
      const e = DB.user() && DB.user().email;
      return e === ADMIN_EMAIL ? 'admin' : e === DOOR_EMAIL ? 'door' : null;
    },
    async anon() {
      if (!DB.user()) await DB.auth.signInAnonymously();
      return DB.user();
    }, // los compradores entran de forma anónima, solo al comprar
    async staffLogin(email, pw) {
      await DB.auth.setPersistence(firebase.auth.Auth.Persistence.SESSION); // la sesión del personal se cierra con la pestaña
      return (await DB.auth.signInWithEmailAndPassword(email.trim(), pw)).user;
    },
    logout: () => DB.auth.signOut(),
    /* eventos y ajustes (lectura pública; escritura solo administrador) */
    async listEvents() {
      return (await DB.fs.collection('events').get()).docs.map((d) => d.data());
    },
    saveEvent: (ev) => DB.fs.doc('events/' + ev.id).set(ev),
    deleteEvent: (id) => DB.fs.doc('events/' + id).delete(),
    async getSettings() {
      const d = await DB.fs.doc('config/settings').get();
      return d.exists ? d.data() : null;
    },
    saveSettings: (s) => DB.fs.doc('config/settings').set(s),
    async legacyCfg() {
      try {
        const d = await DB.fs.doc('kv/cfg').get();
        return d.exists ? d.data().v : null;
      } catch (e) {
        return null;
      }
    },
    /* pedidos: la hora de registro la pone el SERVIDOR (no se puede adelantar ni atrasar desde el navegador) */
    async createOrder(o) {
      const u = await DB.anon();
      await DB.fs.doc('orders/' + o.id).set({ ...o, uid: u.uid, status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      return DB.getOrder(o.id);
    },
    async getOrder(id) {
      await DB.anon();
      const d = await DB.fs.doc('orders/' + id).get();
      return d.exists ? d.data() : null;
    },
    async listOrders() {
      return (await DB.fs.collection('orders').get()).docs.map((d) => d.data()).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
    },
    /* Cierra el pedido en UNA transacción: reserva el comprobante (nadie más podrá usarlo), guarda la foto y, si todo está bien, crea las entradas */
    finalize(order, { rid, hash, img, text, checks, tickets, auto }) {
      return DB.fs.runTransaction(async (tx) => {
        const kr = rid ? DB.fs.doc('rkeys/r' + rid) : null,
          kh = DB.fs.doc('rkeys/h' + hash);
        const [a, b] = await Promise.all([kr ? tx.get(kr) : null, tx.get(kh)]);
        const dup = !!((a && a.exists) || b.exists),
          approve = auto && !dup && checks.ok,
          key = { orderId: order.id, ts: Date.now() };
        if (!dup) {
          if (kr) tx.set(kr, key);
          tx.set(kh, key);
        }
        tx.set(DB.fs.doc('receipts/' + order.id), { orderId: order.id, img, text, ts: Date.now() });
        const patch = { status: approve ? 'approved' : 'review', rid: rid || '', checks: { ...checks, dup }, receiptAt: Date.now() };
        if (approve) {
          tickets.forEach((t) => tx.set(DB.fs.doc('tickets/' + t.id), t));
          patch.tickets = tickets.map(summary);
        }
        tx.update(DB.fs.doc('orders/' + order.id), patch);
      });
    },
    /* administrador */
    async adminApprove(order, tickets) {
      const b = DB.fs.batch();
      tickets.forEach((t) => b.set(DB.fs.doc('tickets/' + t.id), t));
      b.update(DB.fs.doc('orders/' + order.id), { status: 'approved', tickets: tickets.map(summary), manual: true });
      await b.commit();
    },
    setOrder: (id, patch) => DB.fs.doc('orders/' + id).update(patch),
    async setTicketsActive(orderId, active) {
      const q = await DB.fs.collection('tickets').where('orderId', '==', orderId).get();
      const b = DB.fs.batch();
      q.docs.forEach((d) => b.update(d.ref, { active }));
      await b.commit();
    },
    async getReceipt(orderId) {
      const d = await DB.fs.doc('receipts/' + orderId).get();
      return d.exists ? d.data() : null;
    },
    async listTickets() {
      return (await DB.fs.collection('tickets').get()).docs.map((d) => d.data());
    },
    /* puerta: marca un ingreso. Devuelve {r:'ok'|'used'|'off'|'none', t} */
    useTicket(id) {
      return DB.fs.runTransaction(async (tx) => {
        const ref = DB.fs.doc('tickets/' + id),
          d = await tx.get(ref);
        if (!d.exists) return { r: 'none' };
        const t = d.data();
        if (t.active === false) return { r: 'off', t };
        if (t.used >= t.max) return { r: 'used', t };
        t.used++;
        t.scans = [...(t.scans || []), Date.now()];
        tx.update(ref, { used: t.used, scans: t.scans });
        return { r: 'ok', t };
      });
    },
  };
  const summary = ({ id, type, max, amount, name, event, eventDate, eventId }) => ({ id, type, max, amount, name, event, eventDate, eventId });

  /* ======================================================================
   4. ESTADO GLOBAL Y ARRANQUE
   ====================================================================== */
  const State = { events: [], ev: null, settings: null, error: null };
  async function loadState() {
    State.events = await DB.listEvents();
    State.ev = EVENT_ID ? State.events.find((e) => e.id === EVENT_ID) || null : null;
    render();
  }
  const ready = DB.init()
    .then(loadState)
    .catch((e) => {
      State.error = e;
      render();
    });
  function render() {
    IS_HOME ? renderHome() : renderEvent();
  }

  /* ======================================================================
   5. MENÚ, PIE Y TEXTOS LEGALES (iguales en todas las páginas)
   ====================================================================== */
  const icon = (k, cls = 'w-5 h-5') => `<svg class="${cls}" fill="currentColor" viewBox="0 0 24 24"><path d="${ICON[k]}"/></svg>`;
  const home = IS_HOME ? '' : '/';
  function navHTML() {
    return `<nav class="nav-bar fixed top-0 w-full z-50"><div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
    <div class="flex items-center min-w-0">
      <a href="/" class="flex items-center gap-3"><img src="logo-sn.svg" alt="S&N" class="w-9 h-9"><span class="leading-tight"><b class="block font-serif text-xl tracking-wide">S&amp;N</b><span class="block text-[9px] tracking-[.4em] text-bone/70 uppercase">Entertainment</span></span></a>
      <div class="hidden md:flex items-center gap-7 ml-10"><a href="${home}#eventos" class="nav-link">Eventos</a><a href="${home}#nosotros" class="nav-link">Nosotros</a><a href="#contacto" class="nav-link">Contacto</a></div>
    </div>
    <div class="flex items-center gap-2"><a href="https://wa.me/${SITE.phones[0].wa}" target="_blank" rel="noopener" class="nav-btn" aria-label="WhatsApp">${icon('wa', 'w-4 h-4')}<span class="hidden sm:inline">WhatsApp</span></a>
      <button onclick="Staff.open('gate')" class="nav-btn">🚪<span class="hidden sm:inline">Puerta</span></button></div></div></nav>`;
  }
  function footerHTML() {
    const li = (t, extra = 'href="#"') => `<li><a ${extra} class="hover:text-white transition">${t}</a></li>`;
    const soc = (k, label, url) =>
      `<li><a href="${url}" target="_blank" rel="noopener" class="flex items-center gap-2 hover:text-white transition">${icon(k, 'w-4 h-4')}${label}</a></li>`;
    return `<footer id="contacto" class="relative z-10 mt-16 border-t border-white/10 bg-black/50"><div class="max-w-6xl mx-auto px-4 py-14">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
      <div><p class="font-serif text-4xl leading-none">S&amp;N</p><p class="eyebrow mt-1 mb-4">Entertainment</p>
        <p class="text-[11px] text-bone/60 leading-relaxed uppercase tracking-wider">Grupo de entretenimiento &amp; hospitality.<br>Experiencias exclusivas y acceso oficial.<br>Est. 2026 — Santa Cruz, Bolivia.</p>
        <div class="mt-6 text-sm text-bone/75"><p class="font-bold text-white uppercase tracking-wide text-xs mb-1">¿Quieres ser parte del staff / RRPP?</p><p>Únete al equipo de relacionadores oficiales o cotiza alianzas comerciales.<br><a href="https://wa.me/${SITE.phones[0].wa}?text=${encodeURIComponent('Hola, quiero ser parte del staff / RRPP de S&N Entertainment')}" target="_blank" rel="noopener" class="text-brand-light hover:underline">Comunícate con dirección aquí</a></p></div></div>
      <div><h4 class="eyebrow mb-4">Contacto oficial</h4><ul class="space-y-2 text-sm text-bone/80">${SITE.phones.map((p) => `<li><a href="https://wa.me/${p.wa}" target="_blank" rel="noopener" class="hover:text-white">${p.label}</a></li>`).join('')}<li class="pt-2"><a href="mailto:${SITE.email}" class="hover:text-white break-all">${SITE.email}</a></li><li class="pt-2">${SITE.city}</li></ul></div>
      <div><h4 class="eyebrow mb-4">Social</h4><ul class="space-y-2 text-sm text-bone/80">${soc('fb', 'Facebook (S&amp;N Entertainment)', SITE.facebook)}${soc('ig', 'Instagram (S&amp;N Entertainment)', SITE.instagram)}${soc('tt', 'TikTok (S&amp;N Entertainment)', SITE.tiktok)}</ul></div>
      <div><h4 class="eyebrow mb-4">Legal</h4><ul class="space-y-2 text-sm text-bone/80 uppercase tracking-wide">${li('Términos y condiciones', `href="#" onclick="Legal('terminos');return false"`)}${li('Política de privacidad', `href="#" onclick="Legal('privacidad');return false"`)}${li('Reembolsos', `href="#" onclick="Legal('reembolsos');return false"`)}${li('Acerca de nosotros', `href="${home}#nosotros"`)}${IS_HOME ? li('Administración', `href="#" onclick="Staff.open('admin');return false"`) : ''}</ul></div>
    </div><div class="divider mb-6"></div>
    <div class="flex flex-col md:flex-row justify-between gap-2 text-[11px] text-bone/50 uppercase tracking-wider"><p>&copy; 2026 S&amp;N Entertainment. Todos los derechos reservados.</p><p>${SITE.group}</p></div></div></footer>`;
  }
  $('site-nav').innerHTML = navHTML();
  $('site-footer').innerHTML = footerHTML();

  /* ======================================================================
   6. INICIO (cartelera de eventos)
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
    <div class="flex gap-3 items-center pt-3"><div class="ev-date"><b>${d.getDate()}</b><span>${MONTHS_ES[d.getMonth()]}</span></div><div class="min-w-0"><h3 class="font-serif text-2xl leading-tight truncate">${esc(ev.name)}</h3><p class="text-xs text-bone/60 truncate">${esc(ev.venue)}${ev.time ? ' · ' + esc(ev.time) + ' hrs' : ''}</p><p class="text-xs font-bold text-brand-light mt-0.5">${price ? 'Desde Bs ' + price : badge}</p></div></div></a>`;
  }
  function featHTML(ev) {
    const price = fromPrice(ev);
    return `<div class="feat"><a href="${esc(ev.slug)}"><img src="${esc(ev.flyer)}" alt="${esc(ev.name)}" class="flyer w-full max-w-[200px] md:max-w-none mx-auto"></a>
    <div><p class="eyebrow mb-2">Próximo evento</p><h2 class="title-gothic text-5xl md:text-6xl mb-3">${esc(ev.name)}</h2>
    <p class="font-semibold">${esc(longDate(ev))}${ev.time ? ' · ' + esc(ev.time) + ' hrs' : ''}</p><p class="text-bone/70 text-sm mb-5">${esc(ev.venue)} — ${esc(ev.address)}</p>
    <div class="flex flex-wrap items-center gap-4"><a href="${esc(ev.slug)}" class="cta">${price ? 'Comprar entradas' : 'Ver evento'}</a><span class="font-serif text-3xl">${price ? 'Desde Bs ' + price : 'Agotado'}</span></div></div></div>`;
  }
  function renderHome() {
    if (State.error) {
      $('ev-grid').innerHTML = '<p class="text-brand-light">No se pudo cargar la cartelera. Revisa tu conexión y recarga la página.</p>';
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
   7. PÁGINA DE EVENTO (lotes, carrito, resumen)
   ====================================================================== */
  const Cart = { man: 0, woman: 0, couple: 0 };
  const cartCount = () => Object.values(Cart).reduce((a, b) => a + b, 0);
  const labelOf = (k, tier) => (k === 'couple' ? 'PAREJA' : `${tier.n} (${k === 'man' ? 'H' : 'M'})`);
  const qtyControls = (k) =>
    `<div class="flex items-center gap-2"><button onclick="changeQty('${k}',-1)" class="qty-btn" aria-label="Menos">-</button><span class="font-bold w-5 text-center" id="qty-${k}">${Cart[k]}</span><button onclick="changeQty('${k}',1)" class="qty-btn" aria-label="Más">+</button></div>`;

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
    T('ev-age', `Evento ${ev.age}`);
    $('ev-lineup').innerHTML = chips(ev.lineup);
    $('ev-sponsors').innerHTML = chips(ev.sponsors);
    $('sec-gallery').classList.toggle('hidden', !ev.gallery);
    $('gallery').innerHTML = (ev.gallery || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((src) => `<img src="${esc(src)}" alt="" loading="lazy" class="w-full max-h-72 object-cover object-top border border-white/10">`)
      .join('');
    $('map-link').href = ev.mapUrl;
    const f = $('map-f');
    if (f.dataset.q !== ev.mapQ) {
      f.dataset.q = ev.mapQ;
      f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(ev.mapQ) + '&z=16&output=embed';
    }
    $('banner').textContent = ev.banner || '';

    /* lotes: se muestran los agotados (tachados) y el activo */
    const pr = pricesOf(ev),
      act = pr.tier,
      tiers = ev.tiers || [],
      visible = act ? tiers.slice(0, tiers.indexOf(act) + 1) : tiers;
    for (const k of Object.keys(Cart)) if (!pr[k]) Cart[k] = 0;
    const rows = Object.keys(TICKET_TYPES)
      .map((k) => {
        const f = TICKET_TYPES[k].field,
          sold = visible
            .filter((t) => t !== act && +t[f])
            .map(
              (t) =>
                `<div class="trow sold"><div><b>${TICKET_TYPES[k].plural}</b> <small>${esc(t.n)}</small></div><span class="text-[10px] uppercase tracking-widest">Agotado</span></div>`,
            )
            .join('');
        const buy =
          act && pr[k]
            ? `<div class="trow"><div class="min-w-0"><b class="block">${TICKET_TYPES[k].plural}</b><small class="text-bone/60">${esc(act.n)}${k === 'couple' ? ' · acceso doble' : ''}</small></div><div class="flex items-center gap-4"><span class="font-semibold whitespace-nowrap">${pr[k]} Bs</span>${qtyControls(k)}</div></div>`
            : '';
        return sold + buy;
      })
      .join('');
    $('tiers').innerHTML = (act ? '' : '<p class="text-center text-brand-light font-bold uppercase tracking-widest text-sm py-6">Entradas agotadas</p>') + rows;
    const ua = $('urgent-alert');
    ua.classList.toggle('hidden', !(act && act.end));
    ua.textContent = act ? `Últimas entradas ${act.n}` : '';
    updateCart();
    tickCountdown();
    renderResume();
  }
  function updateCart() {
    const ev = State.ev;
    if (!ev) return;
    const pr = pricesOf(ev);
    let total = 0,
      n = 0;
    for (const k of Object.keys(Cart))
      if (Cart[k] > 0) {
        n += Cart[k];
        total += Cart[k] * pr[k];
      }
    $('total').textContent = `${total} Bs`;
    $('buy-btn').disabled = !n;
    const min = fromPrice(ev);
    $('buybar-label').textContent = n ? `${n} entrada${n > 1 ? 's' : ''} · Total` : min ? 'Desde' : '';
    $('buybar-price').textContent = n ? `${total} Bs` : min ? `Bs ${min}` : 'Agotado';
    $('buybar-btn').textContent = n ? 'Comprar' : 'Ver entradas';
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
  if (EVENT_ID) setInterval(tickCountdown, 1000);
  window.changeQty = (k, d) => {
    if (d > 0 && cartCount() >= MAX_PER_ORDER) return alert(`Máximo ${MAX_PER_ORDER} entradas por compra.`);
    Cart[k] = Math.max(0, Cart[k] + d);
    const e = $('qty-' + k);
    if (e) e.textContent = Cart[k];
    updateCart();
  };
  window.buyBar = () => (cartCount() ? openCheckout() : $('panel').scrollIntoView({ behavior: 'smooth' }));
  window.shareEvent = () => {
    const ev = State.ev,
      url = location.href,
      text = `${ev.name} · ${longDate(ev)} — ${SITE.name}`;
    navigator.share
      ? navigator.share({ title: ev.name, text, url }).catch(() => {})
      : window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank');
  };

  /* ======================================================================
   8. COMPRA (pasarela): datos → pago con QR → comprobante → entradas
   ====================================================================== */
  const Order = { cur: null };
  const savedOrder = () => {
    try {
      return JSON.parse(localStorage.getItem('sn_order') || 'null');
    } catch (e) {
      return null;
    }
  };
  const stepsHTML = (n) =>
    `<ol class="steps">${['Datos', 'Pago', 'Entradas'].map((t, i) => `<li class="${i + 1 <= n ? 'on' : ''}"><i>${i + 1}</i>${t}</li>`).join('')}</ol>`;
  function cartItems() {
    const pr = pricesOf(State.ev),
      items = [];
    let total = 0;
    for (const k of Object.keys(Cart))
      if (Cart[k] > 0) {
        items.push({ k, label: labelOf(k, pr.tier), qty: Cart[k], price: pr[k] });
        total += Cart[k] * pr[k];
      }
    return { items, total };
  }
  window.openCheckout = () => {
    if (!cartCount()) return;
    coForm();
    openOv();
  };

  function coForm() {
    const { items, total } = cartItems(),
      ev = State.ev;
    setTitle('Comprar entradas');
    body.innerHTML =
      stepsHTML(1) +
      `<div class="panel p-4 mb-5 text-sm"><p class="eyebrow mb-2">${esc(ev.name)}</p>${items.map((i) => `<div class="flex justify-between py-1"><span>${i.qty} × ${esc(i.label)}</span><b>${i.qty * i.price} Bs</b></div>`).join('')}<div class="flex justify-between border-t border-white/10 mt-2 pt-2 font-bold"><span>Total</span><span class="text-brand-light">${total} Bs</span></div></div>
    <label class="lb">Nombres y apellidos</label><input id="c-name" class="fld mb-3" autocomplete="name">
    <label class="lb">Correo electrónico</label><input id="c-mail" type="email" class="fld mb-3" autocomplete="email">
    <label class="lb">Teléfono / WhatsApp</label><input id="c-tel" type="tel" class="fld mb-3" autocomplete="tel" placeholder="Ej: 70012345">
    <label class="flex gap-2 text-xs text-bone/70 mb-4"><input id="c-ok" type="checkbox"><span>Acepto los <a href="#" class="underline" onclick="Legal('terminos');return false">términos</a> y la <a href="#" class="underline" onclick="Legal('privacidad');return false">política de privacidad</a>.</span></label>
    <button id="c-go" class="btn">Continuar al pago</button><p id="c-msg" class="text-sm text-brand-light mt-3"></p>`;
    $('c-go').onclick = coCreate;
  }
  async function coCreate() {
    const msg = (t) => ($('c-msg').textContent = t),
      name = $('c-name').value.trim().replace(/\s+/g, ' '),
      mail = $('c-mail').value.trim(),
      tel = $('c-tel').value.replace(/\D/g, '');
    if (name.split(' ').length < 2) return msg('Escribe tus nombres y apellidos.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return msg('Escribe un correo válido.');
    if (tel.length < 8 || tel.length > 13) return msg('Escribe un teléfono válido (8 dígitos).');
    if (!$('c-ok').checked) return msg('Debes aceptar los términos para continuar.');
    const { items, total } = cartItems(),
      ev = State.ev;
    $('c-go').disabled = true;
    msg('');
    try {
      Order.cur = await DB.createOrder({ id: oid(), eventId: ev.id, event: ev.name, eventDate: dayLabel(ev), items, total, buyer: { name, email: mail, phone: tel } });
      localStorage.setItem('sn_order', JSON.stringify({ eventId: ev.id, id: Order.cur.id }));
      coPay();
    } catch (e) {
      msg('No se pudo registrar tu compra. Intenta de nuevo.');
      $('c-go').disabled = false;
    }
  }

  /* El QR de pago solo se muestra si el archivo coincide con la huella SHA-256 guardada en este código */
  let qrUrl = null;
  async function verifiedQr() {
    if (qrUrl) return qrUrl;
    const buf = await (await fetch(PAYEE.qr, { cache: 'no-store' })).arrayBuffer();
    if ((await sha256Hex(buf)) !== PAYEE.sha256) throw new Error('QR_NO_VERIFICADO');
    return (qrUrl = URL.createObjectURL(new Blob([buf], { type: 'image/png' })));
  }
  function coPay() {
    const o = Order.cur;
    setTitle('Pago');
    body.innerHTML =
      stepsHTML(2) +
      `<div class="text-center mb-5"><p class="eyebrow">Monto a pagar</p><p class="font-serif text-6xl leading-none mt-1">${o.total} <span class="text-2xl">Bs</span></p><p class="text-[11px] text-bone/50 mt-1">Pedido #${o.id.slice(0, 8)}</p></div>
    <div id="c-qr" class="qrbox"><p>Verificando QR oficial…</p></div>
    <div class="panel p-4 my-5 text-sm leading-relaxed"><ol class="list-decimal pl-5 space-y-1"><li>Escanea el QR con la app de tu banco.</li><li>Paga <b>exactamente ${o.total} Bs</b> a nombre de <b>${PAYEE.name}</b>.</li><li>Sube aquí la captura del comprobante. Debe verse el monto, la fecha, la hora y el N° de transacción.</li></ol></div>
    <label class="lb">Comprobante de pago</label><input id="c-file" type="file" accept="image/*" class="fld mb-3">
    <button id="c-ver" class="btn" disabled>Verificar mi pago</button><p id="c-msg" class="text-sm mt-3"></p>`;
    verifiedQr()
      .then((url) => {
        $('c-qr').innerHTML = `<img src="${url}" alt="QR de pago"><p>${PAYEE.name}</p><span class="seal">✓ QR oficial verificado</span>`;
        $('c-ver').disabled = false;
        $('c-ver').onclick = coVerify;
      })
      .catch(() => {
        $('c-qr').innerHTML = '<p>No se pudo verificar el QR de pago. No pagues: escríbenos por WhatsApp.</p>';
      });
  }
  async function coVerify() {
    const msg = (h) => ($('c-msg').innerHTML = h),
      file = $('c-file').files[0],
      o = Order.cur;
    if (!file) return msg('⚠️ Sube la captura de tu comprobante.');
    $('c-ver').disabled = true;
    try {
      msg('⏳ Verificando tu comprobante… (puede tardar unos segundos)');
      const img = await loadImage(file),
        small = scaleImage(img, 720).toDataURL('image/jpeg', 0.6);
      const text = await ocr(scaleImage(img, 1600)),
        checks = verifyReceipt(text, o);
      const settings = await DB.getSettings().catch(() => null),
        auto = !!(settings && settings.autoApprove === true);
      await DB.finalize(o, {
        rid: checks.rid.value,
        hash: await sha256Hex(new TextEncoder().encode(small)),
        img: small,
        text: text.slice(0, 1500),
        checks,
        tickets: buildTickets(o),
        auto,
      });
      Order.cur = await DB.getOrder(o.id);
      coResult();
    } catch (e) {
      msg('⚠️ No se pudo completar la verificación. Intenta de nuevo o escríbenos por WhatsApp.');
      $('c-ver').disabled = false;
    }
  }
  const buildTickets = (o) =>
    o.items
      .flatMap((i) => Array(i.qty).fill(i.k))
      .map((k) => ({
        id: uid(),
        orderId: o.id,
        eventId: o.eventId,
        event: o.event,
        eventDate: o.eventDate,
        name: o.buyer.name,
        type: TICKET_TYPES[k].label,
        max: TICKET_TYPES[k].seats,
        used: 0,
        scans: [],
        active: true,
        amount: o.items.find((i) => i.k === k).price,
        createdAt: Date.now(),
      }));
  function coResult() {
    const o = Order.cur;
    if (o.status === 'approved') return coTickets(o);
    if (o.status === 'pending') return coPay();
    setTitle(o.status === 'rejected' ? 'Pedido rechazado' : 'En revisión');
    const c = o.checks || {},
      bad = [];
    if (c.amount && !c.amount.ok) bad.push('el monto');
    if (c.payee && !c.payee.ok) bad.push('el titular');
    if (c.date && !c.date.ok) bad.push('la fecha');
    if (c.rid && !c.rid.ok) bad.push('el N° de comprobante');
    if (c.dup) bad.push('que el comprobante sea nuevo');
    body.innerHTML =
      stepsHTML(3) +
      `<div class="panel glow p-5 text-center"><p class="text-4xl mb-2">⏳</p><p class="font-serif text-3xl mb-2">${o.status === 'rejected' ? 'No pudimos aceptar tu pago' : 'Estamos revisando tu comprobante'}</p>
    <p class="text-sm text-bone/75">${bad.length ? 'No pudimos confirmar automáticamente ' + bad.join(', ') + '. ' : ''}Un miembro de la dirección lo revisará y te escribirá por WhatsApp o correo. <b>No necesitas pagar de nuevo.</b></p><p class="text-xs text-bone/50 mt-3">Pedido #${o.id.slice(0, 8)}</p></div>
    <a class="btn mt-4" target="_blank" rel="noopener" href="https://wa.me/${SITE.phones[0].wa}?text=${encodeURIComponent(`Hola, hice una compra de entradas para ${o.event} (pedido #${o.id.slice(0, 8)}) y mi comprobante quedó en revisión.`)}">Escribir por WhatsApp</a><button class="btn2 mt-2" onclick="Staff.close()">Cerrar</button>`;
  }
  async function coTickets(o) {
    setTitle('Tus entradas');
    body.innerHTML =
      stepsHTML(3) +
      '<p class="text-center text-green-400 font-bold mb-1">✅ ¡Pago verificado!</p><p class="text-center text-sm text-bone/70 mb-5">Estas son tus entradas. Guárdalas o compártelas: se validan una sola vez en puerta.</p><div id="c-tk" class="space-y-8"></div><button class="btn2 mt-6" onclick="Staff.close()">Cerrar</button>';
    for (const t of o.tickets) {
      const cv = await drawTicket(t),
        wrap = document.createElement('div');
      cv.className = 'w-full max-w-[260px] mx-auto border border-white/15';
      wrap.innerHTML =
        '<div class="cv"></div><div class="grid grid-cols-2 gap-2 mt-3 max-w-[260px] mx-auto"><button class="btn" data-a="s" style="background:#25D366;color:#000">WhatsApp</button><button class="btn2" data-a="d">Descargar</button></div>';
      wrap.querySelector('.cv').appendChild(cv);
      wrap.querySelector('[data-a=s]').onclick = () => shareTicket(cv, t);
      wrap.querySelector('[data-a=d]').onclick = () => saveImage(cv, t);
      $('c-tk').appendChild(wrap);
    }
  }
  /* Si el comprador cierra la página, puede retomar su pedido desde el mismo navegador */
  function renderResume() {
    const s = savedOrder(),
      r = $('resume');
    if (!r) return;
    r.classList.toggle('hidden', !(s && State.ev && s.eventId === State.ev.id));
    if (s)
      r.innerHTML = `<p class="text-xs text-bone/70 mb-2">Tienes un pedido registrado (#${esc(String(s.id).slice(0, 8))}).</p><button class="cta-ghost w-full" onclick="resumeOrder()">Ver mi pedido</button>`;
  }
  window.resumeOrder = async () => {
    const s = savedOrder();
    if (!s) return;
    try {
      Order.cur = await DB.getOrder(s.id);
      if (!Order.cur) return localStorage.removeItem('sn_order');
      coResult();
      openOv();
    } catch (e) {
      alert('No se pudo abrir tu pedido.');
    }
  };

  /* ======================================================================
   9. VERIFICACIÓN DEL COMPROBANTE (OCR en el navegador)
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
  /* Monto (junto a Bs/monto/importe/total) y N° de comprobante */
  function parseReceipt(text, expected) {
    const amounts = [...text.matchAll(/(?:bs\.?|bob|monto|importe|total)\D{0,12}?(\d{1,6}(?:[.,]\d{1,2})?)|(\d{1,6}[.,]\d{2})\s*(?:bs|bob)/gi)].map((m) =>
      parseFloat((m[1] || m[2]).replace(',', '.')),
    );
    const id = text.match(/(?:comprobante|transacci[oó]n|operaci[oó]n|referencia|\bnro\.?|n[°º]|\bid\b)\D{0,12}?((?=[A-Z0-9]*\d)[A-Z0-9]{6,})/i);
    return {
      amountOk: amounts.some((n) => Math.abs(n - expected) < 0.01),
      amounts: [...new Set(amounts)],
      receiptId: id ? id[1].toUpperCase().replace(/[^A-Z0-9]/g, '') : '',
    };
  }
  /* Fecha/hora del comprobante: dd/mm/aaaa, aaaa-mm-dd o "12 oct 2026", con hh:mm. Devuelve null si no la entiende */
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
      const near = t.slice(Math.max(0, r.index - 40), r.index + r[0].length + 40),
        hm = near.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?/);
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
  /* Titular: busca los nombres de PAYEE.tokens en el texto (sin tildes, tolerando 1 letra mal leída) */
  const norm = (s) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function payeeHits(text) {
    const words = norm(text)
      .split(/[^A-Z]+/)
      .filter((w) => w.length > 2);
    return PAYEE.tokens.filter((t) => words.some((w) => w === t || (t.length > 4 && lev(w, t) <= 1))).length;
  }
  /* Las 4 comprobaciones. La fecha debe ser POSTERIOR al registro de la compra (hora del servidor, 2 min de margen) */
  function verifyReceipt(text, o) {
    const p = parseReceipt(text, o.total),
      f = parseReceiptDate(text),
      created = ms(o.createdAt),
      hits = payeeHits(text);
    const dateOk = !!f && (f.hasTime ? f.ts >= created - 2 * 60e3 : f.ts + 864e5 > created);
    const c = {
      amount: { ok: p.amountOk, found: p.amounts },
      payee: { ok: hits >= 3, hits },
      date: { ok: dateOk, found: f ? f.ts : null },
      rid: { ok: !!p.receiptId, value: p.receiptId },
    };
    c.ok = c.amount.ok && c.payee.ok && c.date.ok && c.rid.ok;
    return c;
  }

  /* ======================================================================
   10. ENTRADA CON QR (imagen para guardar o compartir)
   ====================================================================== */
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
  const toBlob = (cv) => new Promise((r) => cv.toBlob(r, 'image/png'));
  const saveImage = async (cv, t) => download(await toBlob(cv), `entrada-${t.id}.png`);
  async function shareTicket(cv, t) {
    const file = new File([await toBlob(cv)], `entrada-${t.id}.png`, { type: 'image/png' });
    const text = `🎟️ Entrada ${t.event} — ${t.eventDate}\n${t.name}\nVálida para ${t.max > 1 ? t.max + ' ingresos' : '1 solo ingreso'}. Presenta este QR en puerta.`;
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    await saveImage(cv, t);
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }

  /* ======================================================================
   11. ACCESO DEL PERSONAL (correo y contraseña de Firebase)
   ====================================================================== */
  const authMsg = (e) =>
    ({
      'auth/invalid-credential': 'Correo o contraseña incorrectos.',
      'auth/wrong-password': 'Correo o contraseña incorrectos.',
      'auth/user-not-found': 'Correo o contraseña incorrectos.',
      'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
      'auth/operation-not-allowed': 'Falta activar Correo/Contraseña en Firebase Authentication.',
    })[e.code] || 'No se pudo iniciar sesión.';
  const canEnter = (view) => (view === 'admin' ? DB.role() === 'admin' : ['admin', 'door'].includes(DB.role()));
  function loginView(view) {
    setTitle(view === 'gate' ? 'Puerta' : 'Administración');
    body.innerHTML = `<label class="lb">Correo</label><input id="l-mail" type="email" class="fld mb-3" autocomplete="username"><label class="lb">Contraseña</label><input id="l-pw" type="password" class="fld mb-1" autocomplete="current-password"><label class="text-xs text-gray-400 block mb-3"><input id="l-s" type="checkbox"> Mostrar contraseña</label><button id="l-go" class="btn">Entrar</button><p id="l-e" class="text-red-400 text-sm mt-2"></p><p class="text-[10px] text-gray-600 mt-8">Versión ${APP_VERSION}</p>`;
    const go = async () => {
      $('l-go').disabled = true;
      try {
        await DB.staffLogin($('l-mail').value, $('l-pw').value);
        if (!canEnter(view)) {
          await DB.logout();
          $('l-e').textContent = 'Esta cuenta no tiene permiso para esta sección.';
        } else route(view);
      } catch (e) {
        $('l-e').textContent = authMsg(e);
      }
      $('l-go') && ($('l-go').disabled = false);
    };
    $('l-go').onclick = go;
    $('l-pw').onkeydown = (e) => {
      if (e.key === 'Enter') go();
    };
    $('l-s').onchange = (e) => {
      $('l-pw').type = e.target.checked ? 'text' : 'password';
    };
  }

  /* ======================================================================
   12. PUERTA (cámara + verificación contra Firestore)
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
      const res = await DB.useTicket(id),
        who = res.t ? `${esc(res.t.name)} · ${esc(res.t.event || '')}<br>` : '';
      if (res.r === 'ok') scanResult(true, '✅ ENTRADA VÁLIDA', `${who}Ingreso ${res.t.used} de ${res.t.max}`);
      else if (res.r === 'used') scanResult(false, '⛔ YA UTILIZADA', `${who}Último ingreso: ${fmtDate(res.t.scans[res.t.scans.length - 1])}`);
      else if (res.r === 'off') scanResult(false, '🚫 ENTRADA DESACTIVADA', `${who}Consulta con la dirección`);
      else scanResult(false, '❌ QR NO REGISTRADO', 'No existe en la base de datos');
    } catch (e) {
      scanResult(false, '⚠️ Error', 'No se pudo consultar. Revisa tu sesión y conexión.');
    }
  }
  async function startCamera() {
    if (!navigator.mediaDevices) return scanResult(false, '📷 Sin cámara', 'La cámara requiere https o localhost');
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
    setTitle('Puerta');
    body.innerHTML =
      '<video id="g-v" playsinline muted class="w-full bg-black aspect-square object-cover border border-white/20"></video><button id="g-b" class="btn mt-3">📷 Activar cámara</button><div id="g-r" class="mt-3 p-5 text-center hidden"></div><div class="mt-4 flex gap-2"><input id="g-m" class="fld" placeholder="o escribe el ID (ej: 3C5AE2AF)"><button id="g-mb" class="btn2" style="width:auto;padding:0 18px">OK</button></div><button class="btn2 mt-4" onclick="Staff.logout()">Cerrar sesión</button>';
    $('g-b').onclick = startCamera;
    $('g-mb').onclick = () => checkTicket($('g-m').value);
  }

  /* ======================================================================
   13. ADMINISTRACIÓN (solo en el inicio): compras · eventos · ajustes
   ====================================================================== */
  let adminTab = 'buy',
    draft = null,
    fEv = '',
    fSt = '';
  const ADMIN_TABS = [
    ['buy', 'Compras'],
    ['ev', 'Eventos'],
    ['set', 'Ajustes'],
  ];
  const small = 'style="width:auto;padding:8px 12px"';
  async function adminView(tab) {
    adminTab = tab || adminTab;
    setTitle('Administración', true);
    body.innerHTML = `<div class="flex flex-wrap gap-2 mb-4">${ADMIN_TABS.map(([k, n]) => `<button class="${k === adminTab ? 'btn' : 'btn2'}" ${small} onclick="A.go('${k}')">${n}</button>`).join('')}<button class="btn2" ${small} onclick="Staff.logout()">Salir</button></div><div id="ab"><p class="text-gray-400">Cargando…</p></div>`;
    try {
      await seedIfNeeded();
      $('ab').innerHTML = await { buy: tabBuy, ev: tabEvents, set: tabSettings }[adminTab]();
    } catch (e) {
      $('ab').innerHTML =
        '<p class="text-red-400">No se pudieron cargar los datos. Revisa que las reglas de Firestore estén publicadas y que tu cuenta sea la de administrador.</p>';
    }
  }
  /* Primera vez: crea Dark Garden (con los lotes antiguos si existían) y los ajustes */
  async function seedIfNeeded() {
    if (!State.settings) State.settings = await DB.getSettings();
    if (!State.settings) {
      const ev = defaultEvent(),
        leg = await DB.legacyCfg();
      if (leg)
        ['tiers', 'banner', 'mapUrl', 'mapQ'].forEach((k) => {
          if (leg[k]) ev[k] = leg[k];
        });
      if (!State.events.length) {
        await DB.saveEvent(ev);
        State.events = await DB.listEvents();
        render();
      }
      State.settings = { autoApprove: true };
      await DB.saveSettings(State.settings);
    }
  }

  /* ---- Compras ---- */
  const STATUS = { approved: ['Aprobada', 'ok'], review: ['En revisión', 'rev'], pending: ['Sin pagar', 'pen'], rejected: ['Rechazada', 'rej'] };
  const chk = (c, label, extra = '') => (c ? `<span class="${c.ok ? 'text-green-400' : 'text-red-400'}">${c.ok ? '✓' : '✗'} ${label}${extra}</span>` : '');
  async function tabBuy() {
    const [orders, tickets] = await Promise.all([DB.listOrders(), DB.listTickets()]);
    const byOrder = {};
    tickets.forEach((t) => {
      if (t.orderId) (byOrder[t.orderId] ||= []).push(t);
    });
    const list = orders.filter((o) => (!fEv || o.eventId === fEv) && (!fSt || o.status === fSt));
    /* sumatoria: solo entradas activas de compras aprobadas */
    const live = list.filter((o) => o.status === 'approved').flatMap((o) => (byOrder[o.id] || []).filter((t) => t.active !== false));
    const money = live.reduce((s, t) => s + (+t.amount || 0), 0),
      people = live.reduce((s, t) => s + (+t.max || 1), 0);
    const stat = (l, v, c = '') => `<div class="panel p-3"><p class="lb">${l}</p><p class="font-serif text-3xl ${c}">${v}</p></div>`;
    const evOpts =
      '<option value="">Todos los eventos</option>' +
      State.events.map((e) => `<option value="${e.id}" ${e.id === fEv ? 'selected' : ''}>${esc(e.name)}</option>`).join('');
    const stOpts =
      '<option value="">Todos los estados</option>' +
      Object.entries(STATUS)
        .map(([k, v]) => `<option value="${k}" ${k === fSt ? 'selected' : ''}>${v[0]}</option>`)
        .join('');
    return (
      `<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">${stat('Recaudado', money + ' Bs')}${stat('Entradas vendidas', people)}${stat(`Ganancia de Hugo (${FEE_PER_ENTRY} Bs por entrada)`, people * FEE_PER_ENTRY + ' Bs', 'text-brand-light')}${stat('En revisión', orders.filter((o) => o.status === 'review').length, 'text-yellow-300')}</div>
    <div class="grid grid-cols-2 gap-2 mb-4"><select class="fld" onchange="A.filter('ev',this.value)">${evOpts}</select><select class="fld" onchange="A.filter('st',this.value)">${stOpts}</select></div>` +
      (list
        .map((o) => {
          const [sl, sc] = STATUS[o.status] || ['—', 'pen'],
            tk = byOrder[o.id] || [],
            c = o.checks || {},
            b = o.buyer || {},
            off = tk.length && tk.every((t) => t.active === false);
          const wa = `https://wa.me/${intl(b.phone)}?text=${encodeURIComponent(`Hola ${b.name}, te escribimos de S&N Entertainment sobre tu compra para ${o.event} (pedido #${o.id.slice(0, 8)}). Hubo un problema con tu comprobante de pago. ¿Nos ayudas a revisarlo?`)}`;
          const mail = `mailto:${encodeURIComponent(b.email)}?subject=${encodeURIComponent('Tu compra en S&N Entertainment · ' + o.event)}&body=${encodeURIComponent(`Hola ${b.name},\n\nSobre tu pedido #${o.id.slice(0, 8)}: hubo un problema con tu comprobante de pago. Por favor respóndenos a este correo.\n\nS&N Entertainment`)}`;
          return `<div class="panel p-4 mb-3 text-sm"><div class="flex flex-wrap justify-between gap-2 mb-2"><span><b>#${o.id.slice(0, 8)}</b> · ${esc(o.event)} · <span class="text-bone/60">${fmtDate(o.createdAt)}</span></span><span class="pill ${sc}">${sl}</span></div>
        <p>${o.items.map((i) => `${i.qty}× ${esc(i.label)}`).join(' · ')} — <b>${o.total} Bs</b></p>
        <p class="mt-1">👤 <b>${esc(b.name)}</b> · ✉️ ${esc(b.email)} · 📱 ${esc(b.phone)}</p>
        ${o.checks ? `<p class="mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1">${chk(c.amount, 'Monto', c.amount && c.amount.found.length ? ` (leído: ${c.amount.found.join(', ')})` : '')}${chk(c.payee, 'Titular')}${chk(c.date, 'Fecha', c.date && c.date.found ? ` (${fmtDate(c.date.found)})` : '')}${chk(c.rid, 'N° comprobante', c.rid && c.rid.value ? ` (${esc(c.rid.value)})` : '')}${c.dup ? '<span class="text-red-400">✗ Comprobante duplicado</span>' : ''}</p>` : ''}
        ${tk.length ? `<p class="mt-2 text-xs">${tk.map((t) => `<span class="${t.active === false ? 'line-through text-red-400' : 'text-green-300'}">#${t.id}${t.used ? ` (${t.used}/${t.max})` : ''}</span>`).join(' · ')}</p>` : ''}
        <div class="flex flex-wrap gap-2 mt-3"><button class="btn2" ${small} onclick="A.receipt('${o.id}')">Ver comprobante</button><a class="btn2" ${small} target="_blank" rel="noopener" href="${wa}">WhatsApp</a><a class="btn2" ${small} href="${mail}">Correo</a>
          ${o.status === 'review' || o.status === 'pending' ? `<button class="btn" ${small} onclick="A.approve('${o.id}')">Aprobar</button><button class="btn2" ${small} style="border-color:#b91c1c;color:#f87171;width:auto;padding:8px 12px" onclick="A.reject('${o.id}')">Rechazar</button>` : ''}
          ${tk.length ? `<button class="btn2" ${small} style="border-color:#b45309;color:#fbbf24;width:auto;padding:8px 12px" onclick="A.toggle('${o.id}',${off})">${off ? 'Reactivar QR' : 'Desactivar QR'}</button>` : ''}</div></div>`;
        })
        .join('') || '<p class="text-gray-500">Aún no hay compras.</p>')
    );
  }

  /* ---- Eventos ---- */
  const inp = (id, label, val, type = 'text') => `<div><label class="lb">${label}</label><input id="${id}" type="${type}" class="fld mb-3" value="${esc(val)}"></div>`;
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
    return `<h3 class="font-serif text-3xl mb-3">${d.isNew ? 'Nuevo evento' : 'Editar: ' + esc(d.name)}</h3>
    <div class="grid md:grid-cols-2 gap-x-4">${inp('e-name', 'Nombre del evento', d.name)}${inp('e-slug', 'Enlace de la página (nombre del archivo, sin .html)', d.slug)}${inp('e-date', 'Fecha', d.date, 'date')}${inp('e-time', 'Hora (ej: 21:00)', d.time)}${inp('e-venue', 'Lugar', d.venue)}${inp('e-address', 'Dirección / ciudad', d.address)}${inp('e-flyer', 'Imagen del flyer (archivo)', d.flyer)}${inp('e-gallery', 'Galería (archivos separados por coma)', d.gallery)}${inp('e-lineup', 'Line up (separado por comas)', d.lineup)}${inp('e-sponsors', 'Auspiciadores (separados por comas)', d.sponsors)}${inp('e-age', 'Edad (ej: +18; vacío = sin aviso)', d.age)}${inp('e-banner', 'Aviso del lote (vacío = oculto)', d.banner)}${inp('e-mapurl', 'Link del botón "Ver ubicación"', d.mapUrl)}${inp('e-mapq', 'Dirección o coordenadas del mini mapa', d.mapQ)}</div>
    <label class="lb">Descripción</label><textarea id="e-desc" rows="5" class="fld mb-3">${esc(d.description)}</textarea>
    <label class="text-sm block mb-5"><input id="e-pub" type="checkbox" ${d.published !== false ? 'checked' : ''}> Visible en el inicio</label>
    <h4 class="font-serif text-2xl mb-1">Lotes y precios</h4><p class="text-xs text-gray-400 mb-2">El lote activo es el primero que no esté agotado ni vencido. Al marcar "Agotado" o pasar su fecha, pasa al siguiente.</p>
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

  /* ---- Ajustes ---- */
  async function tabSettings() {
    let qrOk = false,
      qrHash = '?';
    try {
      qrHash = await sha256Hex(await (await fetch(PAYEE.qr, { cache: 'no-store' })).arrayBuffer());
      qrOk = qrHash === PAYEE.sha256;
    } catch (e) {}
    const s = State.settings || {};
    return `<div class="panel p-4 mb-4"><h3 class="font-serif text-2xl mb-2">Aprobación automática</h3><label class="text-sm flex gap-2"><input id="s-auto" type="checkbox" ${s.autoApprove ? 'checked' : ''} onchange="A.auto(this.checked)"><span>Generar las entradas automáticamente cuando el comprobante pasa todas las verificaciones.<br><span class="text-gray-400 text-xs">Si la desactivas, TODAS las compras quedan en revisión y solo tú generas las entradas (úsalo si notas abusos).</span></span></label></div>
    <div class="panel p-4 mb-4"><h3 class="font-serif text-2xl mb-2">QR de pago</h3><p class="text-sm ${qrOk ? 'text-green-400' : 'text-red-400'}">${qrOk ? '✓ El archivo ' + PAYEE.qr + ' coincide con la huella guardada.' : '✗ El archivo ' + PAYEE.qr + ' NO coincide: los compradores no verán el QR de pago.'}</p><p class="text-[11px] text-gray-400 break-all mt-2">SHA-256 actual: ${esc(qrHash)}</p><p class="text-xs text-gray-500 mt-2">Si cambias el QR, copia esta huella en <b>PAYEE.sha256</b> dentro de app.js.</p></div>
    <div class="panel p-4"><h3 class="font-serif text-2xl mb-2">Sesión</h3><p class="text-sm text-gray-300">Administrador: ${esc(ADMIN_EMAIL)}<br>Puerta: ${esc(DOOR_EMAIL)}</p><p class="text-xs text-gray-500 mt-2">Las contraseñas se cambian en Firebase → Authentication → Users. Versión ${APP_VERSION}.</p></div>`;
  }

  /* Acciones de los botones del panel (se llaman desde onclick="A.xxx()") */
  const A = (window.A = {
    go: (tab) => {
      draft = null;
      adminView(tab);
    },
    filter(k, v) {
      if (k === 'ev') fEv = v;
      else fSt = v;
      adminView('buy');
    },
    /* compras */
    async receipt(id) {
      const r = await DB.getReceipt(id);
      if (!r || !r.img) return alert('Sin comprobante');
      window
        .open('')
        .document.write(`<img src="${r.img}" style="max-width:100%"><pre style="white-space:pre-wrap;font:12px monospace;color:#444">${esc(r.text || '')}</pre>`);
    },
    async approve(id) {
      const o = await DB.getOrder(id);
      if (!confirm(`¿Aprobar el pedido #${id.slice(0, 8)} y generar sus entradas?`)) return;
      await DB.adminApprove(o, buildTickets(o));
      adminView('buy');
    },
    async reject(id) {
      if (!confirm('¿Rechazar este pedido? Sus QR quedarán desactivados.')) return;
      await DB.setTicketsActive(id, false);
      await DB.setOrder(id, { status: 'rejected' });
      adminView('buy');
    },
    async toggle(id, off) {
      await DB.setTicketsActive(id, !!off);
      adminView('buy');
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
      alert('Evento guardado ✔');
      adminView('ev');
    },
    async evDel() {
      if (!confirm('¿Eliminar "' + draft.name + '"? Las compras ya hechas se conservan.')) return;
      await DB.deleteEvent(draft.id);
      State.events = await DB.listEvents();
      draft = null;
      render();
      adminView('ev');
    },
    /* ajustes */
    async auto(on) {
      State.settings = { ...State.settings, autoApprove: on };
      await DB.saveSettings(State.settings);
    },
  });

  /* ======================================================================
   14. ROUTER DEL PANEL (abrir / cerrar / sesión)
   ====================================================================== */
  function route(view) {
    stopCamera();
    ({ gate: gateView, admin: adminView })[view]();
  }
  function connectionError() {
    setTitle('Sin conexión');
    body.innerHTML =
      '<p class="text-red-400 mb-3">No se pudo conectar con la base de datos.</p><p class="text-sm text-gray-400">Revisa tu conexión. Si eres del personal: confirma que Authentication y las reglas de Firestore estén publicados en Firebase.</p>';
  }
  window.Staff = {
    async open(view) {
      if (view === 'admin' && !IS_HOME) return; // el administrador solo existe en el inicio
      await ready;
      openOv();
      if (State.error) return connectionError();
      canEnter(view) ? route(view) : loginView(view);
    },
    close() {
      stopCamera();
      ov.classList.remove('on');
      document.body.style.overflow = '';
    },
    async logout() {
      await DB.logout();
      Staff.close();
    },
  };
  /* cada minuto: relee eventos y lotes (si no hay un panel abierto) para que todos vean los cambios */
  setInterval(() => {
    if (!State.error && !ov.classList.contains('on')) loadState().catch(() => {});
    else render();
  }, 60000);
})();
