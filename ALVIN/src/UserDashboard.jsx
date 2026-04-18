import { useState } from "react";
import Logo from './assets/alvin-logo.png';


const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root { 
    font-family: 'Manrope', 
    sans-serif; 
    background: #ffffff; 
    color: #000000; m
    in-height: 75vh;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .alvin-root { 
    display: flex; 
    min-height: 100vh;
    background: #fff; }

  /* Sidebar */
  .sidebar {
    width: 256px; min-height: 100vh; position: fixed; left: 0; top: 0;
    background: #f9f9f9; border-right: 1px solid #e5e5e5;
    display: flex; flex-direction: column; padding: 32px 16px; z-index: 50;
  }
  .sidebar-logo { margin-bottom: 48px; padding: 0 16px; }
  .sidebar-logo h1 { color: #862334; font-family: 'Space Grotesk', sans-serif; font-weight: 900; font-size: 20px; letter-spacing: -0.05em; text-transform: uppercase; }
  .sidebar-logo p { font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 0.3em; font-size: 10px; color: #4a4a4a; margin-top: 4px; }

  .nav-list { flex: 1; display: flex; flex-direction: column; gap: 4px; list-style: none; }
  .nav-item a {
    display: flex; align-items: center; gap: 16px; padding: 12px 16px;
    text-decoration: none; color: #4a4a4a; transition: all 0.2s;
    font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; letter-spacing: 0.15em; font-size: 12px;
    border-radius: 2px;
  }
  .nav-item a:hover { color: #862334; background: #f0f0f0; }
  .nav-item.active a { border-right: 4px solid #862334; background: #f0f0f0; color: #862334; }

  .sidebar-cta { margin-top: auto; padding: 0; }
  .btn-primary {
    background: #862334; color: #fff; border: none; cursor: pointer;
    font-family: 'Space Grotesk', sans-serif; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; font-size: 12px; border-radius: 2px;
    display: flex; align-items: center; gap: 8px; transition: all 0.2s;
  }
  .btn-primary:hover { background: #ffb003; }
  .btn-primary-full { width: 100%; padding: 12px 16px; justify-content: center; }
  .btn-primary-wide { width: 100%; padding: 20px 32px; justify-content: space-between; }
  .btn-primary-wide .icon-right { transition: transform 0.2s; }
  .btn-primary-wide:hover .icon-right-forward { transform: translateX(4px); }
  .btn-primary-wide:hover .icon-right-spin { transform: rotate(180deg); }
  .btn-primary-fab {
    width: 56px; height: 56px; border-radius: 50%; justify-content: center;
    position: fixed; bottom: 32px; right: 32px; z-index: 50;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18); transition: transform 0.2s;
  }
  .btn-primary-fab:hover { transform: scale(1.1); }
  .btn-primary-fab:active { transform: scale(0.95); }

  /* Main */
  .main-content { margin-left: 256px; flex: 1; padding-bottom: 80px; background: #fff; }

  /* Header */
  .top-header {
    position: fixed; top: 0; left: 256px; right: 0; z-index: 40;
    background: rgba(255,255,255,0.85); backdrop-filter: blur(12px);
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 32px; border-bottom: 1px solid #e5e5e5;
  }
  .search-wrap { position: relative; }
  .search-wrap .icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #862334; font-size: 20px; }
  .search-input {
    background: #f9f9f9; border: 1px solid #e5e5e5; color: #000; padding: 8px 16px 8px 40px;
    width: 256px; font-size: 14px; font-family: 'Inter', sans-serif; border-radius: 2px;
    outline: none; transition: box-shadow 0.2s;
  }
  .search-input:focus { box-shadow: 0 0 0 2px #862334; }
  .header-actions { display: flex; align-items: center; gap: 24px; }
  .header-icons { display: flex; align-items: center; gap: 4px; }
  .icon-btn { background: none; border: none; cursor: pointer; padding: 8px; color: #4a4a4a; transition: color 0.2s; border-radius: 4px; }
  .icon-btn:hover { color: #862334; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; border: 1px solid #e5e5e5; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }

  /* Page Content */
  .page-inner { 
    padding-top: 96px; 
    padding-left: 48px; 
    padding-right: 48px; 
    max-width: 1500px; 
    margin: 0 auto; 
    }

  /* Hero */
  .hero { margin-top: 32px; margin-bottom: 64px; display: grid; grid-template-columns: 8fr 4fr; gap: 48px; align-items: flex-end; 
  text-align: left;
  }
  .hero-label { color: #862334; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.3em; font-size: 10px; font-weight: 700; display: block; margin-bottom: 16px; }
  .hero-title { font-family: 'Space Grotesk', sans-serif; font-size: 64px; font-weight: 700; letter-spacing: -0.04em; color: #000; line-height: 1; margin-bottom: 24px; }
  .hero-title .accent { color: #862334; }
  .hero-desc { color: #4a4a4a; font-family: 'Manrope', sans-serif; font-size: 20px; max-width: 480px; line-height: 1.6; }
  .hero-desc .accent { color: #862334; font-weight: 700; }
  .hero-actions { display: flex; flex-direction: column; gap: 16px; }

  /* Analytics */
  .analytics-section { margin-bottom: 64px; }
  .analytics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
  .stat-card {
    background: #fff; 
    padding: 20px; 
    border: 1px solid #e5e5e5;
    position: relative; overflow: hidden; transition: border-color 0.3s;
    border-radius: 2px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  .stat-card:hover { border-color: #862334; }
  .stat-label { color: #4a4a4a; font-family: 'Inter', sans-serif; font-size: 8px; text-transform: uppercase; letter-spacing: 0.2em; display: block; margin-bottom: 4px; }
  .stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 30px; font-weight: 700; color: #000; }
  .stat-badge { color: #862334; font-size: 12px; font-weight: 700; }
  .stat-footer { margin-top: 16px; font-size: 12px; font-family: 'Inter', sans-serif; color: #4a4a4a; text-transform: uppercase; letter-spacing: -0.02em; }
  .stat-bar { margin-top: 16px; width: 100%; background: #f0f0f0; height: 4px; border-radius: 2px; }
  .stat-bar-fill { background: #862334; height: 100%; border-radius: 2px; }
  .stat-competency { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; color: #000; margin-top: 8px; line-height: 1.2; text-transform: uppercase; }
  .stat-elite { display: inline-flex; align-items: center; padding: 4px 8px; background: rgba(134,35,52,0.1); color: #862334; font-size: 10px; font-weight: 700; border-radius: 999px; margin-top: 16px; }
  .stat-drift { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; color: #862334; margin-top: 8px; text-transform: uppercase; }
  .stat-bars { display: flex; gap: 4px; margin-top: 16px; }
  .stat-bar-seg { width: 4px; height: 12px; }
  .seg-fill { background: #862334; }
  .seg-empty { background: #f0f0f0; }
  .stat-priority { font-size: 10px; font-family: 'Inter', sans-serif; color: #862334; font-weight: 700; margin-top: 8px; }
  .stat-bg-icon { position: absolute; right: -16px; bottom: -16px; opacity: 0.05; font-size: 120px; transition: opacity 0.3s; pointer-events: none; }
  .stat-card:hover .stat-bg-icon { opacity: 0.1; }

  /* Main grid */
  .content-grid { 
    display: grid; 
    grid-template-columns: 8fr 4fr; 
    gap: 48px;
    display: flex; justify-content: center; align-items: center;
  }

  /* Chronicle */
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
  .section-title { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: -0.02em; color: #000; }
  .section-link { color: #862334; font-size: 12px; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700; text-decoration: none; }
  .section-link:hover { text-decoration: underline; }

  .table-header { display: grid; grid-template-columns: 5fr 3fr 2fr 2fr; padding: 8px 24px; font-size: 10px; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.2em; color: #4a4a4a; }
  .table-row { 
    display: grid; 
    grid-template-columns: 5fr 3fr 2fr 2fr; 
    align-items: center; 
    padding: 20px 24px; 
    background: #f9f9f9; 
    border-bottom: 1px solid #e5e5e5; 
    transition: background 0.2s;
    width: 1100px;
  }
  .table-row:hover { background: #f0f0f0; }
  .row-role { display: flex; align-items: center; gap: 12px; font-family: 'Space Grotesk', sans-serif; font-weight: 500; color: #000; }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot-full { background: #862334; }
  .dot-dim { background: rgba(134,35,52,0.4); }
  .row-date { color: #4a4a4a; font-family: 'Inter', sans-serif; font-size: 12px; }
  .row-score-high { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #862334; }
  .row-score-mid { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #000; }
  .row-action { text-align: right; }
  .view-btn { background: none; border: none; cursor: pointer; font-size: 10px; font-family: 'Inter', sans-serif; text-transform: uppercase; color: #4a4a4a; border-bottom: 1px solid #d1d1d1; padding-bottom: 1px; transition: all 0.2s; }
  .view-btn:hover { color: #862334; border-bottom-color: #862334; }

  /* Sidebar right */
  .right-panel { display: flex; flex-direction: column; gap: 48px; }
  .panel-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: -0.02em; color: #000; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
  .panel-title .icon { color: #862334; font-size: 20px; }

  .asset-list { display: flex; flex-direction: column; gap: 12px; }
  .asset-item { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #fff; border: 1px solid #d1d1d1; cursor: pointer; transition: border-color 0.2s; border-radius: 2px; }
  .asset-item:hover { border-color: #862334; }
  .asset-info { display: flex; align-items: center; gap: 16px; }
  .asset-icon { color: #862334; font-size: 24px; }
  .asset-name { font-size: 12px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase; color: #000; }
  .asset-date { font-size: 10px; color: #4a4a4a; font-family: 'Inter', sans-serif; }
  .asset-more { color: #4a4a4a; font-size: 18px; }
  .upload-btn {
    width: 100%; border: 2px dashed #d1d1d1; padding: 16px; background: none; cursor: pointer;
    font-size: 10px; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.2em; color: #4a4a4a;
    transition: all 0.2s; border-radius: 2px;
  }
  .upload-btn:hover { color: #862334; border-color: #862334; }

  .account-card { background: #f9f9f9; padding: 24px; border: 1px solid #e5e5e5; border-radius: 2px; }
  .account-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #000; text-transform: uppercase; font-size: 12px; margin-bottom: 16px; }
  .account-links { display: flex; flex-direction: column; gap: 16px; }
  .account-link { display: flex; align-items: center; justify-content: space-between; text-decoration: none; }
  .account-link-left { display: flex; align-items: center; gap: 12px; }
  .account-link-label { font-size: 12px; font-family: 'Inter', sans-serif; color: #4a4a4a; transition: color 0.2s; }
  .account-link:hover .account-link-label { color: #862334; }
  .account-link-icon { color: #4a4a4a; font-size: 18px; }
  .account-divider { padding-top: 16px; margin-top: 16px; border-top: 1px solid #e5e5e5; }
  .signout-link { display: flex; align-items: center; gap: 8px; font-size: 12px; font-family: 'Inter', sans-serif; color: #862334; font-weight: 700; text-decoration: none; }
  .signout-link:hover { opacity: 0.8; }

  /* Decorative bg */
  .bg-glow { position: fixed; top: 0; right: 0; width: 60vw; height: 614px; pointer-events: none; z-index: -1; opacity: 0.1; background: radial-gradient(ellipse at top right, rgba(134,35,52,0.15) 0%, transparent 70%); }

  /* FAB tooltip */
  .fab-wrap { position: fixed; bottom: 32px; right: 32px; z-index: 50; }
  .fab-tooltip {
    position: absolute; right: 64px; top: 50%; transform: translateY(-50%);
    background: #000; color: #fff; padding: 8px 16px; font-size: 12px; font-family: 'Inter', sans-serif;
    white-space: nowrap; opacity: 0; transition: opacity 0.2s; pointer-events: none; border-radius: 2px;
  }
  .fab-wrap:hover .fab-tooltip { opacity: 1; }

  @media (max-width: 1100px) {
    .analytics-grid { grid-template-columns: repeat(2, 1fr); }
    .content-grid { grid-template-columns: 1fr; }
    .hero { grid-template-columns: 1fr; }
  }
  @media (max-width: 700px) {
    .sidebar { display: none; }
    .main-content { margin-left: 0; }
    .top-header { left: 0; }
    .analytics-grid { grid-template-columns: 1fr; }
    .page-inner { padding-left: 16px; padding-right: 16px; }
    .hero-title { font-size: 36px; }
  }
`;

const Icon = ({ name, className = "", style = {} }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24", ...style }}>
    {name}
  </span>
);

const navItems = [
  { icon: "dashboard", label: "Dashboard", active: true },
  { icon: "mic_external_on", label: "Interviews" },
  { icon: "settings", label: "Settings" },
];

const interviews = [
  { role: "Senior Product Manager", date: "OCT 24, 2024", score: "88%", high: true },
  { role: "UX Designer (L6)", date: "OCT 21, 2024", score: "75%", high: false },
  { role: "Technical Program Lead", date: "OCT 18, 2024", score: "91%", high: true },
];

const assets = [
  { name: "Sarah_Resume_2024_PM.pdf", modified: "Modified: Oct 20" },
  { name: "Design_Portfolio_CaseStudies.pdf", modified: "Modified: Sep 28" },
];

export default function UserDashboard() {
  const [activeNav, setActiveNav] = useState(0);

  return (
    <>
      <style>{styles}</style>
      <div className="alvin-root">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src={Logo} style={{ width: '100px', height: 'auto', marginBottom: '-40px'}} alt="Small logo" />
            <h1>ALVIN</h1>
            <p style={{marginTop: '-20px'}}>By Team Katana</p>
          </div>
          <nav>
            <ul className="nav-list">
              {navItems.map((item, i) => (
                <li key={item.label} className={`nav-item${activeNav === i ? " active" : ""}`}>
                  <a href="#" onClick={e => { e.preventDefault(); setActiveNav(i); }}>
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="sidebar-cta">
            <button className="btn-primary btn-primary-full">
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="main-content">
          {/* Top Header */}
          <header className="top-header">
            <div className="search-wrap">
              <Icon name="search" className="icon" />
              <input className="search-input" type="text" placeholder="Search insights..." />
            </div>
            <div className="header-actions">
              <div className="header-icons">
                <button className="icon-btn"><Icon name="notifications" /></button>
              </div>
              <div className="avatar">
                <img
                  src="1"
                  alt="Profile"
                />
              </div>
            </div>
          </header>

          <div className="page-inner">
            {/* Hero */}
            <section className="hero">
              <div>
                <span className="hero-label">Version 4.2.0</span>
                <h2 className="hero-title">
                  Welcome back, <span className="accent">Vin!</span>
                </h2>
                <p className="hero-desc">
                  Your interview performance indicates a{" "}
                  <span className="accent">3% improvement</span> since your last session.
                </p>
              </div>
              <div className="hero-actions">
                <button className="btn-primary btn-primary-wide">
                  START NEW INTERVIEW
                  <Icon name="arrow_forward" className="icon-right icon-right-forward" />
                </button>
              </div>
            </section>

            {/* Analytics */}
            <section className="analytics-section">
              <div className="analytics-grid">
                <div className="stat-card">
                  <span className="stat-label">Session Volume</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span className="stat-value">24</span>
                  </div>
                  <div className="stat-footer">Total Interviews</div>
                  <Icon name="quick_reference_all" className="stat-bg-icon" />
                </div>
                <div className="stat-card">
                  <span className="stat-label">AVERAGE PERFORMANCE ACCURACY</span>
                  <span className="stat-value">82%</span>
                  <div className="stat-bar"><div className="stat-bar-fill" style={{ width: "82%" }} /></div>

                </div>
                <div className="stat-card">
                  <span className="stat-label">Peak Competency</span>
                  <div className="stat-competency">Consistent Eye Contact</div>
                  <div className="stat-elite">ELITE TIER</div>
                </div>
                <div className="stat-card">
                  <span className="stat-label">PRIORITY FOCUS AREA</span>
                  <div className="stat-drift">Filler Words</div>
                  <div className="stat-bars">
                    {[true, true, true, false, false].map((f, i) => (
                      <div key={i} className={`stat-bar-seg ${f ? "seg-fill" : "seg-empty"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Content Grid */}
            <div className="content-grid">
              {/* Chronicle */}
              <div>
                <div className="section-header">
                  <h3 className="section-title">Interview History</h3>
                  <a href="#" className="section-link">View All Archive</a>
                </div>
                <div>
                  <div className="table-header">
                    <div>Target Role</div>
                    <div>Date</div>
                    <div>Score</div>
                    <div style={{ textAlign: "right" }}>Insight</div>
                  </div>
                  {interviews.map((row, i) => (
                    <div className="table-row" key={i}>
                      <div className="row-role">
                        <div className={`dot ${row.high ? "dot-full" : "dot-dim"}`} />
                        {row.role}
                      </div>
                      <div className="row-date">{row.date}</div>
                      <div className={row.high ? "row-score-high" : "row-score-mid"}>{row.score}</div>
                      <div className="row-action">
                        <button className="view-btn">VIEW FEEDBACK</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}