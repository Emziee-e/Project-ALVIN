import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

  /* Reset and Maximize */
  * { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    overflow: hidden; /* Prevents double scrollbars on the window */
  }

  :root {
    --bg: #111009;
    --bg2: #181610;
    --bg3: #1f1d12;
    --surface: #1c1a0f;
    --surface2: #242215;
    --border: #2e2b18;
    --yellow: #e8c830;
    --yellow-dim: #b89e1f;
    --red: #c0392b;
    --text: #e8e4d0;
    -- white: #ffffff;
    --text-dim: #8a8470;
    --text-muted: #5a5645;
    --mono: 'Space Mono', monospace;
    --display: 'Bebas Neue', cursive;
    --body: 'DM Sans', sans-serif;
  }

  body { 
    background: var(--bg); 
    color: var(--text); 
    font-family: var(--body); 
    -webkit-font-smoothing: antialiased;
  }

  /* Full Screen Layout */
  .app { 
    display: flex; 
    width: 100vw; 
    height: 100vh; 
    overflow: hidden; 
  }

  /* SIDEBAR */
  .sidebar {
    width: 240px; /* Slightly wider for better breathing room */
    min-width: 240px;
    background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 32px 0;
  }
  
  .logo { padding: 0 24px 40px; }
  .logo-title {
    font-family: var(--display);
    font-size: 26px;
    letter-spacing: 3px;
    color: var(--yellow);
  }
  .logo-sub {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 2px;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .nav { flex: 1; }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 24px;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
    border-left: 3px solid transparent;
  }
  .nav-item:hover { color: var(--text); background: var(--surface); }
  .nav-item.active {
    color: var(--yellow);
    background: var(--surface2);
    border-left: 3px solid var(--yellow);
  }

  .sidebar-bottom { padding: 24px; }
  .btn-start-new {
    background: var(--yellow);
    color: #111;
    border: none;
    padding: 12px;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-weight: 700;
    cursor: pointer;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  /* MAIN AREA */
  .main { 
    flex: 1; 
    display: flex; 
    flex-direction: column; 
    height: 100%;
    background: #ffffff;
  }

  /* TOPBAR */
  .topbar {
    height: 70px;
    min-height: 70px;
    padding: 0 40px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
  }
  .search-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 20px;
    width: 400px;
    background: #ffffff;
  }
  .search-input {
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-family: var(--body);
    font-size: 14px;
    width: 100%;
    background: #ffffff;
  }

  /* SCROLLABLE CONTENT */
  .content-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 40px;
  }
  
  .content-layout { 
    display: flex; 
    gap: 40px; 
    max-width: 1600px; /* Optional: keeps content from stretching too wide on ultrawide monitors */
    margin: 0 auto;
    width: 100%;
  }

  .content-main { flex: 1; min-width: 0; }
  .content-side { width: 300px; min-width: 300px; }

  /* HERO SECTION */
  .welcome-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 40px; }
  .welcome-text h1 {
    font-family: var(--display);
    font-size: 84px;
    line-height: 0.85;
    color: var(--text);
  }
  .welcome-text h1 span { color: var(--yellow); }

  .hero-actions { display: flex; gap: 16px; }
  .btn-primary {
    padding: 30px 100px;
    font-family: var(--mono);
    font-size: 20px;
    text-transform: uppercase;
    font-weight: 700;
    cursor: pointer;
    border: none;
  }
  .btn-primary { background: var(--red); color: #111; }

  /* STATS */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    margin-bottom: 40px;
    background: #000000;
  }
  .stat-card { background: var(--surface); padding: 30px; }
  .stat-value { font-family: var(--display); font-size: 52px; color: var(--text); }

  /* TABLE */
  .chronicle-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .chronicle-table th {
    text-align: left;
    padding: 12px 20px;
    text-align: center;
    font-family: var(--mono);
    font-size: 15px;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
  }
  .chronicle-row td { padding: 20px; border-bottom: 1px solid var(--border); }
  .chronicle-row:hover { background: var(--surface); }

  /* SCROLLBAR */
  .content-wrapper::-webkit-scrollbar { width: 6px; }
  .content-wrapper::-webkit-scrollbar-track { background: var(--bg); }
  .content-wrapper::-webkit-scrollbar-thumb { background: var(--border); }
`;

const interviews = [
  { role: "Senior Product Manager", date: "OCT 24, 2024", score: 88 },
  { role: "N/A", date: "N/A", score: 0 },
  { role: "N/A", date: "N/A", score: 0 },
];

export default function UserDash() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-title">ALVIN</div>
            <div className="logo-sub">By Team Katana</div>
          </div>
          <nav className="nav">
            {["Dashboard", "Interviews", "Analytics", "Settings"].map((label) => (
              <div
                key={label}
                className={`nav-item ${activeNav === label ? "active" : ""}`}
                onClick={() => setActiveNav(label)}
              >
                {label}
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button className="btn-start-new">SIGN OUT</button>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="search-wrap">
              <input className="search-input" placeholder="Search..." />
            </div>
          </header>

          <div className="content-wrapper">
            <div className="content-layout">
              <div className="content-main">
                <div className="welcome-row">
                  <div className="welcome-text">
                    <p style={{fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '10px'}}>VERSION 4.2.0</p>
                    <h1>Welcome back,<br /><span>VIN</span></h1>
                  </div>
                  <div className="hero-actions">
                    <button className="btn-primary">Start New Interview</button>
                  </div>
                </div>

                <div className="stat-grid">
                  <div className="stat-card">
                    <p style={{fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--text-muted)'}}>TOTAL INTERVIEWS</p>
                    <div style={{fontFamily: 'var(--display)', fontSize: '50px', marginTop: '10px'}} className="stat-value">24</div>
                  </div>
                  <div className="stat-card">
                    <p style={{fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--text-muted)'}}>AVERAGE PERFORMANCE ACCURACY</p>
                    <div style={{fontFamily: 'var(--display)', fontSize: '50px', marginTop: '10px'}} className="stat-value">72%</div>
                  </div>
                  <div className="stat-card">
                    <p style={{fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--text-muted)'}}>INTERVIEW SKILL LEVEL</p>
                    <div style={{fontFamily: 'var(--display)', fontSize: '24px', marginTop: '10px'}}>LEARNER</div>
                  </div>
                  <div className="stat-card">
                    <p style={{fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--text-muted)'}}>PRIORITY FOCUS AREA</p>
                    <div style={{fontFamily: 'var(--display)', fontSize: '24px', marginTop: '10px', color: 'var(--yellow)'}}>HIGH FILLER WORD COUNT</div>
                  </div>
                </div>

                <h2 style={{fontFamily: 'var(--display)', fontSize: '24px', letterSpacing: '2px', color: 'var(--white)'}}>INTERVIEW HISTORY</h2>
                <table className="chronicle-table">
                  <thead>
                    <tr>
                      <th>ROLE</th>
                      <th>DATE</th>
                      <th>SCORE</th>
                      <th>INSIGHT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map((i) => (
                      <tr key={i.role} className="chronicle-row">
                        <td style={{color: 'var(--text)', fontWeight: '600'}}>{i.role}</td>
                        <td style={{fontFamily: 'var(--mono)', fontSize: '12px'}}>{i.date}</td>
                        <td style={{fontFamily: 'var(--display)', fontSize: '24px', color: 'var(--yellow)'}}>{i.score}%</td>
                         <td> <span style={{fontFamily: 'var(--mono)', fontSize: '12px'}}>View Feedback</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

