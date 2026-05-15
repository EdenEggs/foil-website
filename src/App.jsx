import { useState, useEffect, useMemo } from 'react';
import RipOpener from './RipOpener.jsx';
import { useTweaks } from './TweaksPanel.jsx';

// ─── email signup ─────────────────────────────────────────────────────────
const WAITLIST_URL = import.meta.env.VITE_WAITLIST_URL;

function SignupForm({ count, onJoin }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@') || submitting) return;
    setError('');
    setDebug(null);
    setSubmitting(true);
    const trace = { url: WAITLIST_URL || '(unset)', sentEmail: email.trim().toLowerCase() };
    try {
      if (!WAITLIST_URL) {
        trace.warning = 'VITE_WAITLIST_URL not set — request was NOT sent';
        console.warn('[waitlist]', trace);
        setDebug(trace);
        setError('Signup endpoint is not configured on this build.');
        return;
      }

      const body = new URLSearchParams({
        email: trace.sentEmail,
        referrer: document.referrer || '',
        userAgent: navigator.userAgent,
      });
      const res = await fetch(WAITLIST_URL, { method: 'POST', body });
      trace.status = res.status;
      trace.ok = res.ok;

      const text = await res.text();
      trace.rawResponse = text;
      let data = null;
      try { data = JSON.parse(text); } catch { /* not JSON */ }
      trace.parsed = data;

      console.log('[waitlist]', trace);

      if (!res.ok) {
        setDebug(trace);
        throw new Error(`HTTP ${res.status}`);
      }
      if (data && data.ok === false) {
        setDebug(trace);
        throw new Error(`server: ${data.error || 'rejected'}`);
      }

      setDone(true);
      onJoin && onJoin(email);
    } catch (err) {
      console.error('[waitlist] submit failed', err, trace);
      setDebug((prev) => prev || trace);
      setError(`Couldn't save your email: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="cs-form-success">
        <div className="check">✓</div>
        <div>
          <strong>You're in.</strong>
          We'll email <span style={{ color: 'var(--fg)' }}>{email}</span> when the packs drop.
        </div>
      </div>
    );
  }

  return (
    <form className="cs-form" onSubmit={submit}>
      <input
        type="email"
        placeholder="you@inbox.lol"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
        required
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Joining…' : 'Join the waitlist →'}
      </button>
      {error && <div className="cs-form-error" style={{ color: 'var(--accent-2, #ff3d54)', fontSize: 13, marginTop: 8 }}>{error}</div>}
      {debug && (
        <pre style={{
          marginTop: 12,
          padding: 10,
          fontSize: 11,
          lineHeight: 1.4,
          background: 'rgba(0,0,0,0.55)',
          color: '#9fe',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          textAlign: 'left',
        }}>
{JSON.stringify(debug, null, 2)}
        </pre>
      )}
    </form>
  );
}

// ─── countdown ────────────────────────────────────────────────────────────
function useCountdown(targetIso) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
}

function Countdown() {
  const { d, h, m, s } = useCountdown('2026-08-14T09:00:00Z');
  return (
    <div className="cs-count">
      <span className="grp"><span>{d}</span><small>days</small></span>
      <span className="sep">:</span>
      <span className="grp"><span>{h}</span><small>hrs</small></span>
      <span className="sep">:</span>
      <span className="grp"><span>{m}</span><small>min</small></span>
      <span className="sep">:</span>
      <span className="grp"><span>{s}</span><small>sec</small></span>
    </div>
  );
}

// ─── stats strip ──────────────────────────────────────────────────────────
function StatsStrip({ count }) {
  const target = 100000;
  const pct = Math.min(100, (count / target) * 100);
  return (
    <div className="cs-stats">
      <div className="cs-stat">
        <div className="label">Drop date</div>
        <div className="value">AUG 14<span className="unit">2026</span></div>
      </div>
      <div className="cs-stat">
        <div className="label">Time until rip</div>
        <div className="value"><Countdown /></div>
      </div>
      <div className="cs-stat">
        <div className="label">Waitlist · live</div>
        <div className="value">
          {count.toLocaleString()}<span className="unit">/ 100k</span>
        </div>
        <div className="cs-meter">
          <div className="cs-meter-bar">
            <div className="cs-meter-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="cs-stat">
        <div className="label">Cards sealed</div>
        <div className="value">1.0<span className="unit">million</span></div>
      </div>
    </div>
  );
}

// ─── live signups feed ────────────────────────────────────────────────────
const HANDLE_PARTS = {
  pre: ['gm', 'cope', 'sealed', 'mythic', 'foil', 'rare', 'wojak', 'doge', 'pepe',
        'gigachad', 'anon', 'yiff', 'haymitch', 'whomstd', 'grandpa', 'bagholder',
        'dca', 'nomu', 'crispr', 'lambo', 'rugged', 'pleb', 'normie', 'vibe',
        'feels', 'kek', 'based', 'cringe', 'huge', 'tiny', 'soft', 'hardcore'],
  suf: ['.eth', '_69', '_xyz', 'lord', 'fan', '420', 'wif', 'gm', 'maxi',
        'cap', '01', '', '', '', ''],
};
const COLORS = ['#f5c842', '#4a7cdb', '#a052e0', '#ff3d54', '#39ff14', '#ff2d8d', '#4af3c8'];

function randHandle() {
  const a = HANDLE_PARTS.pre[Math.floor(Math.random() * HANDLE_PARTS.pre.length)];
  const b = HANDLE_PARTS.suf[Math.floor(Math.random() * HANDLE_PARTS.suf.length)];
  return '@' + a + b;
}

function SignupsList({ events }) {
  return (
    <div className="cs-signups-list">
      {events.map((e, i) => (
        <div key={e.id} className={`cs-signup-row ${i === 0 && e.fresh ? 'new' : ''}`}>
          <div className="avatar" style={{ '--av': e.color }}>
            {e.handle.slice(1, 3).toUpperCase()}
          </div>
          <div>
            <span className="handle">{e.handle}</span> &nbsp;joined the waitlist
          </div>
          <div className="when">{e.when}</div>
        </div>
      ))}
    </div>
  );
}

// ─── app shell ────────────────────────────────────────────────────────────
export default function App() {
  const [t] = useTweaks({
    theme: 'premium',
    openStyle: 'fan',
    showFoil: true,
    tilt: true,
  });

  useEffect(() => { document.body.setAttribute('data-theme', t.theme); }, [t.theme]);
  useEffect(() => {
    document.body.classList.toggle('no-foil', !t.showFoil);
    document.body.classList.toggle('no-tilt', !t.tilt);
  }, [t.showFoil, t.tilt]);

  const [count, setCount] = useState(84207);
  useEffect(() => {
    const tick = () => setCount((c) => c + Math.floor(Math.random() * 3) + 1);
    const id = setInterval(tick, 2400);
    return () => clearInterval(id);
  }, []);

  const [events, setEvents] = useState(() => {
    const seed = [];
    const whens = ['just now', '8s ago', '14s ago', '22s ago', '31s ago',
                   '47s ago', '1m ago', '1m ago', '2m ago', '2m ago', '3m ago'];
    for (let i = 0; i < 11; i++) {
      seed.push({
        id: 'init-' + i,
        handle: randHandle(),
        when: whens[i],
        color: COLORS[i % COLORS.length],
        fresh: false,
      });
    }
    return seed;
  });

  useEffect(() => {
    const push = () => {
      setEvents((prev) => {
        const next = [{
          id: 'e-' + Date.now() + '-' + Math.random(),
          handle: randHandle(),
          when: 'just now',
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          fresh: true,
        }, ...prev.map((e, i) => ({
          ...e,
          fresh: false,
          when: i === 0 ? '4s ago' :
                i === 1 ? '12s ago' :
                i === 2 ? '24s ago' :
                e.when === 'just now' ? '4s ago' : e.when,
        }))].slice(0, 12);
        return next;
      });
    };
    const id = setInterval(push, 3200);
    return () => clearInterval(id);
  }, []);

  const handleJoin = (email) => {
    setCount((c) => c + 1);
    const u = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    setEvents((prev) => [{
      id: 'you-' + Date.now(),
      handle: '@' + (u || 'you'),
      when: 'just now',
      color: 'var(--accent)',
      fresh: true,
    }, ...prev].slice(0, 12));
  };

  return (
    <>
      <div className="cs-page">

        {/* nav */}
        <header className="cs-nav-bar">
          <div className="wrap">
            <nav className="cs-nav">
              <a className="wordmark" href="#"><span>FOIL</span><span className="dot"></span></a>
              <div className="right">
                <span className="status">SYSTEMS NOMINAL · SERIES 01 LOADING</span>
              </div>
            </nav>
          </div>
        </header>

        {/* hero + demo (combined) */}
        <section className="cs-hero" id="waitlist" data-screen-label="01 Hero">
          <div className="cs-bg-grid" aria-hidden="true"></div>
          <div className="wrap" style={{ position: 'relative' }}>
            <h1 className="display">
              The memes are <span className="stamp">coming</span> <span className="hl">soon™.</span>
            </h1>

            <p className="cs-hero-subtitle">Rip a sample pack in the meantime</p>

            {/* DEMO */}
            <div className="cs-hero-demo">
              <RipOpener style={t.openStyle} />
            </div>

            <p className="lede">
              Trade <span className="fx-squiggle">virality</span>, rip <span className="fx-block">packs</span>, or simply collect your favorite <span className="fx-rainbow">brainrots</span> —
              all immortalized in <span className="fx-foil">foil</span>.
            </p>

            <SignupForm count={count} onJoin={handleJoin} />

            <p className="cs-form-note">No spam. Unsubscribe anytime. We'll just email you when the packs drop.</p>
          </div>
        </section>

        {/* fan showcase */}
        <section className="cs-fans" data-screen-label="04 Fans">
          <div className="wrap">
            <div className="cs-fans-head">
              <div className="num">[ COLLECTION SYNERGIES ]</div>
              <h2>Collect Them All</h2>
            </div>
            <div className="cs-fans-grid">
              {[
                {
                  label: 'Discord Mod Starter Pack',
                  cards: [
                    { rarity: 'common', image: '/Roblox.jpg',         name: '???', desc: '???' },
                    { rarity: 'rare',   image: '/EpicSlayer57.jpg',   name: '???', desc: '???' },
                    { rarity: 'epic' },
                  ],
                },
                {
                  label: 'Nightmare Blunt Rotation',
                  cards: [
                    { rarity: 'common', image: '/Altman.jpg', name: '???', desc: '???' },
                    { rarity: 'rare',   image: '/Beast.jpg',  name: '???', desc: '???' },
                    { rarity: 'epic' },
                  ],
                },
                {
                  label: 'Looks = Maxxed',
                  cards: [
                    { rarity: 'common', image: '/virgin.jpg', name: '???', desc: '???' },
                    { rarity: 'rare',   image: '/Chad.jpg',   name: '???', desc: '???' },
                    { rarity: 'epic' },
                  ],
                },
              ].map(({ label, cards }) => (
                <div className="cs-fan" key={label}>
                  <div className="cs-fan-cards">
                    {cards.map((c, i) => (
                      <div className="cs-fan-card" key={i} data-r={c.rarity} data-has-image={c.image ? 'true' : 'false'} title={c.desc}>
                        {c.image ? (
                          <>
                            <div className="cs-fan-top">
                              <span>FOIL '26 · S01</span>
                              <span className="cs-fan-pill">{c.rarity.slice(0, 3).toUpperCase()}</span>
                            </div>
                            <div className="cs-fan-art">
                              <img src={c.image} alt={c.name} />
                            </div>
                            <div className="cs-fan-name">{c.name}</div>
                          </>
                        ) : (
                          <>
                            <span className="cs-fan-logo">FOIL</span>
                            <span className="cs-fan-r">{c.rarity.toUpperCase()}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="cs-fan-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* perks */}
        <section className="cs-perks" data-screen-label="05 Perks">
          <div className="wrap">
            <div className="cs-perks-head">
              <div className="num">[WAITLIST PERKS]</div>
            </div>
            <div className="cs-perks-grid">
              <div className="cs-perk">
                <div className="icon">01</div>
                <h3>24-hour early access</h3>
                <p>First crack at every Series 01 pack drop before public sale. Get the good edition numbers while they're still single digits.</p>
              </div>
              <div className="cs-perk">
                <div className="icon">02</div>
                <h3>Free Rare on signup</h3>
                <p>One free Rare card auto-claimed to your account the day we launch. Yes, it's just a Rare. No, you can't choose which.</p>
              </div>
              <div className="cs-perk">
                <div className="icon">03</div>
                <h3>Exclusive OG badge</h3>
                <p>A permanent OG badge pinned to your profile — visible on every trade, every listing, every pull. Proof you were here before the normies showed up.</p>
              </div>
            </div>
          </div>
        </section>

        {/* signups list */}
        <section className="cs-signups" data-screen-label="05 Signups">
          <div className="wrap">
            <div className="cs-signups-grid">
              <div>
                <div className="num" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.2em', color: 'var(--fg-mute)', textTransform: 'uppercase', marginBottom: 14 }}>[LIVE]</div>
                <h2 className="display">People are<br />signing up<br />right now.</h2>
                <p>The waitlist closes when we hit 100,000. After that, you'll have to wait for public launch like the rest of the unblessed.</p>
              </div>
              <SignupsList events={events} />
            </div>
          </div>
        </section>

        {/* faq */}
        <section className="cs-faq" data-screen-label="06 FAQ">
          <div className="wrap">
            <div className="cs-faq-head">
              <div className="num" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.2em', color: 'var(--fg-mute)', textTransform: 'uppercase', marginBottom: 14 }}>[QUESTIONS]</div>
              <h2>Things we hear a lot.</h2>
            </div>
            <div className="cs-faq-list">
              <div className="cs-faq-item">
                <h4><span className="q">Q.01</span>How does it work?</h4>
                <p>For this first collection we'll be selling an initial 50,000 packs at $0.50 each. Each pack has 10 cards with at least 1 guaranteed rare. You can keep your pack sealed or choose to open it — up to you.</p>
              </div>
              <div className="cs-faq-item">
                <h4><span className="q">Q.02</span>Are these NFTs?</h4>
                <p>No. They're digital trading cards with a chain-backed provenance log under the hood. You don't need a wallet. You don't need to know what "gas" means. You buy with a credit card.</p>
              </div>
              <div className="cs-faq-item">
                <h4><span className="q">Q.03</span>What memes are in Series 01?</h4>
                <p>Whatever is funny — always taking suggestions! But no, seriously, mostly recent (2026) goofs and gafs.</p>
              </div>
              <div className="cs-faq-item">
                <h4><span className="q">Q.04</span>How do trades work?</h4>
                <p>Marketplace listings, peer-to-peer swaps, or counter-offer negotiations. 2.5% platform fee on sales, zero fee on direct swaps. Full ledger lives with each card forever.</p>
              </div>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="cs-foot">
          <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>© FOIL HOLDINGS · MMXXVI · COMING SUMMER 2026</span>
            <div className="right">
              <a href="#">Twitter</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
