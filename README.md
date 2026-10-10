# ExpertFlow: Shift Handover Continuity & Cross-Shift Competency Engine

[![India Energy Week 2027](https://img.shields.io/badge/Competition-India%20Energy%20Week%20(IEW)%202027-blue.svg)](https://www.indiaenergyweek.com/)
[![Problem Statement 2](https://img.shields.io/badge/Problem%20Statement-2%3A%20Compressing%20Experience-orange.svg)](#)
[![OISD-166 Compliant](https://img.shields.io/badge/Compliance-OISD--166%20%7C%20IEC%2062443-green.svg)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Purdue%20Level%203%20%7C%20Air--Gapped-purple.svg)](#)

> **"Eliminating the 'Unit Normal' Trap: Standardizing Operational Intelligence Across All Shifts in Continuous Process Facilities"**

---

## 🌟 Executive Summary

In 24/7 continuous process industries (oil refineries, petrochemical plants, offshore production platforms, pipeline dispatch centers), operations run across rotating shifts (Shift A [Day], Shift B [Evening], Shift C [Night]).

Over **40% of critical plant upsets, unpredicted equipment failures, and safety incidents occur during or immediately following shift relief**. Traditional operations suffer from three systemic failure modes:
1. **The "Unit Normal" Syndrome:** Outgoing operators log 3-word entries (*"Unit normal. All parameters within envelope."*), dangerously omitting weak sensory signals, vibration creeps, or minor setpoint overrides.
2. **Missing "WHY" Reasoning:** CMMS work orders record *what* action was taken (e.g. throttling a valve by 8%), but never *why* the engineer took that step.
3. **The Rubber-Stamping Trap:** Incoming shift leads often blindly sign off on handovers without reading, treating confirmation boxes like software license terms.

**ExpertFlow** is an AI-powered experience acceleration and handover integrity platform engineered to eradicate shift handover failure modes while standardizing operational discipline across all crews.

---

## 🏗️ Three-Pillar Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXPERTFLOW THREE-PILLAR ENGINE                        │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│ PILLAR 1:                │ PILLAR 2:                │ PILLAR 3:             │
│ Structured Experience    │ Context & Reasoning      │ Standardized Cross-   │
│ Handover (5 Sections)    │ via Experience Graph     │ Shift Competency      │
├──────────────────────────┼──────────────────────────┼───────────────────────┤
│ • 1. Normal State        │ • Asset & Situation      │ • 10× Scenario Drills │
│ • 2. Deviations          │ • Signals & Sensor Cues  │ • AI Experience Coach │
│ • 3. Observations        │ • Competing Hypotheses   │   ("What would change │
│ • 4. Actions Taken       │ • Discriminating Checks  │    your mind?")       │
│ • 5. Watch-Points        │ • Verified Decisions     │ • Multi-Shift Radar   │
│ • Live NLP Auditor       │ • Tacit Lessons          │ • 1-Page Mentor Brief │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

### Pillar 1: Structured Experience Handover (The 5-Section Model)
Replaces ad-hoc verbal notes with an audited schema:
1. **Normal State (Mandatory):** Baseline feed rates, temperatures, pressures, and throughput.
2. **Deviations (Mandatory):** Exact overrides, bypass valve trims, and setpoint adjustments.
3. **Observations (Mandatory):** Weak sensory cues (acoustic crackles, sight glass foaming, vibration creeps).
4. **Actions Taken (Mandatory):** Specific troubleshooting interventions and maintenance checks performed.
5. **Watch-Points (Mandatory):** Active trends, unresolved diagnostic hypotheses, and priority surveillance thresholds.

#### 🎙️ Tacit Voice Debrief & AI Reasoning Transcriber
* **Audio Handover Player:** 30-second authentic verbal debriefs with live animated equalizer waveforms.
* **Air-Gapped Speech-to-Entity Extraction:** On-premise Whisper NLP extracts equipment tags (`P-101`), acoustic cues, diagnostic checks, and trip limits.
* **Zero-Typing Auto-Structuring:** 1-click auto-population distributes spoken debriefs into the 5 mandatory OISD sections.

#### 🛡️ Active Comprehension Verification Gate (Anti-Rubber-Stamping)
Incoming leads cannot blindly assume control:
* **Anti-Speedrun Dwell Time Guard:** Enforces cognitive review time.
* **Itemized Watch-Point Affirmations:** Mandatory individual check-off of each active operational constraint.
* **Socratic Diagnostic Micro-Probe:** Dynamic question testing the incoming lead's comprehension of Shift A's diagnostic checks.
* **Enterprise Dual-Presence Biometric Camera:** Air-gapped on-premise facial verification matching both Shift A & Shift B against official refinery HR master onboarding records (OISD-166 & IEC 62443 compliant).

---

### Pillar 2: Context & Reasoning via the Experience Graph
Connects physical plant assets to human diagnostic logic into a machine-readable network:
* **Asset & Situation:** Centrifugal Pump P-101 (flow falling while vibration rises).
* **Signals & Sensor Cues:** Gravel acoustic sound + suction pressure oscillation + normal 52°C bearing temp.
* **Competing Hypotheses:** Thermal NPSH Cavitation vs. Mechanical Bearing Wear.
* **Discriminating Checks:** Bearing temp audit (52°C rules out seizure); available NPSH calculation.
* **Verified Decisions:** Restored suction drum level by 1.2m and trimmed discharge flow to Best Efficiency Point (BEP).
* **Tacit Lessons:** *"Do not infer mechanical failure from vibration alone without verifying suction NPSH."*

---

### Pillar 3: Standardized Competency Across Shifts
Closes the performance gap between Shift A, Shift B, and Shift C:
* **Scenario Engine:** Operators practice rare upsets (10× exposure) in a safe simulation sandbox without affecting live production.
* **AI Experience Coach:** Assesses diagnostic reasoning, asking signature Socratic probes like *"What observation would make you change your mind?"*.
* **Multi-Shift Competency Radar:** Benchmarks Shift A vs. Shift B vs. Shift C, exposing night-shift weak signal gaps.
* **Automated 1-Page Mentor Brief:** Equips senior plant superintendents with targeted 15-minute pre-shift coaching packets, eliminating mentor prep time and equalizing crew discipline.

---

## 🔒 Enterprise & Cybersecurity Feasibility (Zero Plant Downtime)

* **Purdue Model Level 3 Overlay:** Operates strictly at Level 3 (Operations Management). Does **not** touch DCS logic or safety instrumented systems (SIS). Zero plant downtime required for deployment.
* **Read-Only Telemetry:** Interfaces via read-only OPC UA / MQTT / OSIsoft PI Historian listeners.
* **Air-Gapped Local Inference:** All speech models (Whisper-edge) and biometric vector matching run on local refinery servers; zero data leaves the plant firewall (OISD-163 / IEC 62443 compliant).
* **High ROI:** A single unpredicted CDU trip or damaged multi-stage pump costs refiners **₹2 to ₹8 Crores ($250k–$1M)** in lost throughput and equipment replacement. ExpertFlow pays for itself if it prevents even a single handover-related trip in a 10-year span.

---

## 🚀 Live Demo & Getting Started

### Run Locally
Simply clone and open `index.html` in any modern web browser:

```bash
git clone https://github.com/Shikhii1456/ExpertFlow.git
cd ExpertFlow
# Open index.html directly in Chrome, Edge, or Firefox
start index.html
```

---

## 👥 Authors & Acknowledgments

* **Lead Developer:** Shikhar Gupta ([@Shikhii1456](https://github.com/Shikhii1456)) • Rajiv Gandhi Institute of Petroleum Technology (RGIPT)
* **Theme:** India Energy Week (IEW) 2027 National Hackathon — Problem Statement 2
