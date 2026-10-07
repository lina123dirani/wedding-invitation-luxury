import { useEffect, useRef, useState } from "react";

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=33.51315,36.27376";

const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
  encodeURIComponent("حفل زفاف سارة و سوار") +
  "&dates=20261016T160000Z/20261016T200000Z&location=" +
  encodeURIComponent("Sheraton Damascus Hotel") +
  "&details=" +
  encodeURIComponent("الجمعة ١٦ أكتوبر ٢٠٢٦، السابعة مساءً، فندق الشيراتون في دمشق.");

const WEDDING = new Date("2026-10-16T19:00:00+03:00").getTime();

const PROGRAM = [
  {
    time: "٦:٣٠",
    title: "استقبال الضيوف",
    text: "تُفتح الأبواب على ضحكاتكم، وعلى أول وردة في المساء.",
  },
  {
    time: "٧:٠٠",
    title: "عقد القران",
    text: "لحظة يهدأ فيها كل شيء، إلا القلبين.",
  },
  {
    time: "٨:١٥",
    title: "العشاء",
    text: "مائدة جمعتها المودة، ونورٌ يميل إلى الورد.",
  },
  {
    time: "٩:٣٠",
    title: "قطعة الحلوى",
    text: "حلاوة تُقاسَم، كما تُقاسَم أجمل الأمنيات.",
  },
  {
    time: "١٠:١٥",
    title: "السهرة",
    text: "نرقص حتى آخر نجمة، ونودع المساء بالشكر.",
  },
];

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toArabic(value, pad = 2) {
  return String(value)
    .padStart(pad, "0")
    .replace(/\d/g, (digit) => AR_DIGITS[digit]);
}

function wavePath(width, height, ampX, ampY, wavesX, wavesY, inset) {
  const steps = 72;
  const left = inset;
  const right = width - inset;
  const top = inset;
  const bottom = height - inset;
  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push([
      left + (right - left) * t,
      top + Math.sin(t * Math.PI * wavesX) * ampY,
    ]);
  }
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    points.push([
      right + Math.sin(t * Math.PI * wavesY) * ampX,
      top + (bottom - top) * t,
    ]);
  }
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    points.push([
      right - (right - left) * t,
      bottom + Math.sin(t * Math.PI * wavesX) * ampY,
    ]);
  }
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    points.push([
      left + Math.sin(t * Math.PI * wavesY) * ampX,
      bottom - (bottom - top) * t,
    ]);
  }

  return `M ${points
    .map((point) => `${point[0].toFixed(1)} ${point[1].toFixed(1)}`)
    .join(" L ")} Z`;
}

const OUTER_WAVE = wavePath(320, 470, 13, 11, 2, 3, 14);
const INNER_WAVE = wavePath(320, 470, 10, 8, 2, 3, 26);

function Plaque() {
  return (
    <svg
      className="plaque-svg"
      viewBox="0 0 320 470"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={OUTER_WAVE} className="plaque-fill" />
      <path d={OUTER_WAVE} className="plaque-stroke" />
      <path d={INNER_WAVE} className="plaque-inner" />
    </svg>
  );
}

function IntroFilm({ onDone }) {
  const videoRef = useRef(null);
  const onDoneRef = useRef(onDone);
  const finished = useRef(false);
  onDoneRef.current = onDone;

  function finish() {
    if (finished.current) return;
    finished.current = true;
    onDoneRef.current();
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    let stopped = false;

    const start = () => {
      if (stopped || video.ended || !video.paused) return;
      video.muted = true;
      video.play().catch(() => {
        if (!stopped) finish();
      });
    };

    start();
    video.addEventListener("loadeddata", start);
    video.addEventListener("canplay", start);

    return () => {
      stopped = true;
      video.removeEventListener("loadeddata", start);
      video.removeEventListener("canplay", start);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="gate-video"
      src="/media/intro.mp4"
      muted
      playsInline
      autoPlay
      preload="auto"
      data-gate=""
      onEnded={finish}
      onError={finish}
    />
  );
}

function SwanFilm({ id, children, premiere = false, playPremiere = false }) {
  const videoRef = useRef(null);
  const [revealed, setRevealed] = useState(!premiere);
  const started = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const reveal = () => {
      video.loop = true;
      setRevealed(true);
      video.play().catch(() => {});
    };

    if (premiere) {
      video.loop = false;
      video.addEventListener("ended", reveal);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (premiere && !started.current) return;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.18 },
    );
    observer.observe(video);

    return () => {
      if (premiere) video.removeEventListener("ended", reveal);
      observer.disconnect();
    };
  }, [premiere]);

  useEffect(() => {
    const video = videoRef.current;
    if (!premiere || !playPremiere || !video || started.current) return undefined;
    started.current = true;

    const begin = () => {
      video.loop = false;
      if (Number.isFinite(video.duration)) video.currentTime = 0;
      video.play().catch(() => setRevealed(true));
    };

    if (video.readyState >= 1) begin();
    else video.addEventListener("loadeddata", begin, { once: true });

    return undefined;
  }, [premiere, playPremiere]);

  return (
    <section id={id} className={`film${premiere ? " film-premiere" : ""}${revealed ? " is-revealed" : ""}`}>
      <video
        ref={videoRef}
        className="film-video"
        src="/media/swans.mp4"
        muted
        loop={!premiere || revealed}
        playsInline
        preload="auto"
        data-premiere={premiere ? "" : undefined}
        aria-hidden="true"
      />
      <div className="film-veil" />
      <div className="plaque">
        <Plaque />
        <div className="plaque-copy">{children}</div>
      </div>
    </section>
  );
}

function Divider() {
  return (
    <div className="divider" aria-hidden="true">
      <span />
      <i />
      <span />
    </div>
  );
}

function useCountdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = Math.max(0, WEDDING - now);
  return {
    done: remaining === 0,
    days: Math.floor(remaining / 86400000),
    hours: Math.floor(remaining / 3600000) % 24,
    minutes: Math.floor(remaining / 60000) % 60,
    seconds: Math.floor(remaining / 1000) % 60,
  };
}

function FlipUnit({ value, label }) {
  const [snapshot, setSnapshot] = useState(value);
  const [from, setFrom] = useState(value);
  const [flipping, setFlipping] = useState(false);

  if (value !== snapshot && !flipping) {
    setFrom(snapshot);
    setSnapshot(value);
    setFlipping(true);
  }

  useEffect(() => {
    if (!flipping) return undefined;
    const timer = window.setTimeout(() => setFlipping(false), 640);
    return () => window.clearTimeout(timer);
  }, [flipping]);

  const next = toArabic(flipping ? value : snapshot);
  const previous = toArabic(flipping ? from : snapshot);

  return (
    <div className={`flip-unit ${flipping ? "is-flipping" : ""}`}>
      <div className="flip-num" aria-hidden="true">
        <div className="half top"><b>{next}</b></div>
        <div className="half bottom"><b>{previous}</b></div>
        <div className="half top flap"><b>{previous}</b></div>
        <div className="half bottom flap"><b>{next}</b></div>
      </div>
      <span className="sr-only">{toArabic(value)} {label}</span>
      <span>{label}</span>
    </div>
  );
}

function Countdown() {
  const time = useCountdown();

  return (
    <section id="countdown" className="sheet sheet-blush">
      <p className="eyebrow">حتى المساء</p>
      <h2>موعدنا يقترب</h2>
      <Divider />
      {time.done ? (
        <p className="lead">حلّت ليلة العمر. أهلاً بكم في فرحتنا.</p>
      ) : (
        <>
          <p className="lead">باقي على ليلةٍ تشبه الورد، وتُكتَب بالحضور.</p>
          <div className="count">
            <FlipUnit value={time.days} label="يوم" />
            <FlipUnit value={time.hours} label="ساعة" />
            <FlipUnit value={time.minutes} label="دقيقة" />
            <FlipUnit value={time.seconds} label="ثانية" />
          </div>
          <p className="whisper">ومع كل لحظة، نقترب من المساء الذي انتظرناه.</p>
        </>
      )}
    </section>
  );
}

function Program() {
  const sectionRef = useRef(null);
  const flowerRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const flower = flowerRef.current;
    if (!section || !flower) return undefined;

    let frame = 0;
    let current = 0;
    let target = 0;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
      const passed = Math.min(Math.max(-rect.top, 0), scrollable);
      target = passed / scrollable;

      const items = section.querySelectorAll(".timeline li");
      const index = Math.round(target * Math.max(items.length - 1, 0));
      items.forEach((item, i) => item.classList.toggle("is-here", i === index));
    };

    const tick = () => {
      current += (target - current) * 0.18;
      const items = section.querySelectorAll(".timeline li");
      if (items.length > 1) {
        const first = items[0];
        const last = items[items.length - 1];
        const top = first.offsetTop + 4;
        const bottom = last.offsetTop + 4;
        flower.style.top = `${top + (bottom - top) * current}px`;
      }
      frame = window.requestAnimationFrame(tick);
    };

    measure();
    frame = window.requestAnimationFrame(tick);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section id="program" className="sheet program" ref={sectionRef}>
      <p className="eyebrow">برنامج المساء</p>
      <h2>محطات الفرح</h2>
      <p className="lead">خمس وقفات نتشاركها، من أول استقبال حتى آخر رقصة.</p>
      <ol className="timeline">
        {PROGRAM.map((item) => (
          <li key={item.time}>
            <time>{item.time}</time>
            <div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
        <img ref={flowerRef} className="program-flower" src="/media/flower.png" alt="" />
      </ol>
    </section>
  );
}

function Rsvp() {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function submit(event) {
    event.preventDefault();
    if (!name.trim() || !attending) {
      setError("اكتبوا الاسم، واختاروا إن كنتم تشاركوننا المساء.");
      return;
    }
    setError("");
    setSent(true);
  }

  return (
    <section id="rsvp" className="sheet">
      <p className="eyebrow">الحضور</p>
      <h2>هل تشاركوننا الفرح؟</h2>
      <Divider />
      <p className="lead">
        نرجو أن تخبرونا، لنُعدّ لكم مكانًا في القاعة… وفي القلب.
      </p>

      {sent ? (
        <div className="thanks">
          <p className="sign">بكل المودة</p>
          <h3>{attending === "yes" ? "وصلَنا فرحكم" : "وصلت محبتكم"}</h3>
          <p>
            {attending === "yes"
              ? `${name.trim()}، صرتم جزءًا من الحكاية. نراكم في فندق الشيراتون بدمشق، والورد في انتظاركم.`
              : `${name.trim()}، شكرًا لكم. سنفتقد حضوركم، وتبقى المودة بيننا كما هي.`}
          </p>
        </div>
      ) : (
        <form className="rsvp" onSubmit={submit}>
          <label>
            الاسم الكامل
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="اكتبوا اسمكم الكريم"
              autoComplete="name"
            />
          </label>
          <div className="choices">
            <button
              type="button"
              className={attending === "yes" ? "is-on" : ""}
              onClick={() => {
                setAttending("yes");
                setError("");
              }}
            >
              بكل سرور، سأحضر
            </button>
            <button
              type="button"
              className={attending === "no" ? "is-on" : ""}
              onClick={() => {
                setAttending("no");
                setError("");
              }}
            >
              أعتذر عن الحضور
            </button>
          </div>
          <label>
            كلمة للعروسين
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="اتركوا أمنية، أو بيتًا من المحبة…"
              rows={3}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn" type="submit">
            أرسلوا الرد
          </button>
        </form>
      )}
    </section>
  );
}

function GuestMusic() {
  const audioRef = useRef(null);
  const started = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    let stopped = false;
    audio.volume = 0.72;

    const mark = () => {
      if (!stopped) setPlaying(!audio.paused);
    };

    const begin = () => {
      if (started.current) return;
      audio.play().then(() => {
        started.current = true;
        window.removeEventListener("pointerdown", onGesture);
      }).catch(() => {});
    };

    function onGesture(event) {
      if (event.target instanceof Element && event.target.closest(".music-toggle")) return;
      begin();
    }

    audio.addEventListener("play", mark);
    audio.addEventListener("pause", mark);
    begin();
    window.addEventListener("pointerdown", onGesture);

    return () => {
      stopped = true;
      audio.removeEventListener("play", mark);
      audio.removeEventListener("pause", mark);
      window.removeEventListener("pointerdown", onGesture);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => {
        started.current = true;
      }).catch(() => {});
    } else {
      audio.pause();
    }
  }

  return (
    <>
      <audio ref={audioRef} src="/media/music.mp3" loop preload="auto" />
      <button
        className={`music-toggle${playing ? " is-on" : ""}`}
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 18.5a2.5 2.5 0 1 1-2-2.45V6.2l10-2.1v9.95a2.5 2.5 0 1 1-2-2.45V6.4l-6 1.25v8.4a2.5 2.5 0 0 1 0 .45Z" />
          {playing ? null : <path d="M5 5.5 19.5 20" />}
        </svg>
      </button>
    </>
  );
}

export default function App() {
  const [phase, setPhase] = useState(() =>
    new URLSearchParams(window.location.search).has("open") ? "open" : "sealed",
  );
  const open = phase === "open";

  useEffect(() => {
    document.body.style.overflow = open ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal], .sheet, .film");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        });
      },
      { threshold: 0.28 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  function openInvite() {
    document.querySelectorAll("video:not([data-premiere]):not([data-gate])").forEach((video) => {
      video.muted = true;
      video.play().catch(() => {});
    });
    window.scrollTo(0, 0);
    setPhase("opening");
    window.setTimeout(() => setPhase("open"), 860);
  }

  return (
    <div className={`invitation ${open ? "is-open" : ""}`}>
      <GuestMusic />
      {phase !== "open" ? (
        <div className={`gate ${phase === "sealed" ? "" : "is-leaving"}`}>
          <IntroFilm onDone={openInvite} />
        </div>
      ) : null}

      <main id="story">
        <SwanFilm id="names" premiere playPremiere={phase !== "sealed"}>
          <p className="basmala">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          <p className="invite-line">يسرّنا دعوتكم إلى حفل الزفاف</p>
          <h1 className="hero-names">سارة و سوار</h1>
          <Divider />
          <p className="date-line">الجمعة، ١٦ أكتوبر ٢٠٢٦</p>
          <button
            className="scroll-cue"
            type="button"
            onClick={() => document.getElementById("invitation")?.scrollIntoView({ behavior: "smooth" })}
          >
            انزلوا مع الوردة
          </button>
        </SwanFilm>

        <SwanFilm id="invitation">
          <p className="eyebrow">دعوتنا إليكم</p>
          <p className="poem">
            في مساءٍ يشبه الورد،
            <br />
            يجتمع قلبان كما اجتمعت بجعتان
            <br />
            على صفحة ماءٍ هادئ.
          </p>
          <Divider />
          <p className="poem soft">
            نتشرّف بأن تكونوا معنا
            <br />
            حين يُكتَب الاسمان سطرًا واحدًا،
            <br />
            ويصير حضوركم أجمل ما في الحكاية.
          </p>
          <p className="sign">بكل المودة</p>
        </SwanFilm>

        <section id="date" className="sheet sheet-date">
          <div className="petals" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="favors" aria-hidden="true">
            <img className="favor flower" src="/media/flower.png" alt="" />
            <img className="favor flower late" src="/media/flower.png" alt="" />
            <img className="favor flower tiny" src="/media/flower.png" alt="" />
            <i className="favor petal" />
            <i className="favor petal" />
            <i className="favor petal" />
            <i className="favor petal" />
            <i className="favor petal" />
          </div>
          <div className="save-stack" data-reveal>
            <div className="drop title-card">
              <h2>احفظوا الموعد</h2>
              <p>لأن أجمل الحكايات تُحفَظ قبل أن تُروى.</p>
            </div>

            <a className="drop fact" href={CALENDAR_URL} target="_blank" rel="noreferrer">
              <img src="/media/icon-calendar.png" alt="" />
              <span>
                <small>التاريخ</small>
                <strong>الجمعة، ١٦ أكتوبر ٢٠٢٦</strong>
              </span>
            </a>

            <div className="drop fact">
              <img src="/media/icon-hourglass.png" alt="" />
              <span>
                <small>الوقت</small>
                <strong>السابعة مساءً</strong>
              </span>
            </div>

            <a className="drop fact" href={MAPS_URL} target="_blank" rel="noreferrer">
              <img src="/media/icon-pin.png" alt="" />
              <span>
                <small>المكان</small>
                <strong>شيراتون دمشق</strong>
              </span>
            </a>

            <a className="drop btn map-btn" href={MAPS_URL} target="_blank" rel="noreferrer">
              افتحوا الموقع في خرائط غوغل
            </a>
          </div>
        </section>

        <Countdown />

        <Program />

        <SwanFilm id="place">
          <p className="eyebrow">حيث نلتقي</p>
          <h2 className="place-title">شيراتون دمشق</h2>
          <Divider />
          <p className="poem soft">
            نتشرّف بحضوركم في قاعةٍ
            <br />
            تليق بفرحةٍ طال انتظارها.
          </p>
          <p className="place-meta">٧:٠٠ مساءً · ١٦ أكتوبر ٢٠٢٦</p>
          <a className="btn" href={MAPS_URL} target="_blank" rel="noreferrer">
            <img src="/media/icon-pin.png" alt="" />
            افتحوا الموقع على الخريطة
          </a>
        </SwanFilm>

        <Rsvp />

        <section id="studio" className="studio">
          <p className="eyebrow">إلى أن نلتقي</p>
          <p className="studio-line">بخيطٍ من مودة، وبعهدٍ لا يذبل</p>
          <img src="/media/studio-logo.jpg" alt="شعار الاستوديو" />
        </section>
      </main>
    </div>
  );
}
