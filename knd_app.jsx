import { useState, useEffect } from "react";

// ─── Design tokens ───────────────────────────────────────────────
const T = {
  bg: "#F2F5F3", surface: "#FFFFFF", ink: "#17211E", muted: "#5E6E69",
  line: "#E2E8E4", breath: "#0F7B63", breathSoft: "#E3F0EB",
  amber: "#B57F17", amberSoft: "#F7ECD3", coral: "#C74E38", coralSoft: "#F9E7E2",
  blue: "#2E5E8C", blueSoft: "#E4EDF5",
};
const fontStack = "'Manrope', -apple-system, 'Segoe UI', sans-serif";
const displayStack = "'Fraunces', Georgia, serif";

// ─── Goal configurations ─────────────────────────────────────────
// Same mechanics everywhere. Only content, language and outcome
// definitions change per goal — that's the architecture argument.
const GOALS = {
  smoking: {
    chip: "Quit smoking",
    identity: "You are a non-smoker.",
    sub: (d) => `Day ${d} of your quit · started June 20`,
    checkIn: "Check in — smoke-free today",
    checkedToast: (d) => `Checked in — ${d} days as a non-smoker.`,
    slipLabel: "Log a slip",
    slipToast: "Logged. A slip is a data point, not a reset — your quit continues.",
    outcomeMetric: "smoke-free at 6 mo",
    outcomeNote: "Outcome data is self-reported with follow-ups at 1, 3 and 6 months. Non-responders count as relapsed.",
    wearable: {
      metric: "Resting heart rate", value: "64 bpm", delta: "▼ 4 bpm since quit day",
      note: "Your heart is already recovering — RHR typically drops within 2–4 weeks of quitting.",
      source: "Apple Watch · last 7 days",
    },
    protocols: [
      { id: "varen", name: "Varenicline + weekly counseling", source: "Clinical protocol · Cochrane-reviewed", n: 1902, success: 44, grade: "A", upvotes: 861,
        gist: "Prescription med that blunts nicotine reward, paired with brief weekly check-ins.",
        voices: "“The med made cigarettes taste like nothing. Counseling kept me honest.” — 6 mo smoke-free" },
      { id: "carr", name: "Allen Carr's Easyway", source: "Book · The Easy Way to Stop Smoking", n: 4218, success: 34, grade: "B", upvotes: 2140,
        gist: "Reframes quitting as escaping a trap, not giving something up. No substitutes, no willpower framing.",
        voices: "“Finished the book, put them down, never looked back.” — 14 mo" },
      { id: "patch", name: "Nicotine patch, 8-week taper", source: "Clinical protocol · NHS / FDA guidance", n: 3104, success: 28, grade: "A", upvotes: 990,
        gist: "Steady-dose patch stepping down over 8 weeks. Works best started on a planned quit date.",
        voices: "“Boring but it worked. The taper removed all the decisions.” — 9 mo" },
      { id: "cold", name: "Cold turkey + pod accountability", source: "Community protocol", n: 6530, success: 22, grade: "C", upvotes: 3320,
        gist: "Hard stop with a 4-person pod checking in daily for the first 30 days.",
        voices: "“The pod is the only reason day 4 didn't end me.” — 3 mo" },
    ],
    board: {
      question: "Can I use nicotine patches while doing Allen Carr's Easyway?",
      consensus: "2 of 3 disciplines lean yes · 1 dissent",
      experts: [
        { role: "Physician", name: "Pulmonology · smoking cessation", stance: "yes", grade: "A",
          view: "NRT roughly doubles 6-month quit rates versus unaided attempts across 130+ trials. Combining it with any behavioral method is safe and usually additive." },
        { role: "Behavioral psychologist", name: "Habit & addiction psychology", stance: "no", grade: "C",
          view: "Easyway's mechanism is cognitive: you must believe you're giving up nothing. A patch signals 'I still need nicotine,' which can undercut the reframe. Evidence here is weaker — mostly theory and case reports." },
        { role: "Pharmacologist", name: "Clinical pharmacology", stance: "caveat", grade: "B",
          view: "Patches are low-risk. If withdrawal is what historically breaks your attempts, use them. If relapses were belief- and stress-driven, the psychologist's concern matters more." },
      ],
      synthesis: "The disagreement is about mechanism, not safety. Grade A evidence says patches help on average; Grade C evidence says they may blunt this specific method. Deciding factor: your own relapse history — physical withdrawal → patch; mental cravings → run Easyway clean.",
    },
  },

  alcohol: {
    chip: "Alcohol-free",
    identity: "You don't drink.",
    sub: (d) => `Day ${d} alcohol-free · started June 20`,
    checkIn: "Check in — alcohol-free today",
    checkedToast: (d) => `Checked in — ${d} days alcohol-free.`,
    slipLabel: "Log a drink",
    slipToast: "Logged. One evening doesn't erase twelve days — your progress stands.",
    outcomeMetric: "alcohol-free at 6 mo",
    outcomeNote: "Self-reported with follow-ups at 1, 3 and 6 months. Non-responders count as relapsed.",
    wearable: {
      metric: "Overnight HRV", value: "58 ms", delta: "▲ 12 ms since day 1",
      note: "Alcohol suppresses HRV for up to 5 nights. Yours is climbing — visible proof your recovery is real.",
      source: "Oura · 7-night average",
    },
    protocols: [
      { id: "sinclair", name: "Naltrexone (Sinclair Method)", source: "Clinical protocol · prescription required", n: 1204, success: 41, grade: "A", upvotes: 743,
        gist: "Medication taken before drinking that blocks the reward loop, gradually extinguishing the craving itself.",
        voices: "“After four months the pull just… wasn't there anymore.” — 8 mo" },
      { id: "nakedmind", name: "This Naked Mind", source: "Book · Annie Grace", n: 2890, success: 31, grade: "B", upvotes: 1980,
        gist: "Dismantles the beliefs behind drinking rather than fighting the behavior. No counting, no shame framing.",
        voices: "“I stopped wanting it, which is different from resisting it.” — 11 mo" },
      { id: "dry30", name: "Dry-30 challenge + pod", source: "Community protocol", n: 5120, success: 24, grade: "C", upvotes: 2870,
        gist: "30-day full stop with a pod, then a deliberate decision about what comes after — extend, moderate, or reassess.",
        voices: "“Day 30 I realized I didn't want to go back.” — 5 mo" },
    ],
    board: {
      question: "Is moderation a realistic goal for me, or should I aim for full abstinence?",
      consensus: "No consensus · genuinely split",
      experts: [
        { role: "Physician", name: "Addiction medicine", stance: "caveat", grade: "A",
          view: "Depends on severity. Screening scores (like AUDIT) matter: lower-risk drinkers succeed at moderation ~40% of the time; those with dependence markers rarely sustain it. Your history decides this, not preference." },
        { role: "Behavioral psychologist", name: "Habit & addiction psychology", stance: "no", grade: "B",
          view: "Abstinence is a brighter line, and bright lines are easier to defend. Moderation requires a fresh decision every single evening — that's hundreds of chances for depleted willpower to lose." },
        { role: "Public health researcher", name: "Epidemiology of alcohol use", stance: "yes", grade: "B",
          view: "Population data shows harm reduction works: cutting from 20 to 5 drinks weekly captures most of the health benefit. Demanding abstinence deters many people from trying at all." },
      ],
      synthesis: "All three agree the answer depends on your dependence level — they disagree on the default. Practical rule from the evidence: try a strict 30-day abstinence period first. If it feels manageable, moderation may be open to you; if it feels like white-knuckling, that itself is the diagnostic.",
    },
  },

  sleep: {
    chip: "Fix my sleep",
    identity: "You protect your sleep.",
    sub: (d) => `Day ${d} · ${Math.min(d - 3, d)} nights of 7+ hours`,
    checkIn: "Log last night — 7+ hours",
    checkedToast: (d) => `Logged — night ${d} on protocol.`,
    slipLabel: "Log a late night",
    slipToast: "Logged. One bad night is noise, not failure — tonight is a fresh data point.",
    outcomeMetric: "insomnia improved at 8 wk",
    outcomeNote: "Improvement = clinically meaningful drop in self-reported Insomnia Severity Index at 8-week follow-up.",
    wearable: {
      metric: "Sleep duration", value: "7 h 12 m", delta: "▲ 38 min vs. your baseline week",
      note: "Objective data confirms your check-ins — your protocol is working, not just feeling like it.",
      source: "Apple Watch · 7-night average",
    },
    protocols: [
      { id: "cbti", name: "CBT-I (sleep restriction + stimulus control)", source: "Clinical protocol · first-line per AASM", n: 1610, success: 52, grade: "A", upvotes: 690,
        gist: "Counterintuitive gold standard: temporarily restrict time in bed to rebuild sleep pressure, plus strict bed-only-for-sleep rules.",
        voices: "“Brutal for two weeks, then I slept like I was 20 again.” — 4 mo" },
      { id: "wake", name: "Fixed wake time + morning light", source: "Community protocol · circadian-based", n: 4300, success: 38, grade: "B", upvotes: 2410,
        gist: "Same wake time 7 days a week, 10 minutes of outdoor light within an hour of waking. Anchors the circadian clock.",
        voices: "“The weekend part was the hard part. Also the part that mattered.” — 6 mo" },
      { id: "mag", name: "Magnesium glycinate + wind-down stack", source: "Community protocol · supplement-based", n: 6900, success: 21, grade: "C", upvotes: 3980,
        gist: "Popular supplement stack with evening routine. Heavily upvoted; evidence is thin and effects are modest in trials.",
        voices: "“Helps me switch off. Might be ritual as much as chemistry.” — 2 mo" },
    ],
    board: {
      question: "Should I take melatonin every night?",
      consensus: "3 of 3 advise against nightly use — for different reasons",
      experts: [
        { role: "Physician", name: "Sleep medicine", stance: "no", grade: "A",
          view: "Melatonin is a circadian signal, not a sedative. It's effective for shifting sleep timing (jet lag, delayed phase) but shows minimal benefit for ordinary insomnia in meta-analyses. Nightly use treats the wrong problem." },
        { role: "Behavioral psychologist", name: "Sleep & habit psychology", stance: "no", grade: "B",
          view: "Nightly pills become a psychological crutch: you learn 'I can't sleep without it,' which feeds the anxiety that maintains insomnia. CBT-I outperforms it durably and teaches the opposite belief." },
        { role: "Pharmacologist", name: "Clinical pharmacology", stance: "caveat", grade: "B",
          view: "If you use it at all: most products are dosed 5–20x too high. 0.3–1 mg, taken 3–4 hours before bed for phase-shifting. Supplement-grade products also vary wildly from their labeled dose." },
      ],
      synthesis: "Rare full consensus: nightly melatonin isn't the tool for chronic sleep problems. Use it short-term for timing shifts (travel, schedule changes) at low doses; for ongoing insomnia, the Grade A answer is CBT-I.",
    },
  },
};

// ─── Small pieces ────────────────────────────────────────────────
function GradeBadge({ grade }) {
  const map = {
    A: { bg: T.breathSoft, fg: T.breath, label: "Evidence A" },
    B: { bg: T.blueSoft, fg: T.blue, label: "Evidence B" },
    C: { bg: T.amberSoft, fg: T.amber, label: "Evidence C" },
  };
  const s = map[grade];
  return <span style={{ background: s.bg, color: s.fg, fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{s.label}</span>;
}
function Card({ children, style }) {
  return <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, ...style }}>{children}</div>;
}
function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, margin: "20px 4px 8px" }}>{children}</div>;
}
function BreathRing({ day }) {
  const R = 84, C = 2 * Math.PI * R;
  const pct = Math.min(day / 90, 1);
  return (
    <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto" }}>
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx="100" cy="100" r={R} fill="none" stroke={T.line} strokeWidth="10" />
        <circle cx="100" cy="100" r={R} fill="none" stroke={T.breath} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset 800ms ease" }} />
      </svg>
      <div className="breathe" style={{ position: "absolute", inset: 26, borderRadius: "50%", background: T.breathSoft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: displayStack, fontSize: 44, fontWeight: 600, color: T.ink, lineHeight: 1 }}>{day}</div>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginTop: 4 }}>days · goal 90</div>
      </div>
    </div>
  );
}

const POD = [
  { initials: "MK", name: "Marta", day: 12, checked: true },
  { initials: "JT", name: "Jonas", day: 9, checked: true },
  { initials: "AL", name: "Aline", day: 31, checked: false },
];

// ─── Tabs ────────────────────────────────────────────────────────
function TodayTab({ g, day, checked, setChecked, tokens, setTokens, toast }) {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "20px 0 6px" }}>
        <div style={{ fontFamily: displayStack, fontStyle: "italic", fontSize: 24, color: T.ink }}>{g.identity}</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{g.sub(day)}</div>
      </div>
      <BreathRing day={day} />
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={() => { if (!checked) { setChecked(true); toast(g.checkedToast(day)); } }}
          style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "none", cursor: "pointer",
            background: checked ? T.breathSoft : T.breath, color: checked ? T.breath : "#fff",
            fontWeight: 800, fontSize: 15, fontFamily: fontStack }}>
          {checked ? "✓ Checked in today" : g.checkIn}
        </button>
        <button onClick={() => {
            if (tokens > 0) { setTokens(tokens - 1); toast(g.slipToast); }
            else { toast("Out of slip tokens this month. Your pod has been looped in for support."); }
          }}
          style={{ padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${T.coral}`, cursor: "pointer",
            background: "transparent", color: T.coral, fontWeight: 800, fontSize: 14, fontFamily: fontStack }}>
          {g.slipLabel}
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 10, fontSize: 12.5, color: T.muted, flexWrap: "wrap", textAlign: "center" }}>
        Slip tokens left this month:
        {[0, 1].map(i => (
          <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < tokens ? T.coral : "transparent", border: `1.5px solid ${T.coral}`, display: "inline-block" }} />
        ))}
        <span>— a slip never resets your count.</span>
      </div>

      <SectionLabel>Body signal · one metric that matters for this goal</SectionLabel>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>{g.wearable.metric}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
              <span style={{ fontFamily: displayStack, fontSize: 26, fontWeight: 600 }}>{g.wearable.value}</span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: T.breath }}>{g.wearable.delta}</span>
            </div>
          </div>
          <span style={{ fontSize: 10.5, color: T.muted, fontWeight: 700, background: T.bg, padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{g.wearable.source}</span>
        </div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>{g.wearable.note}</div>
      </Card>

      <SectionLabel>Your stake</SectionLabel>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>CHF 50 deposit contract</div>
          <div style={{ fontSize: 13, color: T.breath, fontWeight: 800 }}>{90 - day} days to refund</div>
        </div>
        <div style={{ height: 8, background: T.line, borderRadius: 999, marginTop: 10 }}>
          <div style={{ width: `${(day / 90) * 100}%`, height: "100%", background: T.breath, borderRadius: 999 }} />
        </div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 8 }}>
          Reach day 90 and your deposit comes back in full. Miss it, and it goes to charity — not to us.
        </div>
      </Card>

      <SectionLabel>Your pod · 4 on the same goal</SectionLabel>
      <Card>
        {POD.map((p, i) => (
          <div key={p.initials} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < POD.length - 1 ? `1px solid ${T.line}` : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.blueSoft, color: T.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{p.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name} <span style={{ color: T.muted, fontWeight: 600 }}>· day {p.day}</span></div>
              <div style={{ fontSize: 12, color: p.checked ? T.breath : T.amber, fontWeight: 700 }}>{p.checked ? "Checked in today" : "Not checked in yet"}</div>
            </div>
            {!p.checked && (
              <button onClick={() => toast(`A gentle nudge is on its way to ${p.name}.`)}
                style={{ border: `1.5px solid ${T.line}`, background: "transparent", borderRadius: 10, padding: "6px 12px", fontSize: 12.5, fontWeight: 800, color: T.ink, cursor: "pointer", fontFamily: fontStack }}>Nudge</button>
            )}
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 12, background: T.blueSoft, border: "none" }}>
        <div style={{ fontSize: 13, color: T.blue, fontWeight: 700 }}>
          Fresh start ahead — Monday is the strongest day to add a new habit. Want to pick one from your protocol?
        </div>
      </Card>
    </div>
  );
}

function ProtocolsTab({ g, sort, setSort, votes, setVotes, following, setFollowing, expanded, setExpanded, toast }) {
  const list = [...g.protocols].sort((a, b) =>
    sort === "outcome" ? b.success - a.success : (b.upvotes + (votes[b.id] || 0)) - (a.upvotes + (votes[a.id] || 0))
  );
  return (
    <div>
      <div style={{ padding: "18px 2px 10px" }}>
        <div style={{ fontFamily: displayStack, fontSize: 22, fontWeight: 600 }}>Protocols</div>
        <div style={{ fontSize: 12.5, color: T.muted }}>{g.chip} · what actually worked, measured</div>
      </div>
      <div style={{ display: "flex", background: T.line, borderRadius: 12, padding: 3, marginBottom: 6 }}>
        {[["outcome", "Outcome-weighted"], ["votes", "Most upvoted"]].map(([k, label]) => (
          <button key={k} onClick={() => setSort(k)} style={{
            flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: fontStack,
            background: sort === k ? T.surface : "transparent", fontWeight: 800, fontSize: 13,
            color: sort === k ? T.ink : T.muted, boxShadow: sort === k ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>{label}</button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: T.muted, margin: "0 4px 12px" }}>
        {sort === "outcome"
          ? "Ranked by verified outcomes, not popularity. Users who stopped reporting count as relapsed."
          : "Ranked by community votes. Compelling stories get votes — check the outcome rate too."}
      </div>
      {list.map(p => {
        const voted = !!votes[p.id];
        const open = expanded === p.id;
        return (
          <Card key={p.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setVotes({ ...votes, [p.id]: voted ? 0 : 1 })}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, border: "none", background: "transparent", cursor: "pointer", color: voted ? T.breath : T.muted, fontWeight: 800, fontFamily: fontStack, fontSize: 12, paddingTop: 2 }}
                aria-label={`Upvote ${p.name}`}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>▲</span>
                {(p.upvotes + (votes[p.id] || 0)).toLocaleString()}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.25 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{p.source}</div>
                  </div>
                  <GradeBadge grade={p.grade} />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                  <div>
                    <div style={{ fontFamily: displayStack, fontSize: 22, fontWeight: 600, color: T.breath }}>{p.success}%</div>
                    <div style={{ fontSize: 11, color: T.muted, fontWeight: 700 }}>{g.outcomeMetric}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: displayStack, fontSize: 22, fontWeight: 600 }}>{p.n.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: T.muted, fontWeight: 700 }}>tracked users</div>
                  </div>
                </div>
                {open && (
                  <div style={{ marginTop: 10, fontSize: 13.5, color: T.ink, lineHeight: 1.5 }}>
                    {p.gist}
                    <div style={{ marginTop: 8, padding: 10, background: T.bg, borderRadius: 10, fontSize: 13, color: T.muted, fontStyle: "italic" }}>{p.voices}</div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => setExpanded(open ? null : p.id)}
                    style={{ border: `1.5px solid ${T.line}`, background: "transparent", borderRadius: 10, padding: "7px 12px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: fontStack, color: T.ink }}>
                    {open ? "Less" : "Details"}</button>
                  <button onClick={() => {
                      setFollowing({ ...following, [p.id]: !following[p.id] });
                      toast(following[p.id] ? "Removed from your plan." : "Added to your plan — daily steps will appear in Today.");
                    }}
                    style={{ border: "none", background: following[p.id] ? T.breathSoft : T.breath, color: following[p.id] ? T.breath : "#fff", borderRadius: 10, padding: "7px 14px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: fontStack }}>
                    {following[p.id] ? "✓ Following" : "Follow protocol"}</button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      <div style={{ fontSize: 11.5, color: T.muted, textAlign: "center", padding: "4px 12px 8px", lineHeight: 1.5 }}>
        {g.outcomeNote} This is decision support, not medical advice.
      </div>
    </div>
  );
}

function BoardTab({ g }) {
  const stanceStyle = {
    yes: { label: "Recommends", bg: T.breathSoft, fg: T.breath },
    no: { label: "Advises against", bg: T.coralSoft, fg: T.coral },
    caveat: { label: "It depends", bg: T.amberSoft, fg: T.amber },
  };
  const b = g.board;
  return (
    <div>
      <div style={{ padding: "18px 2px 10px" }}>
        <div style={{ fontFamily: displayStack, fontSize: 22, fontWeight: 600 }}>Your board</div>
        <div style={{ fontSize: 12.5, color: T.muted }}>Three disciplines on your question — including where they disagree</div>
      </div>
      <Card style={{ background: T.ink, border: "none" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#9DB5AD", textTransform: "uppercase" }}>Your question</div>
        <div style={{ fontFamily: displayStack, fontSize: 18, color: "#fff", marginTop: 6, lineHeight: 1.35 }}>{b.question}</div>
        <div style={{ fontSize: 12.5, color: "#9DB5AD", marginTop: 10, fontWeight: 700 }}>Consensus: {b.consensus}</div>
      </Card>
      {b.experts.map(e => {
        const s = stanceStyle[e.stance];
        return (
          <Card key={e.role} style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{e.role}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{e.name}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ background: s.bg, color: s.fg, fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999 }}>{s.label}</span>
                <GradeBadge grade={e.grade} />
              </div>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 8, color: T.ink }}>{e.view}</div>
          </Card>
        );
      })}
      <Card style={{ marginTop: 12, borderLeft: `4px solid ${T.breath}` }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: T.breath, textTransform: "uppercase" }}>
          Why they disagree — and what decides it for you
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 8 }}>{b.synthesis}</div>
      </Card>
      <Card style={{ marginTop: 12, background: T.bg, border: `1.5px dashed ${T.line}` }}>
        <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
          <strong style={{ color: T.ink }}>Ask your board anything.</strong> In the full build this runs on the Claude API: each discipline answers with a stance and evidence grade, plus an honest synthesis of the disagreement.
        </div>
      </Card>
    </div>
  );
}

// ─── App shell ───────────────────────────────────────────────────
export default function App() {
  const [goalKey, setGoalKey] = useState("smoking");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState("today");
  const [checked, setChecked] = useState(false);
  const [tokens, setTokens] = useState(2);
  const [sort, setSort] = useState("outcome");
  const [votes, setVotes] = useState({});
  const [following, setFollowing] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const day = 12;
  const g = GOALS[goalKey];

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const switchGoal = (k) => {
    setGoalKey(k); setPickerOpen(false); setChecked(false); setTokens(2);
    setVotes({}); setFollowing({}); setExpanded(null); setTab("today");
    setToastMsg(`Switched to “${GOALS[k].chip}” — same mechanics, new content.`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#DDE4DF", fontFamily: fontStack, color: T.ink, padding: "16px 8px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400&family=Manrope:wght@400;600;700;800&display=swap');
        @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.035); } }
        .breathe { animation: breathe 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .breathe { animation: none; } }
        button:focus-visible { outline: 3px solid ${T.blue}; outline-offset: 2px; }
      `}</style>

      <div style={{ maxWidth: 400, margin: "0 auto", background: T.bg, borderRadius: 28, border: `1px solid ${T.line}`, overflow: "hidden", boxShadow: "0 12px 40px rgba(23,33,30,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 0" }}>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "0.14em" }}>
            KN<span style={{ color: T.breath }}>D</span>
          </div>
          <button onClick={() => setPickerOpen(!pickerOpen)}
            style={{ fontSize: 11.5, fontWeight: 800, color: T.muted, background: T.surface, border: `1px solid ${T.line}`, padding: "4px 10px", borderRadius: 999, cursor: "pointer", fontFamily: fontStack }}>
            {g.chip} ▾
          </button>
        </div>

        {pickerOpen && (
          <div style={{ display: "flex", gap: 6, padding: "10px 18px 0", flexWrap: "wrap" }}>
            {Object.entries(GOALS).map(([k, cfg]) => (
              <button key={k} onClick={() => switchGoal(k)}
                style={{ fontSize: 12, fontWeight: 800, fontFamily: fontStack, cursor: "pointer",
                  padding: "6px 12px", borderRadius: 999,
                  border: k === goalKey ? "none" : `1.5px solid ${T.line}`,
                  background: k === goalKey ? T.breath : T.surface,
                  color: k === goalKey ? "#fff" : T.ink }}>
                {cfg.chip}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: "0 16px 16px", minHeight: 560 }}>
          {tab === "today" && (
            <TodayTab g={g} day={day} checked={checked} setChecked={setChecked} tokens={tokens} setTokens={setTokens} toast={setToastMsg} />
          )}
          {tab === "protocols" && (
            <ProtocolsTab g={g} sort={sort} setSort={setSort} votes={votes} setVotes={setVotes}
              following={following} setFollowing={setFollowing} expanded={expanded} setExpanded={setExpanded} toast={setToastMsg} />
          )}
          {tab === "board" && <BoardTab g={g} />}
        </div>

        {toastMsg && (
          <div role="status" style={{ position: "sticky", bottom: 76, margin: "0 16px", background: T.ink, color: "#fff", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}>
            {toastMsg}
          </div>
        )}

        <div style={{ display: "flex", borderTop: `1px solid ${T.line}`, background: T.surface, position: "sticky", bottom: 0 }}>
          {[["today", "Today"], ["protocols", "Protocols"], ["board", "Board"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ flex: 1, padding: "13px 0 15px", border: "none", background: "transparent", cursor: "pointer",
                fontFamily: fontStack, fontWeight: 800, fontSize: 13,
                color: tab === k ? T.breath : T.muted,
                borderTop: tab === k ? `2.5px solid ${T.breath}` : "2.5px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
