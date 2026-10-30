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
      '<span class="pill">' + esc(item.kategori || 'Berita') + '</span> <span class="news-date">' + fmtDate(item.tanggal) + '</span>';
    document.getElementById('modal-title').textContent = item.judul || '';
    var src = fotoUrl(item.foto);
    document.getElementById('modal-media').innerHTML = src
      ? '<img src="' + esc(src) + '" alt="' + esc(item.judul || 'Foto berita') + '" onerror="this.remove()">'
      : '';
    var body = '';
    if(item.ringkasan) body += '<p><strong>' + esc(item.ringkasan) + '</strong></p>';
    if(item.isi) body += paragraphs(item.isi);
    if(!body) body = '<p>Isi lengkap berita ini belum tersedia.</p>';
    document.getElementById('modal-body').innerHTML = body;
    backdrop.classList.add('open');
    document.getElementById('modal-close').focus();
  }
  function cardHtml(item, idx){
    return '<article class="news-card">' + mediaHtml(item) +
      '<div class="news-body"><div class="news-meta"><span class="pill">' + esc(item.kategori || 'Berita') + '</span>' +
      '<span class="news-date">' + fmtDate(item.tanggal) + '</span></div>' +
      '<h3 class="news-title">' + esc(item.judul || '') + '</h3>' +
      '<p class="news-excerpt">' + esc(item.ringkasan || item.isi || '') + '</p>' +
      '<button class="read-more" type="button" data-idx="' + idx + '">Baca selengkapnya &rarr;</button></div></article>';
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
      '<span class="pill">' + esc(first.kategori || 'Berita') + '</span>' +
      '<span class="news-date">' + fmtDate(first.tanggal) + '</span></div>' +
      '<h3 class="news-title">' + esc(first.judul || '') + '</h3>' +
      '<p class="news-excerpt">' + esc(first.ringkasan || first.isi || '') + '</p>' +
      '<button class="read-more" type="button" data-idx="0">Baca selengkapnya &rarr;</button></div></article>';
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
    bindOpen(listEl, filtered); bindOpen(featuredEl, filtered);
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
      return { judul: b.judul, tanggal: b.tanggal, ringkasan: b.ringkasan, isi: b.isi, foto: b.foto, kategori: b.kategori || 'Berita', _i: i };
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
