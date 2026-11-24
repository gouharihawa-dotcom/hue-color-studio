import React, { useEffect, useState } from "react";

const randomHex = () =>
  `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")}`.toUpperCase();

const hexToRgb = (hex) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    if (max === g) h = (b - r) / d + 2;
    if (max === b) h = (r - g) / d + 4;
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const getFormats = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  return {
    HEX: hex.toUpperCase(),
    RGB: `rgb(${r}, ${g}, ${b})`,
    HSL: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  };
};

const hexToHue = (hex) => rgbToHsl(...Object.values(hexToRgb(hex))).h;

const mixColors = (colors) => {
  const total = colors.reduce(
    (sum, hex) => {
      const rgb = hexToRgb(hex);
      sum.r += rgb.r;
      sum.g += rgb.g;
      sum.b += rgb.b;
      return sum;
    },
    { r: 0, g: 0, b: 0 },
  );

  const count = colors.length;
  const r = Math.round(total.r / count);
  const g = Math.round(total.g / count);
  const b = Math.round(total.b / count);
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
};

const CopyIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <rect x="7" y="3" width="10" height="12" rx="2" />
    <path d="M13 17H5a2 2 0 0 1-2-2V7" />
  </svg>
);

const hexToHsv = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  let red = r / 255,
    green = g / 255,
    blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === red) h = 60 * (((green - blue) / delta) % 6);
    else if (max === green) h = 60 * ((blue - red) / delta + 2);
    else h = 60 * ((red - green) / delta + 4);
  }

  return { h: (h + 360) % 360, s: max === 0 ? 0 : delta / max, v: max };
};

const hsvToHex = (h, s, v) => {
  const c = v * s;
  const section = h / 60;
  const x = c * (1 - Math.abs((section % 2) - 1));
  const m = v - c;
  let rgb;
  if (section < 1) rgb = [c, x, 0];
  else if (section < 2) rgb = [x, c, 0];
  else if (section < 3) rgb = [0, c, x];
  else if (section < 4) rgb = [0, x, c];
  else if (section < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return `#${rgb
    .map((value) =>
      Math.round((value + m) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
};

export default function App() {
  const [color, setColor] = useState(randomHex);
  const [hue, setHue] = useState(() => hexToHue(randomHex()));
  const [pickerPosition, setPickerPosition] = useState(() => {
    const initial = hexToHsv(color);
    return { s: initial.s, v: initial.v };
  });
  const [mixInputs, setMixInputs] = useState(["#E78364", "#5077C4"]);
  const [mixedColor, setMixedColor] = useState(() =>
    mixColors(["#E78364", "#5077C4"]),
  );
  const [dark, setDark] = useState(false);
  const [notice, setNotice] = useState("");
  const [savedColors, setSavedColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("hue-solid-colors") || "[]");
    } catch {
      return [];
    }
  });
  const [savedMixed, setSavedMixed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("hue-mixed-colors") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("hue-solid-colors", JSON.stringify(savedColors));
    localStorage.setItem("hue-mixed-colors", JSON.stringify(savedMixed));
  }, [savedColors, savedMixed]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("");
      window.requestAnimationFrame(() => {
        setNotice(`${label} copied · ${value}`);
      });
    } catch {
      setNotice("");
      window.requestAnimationFrame(() => {
        setNotice("Copying is not available in this browser");
      });
    }
  };

  const generateMix = () => {
    const next = mixColors(mixInputs);
    setMixedColor(next);
  };

  const formats = getFormats(color);
  const mixedFormats = getFormats(mixedColor);

  return (
    <main className={dark ? "app dark" : "app"}>
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">h</span> hue
          <span className="brand-dot">.</span>
        </a>
        <nav>
          <a href="#generator">Generator</a>
          <a href="#mixer">Color mixer</a>
          <a href="#saved">My colors</a>
        </nav>
      <button className="theme-btn" onClick={() => setDark(!dark)}>
       {dark ? "☀ Light" : "☾ Dark"}
        </button>
      </header>

      <section className="hero">
        <div className="eyebrow">
          <span /> YOUR DAILY DOSE OF COLOR
        </div>
        <h1>
          Find your next
          <br />
          <em>perfect color.</em>
        </h1>
        <p>Choose a shade or blend several colors together.</p>
      </section>

      <section className="color-studio" id="generator">
        <div className="studio-heading">
          <div className="eyebrow">YOUR COLOR STUDIO</div>
          <h2>Choose a color or mix your own</h2>
        </div>

        <section className="workspace studio-panel" id="solid">
          <div className="studio-panel-heading">
            <div>
              <div className="eyebrow">solid COLOR</div>
              <h3>Choose one color</h3>
            </div>
          </div>
          <div className="color-layout">
            <div className="color-preview">
              <div className="swatch" style={{ backgroundColor: color }}>
                <button
                  className="copy-overlay"
                  onClick={() => copyText(color, "HEX")}
                >
                  Copy color
                </button>
              </div>
            </div>
            <div className="picker-panel">
              <div className="picker-heading">
                <strong>Choose color</strong>
                <span className="picker-value">{color}</span>
              </div>
              {(() => {
                const hsv = hexToHsv(color);
                const updateSpectrum = (event) => {
                  if (event.type === "pointermove" && event.buttons !== 1)
                    return;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const saturation = Math.min(
                    1,
                    Math.max(0, (event.clientX - bounds.left) / bounds.width),
                  );
                  const brightness =
                    1 -
                    Math.min(
                      1,
                      Math.max(0, (event.clientY - bounds.top) / bounds.height),
                    );
                  setPickerPosition({ s: saturation, v: brightness });
                  setColor(hsvToHex(hue, saturation, brightness));
                };
                return (
                  <>
                    <div
                      className="picker-field"
                      role="slider"
                      tabIndex={0}
                      aria-label="Color saturation and brightness"
                      style={{ "--picker-hue": `hsl(${hue} 100% 50%)` }}
                      onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        updateSpectrum(event);
                      }}
                      onPointerMove={updateSpectrum}
                      onKeyDown={(event) => {
                        let s = hsv.s,
                          v = hsv.v;
                        if (event.key === "ArrowLeft") s -= 0.05;
                        else if (event.key === "ArrowRight") s += 0.05;
                        else if (event.key === "ArrowDown") v -= 0.05;
                        else if (event.key === "ArrowUp") v += 0.05;
                        else return;
                        event.preventDefault();
                        const nextS = Math.min(1, Math.max(0, s));
                        const nextV = Math.min(1, Math.max(0, v));
                        setPickerPosition({ s: nextS, v: nextV });
                        setColor(hsvToHex(hue, nextS, nextV));
                      }}
                    >
                      <span
                        className="picker-indicator"
                        style={{
                          left: `${pickerPosition.s * 100}%`,
                          top: `${(1 - pickerPosition.v) * 100}%`,
                        }}
                      />
                    </div>
                    <label className="hue-control">
                      <span>Hue</span>
                      <span className="hue-track">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={hue}
                          onChange={(event) => {
                            const nextHue = Number(event.target.value);
                            setHue(nextHue);
                            setColor(hsvToHex(nextHue, hsv.s, hsv.v));
                          }}
                        />
                      </span>
                    </label>
                    <div className="color-info">
                      {Object.entries(formats).map(([format, value]) => (
                        <div className="color-code-row" key={format}>
                          <span className="color-code-label">{format}</span>
                          <code>{value}</code>
                          <button
                            className="copy-code-button"
                            onClick={() => copyText(value, format)}
                            aria-label={`Copy ${format}`}
                          >
                            <CopyIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="studio-card-actions">
            <button
              className="secondary-btn"
              onClick={() =>
                setSavedColors((current) =>
                  [{ id: Date.now(), hex: color }, ...current].slice(0, 12),
                )
              }
            >
              ♡ Save color
            </button>
          </div>
        </section>

        <section className="mixer-section studio-panel" id="mixer">
          <div className="mixer-intro">
            <div className="eyebrow">COLOR LAB</div>
            <h2>Mix colors into something new</h2>
          </div>
          <div className="mixer-inputs">
            {mixInputs.map((hex, index) => (
              <article className="mix-input-card" key={index}>
                <label className="mix-color-picker">
                  <span
                    className="mix-swatch"
                    style={{ backgroundColor: hex }}
                  />
                  <input
                    type="color"
                    value={hex}
                    onChange={(event) =>
                      setMixInputs((current) =>
                        current.map((item, i) =>
                          i === index ? event.target.value.toUpperCase() : item,
                        ),
                      )
                    }
                  />
                </label>
                <div className="mix-card-footer">
                  <span>COLOR {index + 1}</span>
                  <code>{hex}</code>
                  {mixInputs.length > 2 && (
                    <button
                      className="remove-mix-button"
                      type="button"
                      aria-label={`Remove color ${index + 1}`}
                      title="Remove color"
                      onClick={() =>
                        setMixInputs((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
              </article>
            ))}
            {mixInputs.length < 5 && (
              <button
                className="add-mix-color"
                onClick={() =>
                  setMixInputs((current) => [...current, randomHex()])
                }
              >
                <strong>＋ Add color</strong>
              </button>
            )}
          </div>

          <div className="mixer-result">
            <div
              className="mixed-swatch"
              style={{ backgroundColor: mixedColor }}
            >
              <span>YOUR MIX</span>
            </div>
            <div className="mixed-details">
              <div className="mixed-title">
                <div>
                  <span>THE RESULT</span>
                  <strong>Your mixed color</strong>
                </div>
                <button className="primary-btn" onClick={generateMix}>
                  ✦ Mix color
                </button>
              </div>
              <div className="mixed-formats">
                {Object.entries(mixedFormats).map(([format, value]) => (
                  <div className="mix-format-row" key={format}>
                    <span>{format}</span>
                    <code>{value}</code>
                    <button
                      className="copy-code-button"
                      onClick={() => copyText(value, format)}
                      aria-label={`Copy ${format}`}
                    >
                      <CopyIcon />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mixed-result-actions">
                <button
                  className="secondary-btn"
                  onClick={() =>
                    setSavedMixed((current) =>
                      [{ id: Date.now(), hex: mixedColor }, ...current].slice(
                        0,
                        12,
                      ),
                    )
                  }
                >
                  ♡ Save mixed color
                </button>
                <button
                  className="use-mixed-color"
                  onClick={() => setColor(mixedColor)}
                >
                  Use in color generator ↗
                </button>
              </div>
            </div>
          </div>
        </section>
      </section>

      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}

      <section className="saved-section" id="saved">
        <div className="section-heading">
          <div>
            <div className="eyebrow">YOUR COLLECTION</div>
            <h2>Saved colors</h2>
          </div>
          <span className="count">
            {savedColors.length + savedMixed.length} / 24
          </span>
        </div>
        <div className="saved-collections">
          <section className="saved-subsection">
            <div className="saved-subheading">
              <h3>solid colors</h3>
              <span>{savedColors.length} / 12</span>
            </div>
            {savedColors.length ? (
              <div className="saved-list">
                {savedColors.map((item) => (
                  <article className="saved-card" key={item.id}>
                    <button
                      className="saved-colors"
                      onClick={() => setColor(item.hex)}
                      title="Load color"
                    >
                      <span style={{ backgroundColor: item.hex }} />
                    </button>
                    <div className="saved-meta">
                      <code>{item.hex}</code>
                      <div className="saved-card-actions">
                        <button onClick={() => setColor(item.hex)}>Load</button>
                        <button
                          className="saved-copy-button"
                          onClick={() => copyText(item.hex, "HEX")}
                        >
                          Copy
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() =>
                            setSavedColors((current) =>
                              current.filter((saved) => saved.id !== item.id),
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>No solid colors saved yet</strong>
                <p>Save a color from the first card.</p>
              </div>
            )}
          </section>
          <section className="saved-subsection">
            <div className="saved-subheading">
              <h3>Mixed colors</h3>
              <span>{savedMixed.length} / 12</span>
            </div>
            {savedMixed.length ? (
              <div className="saved-list">
                {savedMixed.map((item) => (
                  <article className="saved-card" key={item.id}>
                    <button
                      className="saved-colors"
                      onClick={() => setColor(item.hex)}
                      title="Load mixed color"
                    >
                      <span style={{ backgroundColor: item.hex }} />
                    </button>
                    <div className="saved-meta">
                      <code>{item.hex}</code>
                      <div className="saved-card-actions">
                        <button onClick={() => setColor(item.hex)}>Load</button>
                        <button
                          className="saved-copy-button"
                          onClick={() => copyText(item.hex, "HEX")}
                        >
                          Copy
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() =>
                            setSavedMixed((current) =>
                              current.filter((saved) => saved.id !== item.id),
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>No mixed colors saved yet</strong>
                <p>Save a result from the mixer card.</p>
              </div>
            )}
          </section>
        </div>
      </section>

      <footer>
        <span className="brand small">
          <span className="brand-mark">h</span> hue.
        </span>
        <span>Made for curious creatives.</span>
      </footer>
    </main>
  );
}
