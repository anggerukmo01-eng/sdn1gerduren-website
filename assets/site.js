/* SD Negeri 1 Gerduren — skrip bersama: menu, tema, jam/tanggal, berita */
(function(){
  // Tema: simpan pilihan, hormati preferensi perangkat saat pertama kali
  var themeBtn = document.getElementById('theme-btn');
  var ICO_MOON = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  var ICO_SUN = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    try{ localStorage.setItem('sdn-theme', t); }catch(e){}
    if(themeBtn){
      var ico = themeBtn.querySelector('.theme-ico'); if(ico) ico.innerHTML = (t === 'dark') ? ICO_SUN : ICO_MOON;
      var lab = themeBtn.querySelector('.theme-label'); if(lab) lab.textContent = (t === 'dark') ? 'Mode Terang' : 'Mode Gelap';
    }
  }
  if(themeBtn){
    themeBtn.addEventListener('click', function(){
      var cur = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }

  // Menu mobile: drawer geser dari kanan + backdrop
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('nav-utama');
  var navBackdrop = document.getElementById('nav-backdrop');
  var drawerClose = document.getElementById('drawer-close');
  function closeDrawer(){
    if(!nav) return;
    nav.classList.remove('open');
    if(navBackdrop) navBackdrop.classList.remove('open');
    if(menuBtn) menuBtn.setAttribute('aria-expanded','false');
  }
  if(menuBtn && nav){
    menuBtn.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      if(navBackdrop) navBackdrop.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closeDrawer);
    });
    if(drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if(navBackdrop) navBackdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeDrawer(); });
  }

  // Widget jam & tanggal (WIB) — diperbarui tiap detik, plus status sekolah live
  var clockEl = document.getElementById('clock-widget');
  var statusEl = null;
  if(clockEl && clockEl.parentNode){
    statusEl = document.createElement('span');
    statusEl.id = 'school-status'; statusEl.className = 'status-pill status-luar';
    statusEl.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="status-text">Memuat status&hellip;</span>';
    clockEl.parentNode.appendChild(statusEl);
  }
  function schoolStatus(){
    try{
      var parts = new Intl.DateTimeFormat('id-ID', { timeZone:'Asia/Jakarta', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false }).formatToParts(new Date());
      var wd = '', h = 0, m = 0;
      parts.forEach(function(x){ if(x.type === 'weekday') wd = x.value; if(x.type === 'hour') h = parseInt(x.value,10); if(x.type === 'minute') m = parseInt(x.value,10); });
      var min = h*60 + m;
      if(wd === 'Sab' || wd === 'Min') return { cls:'status-libur', text:'Hari Libur' };
      if((min >= 525 && min < 540) || (min >= 645 && min < 660)) return { cls:'status-istirahat', text:'Istirahat' };
      if(min >= 420 && min < 810) return { cls:'status-aktif', text:'Jam Kegiatan Belajar Aktif' };
      return { cls:'status-luar', text:'Di Luar Jam Pelajaran' };
    }catch(e){ return { cls:'status-luar', text:'Di Luar Jam Pelajaran' }; }
  }
  function tick(){
    if(!clockEl) return;
    if(statusEl){
      var s = schoolStatus();
      if(statusEl.getAttribute('data-status') !== s.cls){
        statusEl.className = 'status-pill ' + s.cls;
        statusEl.setAttribute('data-status', s.cls);
        var st = statusEl.querySelector('.status-text'); if(st) st.textContent = s.text;
      }
    }
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
    var url = item.halaman ? 'https://sdn1gerduren.pages.dev' + item.halaman : 'https://sdn1gerduren.pages.dev/berita/';
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
    var galeriHtml = '';
    if(item.galeri && item.galeri.length){
      galeriHtml = '<h3 style="margin-top:24px">Galeri Foto</h3><div class="berita-galeri">' + item.galeri.map(function(g){
        return '<figure><img src="' + esc(fotoUrl(g.foto)) + '" alt="' + esc(g.keterangan || 'Foto berita') + '" loading="lazy"><figcaption>' + esc(g.keterangan || '') + '</figcaption></figure>';
      }).join('') + '</div>';
    }
    document.getElementById('modal-body').innerHTML = body + galeriHtml + shareHtml(item);
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
      return { judul: b.judul, tanggal: b.tanggal, ringkasan: b.ringkasan, isi: b.isi, foto: b.foto, kategori: b.kategori || 'Berita', penulis: b.penulis || '', galeri: b.galeri || [], halaman: b.halaman || '', _i: i };
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

/* Jadwal pelajaran (content/jadwal.json) */
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
  var kelasTabs = document.getElementById('jadwal-kelas-tabs');
  var selectedKelas = 'Semua Kelas';
  var data = null;
  function render(){
    if(!data) return;
    if(titleEl) titleEl.textContent = 'Jadwal Hari ' + selected;
    if(noteEl){
      if(DAYS.indexOf(today) < 0 && selected === 'Senin') noteEl.textContent = 'Hari ini ' + today + ' — tidak ada jadwal (Senin–Jumat). Menampilkan jadwal Senin.';
      else if(selected !== today && DAYS.indexOf(today) >= 0) noteEl.textContent = 'Menampilkan jadwal ' + selected + '. Hari ini adalah ' + today + '.';
      else noteEl.textContent = 'Jadwal hari ini, ' + today + '.';
    }
    if(dayTabs){
      dayTabs.querySelectorAll('.chip').forEach(function(c){ c.setAttribute('aria-pressed', c.getAttribute('data-hari') === selected ? 'true' : 'false'); });
    }
    if(kelasTabs){
      kelasTabs.querySelectorAll('.chip').forEach(function(c){ c.setAttribute('aria-pressed', c.getAttribute('data-kelas') === selectedKelas ? 'true' : 'false'); });
    }
    var nowMin = nowMinutesWIB();
    var isToday = (selected === today);
    var html = '';
    Object.keys(data.kelas).forEach(function(kelas){
      if(selectedKelas !== 'Semua Kelas' && kelas !== selectedKelas) return;
      var rows = data.kelas[kelas][selected] || [];
      html += '<article class="jadwal-card"><h3>' + esc(kelas) + '</h3><p class="small" style="margin:0 0 8px">Wali kelas: ' + esc(data.wali[kelas] || '') + '</p>';
      rows.forEach(function(r){
        // waktu ditulis "06.30 – 07.00": ubah titik jadi titik-dua sebelum dihitung
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
  if(kelasTabs){
    kelasTabs.querySelectorAll('.chip').forEach(function(chip){
      chip.addEventListener('click', function(){ selectedKelas = chip.getAttribute('data-kelas'); render(); });
    });
  }
  var path = document.body.getAttribute('data-jadwal-path') || 'content/jadwal.json';
  fetch(path).then(function(r){ return r.json(); }).then(function(j){
    data = j; render(); setInterval(render, 60000);
  }).catch(function(){ container.innerHTML = '<div class="empty-card">Jadwal belum dapat dimuat. Silakan buka halaman <a href="/jadwal/">Jadwal</a>.</div>'; });
})();

/* Filter tabel seminggu per kelas (halaman Jadwal) + Quick Bar HP */
(function(){
  var tabs = document.getElementById('jadwal-mingguan-tabs');
  if(tabs){
    var cards = [];
    document.querySelectorAll('div.card > h3').forEach(function(h){
      var m = h.textContent.match(/^Kelas \d/);
      if(m) cards.push({ el: h.parentNode, kelas: m[0] });
    });
    tabs.querySelectorAll('.chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        var k = chip.getAttribute('data-kelas');
        tabs.querySelectorAll('.chip').forEach(function(c){ c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        cards.forEach(function(c){ c.el.style.display = (k === 'Semua Kelas' || c.kelas === k) ? '' : 'none'; });
      });
    });
  }
  if(window.innerWidth <= 960 && !document.querySelector('.quickbar')){
    var bar = document.createElement('nav');
    bar.className = 'quickbar'; bar.setAttribute('aria-label', 'Navigasi cepat');
    bar.innerHTML = '<a href="/"><span class="qi" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>Beranda</a><a href="/jadwal/"><span class="qi" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg></span>Jadwal</a><a href="/ppdb/"><span class="qi" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></span>PPDB</a><a href="/kontak/"><span class="qi" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>Kontak</a>';
    document.body.appendChild(bar);
  }
})();

/* Aplikasi Administrasi Guru — gerbang kata sandi menuju aplikasi AdminGuru */
(function(){
  var URL_ADMINGURU = 'https://anggerukmo01-eng.github.io/AdminGuru/';
  /* Kata sandi standar = NPSN sekolah (20302352). Ini gerbang lunak di sisi
     peramban saja, BUKAN pengaman sungguhan: NPSN bersifat publik dan tautan
     AdminGuru tetap bisa dibuka langsung oleh siapa pun yang mengetahuinya. */
  var SANDI_KHUSUS_GURU = '20302352';
  function bukaAdminGuru(){
    try{ sessionStorage.setItem('sdn-khusus-guru', '1'); }catch(e){}
    var w = null;
    try{ w = window.open(URL_ADMINGURU, '_blank'); }catch(e){}
    if(w){ try{ w.opener = null; }catch(e){} }
    else { window.location.href = URL_ADMINGURU; }
  }
  function tutupModal(){
    var b = document.getElementById('modal-backdrop');
    if(b) b.classList.remove('open');
  }
  window.bukaKhususGuru = function(ev){
    if(ev && ev.preventDefault) ev.preventDefault();
    try{
      if(sessionStorage.getItem('sdn-khusus-guru') === '1'){ bukaAdminGuru(); return false; }
    }catch(e){}
    var backdrop = document.getElementById('modal-backdrop');
    var title = document.getElementById('modal-title');
    var meta = document.getElementById('modal-meta');
    var media = document.getElementById('modal-media');
    var body = document.getElementById('modal-body');
    if(!backdrop || !title || !body){ bukaAdminGuru(); return false; }
    title.textContent = 'Aplikasi Administrasi Guru';
    if(meta) meta.innerHTML = '<span class="pill">Aplikasi AdminGuru</span>';
    if(media) media.innerHTML = '';
    body.innerHTML =
      '<p>Menu ini khusus guru SD Negeri 1 Gerduren. Masukkan kata sandi untuk membuka aplikasi <strong>AdminGuru</strong>.</p>' +
      '<form id="kg-form" class="kg-form">' +
        '<label for="kg-sandi">Kata sandi</label>' +
        '<input id="kg-sandi" name="sandi" type="password" inputmode="numeric" autocomplete="off" placeholder="Masukkan kata sandi" required>' +
        '<p class="kg-error" id="kg-error" role="alert" hidden>Kata sandi salah. Coba lagi.</p>' +
        '<button type="submit">Masuk ke AdminGuru</button>' +
      '</form>';
    backdrop.classList.add('open');
    var form = document.getElementById('kg-form');
    var input = document.getElementById('kg-sandi');
    var err = document.getElementById('kg-error');
    if(input) input.focus();
    if(form) form.addEventListener('submit', function(e){
      e.preventDefault();
      if(input && input.value === SANDI_KHUSUS_GURU){
        tutupModal();
        bukaAdminGuru();
      } else {
        if(err) err.hidden = false;
        if(input){ input.value = ''; input.focus(); }
      }
    });
    return false;
  };
})();

/* Dropdown nav — submenu sebagai panel fixed di desktop (nav bisa digeser
   horizontal, jadi panel tidak boleh jadi anak nav yang terpotong); di menu
   mobile (drawer) submenu tampil statis menjorok (diatur CSS).
   Berlaku untuk SEMUA grup .nav-drop, masing-masing dengan timer sendiri. */
(function(){
  var drops = document.querySelectorAll('.nav-drop');
  if(!drops.length) return;
  function desktop(){ return window.innerWidth > 1180; }
  function closeAll(except){
    drops.forEach(function(d){
      if(d === except) return;
      var s = d.querySelector('.nav-sub'), t = d.querySelector('.nav-drop-toggle');
      if(s) s.classList.remove('open');
      if(t) t.setAttribute('aria-expanded','false');
    });
  }
  drops.forEach(function(drop){
    var toggle = drop.querySelector('.nav-drop-toggle');
    var sub = drop.querySelector('.nav-sub');
    if(!toggle || !sub) return;
    var timer = null;
    function place(){
      var r = toggle.getBoundingClientRect();
      var w = sub.offsetWidth || 320;
      var left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
      sub.style.left = left + 'px';
      sub.style.top = (r.bottom + 6) + 'px';
    }
    function open(){
      if(!desktop()) return;
      clearTimeout(timer);
      closeAll(drop);
      sub.classList.add('open');
      place();
      toggle.setAttribute('aria-expanded', 'true');
    }
    function close(){
      clearTimeout(timer);
      sub.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    function later(){ clearTimeout(timer); timer = setTimeout(close, 200); }
    drop.addEventListener('mouseenter', open);
    drop.addEventListener('mouseleave', later);
    sub.addEventListener('mouseenter', function(){ clearTimeout(timer); });
    sub.addEventListener('mouseleave', later);
    toggle.addEventListener('click', function(e){
      if(!desktop()) return;
      e.preventDefault();
      if(sub.classList.contains('open')) close(); else open();
    });
    toggle.addEventListener('focus', open);
    sub.addEventListener('focusout', function(e){ if(!sub.contains(e.relatedTarget)) later(); });
    sub.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', close); });
  });
  document.addEventListener('click', function(e){
    var inside = false;
    drops.forEach(function(d){ if(d.contains(e.target)) inside = true; });
    if(!inside) closeAll();
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeAll(); });
  window.addEventListener('scroll', function(){ closeAll(); }, true);
  window.addEventListener('resize', function(){ closeAll(); });
  var nav = document.getElementById('nav-utama');
  if(nav) nav.addEventListener('scroll', function(){ closeAll(); });
})();
