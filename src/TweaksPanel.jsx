import { useState, useEffect, useRef, useCallback } from 'react';

const TWEAKS_STYLE = `
  .twk-fab{position:fixed;right:16px;bottom:16px;z-index:2147483645;
    appearance:none;border:0;cursor:pointer;
    background:rgba(20,20,20,.85);color:#fafaf6;
    font:600 11px/1 ui-sans-serif,system-ui,-apple-system,sans-serif;
    letter-spacing:.12em;text-transform:uppercase;
    padding:12px 16px;border-radius:999px;
    box-shadow:0 6px 20px rgba(0,0,0,.3),0 0 0 .5px rgba(255,255,255,.1) inset;
    -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
    transition:transform .15s ease}
  .twk-fab:hover{transform:translateY(-1px)}
  .twk-fab .pip{display:inline-block;width:6px;height:6px;border-radius:50%;
    background:#f5c842;margin-right:8px;vertical-align:middle;
    box-shadow:0 0 8px rgba(245,200,66,.6)}

  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.88);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:pointer;padding:4px 6px;line-height:1.2}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:pointer;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}
`;

export function useTweaks(defaults) {
  const [values, setValues] = useState(defaults);
  const setTweak = useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
  }, []);
  return [values, setTweak];
}

export function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

export function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

export function TweakRadio({ label, value, options, onChange }) {
  const trackRef = useRef(null);
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" className="twk-seg">
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio"
                  aria-checked={o.value === value}
                  onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

export function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <style>{TWEAKS_STYLE}</style>
      {!open && (
        <button type="button" className="twk-fab" onClick={() => setOpen(true)}>
          <span className="pip" />Tweaks
        </button>
      )}
      {open && (
        <div className="twk-panel">
          <div className="twk-hd">
            <b>{title}</b>
            <button className="twk-x" aria-label="Close tweaks" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="twk-body">{children}</div>
        </div>
      )}
    </>
  );
}
