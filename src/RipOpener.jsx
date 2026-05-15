import { useState, useEffect, useRef, useMemo } from 'react';

const PULLS = {
  standard: [
    { rarity: 'common',    name: 'Thinking',      edition: '#1,204 / ∞'  },
    { rarity: 'common',    name: 'Kirkification', edition: '#3,022 / ∞', image: '/Kirky.jpg' },
    { rarity: 'rare',      name: 'Drake Y/N',     edition: '#0,412 / 2k' },
    { rarity: 'epic',      name: 'This Is Fine',  edition: '#072 / 500'  },
    { rarity: 'legendary', name: 'Distracted BF', edition: '#188 / 250'  },
  ],
  chase: [
    { rarity: 'common',    name: 'Kirkification', edition: '#3,022 / ∞', image: '/Kirky.jpg' },
    { rarity: 'rare',      name: 'Yakub',         edition: '#0,882 / 2k', image: '/Yakub.jpg',
      blurb: 'Black scientist who lived approximately 6,600 years ago, responsible for genetically engineering white people through selective breeding.' },
    { rarity: 'epic',      name: 'Girl Dinner <3', edition: '#128 / 500', image: '/Ozempic.jpg',
      blurb: '"a once-weekly, brand-name injection approved to improve blood sugar management in adults with type 2 diabetes and to reduce cardiovascular risks, such as heart attack or stroke"' },
    { rarity: 'legendary', name: 'Tung Tung Tung', edition: '#099 / 250', image: '/Tung.jpg',
      blurb: 'The one and only Triple T.' },
    { rarity: 'mythic',    name: 'Daddy',         edition: '#003 / 100', image: '/Daddy.jpg',
      blurb: 'Power level: ???' },
  ],
};

const isFaceDown = (r) => r === 'epic' || r === 'legendary' || r === 'mythic';

const rarityCopy = {
  common:    { tag: 'Common',     blurb: 'Stock card. Death by a million Kirks.' },
  rare:      { tag: 'Rare',       blurb: 'One of 2,000. Embossed border.' },
  epic:      { tag: 'Epic',       blurb: 'One of 500. Spot UV finish.' },
  legendary: { tag: 'Legendary',  blurb: 'One of 250. Half-foil treatment.' },
  mythic:    { tag: 'MYTHIC',     blurb: "One of 100. Full holo refractor. Don't breathe on it." },
};

function computeSlice(dx, dy) {
  const rad = Math.atan2(dy, dx);
  const deg = rad * 180 / Math.PI;
  const D = 260;
  return {
    angle: deg,
    perpCss: deg + 180,
    flyAx: -D * Math.sin(rad),
    flyAy: -D * Math.cos(rad),
    flyBx:  D * Math.sin(rad),
    flyBy:  D * Math.cos(rad),
  };
}

function DraggableMini({ card }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y };
    setDragging(true);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const { x, y, ox, oy } = dragRef.current;
    setPos({ x: ox + (e.clientX - x), y: oy + (e.clientY - y) });
  };
  const onPointerUp = (e) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  return (
    <div
      className="mini"
      data-r={card.rarity}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: dragging ? 1000 : 1,
        touchAction: 'none',
        userSelect: 'none',
        transition: dragging ? 'none' : 'box-shadow .15s',
        boxShadow: dragging ? '0 12px 32px rgba(0,0,0,0.45)' : 'none',
      }}
    >
      {card.rarity.slice(0, 3).toUpperCase()}
    </div>
  );
}

// deterministic 0..1 pseudo-random from string
function seeded(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const RARITY_BASE = {
  common:    { lo: 30, hi: 65, foil: 'C' },
  rare:      { lo: 50, hi: 80, foil: 'B' },
  epic:      { lo: 65, hi: 90, foil: 'A' },
  legendary: { lo: 78, hi: 96, foil: 'S' },
  mythic:    { lo: 88, hi: 99, foil: 'S+' },
};

function getStats(card) {
  const rnd = seeded(card.name + '::' + card.rarity);
  const { lo, hi, foil } = RARITY_BASE[card.rarity];
  const roll = () => Math.round(lo + rnd() * (hi - lo));
  return {
    power:       roll(),
    hype:        roll(),
    esotericism: roll(),
    mogFactor:   roll(),
    foil,
  };
}

function CardStats({ card, onClose }) {
  const stats = getStats(card);
  return (
    <div className="card-stats-overlay" onClick={onClose}>
      <div className="card-stats" onClick={(e) => e.stopPropagation()} data-r={card.rarity}>
        <button className="card-stats-x" onClick={onClose} aria-label="close">×</button>
        <div className="card-stats-head">
          <div className="card-stats-eyebrow">FOIL '26 · S01 · {card.rarity.toUpperCase()}</div>
          <div className="card-stats-name">{card.name}</div>
          <div className="card-stats-edition">{card.edition}</div>
        </div>
        <div className="card-stats-bars">
          {[
            ['POWER',       stats.power],
            ['HYPE',        stats.hype],
            ['ESOTERICISM', stats.esotericism],
            ['MOG-FACTOR',  stats.mogFactor],
          ].map(([label, val]) => (
            <div className="card-stat-row" key={label}>
              <span className="card-stat-label">{label}</span>
              <div className="card-stat-bar"><span style={{ width: `${val}%` }} /></div>
              <span className="card-stat-val">{val}</span>
            </div>
          ))}
        </div>
        <div className="card-stats-foot">
          <span>FOIL GRADE</span>
          <strong className="card-stats-grade" data-grade={stats.foil} data-text={stats.foil}>{stats.foil}</strong>
        </div>
      </div>
    </div>
  );
}

function RipCard({ card, flipped, charging, settled, onFlip }) {
  const [statsOpen, setStatsOpen] = useState(false);
  const clickable = !flipped && !charging && isFaceDown(card.rarity);
  return (
    <div className="rip-card" data-r={card.rarity} data-flipped={flipped} data-charging={charging ? 'true' : 'false'}
         data-settled={settled ? 'true' : 'false'}
         onClick={clickable ? onFlip : undefined}
         style={{ cursor: clickable ? 'pointer' : 'default' }}>
      <div className="rip-card-flipper">
        <div className="rip-card-back-face">
          <div className="bk-r">{card.rarity}</div>
          <div className="bk-logo">FOIL</div>
          <div className="bk-tap">tap to flip</div>
        </div>
        <div className="rip-card-face">
          <div className="rcf-top">
            <span>FOIL '26 · S01</span>
            <span className="rcf-pill">{card.rarity.slice(0, 3).toUpperCase()}</span>
          </div>
          <div className="rcf-art" data-has-image={card.image ? 'true' : 'false'}>
            {card.image
              ? <img src={card.image} alt={card.name} />
              : card.name.toUpperCase()}
          </div>
          <div className="rcf-name">{card.name}</div>
          <div className="rcf-foot">
            <span>{card.edition}</span>
            <button
              type="button"
              className="rcf-stats-btn"
              onClick={(e) => { e.stopPropagation(); setStatsOpen(true); }}
            >
              STATS
            </button>
          </div>
        </div>
      </div>
      {statsOpen && <CardStats card={card} onClose={() => setStatsOpen(false)} />}
    </div>
  );
}

const CONFETTI_COLORS = ['#ff3d54', '#f5c842', '#4a7cdb', '#a052e0', '#ff2d8d', '#4af3c8', '#39ff14', '#ffffff'];

function Confetti({ count = 70 }) {
  const pieces = useMemo(() => Array.from({ length: count }).map(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 220 + Math.random() * 380;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance * 0.6 - 60;
    return {
      tx, ty,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rot: (Math.random() - 0.5) * 1440,
      delay: Math.random() * 0.18,
      dur: 1.6 + Math.random() * 0.9,
      w: 7 + Math.random() * 7,
      h: 11 + Math.random() * 9,
    };
  }), [count]);
  return (
    <div className="fx-confetti">
      {pieces.map((p, i) => (
        <span key={i} style={{
          '--tx': `${p.tx}px`,
          '--ty': `${p.ty}px`,
          '--rot': `${p.rot}deg`,
          '--d': `${p.delay}s`,
          '--dur': `${p.dur}s`,
          background: p.color,
          width: `${p.w}px`,
          height: `${p.h}px`,
        }} />
      ))}
    </div>
  );
}

function Particles({ count, color }) {
  const dots = useMemo(() => (
    Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * 360 + Math.random() * 20;
      const d = Math.random() * 0.3;
      return { a, d, k: Math.random() };
    })
  ), [count, color]);
  return (
    <div className="fx-particles" data-color={color}>
      {dots.map((p, i) => (
        <span key={i} style={{ '--a': `${p.a}deg`, '--d': `${p.d}s` }} />
      ))}
    </div>
  );
}

function RipFX({ rarity, flipped, revealKey }) {
  const showFx = !isFaceDown(rarity) || flipped;
  if (!showFx) return null;

  return (
    <>
      {rarity === 'rare' && (
        <div className="fx fx-rare" key={revealKey}>
          <div className="fx-rare-aura" />
        </div>
      )}

      {rarity === 'epic' && (
        <>
          <div className="fx-epic-shockwave" key={revealKey + '-sw'} />
          <Particles count={14} color="epic" key={revealKey + '-p'} />
        </>
      )}

      {rarity === 'legendary' && (
        <>
          <svg className="fx-rays" viewBox="-100 -100 200 200" key={revealKey + '-r'}>
            {Array.from({ length: 24 }).map((_, i) => (
              <polygon key={i} className="ray"
                points="-3,-100 3,-100 0,0"
                transform={`rotate(${i * 15})`} />
            ))}
          </svg>
          <Particles count={20} color="legendary" key={revealKey + '-p'} />
        </>
      )}

      {rarity === 'mythic' && (
        <>
          <div className="fx-flash" key={revealKey + '-f'} />
          <svg className="fx-rays" viewBox="-100 -100 200 200" key={revealKey + '-r'}>
            {Array.from({ length: 36 }).map((_, i) => (
              <polygon key={i} className="ray"
                points="-2,-100 2,-100 0,0"
                transform={`rotate(${i * 10})`}
                style={{ fill: `hsl(${i * 10}, 90%, 65%)` }} />
            ))}
          </svg>
          <Particles count={28} color="mythic" key={revealKey + '-p'} />
          <Confetti count={80} key={revealKey + '-c'} />
        </>
      )}
    </>
  );
}

export default function RipOpener() {
  const [phase, setPhase] = useState('idle');
  const [pack, setPack] = useState({ x: 0, y: 0, angle: 0 });
  const [slice, setSlice] = useState({ angle: 0, perpCss: 180, flyAx: 0, flyAy: -260, flyBx: 0, flyBy: 260 });
  const [trail, setTrail] = useState([]);
  const [pull, setPull] = useState(PULLS.standard);
  const [revealIdx, setRevealIdx] = useState(0);
  const [flipped, setFlipped] = useState({});
  const [charging, setCharging] = useState({});
  const [settled, setSettled] = useState({});
  const [revealKey, setRevealKey] = useState(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [revealReady, setRevealReady] = useState(false);

  const stageRef = useRef(null);
  const packRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (phase === 'idle') {
      setPull(PULLS.chase);
    }
  }, [phase]);

  useEffect(() => { setTilt({ rx: 0, ry: 0 }); }, [revealIdx, phase]);

  useEffect(() => {
    if (phase !== 'revealing') { setRevealReady(false); return; }
    const rarity = pull[revealIdx]?.rarity;
    if (rarity === 'common' || rarity === 'rare') {
      setRevealReady(false);
      const t = setTimeout(() => setRevealReady(true), 1000);
      return () => clearTimeout(t);
    }
    setRevealReady(true);
  }, [revealIdx, phase, pull]);

  const tiltLocked = !!charging[revealIdx] || (!!flipped[revealIdx] && !settled[revealIdx]);
  useEffect(() => {
    if (tiltLocked) setTilt({ rx: 0, ry: 0 });
  }, [tiltLocked]);

  const onTiltMove = (e) => {
    if (tiltLocked) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    const max = 18;
    setTilt({ rx: -dy * max, ry: dx * max });
  };
  const onTiltLeave = () => { if (!tiltLocked) setTilt({ rx: 0, ry: 0 }); };

  const stageCoord = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const inPack = (clientX, clientY) => {
    const r = packRef.current?.getBoundingClientRect();
    if (!r) return false;
    return clientX >= r.left && clientX <= r.right
        && clientY >= r.top  && clientY <= r.bottom;
  };

  const onPointerDown = (e) => {
    if (phase !== 'idle') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = stageCoord(e);
    const insidePack = inPack(e.clientX, e.clientY);
    dragRef.current = {
      mode: insidePack ? 'move' : 'slice',
      startClientX: e.clientX, startClientY: e.clientY,
      startX: x, startY: y,
      lastX: x, lastY: y,
      packX0: pack.x, packY0: pack.y,
      entered: insidePack,
      totalDist: 0,
      path: [{ x, y }],
    };
    if (!insidePack) setTrail([{ x, y }]);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const { x, y } = stageCoord(e);
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    const inside = inPack(e.clientX, e.clientY);
    d.totalDist += Math.hypot(x - d.lastX, y - d.lastY);
    d.lastX = x; d.lastY = y;

    if (d.mode === 'move') {
      setPack({ x: d.packX0 + dx, y: d.packY0 + dy, angle: Math.max(-12, Math.min(12, dx * 0.08)) });
      const fastEnough = d.totalDist > 90;
      if (fastEnough && d.entered && !inside) {
        commitSlice(dx, dy);
      }
    } else {
      const newPath = [...d.path, { x, y }].slice(-26);
      d.path = newPath;
      setTrail(newPath);
      if (inside) d.entered = true;
      if (d.entered && !inside) {
        commitSlice(dx, dy);
      }
    }
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d) { return; }
    if (d.mode === 'move' && phase === 'idle') {
      setPack({ x: 0, y: 0, angle: 0 });
    }
    dragRef.current = null;
    setTimeout(() => setTrail([]), 250);
  };

  const commitSlice = (dx, dy) => {
    setSlice(computeSlice(dx, dy));
    setPhase('sliced');
    dragRef.current = null;
    setTimeout(() => setTrail([]), 300);
    setTimeout(() => {
      setPhase('revealing');
      setRevealIdx(0);
      setFlipped({});
      setRevealKey((k) => k + 1);
    }, 950);
  };

  const advance = () => {
    if (phase !== 'revealing') return;
    const rarity = pull[revealIdx]?.rarity;
    if ((rarity === 'common' || rarity === 'rare') && !revealReady) return;
    const next = revealIdx + 1;
    if (next >= pull.length) {
      setPhase('done');
    } else {
      setRevealIdx(next);
      setRevealKey((k) => k + 1);
    }
  };
  const flip = () => {
    if (charging[revealIdx] || flipped[revealIdx]) return;
    const rarity = pull[revealIdx]?.rarity;
    const chargeMs = 800;

    setCharging((m) => ({ ...m, [revealIdx]: true }));

    const idx = revealIdx;
    setTimeout(() => {
      setCharging((m) => { const n = { ...m }; delete n[idx]; return n; });
      setFlipped((m) => ({ ...m, [idx]: true }));
      setTimeout(() => setRevealKey((k) => k + 1), 350);
      setTimeout(() => setSettled((m) => ({ ...m, [idx]: true })), 1500);
    }, chargeMs);

    const shakeMap = {
      mythic:    { cls: 'mythic-shake',     hold: 900 },
      legendary: { cls: 'flip-shake-legendary', hold: 650 },
      epic:      { cls: 'flip-shake-epic',  hold: 500 },
    };
    const shake = shakeMap[rarity];
    if (shake) {
      setTimeout(() => {
        document.body.classList.add(shake.cls);
        setTimeout(() => document.body.classList.remove(shake.cls), shake.hold);
      }, chargeMs - 80);
    }
  };
  const restart = () => {
    setPhase('idle');
    setPack({ x: 0, y: 0, angle: 0 });
    setRevealIdx(0);
    setFlipped({});
    setCharging({});
    setSettled({});
    setTrail([]);
  };

  const currentCard = pull[revealIdx];
  const needsFlip = phase === 'revealing'
    && isFaceDown(currentCard?.rarity)
    && !flipped[revealIdx];

  const trailStr = trail.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="rip">
      <div
        className="rip-stage"
        ref={stageRef}
        data-phase={phase}
        onPointerDown={phase === 'idle' ? onPointerDown : undefined}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {phase === 'idle' && (
          <div
            ref={packRef}
            className={`rip-pack ${dragRef.current?.mode === 'move' ? '' : 'idle-wobble'}`}
            data-grabbing={dragRef.current?.mode === 'move'}
            style={{
              transform: `translate(${pack.x}px, ${pack.y}px) rotate(${pack.angle}deg)`,
            }}
          >
            <div className="rip-pack-inner">
              <div className="rip-pack-logo">FOIL</div>
              <div className="rip-pack-tag">S01 · STARTER</div>
            </div>
          </div>
        )}

        {trail.length > 1 && (
          <svg className="rip-slice-trail">
            <polyline className="glow" points={trailStr} />
            <polyline className="core" points={trailStr} />
          </svg>
        )}

        {phase === 'sliced' && (
          <div className="rip-pack-halves rip-pack-halves-arb"
               style={{
                 '--slice-perp': `${slice.perpCss}deg`,
                 '--slice-rot':  `${slice.angle}deg`,
                 '--fly-ax':     `${slice.flyAx}px`,
                 '--fly-ay':     `${slice.flyAy}px`,
                 '--fly-bx':     `${slice.flyBx}px`,
                 '--fly-by':     `${slice.flyBy}px`,
               }}>
            <div className="rip-pack-half" data-side="a">
              <div className="rip-pack-inner">
                <div className="rip-pack-logo">FOIL</div>
                <div className="rip-pack-tag">S01 · STARTER</div>
              </div>
            </div>
            <div className="rip-pack-half" data-side="b">
              <div className="rip-pack-inner">
                <div className="rip-pack-logo">FOIL</div>
                <div className="rip-pack-tag">S01 · STARTER</div>
              </div>
            </div>
            <div className="rip-slice-flash" />
          </div>
        )}

        {phase === 'revealing' && currentCard && (
          <div className="rip-cards" data-rarity={currentCard.rarity} key={revealIdx + '-' + revealKey}
               onPointerMove={onTiltMove}
               onPointerLeave={onTiltLeave}>
            <RipFX rarity={currentCard.rarity}
                   flipped={!isFaceDown(currentCard.rarity) || flipped[revealIdx]}
                   revealKey={revealKey} />
            <div className="rip-card-tilt"
                 style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}>
              <RipCard card={currentCard}
                       flipped={!isFaceDown(currentCard.rarity) || !!flipped[revealIdx]}
                       charging={!!charging[revealIdx]}
                       settled={!isFaceDown(currentCard.rarity) || !!settled[revealIdx]}
                       onFlip={flip} />
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="rip-cards">
            <div className="rip-summary">
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.2em', color: 'var(--fg-mute)', textTransform: 'uppercase' }}>
                YOUR PULL · {pull.length} CARDS
              </div>
              <div className="rip-summary-grid">
                {pull.map((c, i) => (
                  <DraggableMini key={i} card={c} />
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === 'idle' && (
          <div className="rip-hint">
            <span className="blade"></span>
            click &amp; drag across to slice
            <span className="blade" style={{ transform: 'scaleX(-1)' }}></span>
          </div>
        )}
      </div>

      <div className="rip-side">
        {phase === 'idle' && (
          <>
            <h3>Slice it open.</h3>
            <p>
              Pick up the pack and drag it around if you want. To open: <strong style={{color:'var(--fg)'}}>click and swipe across the pack</strong>{' '}
              — like cutting it with a knife. Five cards inside. Maybe a Mythic.
            </p>
            <ul className="rip-tips">
              <li><span className="dot" style={{ background: 'var(--r-common)' }}></span>Common — flash by</li>
              <li><span className="dot" style={{ background: 'var(--r-rare)' }}></span>Rare — gentle glow</li>
              <li><span className="dot" style={{ background: 'var(--r-epic)' }}></span>Epic — face-down, flip to reveal</li>
              <li><span className="dot" style={{ background: 'var(--r-legendary)' }}></span>Legendary — gold rays incoming</li>
              <li><span className="dot" style={{ background: 'var(--r-mythic)' }}></span>Mythic — pray</li>
            </ul>
          </>
        )}

        {phase === 'sliced' && (
          <>
            <h3>Cutting…</h3>
            <p>Five cards on their way up. Try not to look too desperate.</p>
          </>
        )}

        {phase === 'revealing' && currentCard && (
          <>
            <div className="rip-progress">
              Card<strong>{revealIdx + 1}</strong>of {pull.length}
            </div>
            <h3 className="rip-rarity-head"
                data-r={currentCard.rarity}
                data-revealed={!needsFlip && isFaceDown(currentCard.rarity) ? 'true' : 'false'}
                key={`head-${revealIdx}-${needsFlip ? 'pre' : 'post'}`}>
              {needsFlip ? '???' : rarityCopy[currentCard.rarity].tag}
            </h3>
            {needsFlip ? (
              <p className="rip-card-info" style={{ color: 'var(--fg-mute)' }}>
                <strong style={{ letterSpacing: '0.18em' }}>???</strong>
                Flip the card to find out what you pulled.
              </p>
            ) : (
              <>
                <p className="rip-card-info rip-flash-reveal"
                   data-r={isFaceDown(currentCard.rarity) ? currentCard.rarity : 'none'}>
                  <strong>{currentCard.name}</strong>
                  {currentCard.blurb || rarityCopy[currentCard.rarity].blurb}
                </p>
                <p className="rip-card-info rip-flash-reveal rip-flash-reveal-late"
                   data-r={isFaceDown(currentCard.rarity) ? currentCard.rarity : 'none'}
                   style={{ color: 'var(--fg-mute)' }}>
                  {currentCard.edition}
                </p>
              </>
            )}
            <div className="rip-actions">
              {needsFlip ? (
                <button className="btn primary" onClick={flip}>Tap to flip →</button>
              ) : (
                <button className="btn primary" onClick={advance}
                        disabled={(currentCard.rarity === 'common' || currentCard.rarity === 'rare') && !revealReady}>
                  {revealIdx >= pull.length - 1 ? 'See the stack →' : 'Next card →'}
                </button>
              )}
              {!needsFlip && (
                <button className="btn" onClick={restart}>Skip rip</button>
              )}
            </div>
            <div className="rip-pips">
              {pull.map((c, i) => (
                <span key={i}
                      className={`pip ${i <= revealIdx ? 'on' : ''}`}
                      data-r={c.rarity}></span>
              ))}
            </div>
          </>
        )}

        {phase === 'done' && (
          <>
            <h3>That&apos;s the rip.</h3>
            <p>Five cards added to your collection. The Mythic was either yours or someone else&apos;s. Rip again?</p>
            <button className="btn primary" onClick={restart}>Rip another pack</button>
          </>
        )}
      </div>
    </div>
  );
}
