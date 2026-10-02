/**
 * Widget Decap « position » : placer un lieu sur la carte sans taper de coordonnées.
 * Recherche de l'adresse (géocodage de la Géoplateforme IGN, Base Adresse Nationale, sans clé), puis mini-carte
 * (Leaflet, fond Plan IGN) : clic pour placer le point, glisser pour l'ajuster. Latitude et longitude restent visibles.
 * Leaflet est chargé seulement quand on ouvre la carte (public/admin/leaflet/, copié par scripts/decap.ts).
 */
(function () {
  const CMS = window.CMS, h = window.h, createClass = window.createClass;
  if (!CMS || !h || !createClass) return;
  const Objet = CMS.getWidget('object');
  if (!Objet) return;

  const GEOCODAGE = 'https://data.geopf.fr/geocodage/search';
  const PLAN = 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';
  let promesse = null;
  const chargerLeaflet = () => (promesse ??= new Promise((ok, ko) => {
    if (window.L) return ok(window.L);
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'leaflet/leaflet.css'; document.head.appendChild(l);
    const s = document.createElement('script'); s.src = 'leaflet/leaflet.js';
    s.onload = () => { window.L.Icon.Default.imagePath = 'leaflet/images/'; ok(window.L); };
    s.onerror = ko;
    document.head.appendChild(s);
  }));
  const arrondi = (x) => Math.round(x * 1e6) / 1e6;

  if (!document.getElementById('xm-pos-style')) {
    const st = document.createElement('style');
    st.id = 'xm-pos-style';
    st.textContent = `
      .xm-pos{margin:0 0 12px;padding:12px;border:1px solid #dfe3ea;border-radius:8px;background:#f7f9fc;font:14px/1.4 system-ui,sans-serif}
      .xm-pos__ligne{display:flex;gap:8px;flex-wrap:wrap}
      .xm-pos input{flex:1 1 260px;font:inherit;padding:8px 10px;border:1px solid #b9c1cf;border-radius:6px}
      .xm-pos button{font:600 14px/1.2 system-ui,sans-serif;padding:8px 14px;border-radius:6px;border:1px solid #3a69c7;background:#e8f0fe;color:#1d4a9e;cursor:pointer}
      .xm-pos button:hover{background:#d5e3fc}.xm-pos button:focus-visible,.xm-pos input:focus-visible{outline:3px solid #f5b400;outline-offset:2px}
      .xm-pos__res{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:4px}
      .xm-pos__res button{width:100%;text-align:left;font-weight:500;background:#fff;border-color:#c9d3e6}
      .xm-pos__etat{margin:8px 0 0;color:#4a5160}
      .xm-pos__carte{height:320px;margin-top:10px;border-radius:6px;border:1px solid #c9d3e6}`;
    document.head.appendChild(st);
  }

  const Controle = createClass({
    getInitialState() {
      const e = this.props.entry;
      const adresse = e && e.getIn ? (e.getIn(['data', 'adresse']) || e.getIn(['data', 'lieu']) || '') : '';
      return { q: adresse, resultats: [], etat: '', carte: false };
    },
    componentWillUnmount() { if (this.map) { this.map.remove(); this.map = null; } },
    componentDidUpdate() { if (this.state.carte && this.div && !this.map) this.initCarte(); },
    position() {
      const v = this.props.value;
      const lat = v && v.get ? v.get('latitude') : null, lon = v && v.get ? v.get('longitude') : null;
      return typeof lat === 'number' && typeof lon === 'number' ? [lat, lon] : null;
    },
    poser(lat, lon, recentrer) {
      const v = this.props.value && this.props.value.get ? this.props.value : this.props.field.clear();
      this.props.onChange(v.set('latitude', arrondi(lat)).set('longitude', arrondi(lon)));
      if (this.map) {
        if (this.marqueur) this.marqueur.setLatLng([lat, lon]); else this.ajouterMarqueur(lat, lon);
        if (recentrer) this.map.setView([lat, lon], 18);
      }
      this.setState({ etat: `Point placé : ${arrondi(lat)}, ${arrondi(lon)}. Faites-le glisser pour l'ajuster.` });
    },
    ajouterMarqueur(lat, lon) {
      this.marqueur = window.L.marker([lat, lon], { draggable: true, keyboard: true, title: 'Position du lieu (glisser pour ajuster)' }).addTo(this.map);
      this.marqueur.on('dragend', () => { const p = this.marqueur.getLatLng(); this.poser(p.lat, p.lng, false); });
    },
    async initCarte() {
      let L;
      try { L = await chargerLeaflet(); } catch { this.setState({ etat: 'La carte n\'a pas pu être chargée.' }); return; }
      if (this.map || !this.div) return;
      this.map = L.map(this.div);
      L.tileLayer(PLAN, { maxZoom: 19, attribution: 'IGN – Géoplateforme' }).addTo(this.map);
      const pos = this.position();
      if (pos) { this.map.setView(pos, 17); this.ajouterMarqueur(pos[0], pos[1]); }
      else {
        // Pas encore de point : on centre sur la commune du site
        const ville = this.props.field.get('ville') || '', cp = this.props.field.get('code_postal') || '';
        this.map.setView([46.6, 2.4], 6);
        try {
          const r = await fetch(`${GEOCODAGE}?q=${encodeURIComponent(`${cp} ${ville}`.trim())}&index=address&type=municipality&limit=1`).then((x) => x.json());
          const f = r.features && r.features[0];
          if (f && this.map) this.map.setView([f.geometry.coordinates[1], f.geometry.coordinates[0]], 15);
        } catch { /* hors ligne : vue sur la France */ }
      }
      this.map.on('click', (e) => this.poser(e.latlng.lat, e.latlng.lng, false));
    },
    async chercher(ev) {
      if (ev) ev.preventDefault();
      const q = this.state.q.trim();
      if (q.length < 3) { this.setState({ etat: 'Tapez une adresse (numéro, rue).', resultats: [] }); return; }
      const cp = this.props.field.get('code_postal') || '';
      const avecCp = cp && !/\b\d{5}\b/.test(q) ? `&postcode=${encodeURIComponent(cp)}` : '';
      this.setState({ etat: 'Recherche…', resultats: [] });
      try {
        const r = await fetch(`${GEOCODAGE}?q=${encodeURIComponent(q)}&index=address&limit=5${avecCp}`).then((x) => x.json());
        let feats = r.features || [];
        if (!feats.length && avecCp) feats = ((await fetch(`${GEOCODAGE}?q=${encodeURIComponent(q)}&index=address&limit=5`).then((x) => x.json())).features) || [];
        this.setState({ resultats: feats, etat: feats.length ? 'Choisissez l\'adresse :' : 'Aucune adresse trouvée : placez le point en cliquant sur la carte.' });
        if (!feats.length) this.setState({ carte: true });
      } catch {
        this.setState({ etat: 'Recherche d\'adresse indisponible : placez le point en cliquant sur la carte.', carte: true });
      }
    },
    choisir(f) {
      const [lon, lat] = f.geometry.coordinates;
      this.setState({ resultats: [], carte: true });
      if (this.map) this.poser(lat, lon, true);
      else { this.poser(lat, lon, false); }
    },
    render() {
      const s = this.state;
      const zone = h('div', { className: 'xm-pos' },
        h('div', { className: 'xm-pos__ligne', role: 'search' },
          h('input', { type: 'search', value: s.q, 'aria-label': 'Adresse du lieu', placeholder: 'Adresse (ex. 16 cours Voltaire)', onChange: (e) => this.setState({ q: e.target.value }), onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.chercher(); } } }),
          h('button', { type: 'button', onClick: () => this.chercher() }, 'Chercher l\'adresse'),
          h('button', { type: 'button', onClick: () => this.setState({ carte: !s.carte }), 'aria-expanded': s.carte ? 'true' : 'false' }, s.carte ? 'Masquer la carte' : 'Placer sur la carte')),
        s.etat && h('p', { className: 'xm-pos__etat', role: 'status' }, s.etat),
        s.resultats.length > 0 && h('ul', { className: 'xm-pos__res' }, s.resultats.map((f, i) => h('li', { key: i },
          h('button', { type: 'button', onClick: () => this.choisir(f) }, f.properties.label)))),
        s.carte && h('div', { className: 'xm-pos__carte', ref: (el) => { this.div = el; if (!el && this.map) { this.map.remove(); this.map = null; this.marqueur = null; } } }));
      return h('div', null, zone, h(Objet.control, this.props));
    },
  });

  CMS.registerWidget('position', Controle, Objet.preview);
})();
