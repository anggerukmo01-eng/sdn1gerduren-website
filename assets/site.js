/* SD Negeri 1 Gerduren — skrip bersama: menu, tema, jam/tanggal, berita */
(function(){
  // Tema: simpan pilihan, hormati preferensi perangkat saat pertama kali
  var themeBtn = document.getElementById('theme-btn');
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    try{ localStorage.setItem('sdn-theme', t); }catch(e){}
    if(themeBtn) themeBtn.textContent = (t === 'dark') ? '☀️ Mode Terang' : '🌙 Mode Gelap';
  }
  if(themeBtn){
    themeBtn.addEventListener('click', function(){
      var cur = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }

  // Menu mobile
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('nav-utama');
  if(menuBtn && nav){
    menuBtn.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); });
    });
  }

  // Widget jam & tanggal (WIB) — diperbarui tiap detik
  var clockEl = document.getElementById('clock-widget');
  function tick(){
    if(!clockEl) return;
    try{
      var now = new Date();
      var hari = new Intl.DateTimeFormat('id-ID', { timeZone:'Asia/Jakarta', weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(now);
      var jam = new Intl.DateTimeFormat('id-ID', { timeZone:'Asia/Jakarta', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(now);
      clockEl.textContent = hari + ' • ' + jam + ' WIB';
    }catch(e){
      clockEl.textContent = new Date().toLocaleString('id-ID');
    }
  }
  tick(); setInterval(tick, 1000);

  // Jendela baca berita
  var backdrop = document.getElementById('modal-backdrop');
  function closeModal(){ if(backdrop) backdrop.classList.remove('open'); }
  var closeBtn = document.getElementById('modal-close');
  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  if(backdrop) backdrop.addEventListener('click', function(e){ if(e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });

  function esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  var BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  function fmtDate(iso){
    if(!iso) return '';
    var p = String(iso).slice(0,10).split('-');
    if(p.length !== 3) return esc(iso);
    var d = parseInt(p[2],10), m = parseInt(p[1],10), y = p[0];
    if(!BULAN[m-1]) return esc(iso);
    return d + ' ' + BULAN[m-1] + ' ' + y;
  }
  function fotoUrl(u){
    if(!u) return '';
    var s = String(u);
    if(s.indexOf('dropbox.com') !== -1) s = s.replace('dl=0','raw=1').replace('dl=1','raw=1');
    return s;
  }
  function mediaHtml(b){
    var src = fotoUrl(b.foto);
    if(!src) return '<div class="news-media" aria-hidden="true">SD</div>';
    return '<div class="news-media"><img src="' + esc(src) + '" alt="' + esc(b.judul || 'Foto berita') + '" loading="lazy" onerror="this.parentElement.outerHTML=\'<div class=&quot;news-media&quot; aria-hidden=&quot;true&quot;>SD</div>\'"></div>';
  }
  function shareHtml(item){
    var url = 'https://sdn1gerduren.pages.dev/berita/';
    var text = encodeURIComponent((item.judul || '') + ' ' + url);
    var u = encodeURIComponent(url);
    return '<div class="share-row"><span class="share-label">Bagikan:</span>' +
      '<a class="share-btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + text + '">WhatsApp</a>' +
      '<a class="share-btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '">Facebook</a>' +
      '<a class="share-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=' + text + '">X</a>' +
      '<a class="share-btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + u + '&text=' + encodeURIComponent(item.judul || '') + '">Telegram</a>' +
      '<button class="share-btn share-copy" type="button" data-url="' + url + '">Salin tautan</button></div>';
  }
  function bindShare(container){
    if(!container) return;
    container.querySelectorAll('.share-copy').forEach(function(btn){
      btn.addEventListener('click', function(){
        var url = btn.getAttribute('data-url');
        function done(){ var old = btn.textContent; btn.textContent = 'Tersalin!'; setTimeout(function(){ btn.textContent = old; }, 2000); }
        if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(done).catch(done); }
        else { var ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); done(); }
      });
    });
  }
  function authorHtml(item){ return item.penulis ? '<span class="news-author">Oleh ' + esc(item.penulis) + '</span>' : ''; }
  function paragraphs(text){
    return String(text || '').split(/\n\s*\n/).map(function(p){
      var t = esc(p.trim()).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      return t ? '<p>' + t + '</p>' : '';
    }).join('');
  }

  // Berita: hanya berjalan bila elemen berita ada di halaman ini.
  // Beranda memakai data-limit (cuplikan), halaman Berita menampilkan semua.
  var featuredEl = document.getElementById('berita-featured');
  var listEl = document.getElementById('berita-list');
  if(!featuredEl || !listEl) return;
  var emptyEl = document.getElementById('berita-empty');
  var filtersEl = document.getElementById('berita-filters');
  var showWrap = document.getElementById('show-more-wrap');
  var showBtn = document.getElementById('show-more-btn');
  var homeLimit = listEl.getAttribute('data-limit') ? parseInt(listEl.getAttribute('data-limit'), 10) : null;
  var all = [];
  var currentFilter = 'Semua';
  var showAll = false;

  function openNews(item){
    if(!backdrop) return;
    document.getElementById('modal-meta').innerHTML =
      '<span class="pill">' + esc(item.kategori || 'Berita') + '</span> ' + authorHtml(item) + ' <span class="news-date">' + fmtDate(item.tanggal) + '</span>';
    document.getElementById('modal-title').textContent = item.judul || '';
    var src = fotoUrl(item.foto);
    document.getElementById('modal-media').innerHTML = src
      ? '<img src="' + esc(src) + '" alt="' + esc(item.judul || 'Foto berita') + '" onerror="this.remove()">'
      : '';
    var body = '';
    if(item.ringkasan) body += '<p><strong>' + esc(item.ringkasan) + '</strong></p>';
    if(item.isi) body += paragraphs(item.isi);
    if(!body) body = '<p>Isi lengkap berita ini belum tersedia.</p>';
    document.getElementById('modal-body').innerHTML = body + shareHtml(item);
    bindShare(document.getElementById('modal-body'));
    backdrop.classList.add('open');
    document.getElementById('modal-close').focus();
  }
  function cardHtml(item, idx){
    return '<article class="news-card">' + mediaHtml(item) +
      '<div class="news-body"><div class="news-meta"><span class="pill">' + esc(item.kategori || 'Berita') + '</span>' + authorHtml(item) +
      '<span class="news-date">' + fmtDate(item.tanggal) + '</span></div>' +
      '<h3 class="news-title">' + esc(item.judul || '') + '</h3>' +
      '<p class="news-excerpt">' + esc(item.ringkasan || item.isi || '') + '</p>' +
      '<button class="read-more" type="button" data-idx="' + idx + '">Baca selengkapnya &rarr;</button>' + shareHtml(item) + '</div></article>';
  }
  function bindOpen(container, filtered){
    if(!container) return;
    container.querySelectorAll('[data-idx]').forEach(function(btn){
      btn.addEventListener('click', function(){ openNews(filtered[parseInt(btn.getAttribute('data-idx'),10)]); });
    });
  }
  function render(){
    var filtered = all.filter(function(b){ return currentFilter === 'Semua' || (b.kategori || 'Berita') === currentFilter; });
    if(!all.length){
      featuredEl.innerHTML = ''; listEl.innerHTML = '';
      if(emptyEl) emptyEl.hidden = false; if(showWrap) showWrap.hidden = true;
      if(filtersEl) filtersEl.style.display = 'none';
      return;
    }
    if(emptyEl) emptyEl.hidden = true;
    if(filtersEl) filtersEl.style.display = 'flex';
    if(!filtered.length){
      featuredEl.innerHTML = ''; listEl.innerHTML = '';
      listEl.innerHTML = '<div class="empty-card" style="grid-column:1/-1">Belum ada berita berkategori ' + esc(currentFilter) + '.</div>';
      if(showWrap) showWrap.hidden = true;
      return;
    }
    var first = filtered[0], rest = filtered.slice(1);
    featuredEl.innerHTML = '<article class="news-featured">' + mediaHtml(first) +
      '<div class="news-body"><div class="news-meta"><span class="pill pill-gold">Sorotan</span>' +
      '<span class="pill">' + esc(first.kategori || 'Berita') + '</span>' + authorHtml(first) +
      '<span class="news-date">' + fmtDate(first.tanggal) + '</span></div>' +
      '<h3 class="news-title">' + esc(first.judul || '') + '</h3>' +
      '<p class="news-excerpt">' + esc(first.ringkasan || first.isi || '') + '</p>' +
      '<button class="read-more" type="button" data-idx="0">Baca selengkapnya &rarr;</button>' + shareHtml(first) + '</div></article>';
    var shown = rest;
    if(homeLimit !== null && !showAll) shown = rest.slice(0, homeLimit);
    else if(!showAll && rest.length > 6) shown = rest.slice(0, 6);
    listEl.innerHTML = shown.map(function(item, i){ return cardHtml(item, i + 1); }).join('');
    if(showWrap){
      var moreCount = rest.length - shown.length;
      if(moreCount > 0 && homeLimit === null){
        showWrap.hidden = false;
        showBtn.textContent = 'Tampilkan semua berita (' + rest.length + ')';
      } else if(moreCount > 0 && homeLimit !== null){
        showWrap.hidden = true;
      } else {
        showWrap.hidden = true;
      }
    }
    bindOpen(listEl, filtered); bindOpen(featuredEl, filtered); bindShare(listEl); bindShare(featuredEl);
  }
  if(filtersEl){
    filtersEl.querySelectorAll('.chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        currentFilter = chip.getAttribute('data-filter'); showAll = false;
        filtersEl.querySelectorAll('.chip').forEach(function(c){ c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        render();
      });
    });
  }
  if(showBtn) showBtn.addEventListener('click', function(){ showAll = !showAll; render(); });

  // Jalur berita relatif terhadap halaman: Beranda di root, halaman lain di subfolder.
  var beritaPath = (window.location.pathname.indexOf('/berita/') === 0 || document.getElementById('berita-list')) && document.body.getAttribute('data-berita-path') || 'content/berita.json';
  fetch(beritaPath).then(function(r){ return r.json(); }).then(function(data){
    var list = (data && data.berita) || [];
    all = list.map(function(b, i){
      return { judul: b.judul, tanggal: b.tanggal, ringkasan: b.ringkasan, isi: b.isi, foto: b.foto, kategori: b.kategori || 'Berita', penulis: b.penulis || '', _i: i };
    }).sort(function(a, b){
      var da = a.tanggal || '', db = b.tanggal || '';
      if(da === db) return a._i - b._i;
      if(!da) return 1; if(!db) return -1;
      return db.localeCompare(da);
    });
    if(all.length){
      var strip = document.getElementById('latest-strip');
      var link = document.getElementById('latest-link');
      var dateEl = document.getElementById('latest-date');
      if(strip && link){
        link.textContent = all[0].judul || '';
        if(dateEl) dateEl.textContent = fmtDate(all[0].tanggal);
        strip.hidden = false;
      }
    }
    render();
  }).catch(function(){ render(); });
})();

/* Jadwal pelajaran dari KSP TA 2026/2027 (content/jadwal.json) */
(function(){
  var container = document.getElementById('jadwal-hari-ini');
  if(!container) return;
  var dayTabs = document.getElementById('jadwal-hari-tabs');
  var titleEl = document.getElementById('jadwal-hari-judul');
  var noteEl = document.getElementById('jadwal-hari-catatan');
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function displayMapel(m){
    var t = String(m).replace(/\s+/g, ' ').trim();
    var map = {'B.Indonesia':'B. Indonesia','B. Indonesia':'B. Indonesia','Bhs Jawa':'Bahasa Jawa','B. Jawa':'Bahasa Jawa','B. Inggris':'Bahasa Inggris','Bud. BMS':'Budaya Banyumasan','Bud BMS':'Budaya Banyumasan','KAA':'KKA','Seni Rupa':'Seni Rupa'};
    return map[t] || t;
  }
  function mapelClass(m){
    var t = displayMapel(m);
    if(t === 'PAIBP') return 'mp-paibp';
    if(t === 'Matematika') return 'mp-matematika';
    if(t === 'B. Indonesia') return 'mp-bindonesia';
    if(t === 'PJOK') return 'mp-pjok';
    if(t === 'Pancasila') return 'mp-pancasila';
    if(t === 'IPAS') return 'mp-ipas';
    if(t === 'Seni Rupa') return 'mp-seni';
    if(t === 'Bahasa Jawa') return 'mp-jawa';
    if(t === 'Bahasa Inggris') return 'mp-inggris';
    if(t === 'KKA') return 'mp-kka';
    if(t === 'Budaya Banyumasan') return 'mp-budaya';
    if(t === 'Kokurikuler') return 'mp-kokurikuler';
    if(t === 'Istirahat') return 'mp-istirahat';
    return 'mp-lain';
  }
  function parseTime(s){
    var p = String(s).split(':'); return parseInt(p[0],10)*60 + parseInt(p[1],10);
  }
  function nowMinutesWIB(){
    try{
      var parts = new Intl.DateTimeFormat('id-ID', { timeZone:'Asia/Jakarta', hour:'2-digit', minute:'2-digit', hour12:false }).formatToParts(new Date());
      var h = 0, m = 0; parts.forEach(function(x){ if(x.type === 'hour') h = parseInt(x.value,10); if(x.type === 'minute') m = parseInt(x.value,10); });
      return h*60 + m;
    }catch(e){ var d = new Date(); return d.getHours()*60 + d.getMinutes(); }
  }
  function todayName(){
    try{ return new Intl.DateTimeFormat('id-ID', { timeZone:'Asia/Jakarta', weekday:'long' }).format(new Date()); }
    catch(e){ return ''; }
  }
  var DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat'];
  var today = todayName();
  var selected = DAYS.indexOf(today) >= 0 ? today : 'Senin';
  var data = null;
  function render(){
    if(!data) return;
    if(titleEl) titleEl.textContent = 'Jadwal Hari ' + selected;
    if(noteEl){
      if(DAYS.indexOf(today) < 0 && selected === 'Senin') noteEl.textContent = 'Hari ini ' + today + ' — tidak ada jadwal (Senin–Jumat). Menampilkan jadwal Senin.';
      else if(selected !== today && DAYS.indexOf(today) >= 0) noteEl.textContent = 'Menampilkan jadwal ' + selected + '. Hari ini adalah ' + today + '.';
      else noteEl.textContent = 'Jadwal hari ini, ' + today + ', sesuai KSP TA 2026/2027.';
    }
    if(dayTabs){
      dayTabs.querySelectorAll('.chip').forEach(function(c){ c.setAttribute('aria-pressed', c.getAttribute('data-hari') === selected ? 'true' : 'false'); });
    }
    var nowMin = nowMinutesWIB();
    var isToday = (selected === today);
    var html = '';
    Object.keys(data.kelas).forEach(function(kelas){
      var rows = data.kelas[kelas][selected] || [];
      html += '<article class="jadwal-card"><h3>' + esc(kelas) + '</h3><p class="small" style="margin:0 0 8px">Wali kelas: ' + esc(data.wali[kelas] || '') + '</p>';
      rows.forEach(function(r){
        // waktu KSP ditulis "06.30 – 07.00": ubah titik jadi titik-dua sebelum dihitung
        var w = String(r.waktu).replace(/\./g, ':');
        var wp = w.split('–'); var sMin = wp[0] ? parseTime(wp[0].trim()) : 0; var eMin = wp[1] ? parseTime(wp[1].trim()) : 0;
        var isNow = isToday && sMin && eMin && nowMin >= sMin && nowMin < eMin && r.mapel !== 'Istirahat';
        var cls = r.mapel === 'Istirahat' ? 'jadwal-row istirahat' : 'jadwal-row';
        if(isNow) cls += ' now';
        html += '<div class="' + cls + '"><span class="jadwal-jam">' + (r.jam ? 'Jam ' + esc(r.jam) : '—') + '</span><span class="jadwal-waktu">' + esc(r.waktu) + '</span><span class="jadwal-mapel"><span class="mp ' + mapelClass(r.mapel) + '">' + esc(displayMapel(r.mapel)) + '</span>' + (isNow ? '<span class="now-badge">Sedang berlangsung</span>' : '') + '</span></div>';
      });
      html += '</article>';
    });
    container.innerHTML = html;
  }
  if(dayTabs){
    dayTabs.querySelectorAll('.chip').forEach(function(chip){
      chip.addEventListener('click', function(){ selected = chip.getAttribute('data-hari'); render(); });
    });
  }
  var path = document.body.getAttribute('data-jadwal-path') || 'content/jadwal.json';
  fetch(path).then(function(r){ return r.json(); }).then(function(j){
    data = j; render(); setInterval(render, 60000);
  }).catch(function(){ container.innerHTML = '<div class="empty-card">Jadwal belum dapat dimuat. Silakan buka halaman <a href="/jadwal/">Jadwal</a>.</div>'; });
})();
