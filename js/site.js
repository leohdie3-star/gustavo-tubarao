/* Gustavo Tubarão — interações. GSAP + ScrollTrigger, scroll nativo (resposta 1:1). */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const mobile = matchMedia('(max-width: 860px)').matches;

  /* ---------- manchetes: quebra em linhas (pelo <br>) ---------- */
  document.querySelectorAll('.split').forEach(el => {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i)
      .map(l => '<span class="ln"><span>' + l.trim() + '</span></span>').join('');
  });

  /* ---------- formulário: monta o e-mail para a Rodadig ---------- */
  const form = document.getElementById('leadForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = form.elements, note = document.getElementById('formNote');
    let ok = true;
    ['nome', 'marca'].forEach(n => {
      const bad = !f[n].value.trim();
      f[n].classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Preenche seu nome e a marca, por favor.'; return; }
    const subject = 'Parceria — Gustavo Tubarão — ' + f.marca.value.trim();
    const body = [
      'Olá, equipe Rodadig!', '',
      'Nome: ' + f.nome.value.trim(),
      'Marca / empresa: ' + f.marca.value.trim(),
      'Tipo de ação: ' + f.tipo.value, '',
      f.msg.value.trim() || '(sem mensagem)', '',
      '— enviado pelo site oficial do Gustavo Tubarão'
    ].join('\n');
    location.href = 'mailto:gustavotubarao@rodadig.com.br?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    note.textContent = 'Abrindo seu e-mail com tudo preenchido…';
  });

  /* ---------- vídeos: embed oficial só no clique (leve) ---------- */
  document.querySelectorAll('.yt').forEach(b => b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + b.dataset.id + '?autoplay=1&rel=0&playsinline=1';
    f.title = b.getAttribute('aria-label');
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    b.replaceChildren(f);
  }, { once: true }));

  /* ---------- cabeçalho sólido depois do hero ---------- */
  const top = document.getElementById('top');
  const onScroll = () => top.classList.toggle('solid', scrollY > innerHeight * 0.6);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- CTA vivo: magnético/elástico ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.magnet').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transition = 'transform .15s ease-out';
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.35}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .7s cubic-bezier(.3,1.6,.4,1)';
        el.style.transform = '';
      });
    });
  }

  /* ---------- contadores ---------- */
  const fmt = (v, el) => {
    const dec = +el.dataset.dec || 0;
    return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: !!el.dataset.sep });
  };
  const counters = [...document.querySelectorAll('.count')];
  const finish = () => counters.forEach(el => el.textContent = fmt(+el.dataset.to, el));

  /* ---------- hero: sequência de quadros no canvas ---------- */
  const TOTAL = 96, STEP = mobile ? 2 : 1;
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  const frames = [];
  const src = i => 'assets/hero/f' + String(i).padStart(3, '0') + '.webp';
  let current = -1;
  function draw(idx) {
    // usa o quadro carregado mais próximo (nunca trava esperando rede)
    let i = idx;
    while (i > 0 && !(frames[i] && frames[i].complete && frames[i].naturalWidth)) i--;
    const img = frames[i];
    if (!img || !img.naturalWidth || i === current) return;
    current = i;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  function sizeCanvas() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    current = -1;
  }
  const idxs = [];
  for (let i = 1; i <= TOTAL; i += STEP) idxs.push(i);
  function loadFrames() {
    // primeiro quadro já; o resto só depois da página carregar (prévia leve), em ordem
    const load = k => { const im = new Image(); im.decoding = 'async'; im.src = src(idxs[k]); frames[k] = im; return im; };
    load(0).onload = () => { sizeCanvas(); draw(0); };
    const rest = () => { for (let k = 1; k < idxs.length; k++) load(k); };
    if (document.readyState === 'complete') setTimeout(rest, 0); else addEventListener('load', rest, { once: true });
  }

  function start() {
    if (!window.gsap || !window.ScrollTrigger) { finish(); return; }
    gsap.registerPlugin(ScrollTrigger);

    if (reduce) { finish(); return; }
    loadFrames();
    addEventListener('resize', () => { sizeCanvas(); draw(Math.max(current, 0)); });

    // entrada do hero
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.wm-in', { yPercent: 110, duration: 1.3, stagger: .12 })
      .from('.hero-eyebrow', { opacity: 0, x: -20, duration: .9 }, .2)
      .from('.hero .sign', { opacity: 0, y: 14, rotate: -8, duration: 1 }, .55)
      .from('.hero-ctas > *', { opacity: 0, y: 18, stagger: .08, duration: .9 }, .7)
      .from('.verified, .source-note', { opacity: 0, duration: .8 }, .9)
      .from('.hero-frame', { opacity: 0, scale: .96, duration: 1.4 }, 0);

    // scrub 1:1 do hero (pin) — scrub:true = sem atraso
    const seq = { f: 0 };
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: () => '+=' + innerHeight * (mobile ? 1.4 : 1.8), pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true }
    })
      .to(seq, { f: idxs.length - 1, ease: 'none', duration: 1, onUpdate: () => draw(Math.round(seq.f)) }, 0)
      .to('.hero-copy', { yPercent: mobile ? -6 : -14, ease: 'none', duration: 1 }, 0)
      .to('.scroll-cue', { opacity: 0, duration: .1 }, 0)
      .to('.wm-line:nth-child(2) .wm-in', { x: mobile ? 0 : '-0.3em', ease: 'none', duration: 1 }, 0);

    // manchetes linha a linha
    gsap.utils.toArray('.split').forEach(h => {
      gsap.from(h.querySelectorAll('.ln > span'), {
        yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: .1,
        scrollTrigger: { trigger: h, start: 'top 85%' }
      });
    });

    // seções que pousam
    gsap.utils.toArray('.prose p, .pull, .pillars li, .lead, .formats li, .why-stats div, .ledger div, .form, .fan, .bridge, .vid, .brand-list li').forEach(el => {
      gsap.from(el, { opacity: 0, y: 34, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
    gsap.utils.toArray('.t-card, .road-grid figure').forEach((el, i) => {
      gsap.from(el, { opacity: 0, y: 60, duration: 1.2, ease: 'power3.out', delay: (i % 3) * .08, scrollTrigger: { trigger: el, start: 'top 92%' } });
    });

    // parallax leve nas fotos grandes
    gsap.utils.toArray('.parallax').forEach(img => {
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // contadores disparados pelo scroll
    counters.forEach(el => {
      const o = { v: 0 }, to = +el.dataset.to;
      gsap.to(o, {
        v: to, duration: 2, ease: 'power2.out',
        scrollTrigger: { trigger: '.num-grid', start: 'top 85%', once: true },
        onUpdate: () => el.textContent = fmt(+el.dataset.dec ? o.v : Math.round(o.v), el)
      });
    });
    gsap.from('.num-grid li', { opacity: 0, y: 40, stagger: .1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.num-grid', start: 'top 85%' } });

    // rodapé: wordmark sobe
    gsap.from('.foot-wm', { yPercent: 30, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 85%' } });

    addEventListener('load', () => ScrollTrigger.refresh());
  }
  if (document.readyState === 'complete' || window.gsap) start();
  else addEventListener('DOMContentLoaded', start);
})();
