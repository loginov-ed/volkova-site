(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* ---------- Верхняя панель и плавающее меню ---------- */
  const topbar = $('.topbar');
  const pillList = $('.pill ul');
  const links = $$('.pill a');
  const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
  const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  let current = null;

  const setActive = (id) => {
    if (id === current) return;
    current = id;
    links.forEach((a) => a.removeAttribute('aria-current'));
    const a = id && byId.get(id);
    if (!a) return;
    a.setAttribute('aria-current', 'true');
    // держим активный пункт в поле зрения, если меню прокручивается (телефон)
    const left = a.offsetLeft - (pillList.clientWidth - a.offsetWidth) / 2;
    pillList.scrollTo({ left, behavior: 'smooth' });
  };

  const onScroll = () => {
    topbar.classList.toggle('is-scrolled', window.scrollY > 8);
    const mark = window.innerHeight * 0.4;
    let id = null;
    for (const s of sections) if (s.getBoundingClientRect().top <= mark) id = s.id;
    // внизу страницы подсвечиваем последний раздел
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      id = sections[sections.length - 1].id;
    }
    setActive(id);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Появление блоков ---------- */
  const revealables = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Отзывы: карточки из reviews.js ---------- */
  const reviewsTrack = $('[data-reviews]');
  const reviews = (Array.isArray(window.REVIEWS) ? window.REVIEWS : []).filter((r) => r && r.text);

  const reviewCard = (r, placeholder = false) => {
    const li = document.createElement('li');
    li.className = placeholder ? 'review review--placeholder' : 'review';

    const mark = document.createElement('span');
    mark.className = 'review__mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '“';

    const quote = document.createElement('blockquote');
    quote.textContent = r.text;

    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'review__more';
    more.textContent = 'Читать полностью';
    more.hidden = true;
    more.addEventListener('click', () => {
      const open = li.classList.toggle('is-open');
      more.textContent = open ? 'Свернуть' : 'Читать полностью';
    });

    const foot = document.createElement('div');
    foot.className = 'review__foot';
    const who = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = r.author || 'Пациентка';
    who.append(name, r.date ? ` · ${r.date}` : '');
    const src = document.createElement(r.url ? 'a' : 'span');
    src.textContent = r.source || 'ПроДокторов';
    if (r.url) { src.href = r.url; src.target = '_blank'; src.rel = 'noopener'; }
    foot.append(who, src);

    li.append(mark, quote, more, foot);
    return li;
  };

  if (reviewsTrack) {
    if (reviews.length) {
      reviews.forEach((r) => reviewsTrack.append(reviewCard(r)));
    } else {
      // пока отзывы не добавлены — показываем заглушки, чтобы было видно макет
      for (let i = 0; i < 3; i++) {
        reviewsTrack.append(reviewCard({ text: 'Здесь появится отзыв пациентки с ПроДокторов. Текст добавляется в файл reviews.js.', date: 'дата' }, true));
      }
    }
    // «Читать полностью» — только у длинных отзывов, которые не влезли целиком
    const markLong = () => {
      $$('.review', reviewsTrack).forEach((li) => {
        if (li.classList.contains('is-open')) return;
        const q = $('blockquote', li);
        $('.review__more', li).hidden = q.scrollHeight <= q.clientHeight + 2;
      });
    };
    markLong();
    window.addEventListener('resize', markLong);
    if (document.fonts) document.fonts.ready.then(markLong);
  }

  /* ---------- Карусели: стрелки и полоска прогресса ---------- */
  $$('[data-carousel]').forEach((root) => {
    const track = $('[data-track]', root);
    const prev = $('[data-dir="-1"]', root);
    const next = $('[data-dir="1"]', root);
    const bar = $('[data-progress]', root);
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
      if (bar) bar.style.setProperty('--p', max > 0 ? (track.scrollLeft + track.clientWidth) / track.scrollWidth : 1);
    };
    $$('[data-dir]', root).forEach((btn) => {
      btn.addEventListener('click', () => {
        track.scrollBy({ left: Number(btn.dataset.dir) * track.clientWidth * 0.8, behavior: 'smooth' });
      });
    });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
  });

  /* ---------- Лайтбокс для фото с конференций ---------- */
  const dialog = $('.lightbox');
  const dialogImg = $('img', dialog);
  const counter = $('.lightbox__count', dialog);
  const shots = $$('.gallery [data-full]');
  let index = 0;

  const show = (i) => {
    index = (i + shots.length) % shots.length;
    const shot = shots[index];
    dialogImg.src = shot.dataset.full;
    dialogImg.alt = $('img', shot).alt;
    counter.textContent = `${index + 1} / ${shots.length}`;
  };
  shots.forEach((shot, i) => shot.addEventListener('click', () => { show(i); dialog.showModal(); }));
  $('[data-lb="prev"]', dialog).addEventListener('click', () => show(index - 1));
  $('[data-lb="next"]', dialog).addEventListener('click', () => show(index + 1));
  $('[data-lb="close"]', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  dialog.addEventListener('close', () => shots[index]?.focus());

  /* ---------- Видео: грузим YouTube только по клику ---------- */
  $$('[data-yt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
      iframe.title = btn.getAttribute('aria-label');
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      btn.replaceWith(iframe);
    });
  });

  /* ---------- Telegram: готовое сообщение ----------
     Ссылка сама подставляет текст в чат (?text=...). На случай, если
     приложение Telegram его не подхватит, дублируем текст в буфер обмена. */
  const toast = $('.toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 4500);
  };
  $$('[data-tg-text]').forEach((a) => {
    a.addEventListener('click', () => {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(a.dataset.tgText).then(
        () => showToast('Текст сообщения скопирован — если он не появился в Telegram, просто вставьте его в чат'),
        () => {}
      );
    });
  });
})();
