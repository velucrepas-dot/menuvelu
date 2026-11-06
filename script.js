(function(){
  var FONT_LINK = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Kaushan+Script&display=swap">';
  var TITLE = 'Menú Crepería Velu';
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbyAuoH3Aq6d4BCz-PrvEsf2sQ-0DgFb1TXvIRznYB0I06Sy-vBl2vMcxyLjhi59Kd0cgA/exec';
  var SHEET_REFRESH_MS = 60000;

  var state = JSON.parse(document.getElementById('menu-data').textContent);
  state.contact = state.contact || { phone: '', facebook: '', address: '' };
  var embeddedItems = (state.items || []).slice();
  var sheetMode = false, sheetLoading = false, sheetError = false, lastSheetFetch = 0;
  var NAME_ALIASES = { '1 fruta 1 topping': 'crepa dulce clasica', '2 frutas': 'crepa de 2 frutas', 'cheesecake helado de vainilla': 'crepa de cheesecake con helado', 'jamon o peperoni': 'crepa salada', '16 unidades': 'minipancakes', 'waffles tradicionales': 'waffle', 'palicrepas 2 unidades': 'palicrepas', 'fruta extra': 'fruta', 'chocolate extra': 'chocolate' };

  var app = document.getElementById('app');
  app.innerHTML = '<header class="hero" id="hero"></header><div id="notice" hidden></div><nav class="chips" id="chips" aria-label="Categorías" hidden></nav><main class="menu" id="menu"></main><footer class="foot" id="foot"></footer><div class="lb" id="lb" hidden></div>';
  var PLATE = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="12"/><path d="M6 12v14M10 12v14M14 12v14M10 26v26M56 12c-4 4-4 12 0 16v24"/></svg>';
  var IC_FB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>';
  var IC_WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
  var $ = function(id){ return document.getElementById(id); };
  function waLink(){
    var d = String((state.contact || {}).phone || '').replace(/\D/g, '');
    if (d.length === 8) d = '502' + d;
    return d.length >= 10 ? 'https://wa.me/' + d : '';
  }
  function normalizeUrl(v){
    var s = String(v == null ? '' : v).trim();
    if (/^\/\//.test(s)) s = 'https:' + s;
    if (!s) return '';
    if (!/^https?:\/\//i.test(s) && !/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}([\/?#]|$)/i.test(s)) return '';
    return /^https?:\/\//i.test(s) ? s : 'https://' + s;
  }
  function mapsFromAddress(address){
    var s = String(address == null ? '' : address).trim();
    return s ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s) : '';
  }
  function mapsUrl(v){
    var s = String(v == null ? '' : v).trim(), u = normalizeUrl(s);
    if (u) return u;
    return /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/.test(s) ? mapsFromAddress(s) : '';
  }
  function fbLink(){
    return normalizeUrl((state.contact || {}).facebookUrl);
  }
  var IC_MAP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
  function mapsLink(){
    var c = state.contact || {};
    return mapsUrl(c.maps) || mapsFromAddress(c.address);
  }
  function social(){
    var w = waLink(), f = fbLink(), h = '';
    if (w) h += '<a class="sbtn" href="' + esc(w) + '" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">' + IC_WA + '</a>';
    if (f) h += '<a class="sbtn" href="' + esc(f) + '" target="_blank" rel="noopener" aria-label="Ver Facebook">' + IC_FB + '</a>';
    var m = mapsLink();
    if (m) h += '<a class="sbtn" href="' + esc(m) + '" target="_blank" rel="noopener" aria-label="Ver ubicación en Google Maps">' + IC_MAP + '</a>';
    return h ? '<div class="social">' + h + '</div>' : '';
  }
  function row(label, val, href, icon){
    var inner = '<span><span class="lbl">' + label + '</span><p class="val">' + esc(val) + '</p></span>';
    if (!href) return '<div>' + inner + '</div>';
    return '<a class="row" href="' + esc(href) + '" target="_blank" rel="noopener"><span class="sbtn">' + icon + '</span>' + inner + '</a>';
  }

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function money(n){ return 'Q.' + Number(n).toFixed(2); }
  function find(id){ for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) return state.items[i]; return null; }
  function catList(){
    var out = [];
    (state.cats || []).forEach(function(c){ if (state.items.some(function(i){ return i.cat === c; })) out.push(c); });
    state.items.forEach(function(i){ if (out.indexOf(i.cat) < 0) out.push(i.cat); });
    return out;
  }

  function sheetCsvUrl(){
    var u = String(SHEET_URL || '').trim();
    if (!u) return '';
    if (/\/spreadsheets\/d\/e\//.test(u)) {
      u = u.replace(/\/pubhtml\b/i, '/pub');
      if (/[?&]output=csv\b/i.test(u)) return u;
      return u + (u.indexOf('?') < 0 ? '?' : '&') + 'output=csv';
    }
    var m = u.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (m) {
      var gid = (u.match(/[?#&]gid=([0-9]+)/) || [])[1];
      return 'https://docs.google.com/spreadsheets/d/' + m[1] + '/gviz/tq?tqx=out:csv&headers=1' + (gid ? '&gid=' + gid : '');
    }
    return u;
  }

  function normText(s){
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function parseCSV(text){
    var rows = [], row = [], field = '', quoted = false, i = 0;
    while (i < text.length) {
      var c = text.charAt(i);
      if (quoted) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') { field += '"'; i += 2; continue; }
          quoted = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { quoted = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    row.push(field);
    rows.push(row);
    return rows.filter(function(r){ return r.some(function(v){ return String(v).trim() !== ''; }); });
  }

  function parsePrice(v){
    if (typeof v === 'number') return isFinite(v) ? v : NaN;
    var s = String(v == null ? '' : v).trim();
    if (!s) return NaN;
    s = s.replace(/^[Qq]\s*\.?\s*/, '').replace(/[^\d.,-]/g, '');
    if (!s) return NaN;
    var lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
      if (lastComma > lastDot) s = s.replace(/\./g, '').replace(/,/g, '.');
      else s = s.replace(/,/g, '');
    } else if (lastComma >= 0) {
      var decimals = s.length - lastComma - 1;
      if (decimals === 3 && s.replace(/,/g, '').length > 3) s = s.replace(/,/g, '');
      else s = s.replace(/,/g, '.');
    }
    var n = parseFloat(s);
    return isFinite(n) ? n : NaN;
  }

  function parseAvail(v, fallback){
    var s = normText(v);
    if (!s) return fallback;
    if (/^(no|false|0|agotado|agotada|no disponible|sin stock|off|x)$/.test(s)) return false;
    if (/^(si|true|1|disponible|activo|yes|on)$/.test(s)) return true;
    return fallback;
  }

  function normalizeImg(v){
    var s = String(v == null ? '' : v).trim();
    if (!s || s === '-' || /^(sin foto|no|ninguna)$/i.test(s)) return '';
    if (/^\/\//.test(s)) s = 'https:' + s;
    if (/drive\.google\.com/i.test(s)) {
      var m = s.match(/\/file\/d\/([^/?#&]+)/) || s.match(/[?&]id=([^&#]+)/);
      if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w800';
    }
    return /^(https?:\/\/|data:image\/)/i.test(s) ? s : '';
  }

  function columnIndex(headers, aliases){
    for (var i = 0; i < headers.length; i++) {
      if (aliases.indexOf(normText(headers[i])) >= 0) return i;
    }
    return -1;
  }

  function firstColumnValue(rows, headerRow, col){
    if (col < 0) return '';
    for (var r = headerRow + 1; r < rows.length; r++) {
      var cell = rows[r][col];
      var v = String(cell == null ? '' : cell).trim();
      if (v) return v;
    }
    return '';
  }

  function slugId(name){
    return normText(name).replace(/\s+/g, '-').slice(0, 40) || 'platillo';
  }

  function oldItem(id, name){
    var n = normText(name);
    if (NAME_ALIASES[n]) n = NAME_ALIASES[n];
    var byName = null;
    for (var i = 0; i < embeddedItems.length; i++) {
      var it = embeddedItems[i];
      if (id && it.id === id) return it;
      if (!byName && normText(it.name) === n) byName = it;
    }
    return byName;
  }

  function applyRows(rows){
    if (!rows || rows.length < 2) return false;
    var headerRow = -1, headers = [];
    for (var r = 0; r < Math.min(rows.length, 6); r++) {
      if (columnIndex(rows[r], ['nombre', 'platillo', 'producto', 'nombre del platillo', 'dish', 'name']) >= 0 &&
          columnIndex(rows[r], ['precio', 'precio q', 'precio quetzales', 'price', 'valor']) >= 0) {
        headerRow = r; headers = rows[r]; break;
      }
    }
    if (headerRow < 0) return false;
    var ci = {
      id: columnIndex(headers, ['id', 'clave', 'codigo', 'code']),
      name: columnIndex(headers, ['nombre', 'platillo', 'producto', 'nombre del platillo', 'dish', 'name']),
      price: columnIndex(headers, ['precio', 'precio q', 'precio quetzales', 'price', 'valor']),
      cat: columnIndex(headers, ['categoria', 'seccion', 'category', 'cat', 'tipo']),
      desc: columnIndex(headers, ['descripcion', 'detalle', 'description', 'desc']),
      avail: columnIndex(headers, ['disponible', 'disponible hoy', 'estado', 'activo', 'available', 'avail']),
      out: columnIndex(headers, ['agotado', 'agotada', 'no disponible', 'soldout', 'sold out', 'out']),
      img: columnIndex(headers, ['foto', 'imagen', 'foto url', 'imagen url', 'url foto', 'url imagen', 'img', 'image', 'photo'])
    };
    if (ci.name < 0 || ci.price < 0) return false;
    var cc = {
      phone: columnIndex(headers, ['whatsapp', 'telefono', 'celular', 'numero', 'phone', 'movil']),
      facebook: columnIndex(headers, ['facebook', 'usuario de facebook', 'usuario facebook', 'pagina de facebook', 'pagina facebook', 'facebook usuario', 'facebook pagina']),
      facebookUrl: columnIndex(headers, ['facebook url', 'facebookurl', 'url de facebook', 'urlfacebook', 'enlace de facebook', 'enlacefacebook', 'enlace facebook', 'link de facebook', 'linkfacebook', 'link facebook', 'url facebook']),
      maps: columnIndex(headers, ['maps', 'mapa', 'ubicacion', 'google maps', 'googlemaps', 'enlace de maps', 'enlacemaps', 'enlace maps', 'link de maps', 'linkmaps', 'link maps', 'url de maps', 'urlmaps', 'url maps']),
      address: columnIndex(headers, ['direccion', 'address', 'domicilio'])
    };
    var found = {
      phone: firstColumnValue(rows, headerRow, cc.phone),
      facebook: firstColumnValue(rows, headerRow, cc.facebook),
      facebookUrl: firstColumnValue(rows, headerRow, cc.facebookUrl),
      maps: firstColumnValue(rows, headerRow, cc.maps),
      address: firstColumnValue(rows, headerRow, cc.address)
    };
    var items = [], cats = [], used = {}, lastCat = '';
    for (var i = headerRow + 1; i < rows.length; i++) {
      var row = rows[i];
      var name = String(row[ci.name] == null ? '' : row[ci.name]).trim();
      if (!name) continue;
      var rawId = ci.id >= 0 ? String(row[ci.id] == null ? '' : row[ci.id]).trim() : '';
      var old = oldItem(rawId, name);
      var price = parsePrice(row[ci.price]);
      if (!isFinite(price) && old && isFinite(old.price)) price = Number(old.price);
      if (!isFinite(price)) continue;
      var cat = ci.cat >= 0 ? String(row[ci.cat] == null ? '' : row[ci.cat]).trim() : '';
      if (!cat && old && old.cat) cat = old.cat;
      if (!cat) cat = lastCat || 'Otros';
      lastCat = cat;
      var rawDesc = ci.desc >= 0 ? String(row[ci.desc] == null ? '' : row[ci.desc]).trim() : '';
      var desc = rawDesc === '-' ? '' : (rawDesc || (old && old.desc) || '');
      var avail = old ? old.avail !== false : true;
      if (ci.avail >= 0) avail = parseAvail(row[ci.avail], avail);
      if (ci.out >= 0) avail = !parseAvail(row[ci.out], !avail);
      var rawImg = ci.img >= 0 ? String(row[ci.img] == null ? '' : row[ci.img]).trim() : '';
      var img = rawImg === '-' ? '' : (normalizeImg(rawImg) || (old && old.img) || '');
      var id = rawId || (old && old.id) || ('s' + (i - headerRow) + '-' + slugId(name));
      if (used[id]) id = id + '-' + (i - headerRow);
      used[id] = 1;
      items.push({ id: id, name: name, price: Math.round(price * 100) / 100, desc: desc, cat: cat, avail: avail, img: img });
      if (cats.indexOf(cat) < 0) cats.push(cat);
    }
    if (!items.length) return false;
    var contactBefore = JSON.stringify(state.contact || {});
    state.contact = state.contact || {};
    if (found.phone) state.contact.phone = found.phone;
    if (found.facebook) state.contact.facebook = found.facebook;
    if (found.facebookUrl) state.contact.facebookUrl = normalizeUrl(found.facebookUrl) || found.facebookUrl;
    if (found.maps) state.contact.maps = found.maps;
    if (found.address) state.contact.address = found.address;
    if (found.address && !found.maps) state.contact.maps = mapsFromAddress(found.address);
    var contactChanged = JSON.stringify(state.contact) !== contactBefore;
    var first = !sheetMode, hadError = sheetError;
    var changed = contactChanged || JSON.stringify(items) !== JSON.stringify(state.items) || JSON.stringify(cats) !== JSON.stringify(state.cats);
    state.items = items;
    state.cats = cats;
    if (changed || first) state.updated = new Date().toISOString();
    sheetMode = true;
    sheetError = false;
    if (first || changed || hadError) renderAll();
    return true;
  }

  function applySheet(text){
    return applyRows(parseCSV(String(text).replace(/^\uFEFF/, '')));
  }

  function applyJson(data){
    if (data && !Array.isArray(data) && typeof data === 'object') {
      if (Array.isArray(data.items)) data = data.items;
      else if (Array.isArray(data.rows)) return applyRows(data.rows);
      else if (Array.isArray(data.values)) return applyRows(data.values);
      else if (Array.isArray(data.data)) data = data.data;
    }
    if (!Array.isArray(data) || !data.length) return false;
    if (Array.isArray(data[0])) return applyRows(data);
    if (typeof data[0] !== 'object' || data[0] === null) return false;
    var keys = [];
    data.forEach(function(obj){
      Object.keys(obj).forEach(function(k){ if (keys.indexOf(k) < 0) keys.push(k); });
    });
    if (!keys.length) return false;
    var rows = [keys].concat(data.map(function(obj){
      return keys.map(function(k){
        var v = obj[k];
        return v == null || typeof v === 'object' ? '' : v;
      });
    }));
    return applyRows(rows);
  }

  function sheetJsonpUrl(){
    var u = String(SHEET_URL || '').trim();
    if (/\/spreadsheets\/d\/e\//.test(u)) return '';
    var m = u.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!m) return '';
    var gid = (u.match(/[?#&]gid=([0-9]+)/) || [])[1];
    return 'https://docs.google.com/spreadsheets/d/' + m[1] + '/gviz/tq?tqx=out:json;responseHandler:__menuSheetCb&headers=1' + (gid ? '&gid=' + gid : '');
  }

  function loadSheetJsonp(){
    return new Promise(function(resolve, reject){
      var base = sheetJsonpUrl();
      if (!base) { reject(new Error('Sin enlace de Google Sheets')); return; }
      var name = '__menuSheetCb' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      var script = document.createElement('script');
      var timer = setTimeout(function(){ cleanup(); reject(new Error('Tiempo de espera de Google Sheets')); }, 12000);
      function cleanup(){
        clearTimeout(timer);
        try { delete window[name]; } catch (e) { window[name] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }
      window[name] = function(data){
        cleanup();
        try {
          var table = data && data.table;
          if (!table || !table.rows) throw new Error('Respuesta vacía de Google Sheets');
          var headers = (table.cols || []).map(function(c){ return c.label || ''; });
          var rows = [headers].concat(table.rows.map(function(r){
            return (r.c || []).map(function(cell){
              if (!cell) return '';
              return cell.v != null ? cell.v : (cell.f != null ? cell.f : '');
            });
          }));
          if (applyRows(rows)) resolve(true);
          else reject(new Error('La hoja no tiene platillos válidos'));
        } catch (e) { reject(e); }
      };
      script.onerror = function(){ cleanup(); reject(new Error('No se pudo cargar Google Sheets')); };
      script.onload = function(){
        setTimeout(function(){
          if (window[name]) { cleanup(); reject(new Error('Respuesta inválida de Google Sheets')); }
        }, 200);
      };
      script.src = base.replace('responseHandler:__menuSheetCb', 'responseHandler:' + name);
      document.head.appendChild(script);
    });
  }

  function loadSheet(){
    var url = sheetCsvUrl();
    if (!url || sheetLoading) return;
    sheetLoading = true;
    lastSheetFetch = Date.now();
    fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), { cache: 'no-store' }).then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function(text){
      var t = String(text).replace(/^\uFEFF/, '').trim(), ok = false;
      if (t.charAt(0) === '[' || t.charAt(0) === '{') {
        try { ok = applyJson(JSON.parse(t)); } catch (e) { ok = false; }
      } else {
        ok = applySheet(t);
      }
      if (!ok) throw new Error('La hoja no tiene platillos válidos');
    }).catch(function(err){
      if (!sheetJsonpUrl()) throw err;
      return loadSheetJsonp().catch(function(){ throw err; });
    }).then(function(){
      sheetLoading = false;
    }).catch(function(err){
      sheetLoading = false;
      sheetError = true;
      if (window.console && console.warn) console.warn('Google Sheets:', err);
      renderNotice();
    });
  }

  function renderHero(){
    $('hero').innerHTML = '<div class="wrap"><p class="kicker">' + esc(state.name) + '</p><h1>Menú</h1>' +
      (state.tagline ? '<p class="tag">' + esc(state.tagline) + '</p>' : '') + '<span class="rule"></span>' + social() + '</div>';
    var c = state.contact || {}, g = '';
    if (c.phone) g += row('WhatsApp', c.phone, waLink(), IC_WA);
    if (c.facebook) g += row('Facebook', c.facebook, fbLink(), IC_FB);
    if (c.address) g += row('Dirección', c.address, mapsLink(), IC_MAP);
    $('foot').innerHTML = '<div class="wrap">' + (g ? '<div class="grid2">' + g + '</div>' : '') +
      (state.tagline ? '<p class="note">' + esc(state.tagline) + '</p>' : '') +
      '<p class="small">Precios en quetzales (Q). Los platillos tachados no están disponibles por ahora.</p></div>';
  }

  function renderNotice(){
    var el = $('notice');
    if (!SHEET_URL || !sheetError) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = '<div class="wrap"><div class="notice">No se pudo actualizar desde Google Sheets; se muestran los últimos datos cargados.</div></div>';
  }

  function itemHtml(it){
    var off = !it.avail;
    var s = '<li class="item' + (off ? ' off' : '') + '" data-id="' + esc(it.id) + '">';
    if (it.img) s += '<button class="media" type="button" data-zoom="' + esc(it.id) + '" aria-label="Ver foto de ' + esc(it.name) + '"><img src="' + esc(it.img) + '" alt="" loading="lazy"></button>';
    else s += '<div class="media none">' + PLATE + '</div>';
    s += '<div class="ibody"><div class="line"><h3>' + esc(it.name) + '</h3><span class="price">' + money(it.price) + '</span></div>';
    if (it.desc) s += '<p class="desc">' + esc(it.desc) + '</p>';
    if (off) s += '<span class="badge">Agotado hoy</span>';
    return s + '</div></li>';
  }

  function renderMenu(){
    var cats = catList();
    var chips = $('chips');
    if (!cats.length) {
      chips.hidden = true;
      $('menu').innerHTML = '<div class="wrap"><div class="empty"><strong>Pronto tendremos el menú aquí</strong>Vuelve a revisar más tarde.</div></div>';
      return;
    }
    chips.hidden = false;
    chips.innerHTML = '<div class="wrap">' + cats.map(function(c, i){ return '<button class="chip" data-go="' + i + '" type="button">' + esc(c) + '</button>'; }).join('') + '</div>';
    var h = '<div class="wrap">';
    cats.forEach(function(c, i){
      var list = state.items.filter(function(it){ return it.cat === c; });
      var on = list.filter(function(it){ return it.avail; }), offl = list.filter(function(it){ return !it.avail; });
      h += '<section class="cat" id="cat-' + i + '"><h2><span class="mk">' + esc(c) + '</span></h2><ul class="items">' +
        on.concat(offl).map(itemHtml).join('') + '</ul></section>';
    });
    $('menu').innerHTML = h + '</div>';
  }

  function renderAll(){ renderHero(); renderNotice(); renderMenu(); }

  /* ---------- visor de fotos ---------- */
  function closeLb(){ var lb = $('lb'); lb.hidden = true; lb.innerHTML = ''; }
  $('lb').addEventListener('click', closeLb);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeLb(); });

  $('menu').addEventListener('click', function(e){
    var z = e.target.closest('[data-zoom]');
    if (!z) return;
    var zi = find(z.getAttribute('data-zoom'));
    if (zi && zi.img) {
      var lb = $('lb');
      lb.innerHTML = '<figure><img src="' + esc(zi.img) + '" alt=""><figcaption>' + esc(zi.name) + ' · ' + money(zi.price) + '</figcaption></figure>';
      lb.hidden = false;
    }
  });

  $('chips').addEventListener('click', function(e){
    var b = e.target.closest('[data-go]'); if (!b) return;
    var s = document.getElementById('cat-' + b.getAttribute('data-go'));
    if (s) s.scrollIntoView({block:'start'});
  });

  renderAll();
  loadSheet();

  if (SHEET_REFRESH_MS > 0) {
    setInterval(function(){ if (!document.hidden) loadSheet(); }, SHEET_REFRESH_MS);
    document.addEventListener('visibilitychange', function(){
      if (!document.hidden && Date.now() - lastSheetFetch > 15000) loadSheet();
    });
  }
})();
