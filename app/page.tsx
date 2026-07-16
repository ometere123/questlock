"use client";

import { useEffect } from "react";
import Link from "next/link";

const STAGES = [
  { icon: "📋", name: ["Proof", "Submitted"], sub: "GitHub + URL",    status: "Received",  cls: "active"   },
  { icon: "⚙",  name: ["Proof", "Engine"],    sub: "10 checks",      status: "Scoring",   cls: "active"   },
  { icon: "🛡",  name: ["Anti-Farm", "Rules"], sub: "Duplicate check",status: "Checking",  cls: "active-g" },
  { icon: "📜", name: ["EAS", "Attestation"], sub: "Base Sepolia",   status: "Attesting", cls: "active-g" },
  { icon: "⛽", name: ["Gasless", "Claim"],   sub: "Gelato Relay",   status: "Complete",  cls: "done"     },
];

const CHECKS_PASS = [
  { label: "Repository exists",             pass: true,  pts: "+10" },
  { label: "Owner matches username",         pass: true,  pts: "+10" },
  { label: "Updated after quest start",      pass: true,  pts: "+10" },
  { label: "3+ commits after start",         pass: true,  pts: "+15" },
  { label: "README exists",                  pass: true,  pts: "+10" },
  { label: "README ≥ 500 characters",        pass: true,  pts: "+10" },
  { label: "Frontend files found",           pass: true,  pts: "+10" },
  { label: "Contract/backend files",         pass: false, pts: "+0"  },
  { label: "Demo URL loads (200)",           pass: true,  pts: "+10" },
  { label: "Repo not previously submitted",  pass: true,  pts: "+5"  },
];

const CHECKS_FAIL = [
  { label: "Repository exists",             pass: true,  pts: "+10"        },
  { label: "Owner matches username",         pass: false, pts: "+0"         },
  { label: "Updated after quest start",      pass: false, pts: "+0"         },
  { label: "3+ commits after start",         pass: false, pts: "+0"         },
  { label: "README exists",                  pass: true,  pts: "+10"        },
  { label: "README ≥ 500 characters",        pass: false, pts: "+0"         },
  { label: "Frontend files found",           pass: false, pts: "+0"         },
  { label: "Contract/backend files",         pass: false, pts: "+0"         },
  { label: "Demo URL loads (200)",           pass: true,  pts: "+10"        },
  { label: "Repo not previously submitted",  pass: false, pts: "+0 · DUPLICATE" },
];

export default function LandingPage() {
  useEffect(() => {
    // Pipeline animation
    const stageDefs = [
      { n: "pn0", s: "ps0", t: "Received",  c: "active"   },
      { n: "pn1", s: "ps1", t: "Scoring",   c: "active"   },
      { n: "pn2", s: "ps2", t: "Checking",  c: "active-g" },
      { n: "pn3", s: "ps3", t: "Attesting", c: "active-g" },
      { n: "pn4", s: "ps4", t: "Complete",  c: "done"     },
    ];
    function clearPipe() {
      stageDefs.forEach(({ n, s }) => {
        document.getElementById(n)?.classList.remove("active", "active-g", "done");
        const st = document.getElementById(s);
        if (st) st.style.opacity = "0";
      });
    }
    function runPipe() {
      clearPipe();
      stageDefs.forEach(({ n, s, t, c }, i) => {
        setTimeout(() => {
          document.getElementById(n)?.classList.add(c);
          const st = document.getElementById(s) as HTMLElement | null;
          if (st) { st.textContent = t; st.style.opacity = "1"; }
        }, i * 900 + 400);
      });
    }
    runPipe();
    const timer = setInterval(runPipe, 7000);

    // Scroll reveal
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("on"); obs.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => {
      const sibs = el.parentElement?.querySelectorAll(".reveal");
      if (sibs && sibs.length > 1) {
        const idx = Array.from(sibs).indexOf(el as Element);
        (el as HTMLElement).style.transitionDelay = `${idx * 0.09}s`;
      }
      obs.observe(el);
    });

    return () => { clearInterval(timer); obs.disconnect(); };
  }, []);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          Deterministic Proof Engine · Base Sepolia · EAS Attestations
        </div>

        <h1 className="ht">
          <span className="ln"><span className="w" style={{ animationDelay: ".15s" }}>Proof-powered</span></span>
          <span className="ln"><span className="gw" style={{ animationDelay: ".38s" }}>quest infrastructure.</span></span>
          <span className="ln"><span className="w" style={{ animationDelay: ".62s" }}>Not AI.</span></span>
        </h1>

        <p className="hero-sub">
          QuestLock rewards <span className="hl">genuine builders</span> and blocks farmers using
          objective proof checks — no LLMs, no guesswork. Just deterministic predicate evaluation
          and on-chain attestations.
        </p>

        {/* Pipeline */}
        <div className="pipeline-wrap">
          <div className="pipe-lbl">Deterministic proof evaluation · Base Sepolia · Gelato Relay gasless claim</div>
          <div className="pipeline">
            <span className="beam-dot" />
            {STAGES.map((s, i) => (
              <div className="pnode" key={i} id={`pn${i}`}>
                <div className="pnode-ring">{s.icon}</div>
                <div className="pnode-name">{s.name[0]}<br />{s.name[1]}</div>
                <div className="pnode-sub">{s.sub}</div>
                <div className="pnode-st" id={`ps${i}`} style={{ opacity: 0 }}>{s.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-btns">
          <Link href="/quests" className="btn btn-p">Explore Quests <span className="arr">→</span></Link>
          <Link href="/create" className="btn btn-g">Create Quest</Link>
        </div>
      </section>

      {/* ── DASHBOARD ── */}
      <div className="divider" />
      <div className="sec" id="dashboard">
        <div className="reveal">
          <div className="sec-lbl">Live Dashboard</div>
          <h2 className="st">Quest integrity. <span className="gs">Every submission.</span></h2>
          <p className="sec-sub">Admin creates quests with scoring rubrics. Builders submit proof. The predicate engine decides — transparently.</p>
        </div>
        <div className="dash reveal">
          <div className="dash-bar">
            <span className="dd dd-r" /><span className="dd dd-y" /><span className="dd dd-g" />
            <span className="d-url">app.questlock.io / dashboard · Base Sepolia 84532</span>
          </div>
          <div className="dash-layout">
            <div className="dsb">
              <div className="dsb-logo"><div className="dsb-icon">🔒</div>QuestLock</div>
              <div className="dsb-s">Overview</div>
              <div className="dsb-i act">⬡ Dashboard<span className="dsb-badge">2 flagged</span></div>
              <div className="dsb-i">◎ Quest Feed</div>
              <div className="dsb-i">⚙ Submissions</div>
              <div className="dsb-s">Manage</div>
              <div className="dsb-i">✦ Quests</div>
              <div className="dsb-i">◇ Proof Checks</div>
              <div className="dsb-i">⊛ Contributors</div>
              <div className="dsb-s">Onchain</div>
              <div className="dsb-i">📜 Attestations</div>
              <div className="dsb-i">⚙ Admin</div>
            </div>
            <div className="dm">
              <div className="dm-h">
                <div>
                  <div className="dm-title">Proof Verification Dashboard</div>
                  <div className="dm-sub">LIVE · Base Sepolia 84532 · EAS · Updated 3s ago</div>
                </div>
                <div className="dm-acts">
                  <button className="dmb dmbs">Export</button>
                  <Link href="/create" className="dmb dmbp">+ Create Quest</Link>
                </div>
              </div>
              <div className="krow">
                <div className="kpi k1"><div className="knum">847</div><div className="klbl">Total Submissions</div><div className="ktrend kts">↑ 12% today</div></div>
                <div className="kpi k2"><div className="knum">612</div><div className="klbl">Proofs Passed</div><div className="ktrend kts">↑ 72.3% pass rate</div></div>
                <div className="kpi k3"><div className="knum">235</div><div className="klbl">Farms Blocked</div><div className="ktrend ktd">↓ 27.7% rejected</div></div>
                <div className="kpi k4"><div className="knum">498</div><div className="klbl">EAS Attestations</div><div className="ktrend kts">Base Sepolia</div></div>
              </div>
              <div className="tbl-head">
                <div className="th">Quest / Wallet</div>
                <div className="th">GitHub Repo</div>
                <div className="th">Status</div>
                <div className="th">Proof Score</div>
                <div className="th">Risk Band</div>
              </div>
              {[
                { name: "GenLayer Builder Quest",  id: "QST-0412 · 0x4a7f...c291", repo: "github.com/user/genlayer-app",   status: "Verified · Attested", sc: "ch-pass", score: "84 / 100", nc: "ps-pass", risk: "LOW",    rc: "ch-pass", row: "t-pass" },
                { name: "Frontend Sprint Quest",   id: "QST-0413 · 0x9c2a...f847", repo: "github.com/user/copied-repo",   status: "Rejected · Farm",     sc: "ch-fail", score: "28 / 100", nc: "ps-fail", risk: "HIGH",   rc: "ch-hi",   row: "t-fail" },
                { name: "Smart Contract Quest",    id: "QST-0414 · 0x1b3e...a032", repo: "github.com/user/defi-contracts", status: "Evaluating",          sc: "ch-pend", score: "— / 100",  nc: "ps-pend", risk: "MEDIUM", rc: "ch-med",  row: "t-pend" },
                { name: "Full-Stack DApp Quest",   id: "QST-0415 · 0x7f9b...d514", repo: "github.com/user/fullstack-dapp",status: "Claim Ready",         sc: "ch-pass", score: "91 / 100", nc: "ps-pass", risk: "LOW",    rc: "ch-pass", row: "t-pass" },
              ].map((r, i) => (
                <div className={`trow ${r.row} reveal`} key={i}>
                  <div><div className="tc-name">{r.name}</div><div className="tc-id">{r.id}</div></div>
                  <div className="tc-user">{r.repo}</div>
                  <div><div className={`chip ${r.sc}`}><span className="cdot" />{r.status}</div></div>
                  <div className={`proof-score ${r.nc}`}>{r.score}</div>
                  <div><div className={`chip ${r.rc}`}><span className="cdot" />{r.risk}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PROOF ENGINE / SCORE BREAKDOWN ── */}
      <div className="divider" />
      <div className="sec" id="engine">
        <div className="reveal">
          <div className="sec-lbl">Deterministic Proof Engine</div>
          <h2 className="st">100 points. <span className="gs">No subjectivity.</span></h2>
          <p className="sec-sub">Ten objective GitHub checks. Every point is explainable. Every rejection shows exactly which checks failed and why.</p>
        </div>
        <div className="score-layout">
          {/* PASS */}
          <div className="score-card sc-pass reveal">
            <div className="sc-head">
              <div><div className="sch-label">Submission · QST-0412</div><div className="sch-name">github.com/user/genlayer-app</div></div>
              <div className="sch-score"><div className="sch-num scn-pass">84</div><div className="sch-lbl">Proof Score</div></div>
            </div>
            <div className="sc-body">
              {CHECKS_PASS.map((c, i) => (
                <div className="check-row" key={i}>
                  <div className="cr-left">
                    <div className={`cr-icon ${c.pass ? "ci-pass" : "ci-fail"}`}>{c.pass ? "✓" : "✕"}</div>
                    <div className="cr-name">{c.label}</div>
                  </div>
                  <div className={`cr-pts ${c.pass ? "pt-pass" : "pt-fail"}`}>{c.pts}</div>
                </div>
              ))}
              <div className="score-bar-wrap">
                <div className="sb-label"><span>Score</span><span>84 / 100 · Predicate PASS</span></div>
                <div className="score-bar"><div className="sb-fill sbf-pass" style={{ width: "84%" }} /></div>
              </div>
            </div>
          </div>
          {/* FAIL */}
          <div className="score-card sc-fail reveal">
            <div className="sc-head">
              <div><div className="sch-label">Submission · QST-0413</div><div className="sch-name">github.com/user/copied-repo</div></div>
              <div className="sch-score"><div className="sch-num scn-fail">28</div><div className="sch-lbl">Proof Score</div></div>
            </div>
            <div className="sc-body">
              {CHECKS_FAIL.map((c, i) => (
                <div className="check-row" key={i}>
                  <div className="cr-left">
                    <div className={`cr-icon ${c.pass ? "ci-pass" : "ci-fail"}`}>{c.pass ? "✓" : "✕"}</div>
                    <div className="cr-name">{c.label}</div>
                  </div>
                  <div className={`cr-pts ${c.pass ? "pt-pass" : "pt-fail"}`}>{c.pts}</div>
                </div>
              ))}
              <div className="score-bar-wrap">
                <div className="sb-label"><span>Score</span><span>28 / 100 · Predicate FAIL · HIGH risk</span></div>
                <div className="score-bar"><div className="sb-fill sbf-fail" style={{ width: "28%" }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ANTI-FARM RULES ── */}
      <div className="divider" />
      <div className="sec">
        <div className="reveal">
          <div className="sec-lbl">Anti-Farm Rules</div>
          <h2 className="st">Objective checks. <span className="gs">Explainable rejections.</span></h2>
          <p className="sec-sub">Not AI sybil detection. Simple, transparent rules that farmers cannot argue with — because the checks are public and deterministic.</p>
        </div>
        <div className="farm-table reveal">
          <div className="ft-head">
            <div className="fth">Risk Band</div>
            <div className="fth">Condition</div>
            <div className="fth">Action</div>
          </div>
          {[
            { band: "LOW",    bc: "fb-lo", cond: "No duplicate or suspicious signals found",                             action: "Normal scoring · Approve if predicate passes" },
            { band: "MEDIUM", bc: "fb-md", cond: "New GitHub account, forked repo, or weak engagement signals",          action: "Allow if score is strong · Flag for review"   },
            { band: "HIGH",   bc: "fb-hi", cond: "Duplicate repo submitted by another wallet for this quest",            action: "Auto-reject · No attestation · Reason shown"  },
            { band: "HIGH",   bc: "fb-hi", cond: "Same demo URL reused by multiple wallets",                             action: "Auto-reject · Duplicate index flagged"         },
            { band: "HIGH",   bc: "fb-hi", cond: "Wallet has already claimed this quest",                                action: "Auto-reject · Claim history checked"           },
          ].map((r, i) => (
            <div className="ft-row" key={i}>
              <div className={`fband ${r.bc}`}>{r.band}</div>
              <div className="ft-desc">{r.cond}</div>
              <div className="ft-action">{r.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── EAS ATTESTATION ── */}
      <div className="divider" />
      <div className="sec" id="attestation">
        <div className="reveal">
          <div className="sec-lbl">EAS Attestations · Base Sepolia</div>
          <h2 className="st">Not logs. <span className="gs">On-chain proof.</span></h2>
          <p className="sec-sub">Every passing submission creates an Ethereum Attestation Service record on Base Sepolia — public-safe, permanent, linkable from any profile or protocol.</p>
        </div>
        <div className="att-card reveal">
          <div className="att-grid">
            <div className="att-seal">📜</div>
            <div>
              <div className="att-label">QuestCompletion · EAS Schema · Base Sepolia</div>
              <div className="att-title">GenLayer Builder Quest · Verified</div>
              <div className="att-sub">Proof type: github_project · Score 84/100 · Risk band LOW · Approved onchain · Reward claimed via Gelato Relay</div>
            </div>
            <div className="att-meta">
              {([
                ["Quest ID",        "1",                  ""],
                ["User",            "0x4a7f...c291",      ""],
                ["Proof Type",      "github_project",     ""],
                ["Score",           "84",                 "amv-gold"],
                ["Risk Band",       "LOW",                "amv-pass"],
                ["Approved",        "true",               "amv-pass"],
                ["Attestation UID", "0x9283...a7f1",      ""],
                ["Network",         "Base Sepolia · 84532",""],
              ] as [string,string,string][]).map(([k, v, cls]) => (
                <div className="am-row" key={k}>
                  <span className="amk">{k}</span>
                  <span className={`amv${cls ? ` ${cls}` : ""}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lifecycle reveal">
          {[
            { dot: "ld-active", n: "1", state: "SUBMITTED",               desc: "User submits GitHub username, repo URL, demo URL, and explanation via the frontend" },
            { dot: "ld-active", n: "2", state: "FETCHING_PROOF → EVALUATING", desc: "Backend fetches GitHub metadata, commits, README, file tree, and demo URL status" },
            { dot: "ld-active", n: "3", state: "PASSED / FAILED",         desc: "Deterministic predicate engine applies scoring rubric — all reasons shown to user" },
            { dot: "ld-pass",   n: "4", state: "ATTESTING → ATTESTED",    desc: "EAS attestation created on Base Sepolia with proofHash, score, riskBand, approved=true" },
            { dot: "ld-pass",   n: "5", state: "APPROVED_ONCHAIN",        desc: "Verifier wallet calls QuestLockCore.approveSubmission on Base Sepolia" },
            { dot: "ld-pass",   n: "6", state: "CLAIM_READY → CLAIMED",   desc: "User claims QUEST tokens + ERC-1155 badge gaslessly through Gelato Relay" },
          ].map((item, i) => (
            <div className="lc-item" key={i}>
              <div className={`lc-dot ${item.dot}`}>{item.n}</div>
              <div><div className="lc-state">{item.state}</div><div className="lc-desc">{item.desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY THIS ARCHITECTURE ── */}
      <div className="divider" />
      <div className="sec" id="why">
        <div className="reveal">
          <div className="sec-lbl">Architecture Decision</div>
          <h2 className="st">The first problem is <span className="gs">proof integrity.</span></h2>
          <p className="sec-sub">QuestLock intentionally avoids AI in v1. Subjective judgement comes second. Objective proof verification comes first.</p>
        </div>
        <div className="why-grid">
          <div className="wc wc-trad reveal">
            <div className="wc-lbl wl-t">Traditional Quest Platforms</div>
            {[
              "Reward anyone who clicks — no proof of actual work done",
              "Manual review doesn't scale — one admin reviewing 500 submissions daily",
              "No public attestation — users can't prove their work history anywhere",
              "Gas friction on claiming — users need ETH before they've earned anything",
              "Farmers drain reward pools — genuine builders compete against bots",
            ].map((t, i) => (
              <div className="wi" key={i}>
                <span className="wim" style={{ color: "var(--mauve)", opacity: .6 }}>×</span>
                <div className="wit wit-t">{t}</div>
              </div>
            ))}
          </div>
          <div className="wc wc-ql reveal">
            <div className="wc-lbl wl-q">QuestLock Architecture</div>
            {[
              { text: "GitHub proof engine checks 10 objective conditions — no manual review needed",           tag: "Deterministic predicate",  gold: false, ic: "var(--ember-3)" },
              { text: "Anti-farm rules block duplicate repos, demo URLs, and multi-wallet abuse automatically", tag: "Anti-farm rules",           gold: false, ic: "var(--gold-2)"  },
              { text: "EAS attestation on Base Sepolia — a permanent public credential for every verified builder", tag: "On-chain attestation",   gold: true,  ic: "var(--ember-3)" },
              { text: "Gelato Relay sponsors gas — users claim QUEST tokens without needing ETH first",        tag: "Gasless · Gelato Relay",   gold: true,  ic: "var(--gold-2)"  },
              { text: "Rejection reasons are transparent — farmers can't argue with objective checks",         tag: "Explainable rejections",   gold: false, ic: "var(--pass-2)"  },
            ].map((item, i) => (
              <div className="wi" key={i}>
                <span className="wim" style={{ color: item.ic }}>✦</span>
                <div>
                  <div className="wit wit-q">{item.text}</div>
                  <span className={`wtag${item.gold ? " wtag-g" : ""}`}>{item.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div className="fcta reveal">
        <div className="fcta-i">
          <h2>Reward the builders.<br /><span className="gs2">Block the farmers.</span></h2>
          <p>QuestLock verifies GitHub proof deterministically, attests results on Base Sepolia, and delivers rewards gaslessly. No AI. No ambiguity. Just provable work.</p>
          <Link href="/quests" className="btn-lt">Browse Quests <span className="arr">→</span></Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <p>QuestLock · Deterministic Proof Engine · Base Sepolia · EAS Attestations · Gelato Relay · No AI in v1</p>
      </footer>
    </div>
  );
}
