// ==========================================================================
// ExpertFlow | Operational Continuity & Cross-Shift Competency (IEW 2027)
// Full Application Logic, Handover Engine, Experience Graph & Mentoring Loop
// ==========================================================================

// Global State
const appState = {
    xp: 820,
    level: 3,
    activeUnitKey: 'pump',
    vagueModeVisible: false,
    handoverAcknowledged: false,
    selectedGraphNodeId: 1,
    skillsShiftA: [88, 92, 85, 82, 94],
    skillsShiftB: [82, 90, 80, 78, 92],
    skillsShiftC: [64, 74, 62, 58, 70], // Shift C has identified gaps
    competencyLabels: [
        'Structured Diagnosis',
        'Risk Awareness & OISD',
        'Decision Discipline',
        'Weak Signal Identification',
        'Handover Rigor (5-Sec)'
    ]
};

let radarChart = null;
let networkGraph = null;
let currentDemoStep = 0;

// ==========================================================================
// 1. DATA: 5-SECTION HANDOVER REPOSITORY
// ==========================================================================

const HANDOVER_DATA = {
    pump: {
        assetName: "P-101 Heavy Naphtha Centrifugal Booster Pump (Crude Distillation Unit)",
        normal: [
            { label: "Feed Throughput", val: "850 m³/h (100% rated design throughput)" },
            { label: "Discharge Pressure", val: "14.2 kg/cm² steady" },
            { label: "Motor Power & Amps", val: "315 kW • 52 Amperes balanced across 3 phases" },
            { label: "Lube Oil Pressure", val: "2.1 bar @ 44°C (Duplex cooler online)" }
        ],
        deviations: [
            { label: "Cooling Bypass Position", val: "Manual bypass trimmed 5% at 11:30 to counteract pre-heat surge" },
            { label: "Suction Strainer DP", val: "Elevated from 0.15 bar to 0.42 bar across Shift A" },
            { label: "Suction Drum Level", val: "Running at 48% (Target: 60%) due to desalter wash swing" }
        ],
        observations: [
            { label: "Acoustic Signature", val: "Intermittent 'gravel-like' crackle heard near suction nozzle at 13:10" },
            { label: "Casing Vibration", val: "Crept from 2.1 mm/s to 4.6 mm/s (Alarm trigger: 7.0 mm/s)" },
            { label: "Bearing Housing Temp", val: "Normal at 52°C (Rules out immediate mechanical seizure)" }
        ],
        actions: [
            { label: "Discharge Valve Trim", val: "Throttled discharge control valve by 8% to pull pump operating point toward BEP" },
            { label: "NPSH Calculation", val: "Calculated NPSHa: 3.4m vs NPSHr: 3.2m (Critical low margin of 0.2m)" },
            { label: "Lube Oil Sample", val: "Visual inspection: Clear, zero metallic particles or babbitt shavings" }
        ],
        watchpoints: [
            { label: "PRIORITY MONITORING", val: "Suction liquid temperature: If temp exceeds 82°C, NPSH collapses into severe vapor cavitation" },
            { label: "UNRESOLVED HYPOTHESIS", val: "Suction strainer partial blinding vs. thermal vapor bubble formation" },
            { label: "SAFE ESCALATION RULE", val: "If vibration exceeds 6.5 mm/s, commission standby pump P-101B immediately per OISD-119" }
        ],
        graphFocusId: 1
    },
    column: {
        assetName: "C-201 Atmospheric Distillation Column (42 Sieve Trays)",
        normal: [
            { label: "Crude Charge Rate", val: "1,200 m³/h pre-heated to 365°C at flash zone" },
            { label: "Column Top Pressure", val: "1.45 kg/cm² gauge" },
            { label: "Bottom Stripping Steam", val: "4.2 T/h @ 12 bar saturated" },
            { label: "Naphtha Draw Rate", val: "210 m³/h on specification" }
        ],
        deviations: [
            { label: "Top Reflux Flow Override", val: "Controller set to manual 145 m³/h (Normal: 120 m³/h)" },
            { label: "Overhead DP Rate of Rise", val: "DP rose from 240 mmWC to 395 mmWC over last 90 minutes" },
            { label: "Reflux Subcooling", val: "Returning at 42°C (abnormally cold, causing heavy internal condensing)" }
        ],
        observations: [
            { label: "Reflux Accumulator Level", val: "Level fluctuating rapidly (±15% swings on sight glass)" },
            { label: "Middle Section Delta-T", val: "Trays 18-24 temperature drop of 8°C noticed on DCS trend" },
            { label: "Product Spec Smell", val: "Heavy hydrocarbon tail noted in light naphtha sample test at 13:30" }
        ],
        actions: [
            { label: "Reboiler Heat Hold", val: "Refrained from cutting reboiler fuel gas (avoided dumping trays)" },
            { label: "Sample Draw", val: "Sent top naphtha sample for lab ASTM D86 distillation curve audit" },
            { label: "Anti-Foam Readiness", val: "Verified anti-foam chemical injection skid is primed and available" }
        ],
        watchpoints: [
            { label: "HYDRAULIC FLOODING RISK", val: "Monitor column DP: If DP reaches 430 mmWC, upper downcomers will choke" },
            { label: "REFLUX DE-ESCALATION", val: "Incoming lead must trim top reflux flow back toward 125 m³/h in 5 m³/h increments" },
            { label: "OISD-108 LIMIT", val: "If overhead pressure hits 2.8 kg/cm², execute immediate flare diversion" }
        ],
        graphFocusId: 2
    },
    compressor: {
        assetName: "K-301 Two-Stage Centrifugal Wet Gas Compressor (FCC Unit)",
        normal: [
            { label: "Suction Mass Flow", val: "54,000 kg/h wet hydrocarbon gas" },
            { label: "Discharge Pressure", val: "14.8 bar gauge" },
            { label: "Turbine Governor Speed", val: "6,800 RPM (Rated: 7,200 RPM)" },
            { label: "Seal Oil Delta-P", val: "1.4 bar above reference gas chamber" }
        ],
        deviations: [
            { label: "Anti-Surge Recycle Valve", val: "Bias trimmed +8% open to buffer desalter feed fluctuation" },
            { label: "Suction Drum KO Level", val: "Boot level crept to 68% (Automatic drain valve exercised manually)" },
            { label: "Surge Margin Buffer", val: "Currently at 12% (Operating limit: >10%)" }
        ],
        observations: [
            { label: "Discharge Pressure Flutter", val: "±0.3 bar pressure flutter observed on high-speed trend" },
            { label: "Radial Vibration", val: "Drive end vibration: 2.8 mm/s; Non-drive end: 3.2 mm/s (Stable)" },
            { label: "Interstage Cooler Temp", val: "Outlet temperature at 44°C (Normal)" }
        ],
        actions: [
            { label: "Manual KO Boot Drain", val: "Exercised suction drum drain valve to eliminate liquid slugging risk" },
            { label: "Governor Calibration Check", val: "Verified speed transmitter redundancy healthy" },
            { label: "FCC Coordination", val: "Notified FCC board engineer to notify before upstream feed swings" }
        ],
        watchpoints: [
            { label: "SURGE LINE PROXIMITY", val: "Monitor surge margin: If upstream flow drops >10%, step-open recycle loop by +15%" },
            { label: "LIQUID CARRYOVER DANGER", val: "Check KO drum level every 30 minutes to prevent liquid droplets entering impellers" },
            { label: "API 670 TRIP THRESHOLD", val: "3 surge oscillations within 10s trigger automatic shutdown" }
        ],
        graphFocusId: 3
    },
    pipeline: {
        assetName: "PL-400 24-Inch Interstate Crude Supply Pipeline (500 km)",
        normal: [
            { label: "Line Operating Pressure", val: "68 bar (85% of MAOP 80 bar)" },
            { label: "Flow Velocity", val: "1.8 m/s continuous crude transmission" },
            { label: "Cathodic Protection", val: "-0.85 V vs Cu/CuSO4 reference electrode" },
            { label: "Intermediate Station Flow", val: "Balanced across booster stations 1 to 4" }
        ],
        deviations: [
            { label: "Operating Pressure De-rate", val: "De-rated from 74 bar to 68 bar pending anomaly assessment" },
            { label: "Pressure Transmitter 12", val: "Dual sensor averaging active due to 0.4 bar transmitter offset" }
        ],
        observations: [
            { label: "Smart Pig Anomaly Flag", val: "In-line inspection (ILI) report flagged 80% wall loss pit at MP 142.6" },
            { label: "Soil Resistivity Check", val: "External soil survey shows localized disbonded coating zone" }
        ],
        actions: [
            { label: "ASME B31G Assessment", val: "Calculated safe operating pressure: 69.4 bar (Currently operating safely at 68 bar)" },
            { label: "Excavation Notice Issued", val: "Mobilized field NDT crew for Type-B pressure sleeve repair" },
            { label: "Patrol Frequency Boosted", val: "Doubled aerial & foot patrol frequency over Milepost 140-145" }
        ],
        watchpoints: [
            { label: "PRESSURE BOUNDARY", val: "Strictly forbid pressure transient spikes >70 bar during pump startups" },
            { label: "REPAIR EXCAVATION", val: "Incoming shift must receive radio confirmation when hand-digging reaches pipe crown" },
            { label: "OISD-141 COMPLIANCE", val: "Continuous leak detection monitoring active on SCADA console" }
        ],
        graphFocusId: 4
    }
};

// ==========================================================================
// 2. NAVIGATION & TAB SWITCHING
// ==========================================================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            navigateToSection(sectionId);
        });
    });
}

function navigateToSection(sectionId) {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-section') === sectionId);
    });
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });

    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (sectionId === 'graph') {
        setTimeout(initExperienceGraph, 100);
    } else if (sectionId === 'cross-shift') {
        setTimeout(renderCrossShiftRadar, 100);
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<strong>ExpertFlow:</strong> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3600);
}

// ==========================================================================
// 3. PILLAR 1: STRUCTURED EXPERIENCE HANDOVER ENGINE
// ==========================================================================

function initHandoverModule() {
    renderHandoverCanvas(appState.activeUnitKey);
    initOperatorConsole();
    initVoiceDebrief();

    // Preset unit buttons for review canvas
    const btnPump = document.getElementById('btnUnitPump');
    const btnCol = document.getElementById('btnUnitColumn');
    const btnComp = document.getElementById('btnUnitCompressor');
    const btnPipe = document.getElementById('btnUnitPipeline');

    if (btnPump) btnPump.addEventListener('click', () => switchUnitPreset('pump'));
    if (btnCol) btnCol.addEventListener('click', () => switchUnitPreset('column'));
    if (btnComp) btnComp.addEventListener('click', () => switchUnitPreset('compressor'));
    if (btnPipe) btnPipe.addEventListener('click', () => switchUnitPreset('pipeline'));

    // Toggle Vague Log Comparison
    const btnToggleLog = document.getElementById('btnToggleLogMode');
    if (btnToggleLog) {
        btnToggleLog.addEventListener('click', () => {
            appState.vagueModeVisible = !appState.vagueModeVisible;
            const comp = document.getElementById('vagueLogComparison');
            if (comp) comp.style.display = appState.vagueModeVisible ? 'grid' : 'none';
            btnToggleLog.classList.toggle('btn-accent', appState.vagueModeVisible);
        });
    }

    // Intercept Handover Sign-off with Active Comprehension Gate
    const btnAck = document.getElementById('btnAcknowledgeHandover');
    if (btnAck) {
        btnAck.addEventListener('click', () => {
            openComprehensionGateModal(false);
        });
    }

    // Test Blind Sign-off Button (Demonstrates the Interceptor)
    const btnTestBlind = document.getElementById('btnTestBlindSignOff');
    if (btnTestBlind) {
        btnTestBlind.addEventListener('click', () => {
            openComprehensionGateModal(true);
        });
    }

    // Trace Reasoning in Graph button
    const btnTrace = document.getElementById('btnTraceReasoningFromHandover');
    if (btnTrace) {
        btnTrace.addEventListener('click', () => {
            navigateToSection('graph');
            highlightGraphAsset(HANDOVER_DATA[appState.activeUnitKey].graphFocusId);
        });
    }

    initComprehensionGate();
}

// ==========================================================================
// 3.1 SHIFT A OPERATOR CONSOLE INTERACTIVE WORKSPACE
// ==========================================================================

function initOperatorConsole() {
    const btnConsoleTab = document.getElementById('btnModeOperatorConsole');
    const btnReviewTab = document.getElementById('btnModeReviewCanvas');
    const consoleCard = document.getElementById('operatorConsoleCard');
    const canvasCard = document.querySelector('.handover-canvas-card');
    const reviewUnitBar = document.getElementById('reviewUnitBar');
    const unitSelect = document.getElementById('operatorTargetAssetSelect');

    // Tab mode switching
    if (btnConsoleTab && btnReviewTab) {
        btnConsoleTab.addEventListener('click', () => {
            btnConsoleTab.classList.add('active');
            btnReviewTab.classList.remove('active');
            if (consoleCard) consoleCard.style.display = 'block';
            if (reviewUnitBar) reviewUnitBar.style.display = 'none';
        });

        btnReviewTab.addEventListener('click', () => {
            btnReviewTab.classList.add('active');
            btnConsoleTab.classList.remove('active');
            if (consoleCard) consoleCard.style.display = 'none';
            if (reviewUnitBar) reviewUnitBar.style.display = 'flex';
        });
    }

    // Target Asset change in operator console
    if (unitSelect) {
        unitSelect.addEventListener('change', e => {
            appState.activeUnitKey = e.target.value;
            loadOperatorFormFromPreset(appState.activeUnitKey);
        });
    }

    // Quick Action: Fill Verified Draft
    const btnVerified = document.getElementById('btnFillVerifiedSample');
    if (btnVerified) {
        btnVerified.addEventListener('click', () => {
            loadOperatorFormFromPreset(appState.activeUnitKey);
            showToast('Loaded verified operational draft with all 5 mandatory sections compliant.', 'info');
        });
    }

    // Quick Action: Simulate Vague "Unit Normal" Entry (Test Rejection)
    const btnVague = document.getElementById('btnFillVagueSample');
    if (btnVague) {
        btnVague.addEventListener('click', () => {
            fillVagueTestSample();
        });
    }

    // Reset Form
    const btnReset = document.getElementById('btnResetOperatorForm');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            clearOperatorForm();
            showToast('Operator form cleared. Please fill all 5 mandatory sections.', 'info');
        });
    }

    // Real-time Textarea Listeners for Live Audit
    ['inputNormalState', 'inputDeviations', 'inputObservations', 'inputActions', 'inputWatchpoints'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => auditOperatorFormLive());
        }
    });

    // Form Submission
    const btnSubmit = document.getElementById('btnSubmitOperatorHandover');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', () => {
            handleOperatorHandoverSubmission();
        });
    }

    // Initialize with current unit draft
    loadOperatorFormFromPreset(appState.activeUnitKey);
}

function loadOperatorFormFromPreset(key) {
    const data = HANDOVER_DATA[key];
    if (!data) return;

    const normText = data.normal.map(i => `${i.label}: ${i.val}`).join('\n');
    const devText = data.deviations.map(i => `${i.label}: ${i.val}`).join('\n');
    const obsText = data.observations.map(i => `${i.label}: ${i.val}`).join('\n');
    const actText = data.actions.map(i => `${i.label}: ${i.val}`).join('\n');
    const watText = data.watchpoints.map(i => `[${i.label}] ${i.val}`).join('\n');

    const elNorm = document.getElementById('inputNormalState');
    const elDev = document.getElementById('inputDeviations');
    const elObs = document.getElementById('inputObservations');
    const elAct = document.getElementById('inputActions');
    const elWat = document.getElementById('inputWatchpoints');

    if (elNorm) elNorm.value = normText;
    if (elDev) elDev.value = devText;
    if (elObs) elObs.value = obsText;
    if (elAct) elAct.value = actText;
    if (elWat) elWat.value = watText;

    const unitSelect = document.getElementById('operatorTargetAssetSelect');
    if (unitSelect && unitSelect.value !== key) unitSelect.value = key;

    auditOperatorFormLive();
}

function fillVagueTestSample() {
    document.getElementById('inputNormalState').value = "Unit normal. Feed running on target. Nothing unusual.";
    document.getElementById('inputDeviations').value = "None.";
    document.getElementById('inputObservations').value = "All parameters ok. Routine shift.";
    document.getElementById('inputActions').value = "No actions taken.";
    document.getElementById('inputWatchpoints').value = "Keep monitoring.";

    auditOperatorFormLive();
    showToast('Simulated vague "Unit Normal" entry. Notice how the AI Auditor blocks submission!', 'warning');
}

function clearOperatorForm() {
    ['inputNormalState', 'inputDeviations', 'inputObservations', 'inputActions', 'inputWatchpoints'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    auditOperatorFormLive();
}

function auditOperatorFormLive() {
    const norm = document.getElementById('inputNormalState')?.value.trim() || '';
    const dev = document.getElementById('inputDeviations')?.value.trim() || '';
    const obs = document.getElementById('inputObservations')?.value.trim() || '';
    const act = document.getElementById('inputActions')?.value.trim() || '';
    const wat = document.getElementById('inputWatchpoints')?.value.trim() || '';

    const vagueTerms = ['unit normal', 'all ok', 'all normal', 'nothing unusual', 'routine shift', 'keep monitoring', 'none.'];
    let hasVague = false;

    // Check individual fields
    const checkField = (val, fbId) => {
        const fb = document.getElementById(fbId);
        if (!val) {
            if (fb) { fb.className = 'field-feedback err'; fb.innerText = '❌ Mandatory field cannot be left blank.'; }
            return false;
        }
        const isVague = vagueTerms.some(term => val.toLowerCase() === term || (val.length < 35 && val.toLowerCase().includes(term)));
        if (isVague) {
            hasVague = true;
            if (fb) { fb.className = 'field-feedback err'; fb.innerText = '⚠️ OISD Audit Alert: Vague entry rejected! Must detail specific parameters & signals.'; }
            return false;
        }
        if (val.length < 25) {
            if (fb) { fb.className = 'field-feedback err'; fb.innerText = '⚠️ Entry too brief. Provide technical numbers and equipment context.'; }
            return false;
        }
        if (fb) { fb.className = 'field-feedback ok'; fb.innerText = '✓ Verified substantive operational input.'; }
        return true;
    };

    const ok1 = checkField(norm, 'feedbackNormalState');
    const ok2 = checkField(dev, 'feedbackDeviations');
    const ok3 = checkField(obs, 'feedbackObservations');
    const ok4 = checkField(act, 'feedbackActions');
    const ok5 = checkField(wat, 'feedbackWatchpoints');

    const allValid = ok1 && ok2 && ok3 && ok4 && ok5;

    const banner = document.getElementById('auditLiveBanner');
    const title = document.getElementById('auditBannerTitle');
    const sub = document.getElementById('auditBannerSub');
    const pill = document.getElementById('auditScorePill');

    if (hasVague) {
        if (banner) banner.className = 'audit-live-banner vague-alert';
        if (title) title.innerText = '🚨 AI Anti-"Unit Normal" Audit FAILED: Vague Log Detected';
        if (sub) sub.innerText = 'OISD-166 & ExpertFlow rule violation: Outgoing shifts cannot submit entries like "Unit normal" or "All ok". Explicit baseline parameters, weak sensory signals, and watch-points are mandatory.';
        if (pill) { pill.className = 'audit-score-pill danger-score'; pill.innerText = 'Audit: REJECTED'; }
    } else if (!allValid) {
        if (banner) banner.className = 'audit-live-banner';
        if (title) title.innerText = 'AI Handover Auditor: Incomplete Mandatory Fields';
        if (sub) sub.innerText = 'All 5 sections are legally mandatory. Please complete all fields with numerical baselines and operational rationale.';
        if (pill) { pill.className = 'audit-score-pill danger-score'; pill.innerText = 'Incomplete'; }
    } else {
        if (banner) banner.className = 'audit-live-banner';
        if (title) title.innerText = '✓ AI Handover Integrity Auditor: PASSED (OISD-166 & PSM Compliant)';
        if (sub) sub.innerText = 'All 5 sections contain verified numerical baselines, weak sensory signals, and actionable watch-points. Ready for Shift A signature.';
        if (pill) { pill.className = 'audit-score-pill'; pill.innerText = 'Compliance: 100%'; }
    }

    return allValid;
}

function handleOperatorHandoverSubmission() {
    const isValid = auditOperatorFormLive();
    if (!isValid) {
        showToast('Submission Blocked! You must resolve the AI audit warnings in the 5 mandatory sections.', 'danger');
        return;
    }

    const key = document.getElementById('operatorTargetAssetSelect')?.value || appState.activeUnitKey;
    const norm = document.getElementById('inputNormalState').value.trim();
    const dev = document.getElementById('inputDeviations').value.trim();
    const obs = document.getElementById('inputObservations').value.trim();
    const act = document.getElementById('inputActions').value.trim();
    const wat = document.getElementById('inputWatchpoints').value.trim();

    // Parse and package into HANDOVER_DATA
    const parseLines = (text) => text.split('\n').filter(l => l.trim()).map(l => {
        const parts = l.split(':');
        if (parts.length > 1) {
            return { label: parts[0].replace(/[\[\]]/g, '').trim(), val: parts.slice(1).join(':').trim() };
        }
        return { label: 'Operational Detail', val: l.trim() };
    });

    HANDOVER_DATA[key].normal = parseLines(norm);
    HANDOVER_DATA[key].deviations = parseLines(dev);
    HANDOVER_DATA[key].observations = parseLines(obs);
    HANDOVER_DATA[key].actions = parseLines(act);
    HANDOVER_DATA[key].watchpoints = parseLines(wat);

    // Update canvas display
    renderHandoverCanvas(key);

    // Update audit status badge
    const auditStatus = document.getElementById('handoverAuditStatus');
    if (auditStatus) {
        auditStatus.className = 'badge-status-validated';
        auditStatus.innerHTML = '<i class="fas fa-check-double text-success"></i> Signed by Shift A (R. Verma) • Passed 5-Section Audit';
    }

    // Switch to review tab
    document.getElementById('btnModeReviewCanvas')?.click();

    appState.xp += 100;
    showToast('Shift A Handover Log signed, audited, and published! Shift B can now review and acknowledge.', 'success');
}

function switchUnitPreset(key) {
    appState.activeUnitKey = key;
    document.querySelectorAll('#reviewUnitBar .btn-chip').forEach(c => c.classList.remove('active'));
    if (key === 'pump') document.getElementById('btnUnitPump')?.classList.add('active');
    if (key === 'column') document.getElementById('btnUnitColumn')?.classList.add('active');
    if (key === 'compressor') document.getElementById('btnUnitCompressor')?.classList.add('active');
    if (key === 'pipeline') document.getElementById('btnUnitPipeline')?.classList.add('active');

    renderHandoverCanvas(key);
    updateVoiceDebriefForUnit(key);
}

function renderHandoverCanvas(key) {
    const data = HANDOVER_DATA[key];
    const assetEl = document.getElementById('handoverTargetAsset');
    if (assetEl) assetEl.innerText = `Asset: ${data.assetName}`;

    // Render Normal
    const normEl = document.getElementById('secContentNormal');
    if (normEl) {
        normEl.innerHTML = data.normal.map(item => `
            <div class="sec-item">
                <div class="sec-item-label">${item.label}</div>
                <div class="sec-item-val">${item.val}</div>
            </div>
        `).join('');
    }

    // Render Deviations
    const devEl = document.getElementById('secContentDeviations');
    if (devEl) {
        devEl.innerHTML = data.deviations.map(item => `
            <div class="sec-item">
                <div class="sec-item-label">${item.label}</div>
                <div class="sec-item-val">${item.val}</div>
            </div>
        `).join('');
    }

    // Render Observations
    const obsEl = document.getElementById('secContentObservations');
    if (obsEl) {
        obsEl.innerHTML = data.observations.map(item => `
            <div class="sec-item">
                <div class="sec-item-label">${item.label}</div>
                <div class="sec-item-val">${item.val}</div>
            </div>
        `).join('');
    }

    // Render Actions
    const actEl = document.getElementById('secContentActions');
    if (actEl) {
        actEl.innerHTML = data.actions.map(item => `
            <div class="sec-item">
                <div class="sec-item-label">${item.label}</div>
                <div class="sec-item-val">${item.val}</div>
            </div>
        `).join('');
    }

    // Render Watchpoints
    const watEl = document.getElementById('secContentWatchpoints');
    if (watEl) {
        watEl.innerHTML = data.watchpoints.map(item => `
            <div class="sec-item">
                <span class="watchpoint-badge">${item.label}</span>
                <div class="sec-item-val">${item.val}</div>
            </div>
        `).join('');
    }
}

// ==========================================================================
// 3.15 TACIT VOICE DEBRIEF & AI REASONING TRANSCRIBER ENGINE
// ==========================================================================

const VOICE_DEBRIEFS = {
    pump: {
        durationSec: 28,
        durationStr: "00:28",
        transcript: "Kunal, quick briefing on P-101. Around 11:30 we noticed a slight gravel crackle at the suction nozzle and casing vibration rose to 4.6 mm/s. Don't panic and pull the pump—we checked bearing housing temp and it's completely normal at 52°C. It's thermal vapor cavitation because the suction liquid ran about 4°C hot today. We boosted upstream suction drum level by 1.2 meters and throttled discharge by 8%. Watch-point: keep suction liquid temperature strictly below 82°C. If vibration crosses 6.5 mm/s, commission standby pump P-101B immediately.",
        entities: [
            { cls: "pill-asset", icon: "fa-industry", text: "Asset: P-101 Centrifugal Pump" },
            { cls: "pill-cue", icon: "fa-ear-listen", text: "Acoustic Cue: Gravel Crackle at Suction" },
            { cls: "pill-param", icon: "fa-wave-square", text: "Sensor: 4.6 mm/s Vibration (Warning)" },
            { cls: "pill-check", icon: "fa-stethoscope", text: "Check: 52°C Bearing Housing (Rules out seizure)" },
            { cls: "pill-hypo", icon: "fa-code-branch", text: "Diagnosis: Thermal NPSH Vapor Cavitation" },
            { cls: "pill-boundary", icon: "fa-triangle-exclamation", text: "Limit: Temp < 82°C | Trip Cutover > 6.5 mm/s" }
        ],
        structured: {
            normal: "Throughput: 420 m³/h\nDischarge Pressure: 18.2 kg/cm²\nSuction Pressure: 2.4 kg/cm²\nMotor Current: 142 A (Within full-load 160A)",
            deviations: "Suction liquid temperature running +4°C above baseline (78°C vs 74°C normal)\nDischarge valve throttled by 8% to restore BEP operating point",
            observations: "Field operator reported subtle gravel-like acoustic crackle near suction eye\nCasing vibration rose from 2.1 mm/s to 4.6 mm/s at 11:30 hrs\nBearing housing temperature stable at 52°C (well below 75°C alarm threshold)",
            actions: "Audited bearing housing temp with IR gun (52°C confirmed)\nRaised upstream suction drum liquid level by +1.2m to increase static NPSH available\nPostponed mechanical bearing overhaul based on normal bearing temperature",
            watchpoints: "[NPSH Vapor Pressure Boundary] Monitor suction liquid temp; must not exceed 82°C\n[Active Surveillance] Verify if suction strainer DP climbs > 0.6 bar\n[OISD-119 Escalation Limit] If vibration exceeds 6.5 mm/s, commission standby pump P-101B"
        }
    },
    column: {
        durationSec: 26,
        durationStr: "00:26",
        transcript: "Shift B team, heads up on Atmospheric Column C-201. Top differential pressure crept up to 395 mmWC after the 10:00 crude switch. Do not cut reboiler firing—the reflux was subcooled at 42°C, causing downcomer hydraulic choking, not reboiler foaming. We trimmed top reflux flow smoothly from 145 down to 125 m³/h. Watch-point: watch top DP closely; if it touches 430 mmWC, cut reflux by another 5 m³/h. If column overhead hits 2.8 kg/cm², execute immediate flare diversion.",
        entities: [
            { cls: "pill-asset", icon: "fa-industry", text: "Asset: C-201 Atmospheric Distillation" },
            { cls: "pill-cue", icon: "fa-wave-square", text: "Signal: Overhead DP Spike (395 mmWC)" },
            { cls: "pill-param", icon: "fa-temperature-low", text: "Sensor: Reflux Subcooled at 42°C" },
            { cls: "pill-check", icon: "fa-stethoscope", text: "Check: Tray Temp Profile Stable (Rules out Foaming)" },
            { cls: "pill-hypo", icon: "fa-code-branch", text: "Diagnosis: Downcomer Hydraulic Jet Flooding" },
            { cls: "pill-boundary", icon: "fa-triangle-exclamation", text: "Limit: DP < 430 mmWC | Flare Safety 2.8 kg/cm²" }
        ],
        structured: {
            normal: "Crude Feed Rate: 850 m³/h\nTop Column Pressure: 1.45 kg/cm²\nOverhead Vapor Temp: 112°C\nBottom Stripper Level: 58%",
            deviations: "Top differential pressure spiked from 240 mmWC to 395 mmWC\nTop reflux trimmed from 145 m³/h to 125 m³/h",
            observations: "Internal reflux ratio calculated at 3.2 vs 2.4 target\nSubcooled reflux at 42°C caused local vapor condensation on Tray 3-6\nNaphtha 95% boiling point endpoint spiked by +6°C",
            actions: "Gradually stepped down cold reflux pump flow by -20 m³/h\nMaintained steady furnace reboiler fuel firing to avoid liquid dumping into boot\nCoordinated with crude tank farm to stabilize feed gravity",
            watchpoints: "[Hydraulic Choke Threshold] Keep top DP strictly under 430 mmWC\n[Reflux De-escalation] Trim reflux flow toward 125 m³/h in 5 m³/h increments\n[OISD-108 Safety Limit] If column pressure reaches 2.8 kg/cm², execute flare diversion"
        }
    },
    compressor: {
        durationSec: 25,
        durationStr: "00:25",
        transcript: "Control lead, note on Wet Gas Compressor K-301. Suction mass flow dipped by 22% when upstream FCC cat-cracker swung feed. Anti-surge margin collapsed to 12%. We immediately step-opened the anti-surge hot gas bypass valve by 15% and trimmed turbine speed. Whatever you do, do not trip the machine—forward flow is now stable. Watch-point: keep surge margin above 15% and inspect the suction knockout drum boot level every 30 minutes for liquid carryover.",
        entities: [
            { cls: "pill-asset", icon: "fa-industry", text: "Asset: K-301 Wet Gas Compressor" },
            { cls: "pill-cue", icon: "fa-gauge-high", text: "Signal: Anti-Surge Margin Collapsed to 12%" },
            { cls: "pill-param", icon: "fa-wind", text: "Sensor: Suction Mass Flow Dropped -22%" },
            { cls: "pill-check", icon: "fa-stethoscope", text: "Check: Shaft Vibration Stable at 28 µm" },
            { cls: "pill-hypo", icon: "fa-code-branch", text: "Diagnosis: Impending Surge from Feed Starvation" },
            { cls: "pill-boundary", icon: "fa-triangle-exclamation", text: "Limit: Margin > 15% | API 670 3-Surge Trip" }
        ],
        structured: {
            normal: "Discharge Pressure: 14.8 kg/cm²\nTurbine Speed: 8,420 RPM\nSuction KO drum Level: 28%\nLube Oil Header Pressure: 3.2 kg/cm²",
            deviations: "Anti-surge hot gas recycle valve biased open by +15%\nTurbine governor speed trimmed to 8,150 RPM",
            observations: "Upstream FCC feed swing caused rapid -22% suction mass flow drop\nAnti-surge operating point drifted toward surge control line (margin: 12%)\nShaft radial vibration steady at 28 µm (normal)",
            actions: "Manual step-increase of anti-surge recycle valve by +15%\nBalanced turbine extraction steam to maintain smooth mass throughput\nVerified seal gas differential pressure at 1.8 bar",
            watchpoints: "[Surge Margin Proximity] Maintain anti-surge margin strictly above 15%\n[Liquid Slug Hazard] Drain suction KO drum boot every 30 minutes\n[API 670 Automatic Trip] 3 rapid surge oscillations within 10s trigger automatic shutdown"
        }
    },
    pipeline: {
        durationSec: 27,
        durationStr: "00:27",
        transcript: "Pipeline dispatch, briefing on Crude Trunkline PL-400. Intelligent pigging inline inspection flagged an immediate 80% wall loss anomaly—a 9.6mm external corrosion pit at kilometer 142. Based on ASME B31G calculations, we de-rated line operating pressure to 68 bar so throughput can continue safely until the sleeve repair crew arrives. Watch-point: strictly forbid pressure surges above 70 bar during booster pump starts, and maintain SCADA leak detection monitoring active.",
        entities: [
            { cls: "pill-asset", icon: "fa-industry", text: "Asset: PL-400 24-Inch Crude Trunkline" },
            { cls: "pill-cue", icon: "fa-magnifying-glass-chart", text: "Signal: Smart Pig ILI Anomaly (80% Wall Loss)" },
            { cls: "pill-param", icon: "fa-gauge-simple-high", text: "Sensor: Operating Pressure De-rated to 68 bar" },
            { cls: "pill-check", icon: "fa-stethoscope", text: "Check: ASME B31G Safe Operating Pressure Validated" },
            { cls: "pill-hypo", icon: "fa-code-branch", text: "Diagnosis: External Coating Disbondment & Pit" },
            { cls: "pill-boundary", icon: "fa-triangle-exclamation", text: "Limit: Pressure < 70 bar | OISD-141 Surveillance" }
        ],
        structured: {
            normal: "Line Flow Rate: 1,850 m³/h\nInlet Header Pressure: 68 bar (De-rated from 78 bar)\nCathodic Protection Potential: -1.05 V vs CSE\nProduct Temperature: 32°C",
            deviations: "Operating pressure derated by 10 bar per ASME B31G calculation\nBooster pump P-401 speed clamped to 85% maximum",
            observations: "MFL Smart Pig log identified 9.6mm pit depth on 12mm nominal wall at KM 142.4\nSoil resistivity test indicates external coating holiday\nNo active crude leak detected via computational mass balance",
            actions: "Reduced dispatch pumping discharge pressure to 68 bar\nDispatched emergency pipeline excavation and NDT inspection team\nMobilized Type-B full-encirclement steel repair sleeve to site",
            watchpoints: "[Pressure Transient Limit] Forbid pressure transient spikes >70 bar during pump starts\n[NDT Team Protocol] Radio confirmation required when hand excavation reaches pipe crown\n[OISD-141 SCADA Surveillance] Maintain real-time CPM leak detection sensitivity on high alert"
        }
    }
};

let voiceState = {
    isPlaying: false,
    isRecording: false,
    speed: 1.0,
    timerInterval: null,
    currentSec: 0,
    utterance: null,
    recognition: null
};

function initVoiceDebrief() {
    const btnPlay = document.getElementById('btnPlayVoiceDebrief');
    const btnStop = document.getElementById('btnStopVoiceDebrief');
    const btnRecord = document.getElementById('btnRecordLiveVoice');
    const btnApply = document.getElementById('btnApplyVoiceToHandover');

    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            if (voiceState.isPlaying) {
                pauseVoiceDebrief();
            } else {
                playVoiceDebrief();
            }
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            stopVoiceDebrief();
        });
    }

    // Speed toggle buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            voiceState.speed = parseFloat(e.target.getAttribute('data-speed')) || 1.0;
            if (voiceState.isPlaying) {
                stopVoiceDebrief();
                playVoiceDebrief();
            }
        });
    });

    if (btnRecord) {
        btnRecord.addEventListener('click', () => {
            toggleLiveVoiceRecording();
        });
    }

    if (btnApply) {
        btnApply.addEventListener('click', () => {
            applyVoiceToHandoverSections();
        });
    }

    updateVoiceDebriefForUnit(appState.activeUnitKey);
}

function updateVoiceDebriefForUnit(unitKey) {
    stopVoiceDebrief();
    const data = VOICE_DEBRIEFS[unitKey] || VOICE_DEBRIEFS.pump;

    const transcriptEl = document.getElementById('voiceTranscriptText');
    if (transcriptEl) transcriptEl.innerText = `"${data.transcript}"`;

    const totalTimeEl = document.getElementById('voiceTotalTime');
    if (totalTimeEl) totalTimeEl.innerText = data.durationStr;

    const currTimeEl = document.getElementById('voiceCurrentTime');
    if (currTimeEl) currTimeEl.innerText = "00:00";

    const statusPill = document.getElementById('voiceStatusPill');
    if (statusPill) statusPill.innerHTML = `<i class="fas fa-volume-high text-success"></i> Audio Ready (${data.durationStr})`;

    const pillsContainer = document.getElementById('voiceEntityPills');
    if (pillsContainer) {
        pillsContainer.innerHTML = data.entities.map(e => `
            <span class="entity-pill ${e.cls}"><i class="fas ${e.icon}"></i> ${e.text}</span>
        `).join('');
    }
}

function playVoiceDebrief() {
    const unitKey = appState.activeUnitKey;
    const data = VOICE_DEBRIEFS[unitKey] || VOICE_DEBRIEFS.pump;

    voiceState.isPlaying = true;
    voiceState.currentSec = 0;

    const btnPlay = document.getElementById('btnPlayVoiceDebrief');
    const btnStop = document.getElementById('btnStopVoiceDebrief');
    const playIcon = document.getElementById('voicePlayIcon');
    const playText = document.getElementById('voicePlayText');
    const waveform = document.getElementById('audioWaveform');
    const currTimeEl = document.getElementById('voiceCurrentTime');

    if (btnPlay) btnPlay.classList.add('playing');
    if (playIcon) playIcon.className = 'fas fa-pause';
    if (playText) playText.innerText = 'Pause Verbal Debrief';
    if (btnStop) btnStop.style.display = 'inline-flex';
    if (waveform) waveform.classList.add('active');

    // Speech Synthesis
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(data.transcript);
        utter.rate = voiceState.speed;
        utter.pitch = 0.95;

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('George') || v.name.includes('Natural') || v.name.includes('Male')));
        if (preferred) utter.voice = preferred;

        utter.onend = () => {
            stopVoiceDebrief();
        };
        utter.onerror = () => {
            stopVoiceDebrief();
        };

        voiceState.utterance = utter;
        window.speechSynthesis.speak(utter);
    }

    // Timer simulation
    clearInterval(voiceState.timerInterval);
    const totalDuration = data.durationSec / voiceState.speed;
    voiceState.timerInterval = setInterval(() => {
        voiceState.currentSec += 1;
        const curM = String(Math.floor(voiceState.currentSec / 60)).padStart(2, '0');
        const curS = String(voiceState.currentSec % 60).padStart(2, '0');
        if (currTimeEl) currTimeEl.innerText = `${curM}:${curS}`;

        if (voiceState.currentSec >= totalDuration) {
            stopVoiceDebrief();
        }
    }, 1000);
}

function pauseVoiceDebrief() {
    voiceState.isPlaying = false;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    clearInterval(voiceState.timerInterval);

    const btnPlay = document.getElementById('btnPlayVoiceDebrief');
    const playIcon = document.getElementById('voicePlayIcon');
    const playText = document.getElementById('voicePlayText');
    const waveform = document.getElementById('audioWaveform');

    if (btnPlay) btnPlay.classList.remove('playing');
    if (playIcon) playIcon.className = 'fas fa-play';
    if (playText) playText.innerText = 'Resume Verbal Debrief';
    if (waveform) waveform.classList.remove('active');
}

function stopVoiceDebrief() {
    voiceState.isPlaying = false;
    voiceState.currentSec = 0;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    clearInterval(voiceState.timerInterval);

    const btnPlay = document.getElementById('btnPlayVoiceDebrief');
    const btnStop = document.getElementById('btnStopVoiceDebrief');
    const playIcon = document.getElementById('voicePlayIcon');
    const playText = document.getElementById('voicePlayText');
    const waveform = document.getElementById('audioWaveform');
    const currTimeEl = document.getElementById('voiceCurrentTime');

    if (btnPlay) btnPlay.classList.remove('playing');
    if (playIcon) playIcon.className = 'fas fa-play';
    if (playText) playText.innerText = 'Play Verbal Debrief';
    if (btnStop) btnStop.style.display = 'none';
    if (waveform) waveform.classList.remove('active');
    if (currTimeEl) currTimeEl.innerText = '00:00';
}

function toggleLiveVoiceRecording() {
    const btnRecord = document.getElementById('btnRecordLiveVoice');
    const recordLabel = document.getElementById('recordBtnLabel');
    const transcriptEl = document.getElementById('voiceTranscriptText');

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!voiceState.isRecording) {
        if (SpeechRec) {
            try {
                const rec = new SpeechRec();
                rec.continuous = true;
                rec.interimResults = true;
                rec.lang = 'en-US';

                rec.onstart = () => {
                    voiceState.isRecording = true;
                    if (btnRecord) btnRecord.classList.add('recording');
                    if (recordLabel) recordLabel.innerText = 'Listening... (Speak Now)';
                    if (transcriptEl) transcriptEl.innerText = 'Listening to live microphone audio...';
                    showToast('Microphone active! Speak your operational shift debrief.', 'info');
                };

                rec.onresult = (event) => {
                    let liveText = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        liveText += event.results[i][0].transcript;
                    }
                    if (transcriptEl && liveText) {
                        transcriptEl.innerText = `"${liveText}"`;
                    }
                };

                rec.onerror = (err) => {
                    console.warn('Speech recognition error:', err);
                    stopLiveVoiceRecording();
                    showToast('Microphone recognition finished or permission denied.', 'warning');
                };

                rec.onend = () => {
                    stopLiveVoiceRecording();
                };

                voiceState.recognition = rec;
                rec.start();
            } catch (e) {
                fallbackSimulateRecording();
            }
        } else {
            fallbackSimulateRecording();
        }
    } else {
        stopLiveVoiceRecording();
    }
}

function stopLiveVoiceRecording() {
    voiceState.isRecording = false;
    if (voiceState.recognition) {
        try { voiceState.recognition.stop(); } catch (e) {}
        voiceState.recognition = null;
    }
    const btnRecord = document.getElementById('btnRecordLiveVoice');
    const recordLabel = document.getElementById('recordBtnLabel');
    if (btnRecord) btnRecord.classList.remove('recording');
    if (recordLabel) recordLabel.innerText = 'Record Live Voice';
    showToast('Live voice recording completed. AI NLP entity parsing active.', 'success');
}

function fallbackSimulateRecording() {
    voiceState.isRecording = true;
    const btnRecord = document.getElementById('btnRecordLiveVoice');
    const recordLabel = document.getElementById('recordBtnLabel');
    const transcriptEl = document.getElementById('voiceTranscriptText');

    if (btnRecord) btnRecord.classList.add('recording');
    if (recordLabel) recordLabel.innerText = 'Simulating Capture... (3s)';
    showToast('Simulating live speech capture: "P-101 running steady, slight gravel vibration at suction..."', 'info');

    setTimeout(() => {
        stopLiveVoiceRecording();
        if (transcriptEl) {
            transcriptEl.innerText = '"Live Spoken Memo: Observed 4.6 mm/s vibration on P-101. Verified bearing temperature at 52°C. Raised drum head level to stop cavitation. Keep suction temp under 82°C."';
        }
    }, 3200);
}

function applyVoiceToHandoverSections() {
    const key = appState.activeUnitKey;
    const data = VOICE_DEBRIEFS[key] || VOICE_DEBRIEFS.pump;

    // Load structured data into operator form
    const elNorm = document.getElementById('inputNormalState');
    const elDev = document.getElementById('inputDeviations');
    const elObs = document.getElementById('inputObservations');
    const elAct = document.getElementById('inputActions');
    const elWat = document.getElementById('inputWatchpoints');

    if (elNorm) elNorm.value = data.structured.normal;
    if (elDev) elDev.value = data.structured.deviations;
    if (elObs) elObs.value = data.structured.observations;
    if (elAct) elAct.value = data.structured.actions;
    if (elWat) elWat.value = data.structured.watchpoints;

    // Also update HANDOVER_DATA
    const parseLines = (text) => text.split('\n').filter(l => l.trim()).map(l => {
        const parts = l.split(':');
        if (parts.length > 1) {
            return { label: parts[0].replace(/[\[\]]/g, '').trim(), val: parts.slice(1).join(':').trim() };
        }
        return { label: 'Operational Detail', val: l.trim() };
    });

    HANDOVER_DATA[key].normal = parseLines(data.structured.normal);
    HANDOVER_DATA[key].deviations = parseLines(data.structured.deviations);
    HANDOVER_DATA[key].observations = parseLines(data.structured.observations);
    HANDOVER_DATA[key].actions = parseLines(data.structured.actions);
    HANDOVER_DATA[key].watchpoints = parseLines(data.structured.watchpoints);

    renderHandoverCanvas(key);
    auditOperatorFormLive();

    appState.xp += 100;
    showToast('🎙️ AI Speech-to-Structure Engine: Successfully mapped verbal debrief into 5 OISD-compliant sections with zero typing!', 'success');
}

// ==========================================================================
// 3.2 ACTIVE COMPREHENSION VERIFICATION GATE (ANTI-RUBBER-STAMPING ENGINE)
// ==========================================================================

let comprehensionState = {
    quizAnsweredCorrectly: false,
    watchpointsConfirmed: false
};

const COMPREHENSION_QUIZZES = {
    pump: {
        question: "Diagnostic Check: Shift A logged that pump P-101 exhibited a gravel-like crackle and vibration rose to 4.6 mm/s. Why did Shift A postpone pulling the pump for a mechanical bearing overhaul?",
        options: [
            { text: "Bearing housing temperature was normal at 52°C (well below 75°C failure limit), proving it was thermal vapor cavitation, not bearing seizure.", correct: true },
            { text: "Standby pump P-101B was dismantled for annual overhaul.", correct: false },
            { text: "The shift engineer forgot to inform maintenance.", correct: false }
        ],
        watchpoints: [
            "NPSH Vapor Pressure: Suction liquid temp (+4°C elevated) must strictly stay below 82°C.",
            "Active Unresolved Hypothesis: Suction strainer partial blinding vs. thermal vapor bubble formation.",
            "OISD-119 Escalation Limit: If vibration exceeds 6.5 mm/s, commission standby pump P-101B immediately."
        ]
    },
    column: {
        question: "Diagnostic Check: Column C-201 top differential pressure (DP) spiked to 395 mmWC. Why did Shift A refrain from cutting reboiler furnace heat duty?",
        options: [
            { text: "Cutting reboiler heat during foaming/flooding can dump 40 trays of liquid hydrocarbon into the column bottom boot.", correct: true },
            { text: "The furnace fuel gas control valve was stuck at 100% open.", correct: false },
            { text: "DCS reboiler temperature sensor was out of calibration.", correct: false }
        ],
        watchpoints: [
            "Hydraulic Choke: Monitor overhead DP; if DP reaches 430 mmWC, downcomers will flood.",
            "Reflux De-escalation: Incoming lead must trim reflux flow toward 125 m³/h in 5 m³/h increments.",
            "OISD-108 Safety Boundary: If column pressure hits 2.8 kg/cm², execute immediate flare diversion."
        ]
    },
    compressor: {
        question: "Diagnostic Check: On compressor K-301, anti-surge margin dropped to 12%. What is the correct response before tripping?",
        options: [
            { text: "Step-open anti-surge hot gas recycle loop by +15% and trim turbine speed smoothly to sustain forward mass flow.", correct: true },
            { text: "Immediately hit manual emergency trip push button to shut down entire FCC.", correct: false },
            { text: "Block compressor discharge isolation valve.", correct: false }
        ],
        watchpoints: [
            "Surge Margin Proximity: If feed flow drops >10%, step-open recycle loop by +15%.",
            "Liquid Slug Risk: Check suction KO drum boot level every 30 mins to protect impellers.",
            "API 670 Threshold: 3 rapid surge oscillations within 10 seconds mandate automatic safety trip."
        ]
    },
    pipeline: {
        question: "Diagnostic Check: Smart pig ILI flagged 80% wall loss (9.6mm pit) on pipeline PL-400. What allows continuous throughput before sleeve repair?",
        options: [
            { text: "De-rating operating pressure to 68 bar based on ASME B31G remaining strength calculations.", correct: true },
            { text: "Applying external epoxy paint over the buried pipe.", correct: false },
            { text: "Pumping corrosion inhibitor at 10x chemical dosage.", correct: false }
        ],
        watchpoints: [
            "Pressure Boundary: Forbid pressure transient spikes >70 bar during booster pump starts.",
            "NDT Repair Crew: Radio confirmation required when hand excavation reaches pipe crown.",
            "OISD-141 Surveillance: Continuous leak detection monitoring active on SCADA console."
        ]
    }
};

let dualPresenceState = {
    isSimulated: true,
    webcamStream: null,
    dualPresenceVerified: true // Air-gapped simulated feed is verified
};

function initDualPresence() {
    const btnToggle = document.getElementById('btnToggleCamFeed');
    const label = document.getElementById('camSwitchLabel');
    const videoEl = document.getElementById('dualPresenceWebcam');
    const simScreen = document.getElementById('cctvSimScreen');

    if (!btnToggle) return;

    btnToggle.addEventListener('click', async () => {
        if (dualPresenceState.isSimulated) {
            // Request local webcam
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
                });
                dualPresenceState.webcamStream = stream;
                if (videoEl) {
                    videoEl.srcObject = stream;
                    videoEl.style.display = 'block';
                }
                if (simScreen) simScreen.style.display = 'none';
                dualPresenceState.isSimulated = false;
                if (label) label.innerText = 'Switch to Air-Gapped CCTV';
                
                showToast('Live terminal camera engaged! Local air-gapped biometric inference active.', 'success');
            } catch (err) {
                console.warn('Webcam permission denied or unavailable:', err);
                showToast('Local camera unavailable or access denied. Falling back to Enterprise CCTV simulation.', 'info');
                stopWebcamStream();
                if (videoEl) videoEl.style.display = 'none';
                if (simScreen) simScreen.style.display = 'block';
                dualPresenceState.isSimulated = true;
                if (label) label.innerText = 'Use Local Webcam';
            }
        } else {
            // Switch back to simulated
            stopWebcamStream();
            if (videoEl) videoEl.style.display = 'none';
            if (simScreen) simScreen.style.display = 'block';
            dualPresenceState.isSimulated = true;
            if (label) label.innerText = 'Use Local Webcam';
            showToast('Switched to Enterprise CCTV console feed (air-gapped refinery simulation).', 'info');
        }
        evaluateGateUnlock();
    });
}

function stopWebcamStream() {
    if (dualPresenceState.webcamStream) {
        dualPresenceState.webcamStream.getTracks().forEach(track => track.stop());
        dualPresenceState.webcamStream = null;
    }
}

function initComprehensionGate() {
    const overlay = document.getElementById('comprehensionGateOverlay');
    const btnClose = document.getElementById('btnCloseGateModal');
    const btnCancel = document.getElementById('btnCancelGateModal');
    const btnConfirm = document.getElementById('btnConfirmActiveVerification');

    initDualPresence();

    if (btnClose) btnClose.addEventListener('click', () => { 
        stopWebcamStream();
        overlay.style.display = 'none'; 
    });
    if (btnCancel) btnCancel.addEventListener('click', () => { 
        stopWebcamStream();
        overlay.style.display = 'none'; 
    });

    // Checkboxes change listeners
    ['chkWatchpoint1', 'chkWatchpoint2', 'chkWatchpoint3'].forEach(id => {
        const chk = document.getElementById(id);
        if (chk) {
            chk.addEventListener('change', () => evaluateGateUnlock());
        }
    });

    // Confirm button listener
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            stopWebcamStream();
            overlay.style.display = 'none';
            appState.handoverAcknowledged = true;

            const sig = document.getElementById('incomingAckSignature');
            if (sig) {
                sig.className = 'party-signature';
                sig.innerHTML = '<i class="fas fa-check-double text-success"></i> Actively Sealed by Lead K. Mukherjee (Shift B) • Dual-Presence Verified with R. Verma (Shift A) • PSM Match: 98.1%';
            }

            const btnAck = document.getElementById('btnAcknowledgeHandover');
            if (btnAck) {
                btnAck.disabled = true;
                btnAck.innerHTML = '<i class="fas fa-lock"></i> Operational Control Transferred';
                btnAck.style.opacity = '0.7';
            }

            // Boost Shift B's Handover Rigor and Risk Awareness
            appState.skillsShiftB[0] = Math.min(100, appState.skillsShiftB[0] + 4);
            appState.skillsShiftB[3] = Math.min(100, appState.skillsShiftB[3] + 5);
            appState.skillsShiftB[4] = 98; // Near perfect handover rigor
            renderCrossShiftRadar();

            appState.xp += 150;
            showToast('Dual-Presence Handover Verified & Sealed! Operational control transferred under OISD-166 compliance.', 'success');
        });
    }
}

function openComprehensionGateModal(isTestBlind = false) {
    const overlay = document.getElementById('comprehensionGateOverlay');
    if (!overlay) return;

    const unitKey = appState.activeUnitKey;
    const quizData = COMPREHENSION_QUIZZES[unitKey] || COMPREHENSION_QUIZZES.pump;

    // Reset state
    comprehensionState.quizAnsweredCorrectly = false;
    ['chkWatchpoint1', 'chkWatchpoint2', 'chkWatchpoint3'].forEach(id => {
        const chk = document.getElementById(id);
        if (chk) chk.checked = false;
    });

    // Populate Watchpoints Checklist
    const chk1 = document.getElementById('chkWatchpoint1');
    const chk2 = document.getElementById('chkWatchpoint2');
    const chk3 = document.getElementById('chkWatchpoint3');

    if (chk1 && chk1.nextElementSibling) chk1.nextElementSibling.innerHTML = `<strong>Operational Boundary:</strong> ${quizData.watchpoints[0]}`;
    if (chk2 && chk2.nextElementSibling) chk2.nextElementSibling.innerHTML = `<strong>Surveillance Hypothesis:</strong> ${quizData.watchpoints[1]}`;
    if (chk3 && chk3.nextElementSibling) chk3.nextElementSibling.innerHTML = `<strong>Escalation Threshold:</strong> ${quizData.watchpoints[2]}`;

    // Populate Quiz Question
    const qText = document.getElementById('quizQuestionText');
    if (qText) qText.innerHTML = `<strong>Diagnostic Comprehension Probe:</strong> ${quizData.question}`;

    const optsContainer = document.getElementById('quizOptionsList');
    if (optsContainer) {
        optsContainer.innerHTML = quizData.options.map((opt, idx) => `
            <button class="quiz-opt-btn" onclick="handleQuizOptionClick(${idx}, ${opt.correct})">
                <span class="opt-letter">${String.fromCharCode(65 + idx)}.</span>
                <span>${opt.text}</span>
            </button>
        `).join('');
    }

    const fbBox = document.getElementById('quizFeedbackBox');
    if (fbBox) fbBox.style.display = 'none';

    document.getElementById('btnConfirmActiveVerification').disabled = true;

    overlay.style.display = 'flex';

    if (isTestBlind) {
        showToast('SIMULATED BLIND SIGN-OFF: Notice how the system intercepts Shift B and demands cognitive verification!', 'warning');
    }
}

function handleQuizOptionClick(optIdx, isCorrect) {
    const buttons = document.querySelectorAll('.quiz-opt-btn');
    const fbBox = document.getElementById('quizFeedbackBox');

    buttons.forEach((btn, idx) => {
        btn.classList.remove('selected-correct', 'selected-incorrect');
        if (idx === optIdx) {
            btn.classList.add(isCorrect ? 'selected-correct' : 'selected-incorrect');
        }
    });

    comprehensionState.quizAnsweredCorrectly = isCorrect;

    if (fbBox) {
        fbBox.style.display = 'block';
        if (isCorrect) {
            fbBox.className = 'quiz-feedback ok';
            fbBox.innerHTML = '<strong><i class="fas fa-check-circle"></i> Cognitive Check Passed:</strong> Correct! You verified Shift A\'s diagnostic rationale. Complete the watch-point affirmations below to seal handover.';
        } else {
            fbBox.className = 'quiz-feedback err';
            fbBox.innerHTML = '<strong><i class="fas fa-triangle-exclamation"></i> Blind Sign-off Intercepted:</strong> Incorrect! Your answer indicates you did not review Shift A\'s diagnostic checks. Review Section 3 & Section 4 in the handover canvas.';
        }
    }

    evaluateGateUnlock();
}

function evaluateGateUnlock() {
    const c1 = document.getElementById('chkWatchpoint1')?.checked;
    const c2 = document.getElementById('chkWatchpoint2')?.checked;
    const c3 = document.getElementById('chkWatchpoint3')?.checked;

    const allChecked = c1 && c2 && c3;
    const isQuizPassed = comprehensionState.quizAnsweredCorrectly;
    const isDualPresenceOk = dualPresenceState.dualPresenceVerified;

    const btnConfirm = document.getElementById('btnConfirmActiveVerification');
    if (btnConfirm) {
        btnConfirm.disabled = !(allChecked && isQuizPassed && isDualPresenceOk);
    }
}

// ==========================================================================
// 4. PILLAR 2: CONTEXT & REASONING VIA EXPERIENCE GRAPH (vis.js)
// ==========================================================================

const GRAPH_REASONING_CASES = {
    1: {
        asset: "Centrifugal Pump P-101: Flow falling while vibration rises",
        signals: "Gravel acoustic sound at suction nozzle + 0.4 bar strainer DP rise + normal bearing temp (52°C)",
        hypotheses: "Cavitation (Thermal NPSH margin collapse) vs. Mechanical Bearing / Coupling Failure",
        checks: "Audited bearing housing temp (52°C rules out bearing seizure); calculated available NPSH at elevated feed temp (+4°C)",
        decision: "Boosted upstream vessel liquid level by 1.2m and throttled discharge valve by 8% to restore BEP operating point",
        lesson: "Do not infer mechanical failure from vibration alone without verifying suction NPSH and acoustic signature."
    },
    2: {
        asset: "Atmospheric Distillation Column C-201: Overhead DP rising rapidly (>420 mmWC)",
        signals: "Column DP spike + cold subcooled reflux (42°C) + heavy endpoint tail in light naphtha",
        hypotheses: "Downcomer Jet Flooding from Over-Refluxing vs. Chemical Tray Foaming from Amine Ingress",
        checks: "Audited internal reflux ratio (3.2 vs 2.4 target); checked middle tray temperature profile stability",
        decision: "Trimmed top reflux flow rate smoothly from 145 m³/h to 125 m³/h; maintained steady reboiler firing",
        lesson: "Over-refluxing creates hydraulic downcomer liquid choking that mimics reboiler heat overload."
    },
    3: {
        asset: "Centrifugal Wet Gas Compressor K-301: Feed drop threatening surge cycle",
        signals: "Rapid -22% suction mass flow drop + anti-surge margin collapsing to 4.2% + discharge pressure flutter",
        hypotheses: "Incipient Compressor Surge from Feed Starvation vs. Interstage Cooler Blockage",
        checks: "Monitored dynamic distance from surge control line; audited suction drum KO boot liquid level",
        decision: "Step-opened anti-surge hot gas recycle loop by +15% and de-rated governor speed by 150 RPM",
        lesson: "Surge prevention requires rapid volume recycle through bypass, never uncontrolled emergency tripping."
    },
    4: {
        asset: "Interstate Crude Pipeline PL-400: Smart pig flags 80% wall loss anomaly",
        signals: "High-resolution Magnetic Flux Leakage (MFL) pig reports 9.6mm pit depth on 12mm wall at MP 142.6",
        hypotheses: "Severe External Soil Corrosion / Coating Disbondment vs. Internal Microbially Influenced Corrosion (MIC)",
        checks: "Conducted ASME B31G safe remaining pressure calculation; evaluated cathodic protection potentials",
        decision: "De-rated operating pressure by 20% to 68 bar and mobilized excavation crew for Type-B pressure sleeve repair",
        lesson: "ASME B31G calculations enable continuous safe throughput at reduced pressure during emergency pipeline remediation."
    }
};

function initExperienceGraph() {
    const container = document.getElementById('knowledgeGraph');
    if (!container || networkGraph) return;

    const nodes = new vis.DataSet([
        // Assets & Situations (Cyan)
        { id: 1, label: 'P-101 Pump:\nFlow Falls, Vib Rises', color: '#00d4ff', shape: 'box', group: 'asset', font: { color: '#000', face: 'Inter', weight: 'bold' } },
        { id: 2, label: 'C-201 Column:\nOverhead DP Spike', color: '#00d4ff', shape: 'box', group: 'asset', font: { color: '#000', face: 'Inter', weight: 'bold' } },
        { id: 3, label: 'K-301 Compressor:\nFeed Loss / Surge Risk', color: '#00d4ff', shape: 'box', group: 'asset', font: { color: '#000', face: 'Inter', weight: 'bold' } },
        { id: 4, label: 'PL-400 Pipeline:\nSmart Pig 80% Wall Loss', color: '#00d4ff', shape: 'box', group: 'asset', font: { color: '#000', face: 'Inter', weight: 'bold' } },

        // Signals & Cues (Red)
        { id: 11, label: 'Gravel Crackle Sound\n& Suction DP Rise', color: '#ff6b6b', shape: 'ellipse', group: 'signal', font: { color: '#fff' } },
        { id: 12, label: 'DP Spike >420 mmWC\nCold Reflux (42°C)', color: '#ff6b6b', shape: 'ellipse', group: 'signal', font: { color: '#fff' } },
        { id: 13, label: 'Anti-Surge Margin\nDrops to 4.2%', color: '#ff6b6b', shape: 'ellipse', group: 'signal', font: { color: '#fff' } },
        { id: 14, label: 'MFL Pig Anomaly\n9.6mm Depth (80%)', color: '#ff6b6b', shape: 'ellipse', group: 'signal', font: { color: '#fff' } },

        // Competing Hypotheses (Yellow)
        { id: 21, label: 'Hypothesis:\nNPSH Cavitation', color: '#f9ca24', shape: 'diamond', group: 'hypothesis', font: { color: '#000' } },
        { id: 22, label: 'Hypothesis:\nBearing Breakdown', color: '#f9ca24', shape: 'diamond', group: 'hypothesis', font: { color: '#000' } },
        { id: 23, label: 'Hypothesis:\nJet Flooding (Reflux)', color: '#f9ca24', shape: 'diamond', group: 'hypothesis', font: { color: '#000' } },
        { id: 24, label: 'Hypothesis:\nChemical Foaming', color: '#f9ca24', shape: 'diamond', group: 'hypothesis', font: { color: '#000' } },
        { id: 25, label: 'Hypothesis:\nFlow Starvation Surge', color: '#f9ca24', shape: 'diamond', group: 'hypothesis', font: { color: '#000' } },

        // Discriminating Checks (Teal)
        { id: 31, label: 'Check Bearing Temp\n(52°C Normal Rules Out)', color: '#4ecdc4', shape: 'box', group: 'check', font: { color: '#000' } },
        { id: 32, label: 'Audit Internal Reflux\nRatio & Delta-T', color: '#4ecdc4', shape: 'box', group: 'check', font: { color: '#000' } },
        { id: 33, label: 'ASME B31G Remaining\nPressure Calculation', color: '#4ecdc4', shape: 'box', group: 'check', font: { color: '#000' } },

        // Verified Decisions (Green)
        { id: 41, label: 'Boost Vessel Level\n& Adjust BEP Flow', color: '#43e97b', shape: 'hexagon', group: 'decision', font: { color: '#000', weight: 'bold' } },
        { id: 42, label: 'Trim Reflux Flow\nFrom 145 to 125 m³/h', color: '#43e97b', shape: 'hexagon', group: 'decision', font: { color: '#000', weight: 'bold' } },
        { id: 43, label: 'Step-Open Recycle\nLoop by +15%', color: '#43e97b', shape: 'hexagon', group: 'decision', font: { color: '#000', weight: 'bold' } },
        { id: 44, label: 'De-rate MAOP 20%\nInstall Type-B Sleeve', color: '#43e97b', shape: 'hexagon', group: 'decision', font: { color: '#000', weight: 'bold' } },

        // Tacit Lessons (Purple)
        { id: 51, label: 'Lesson: Never infer bearing\nfault from vibration alone', color: '#a29bfe', shape: 'ellipse', group: 'lesson', font: { color: '#000' } },
        { id: 52, label: 'Lesson: Over-reflux mimics\nreboiler overload', color: '#a29bfe', shape: 'ellipse', group: 'lesson', font: { color: '#000' } }
    ]);

    const edges = new vis.DataSet([
        { from: 1, to: 11, label: 'exhibits', color: { color: 'rgba(255,255,255,0.3)' } },
        { from: 11, to: 21, label: 'suggests', color: { color: 'rgba(255,255,255,0.3)' } },
        { from: 11, to: 22, label: 'competes with', color: { color: 'rgba(255,255,255,0.3)' }, dashes: true },
        { from: 21, to: 31, label: 'discriminated by', color: { color: 'rgba(255,255,255,0.3)' } },
        { from: 31, to: 41, label: 'leads to safe action', color: { color: '#43e97b' } },
        { from: 41, to: 51, label: 'yields tacit lesson', color: { color: '#a29bfe' } },

        { from: 2, to: 12, label: 'exhibits', color: { color: 'rgba(255,255,255,0.3)' } },
        { from: 12, to: 23, label: 'suggests', color: { color: 'rgba(255,255,255,0.3)' } },
        { from: 12, to: 24, label: 'competes with', color: { color: 'rgba(255,255,255,0.3)' }, dashes: true },
        { from: 23, to: 32, label: 'discriminated by', color: { color: 'rgba(255,255,255,0.3)' } },
        { from: 32, to: 42, label: 'leads to safe action', color: { color: '#43e97b' } },
        { from: 42, to: 52, label: 'yields tacit lesson', color: { color: '#a29bfe' } },

        { from: 3, to: 13, label: 'triggers', color: { color: 'rgba(255,255,255,0.3)' } },
        { from: 13, to: 25, label: 'suggests', color: { color: 'rgba(255,255,255,0.3)' } },
        { from: 25, to: 43, label: 'leads to safe action', color: { color: '#43e97b' } },

        { from: 4, to: 14, label: 'reveals', color: { color: 'rgba(255,255,255,0.3)' } },
        { from: 14, to: 33, label: 'mandates', color: { color: 'rgba(255,255,255,0.3)' } },
        { from: 33, to: 44, label: 'leads to remediation', color: { color: '#43e97b' } }
    ]);

    const data = { nodes, edges };
    const options = {
        nodes: { margin: 10, borderWidth: 2, shadow: true },
        edges: {
            arrows: { to: { enabled: true, scaleFactor: 0.8 } },
            font: { size: 10, color: '#94a3b8', face: 'Inter' },
            smooth: { type: 'continuous' }
        },
        physics: {
            barnesHut: { gravitationalConstant: -2800, springLength: 140, springConstant: 0.04 }
        },
        interaction: { hover: true, tooltipDelay: 200 }
    };

    networkGraph = new vis.Network(container, data, options);

    networkGraph.on('click', params => {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const nodeData = nodes.get(nodeId);
            updateReasoningTracePanel(nodeId, nodeData);
        }
    });

    // Filter Chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const filter = chip.getAttribute('data-filter');
            if (filter === 'all') {
                nodes.forEach(n => nodes.update({ id: n.id, hidden: false }));
            } else {
                nodes.forEach(n => nodes.update({ id: n.id, hidden: n.group !== filter }));
            }
        });
    });

    // Initial update for P-101
    updateReasoningTracePanel(1, nodes.get(1));
}

function highlightGraphAsset(assetId) {
    if (!networkGraph) initExperienceGraph();
    setTimeout(() => {
        if (networkGraph) {
            networkGraph.selectNodes([assetId]);
            const nodeData = networkGraph.body.data.nodes.get(assetId);
            updateReasoningTracePanel(assetId, nodeData);
        }
    }, 150);
}

function updateReasoningTracePanel(nodeId, nodeData) {
    const caseId = (nodeId <= 4) ? nodeId : (nodeId % 10 || 1);
    const trace = GRAPH_REASONING_CASES[caseId] || GRAPH_REASONING_CASES[1];

    document.getElementById('topicBadge').innerText = nodeData ? nodeData.group.toUpperCase() : 'REASONING TRACE';
    document.getElementById('topicTitle').innerText = nodeData ? nodeData.label.replace('\n', ' — ') : 'Diagnostic Logic Trace';

    document.getElementById('traceAsset').innerText = trace.asset;
    document.getElementById('traceSignals').innerText = trace.signals;
    document.getElementById('traceHypotheses').innerText = trace.hypotheses;
    document.getElementById('traceChecks').innerText = trace.checks;
    document.getElementById('traceDecision').innerText = trace.decision;
    document.getElementById('traceLesson').innerText = `"${trace.lesson}"`;

    const drillBtn = document.getElementById('topicDrillBtn');
    if (drillBtn) {
        drillBtn.onclick = () => {
            navigateToSection('scenarios');
            const scenarioMap = { 1: 'pump-cavitation', 2: 'distillation-flooding', 3: 'compressor-trip', 4: 'pipeline-corrosion' };
            loadAndPlayScenario(scenarioMap[caseId] || 'pump-cavitation');
        };
    }
}

// ==========================================================================
// 5. PILLAR 3: SCENARIO ENGINE & SOCRATIC PRACTICE
// ==========================================================================

const SCENARIOS = [
    {
        id: 'pump-cavitation',
        title: 'Centrifugal Pump P-101: Cavitation vs. Bearing Failure',
        category: 'Rotating Equipment',
        difficulty: 'Medium',
        diffClass: 'diff-medium',
        source: 'Handover Case #2027-084',
        description: 'Shift B takes over pump P-101 with an active watchpoint: vibration is 4.6 mm/s and gravel noise is heard. Discriminate true root cause before escalating.',
        telemetry: [
            { label: 'Casing Vibration', val: '4.6 mm/s', status: 'gauge-warning', text: 'ELEVATED' },
            { label: 'Bearing Housing Temp', val: '52°C', status: 'gauge-normal', text: 'NORMAL' },
            { label: 'Suction Pressure', val: '1.2 kg/cm²', status: 'gauge-warning', text: 'FLUCTUATING' },
            { label: 'Suction Liquid Temp', val: '78°C (+4°)', status: 'gauge-warning', text: 'HIGH VAPOR P' }
        ],
        steps: [
            {
                situation: 'Field operator reports hearing gravel-like crackle at the suction nozzle. He insists the bearings have degraded and urges tripping the motor. What observation would make you change your mind?',
                hypothesisChips: [
                    'If bearing temp was >75°C, I would suspect bearing wear',
                    'If fluid temp was normal (<70°C), I would suspect impeller debris',
                    'Current normal temp (52°C) confirms cavitation vapor collapse'
                ],
                options: [
                    { letter: 'A', text: 'Agree with operator: Immediately trip pump motor and issue mechanical overhaul permit', correct: false, feedback: 'Incorrect & costly! Rushing to teardown without checking bearing temp (52°C is completely normal) wastes ₹18 Lakhs and stops crude throughput.' },
                    { letter: 'B', text: 'Verify bearing housing temperature (52°C) and calculate available NPSH vs vapor pressure at elevated 78°C suction temperature', correct: true, feedback: 'Exemplary Diagnostic Reasoning! Bearing temp is 52°C (well below 75°C failure limit). The +4°C feed temp rise reduced available NPSH below required NPSH, causing thermal cavitation.' },
                    { letter: 'C', text: 'Throttle pump discharge valve to 10% without checking suction parameters', correct: false, feedback: 'Unsafe! Throttling discharge pushes the pump toward dead-head condition, elevating internal fluid temperature and intensifying cavitation damage.' },
                    { letter: 'D', text: 'Ignore vibration; assume acoustic transmitter is miscalibrated', correct: false, feedback: 'Dangerous complacency! Neglected cavitation can rupture mechanical seals and trigger volatile hydrocarbon leakage.' }
                ]
            },
            {
                situation: 'Thermal cavitation is proven. Suction drum level has dropped to 48%, further starving suction head. What is the approved corrective sequence?',
                hypothesisChips: [
                    'Restore upstream suction head first',
                    'Execute full unit emergency trip',
                    'Switch to standby pump blindly'
                ],
                options: [
                    { letter: 'A', text: 'Raise upstream vessel level by 1.2m, trim pre-heat cooling bypass, and adjust flow rate towards Best Efficiency Point (BEP)', correct: true, feedback: 'Validated Operating Procedure! Restoring suction liquid level re-establishes NPSH margin. Vibration drops to 1.9 mm/s within minutes without unit downtime.' },
                    { letter: 'B', text: 'Emergency Shutdown (ESD) of the entire Crude Distillation Unit', correct: false, feedback: 'Excessive! Normal procedural head stabilization resolves the issue safely without a catastrophic full plant shutdown.' },
                    { letter: 'C', text: 'Switch to spare pump P-101B without addressing upstream low vessel head', correct: false, feedback: 'Flawed! P-101B draws from the exact same starved suction header. The spare pump will immediately experience identical cavitation!' }
                ]
            }
        ]
    },
    {
        id: 'distillation-flooding',
        title: 'C-201 Distillation Column: Differential Pressure Flooding',
        category: 'Process Unit',
        difficulty: 'Hard',
        diffClass: 'diff-hard',
        source: 'Handover Case #2027-085',
        description: 'Shift B assumes control with column top DP creeping to 395 mmWC. Discriminate hydraulic jet flooding from chemical foaming before adjusting reboiler duty.',
        telemetry: [
            { label: 'Column Overhead DP', val: '410 mmWC', status: 'gauge-alarm', text: 'HIGH ALARM' },
            { label: 'Top Reflux Flow', val: '145 m³/h', status: 'gauge-warning', text: 'MAX OVERRIDE' },
            { label: 'Tray 18-24 Delta-T', val: '14°C', status: 'gauge-normal', text: 'NORMAL' },
            { label: 'Naphtha 95% Cut Pt', val: '177°C', status: 'gauge-alarm', text: 'OFF-SPEC' }
        ],
        steps: [
            {
                situation: 'Column top DP has spiked 180 mmWC in 20 minutes. Product quality is severely degraded. Rookie board engineer reaches to slash reboiler fuel gas duty. What check discriminates jet flooding from tray foaming?',
                hypothesisChips: [
                    'If DP was oscillating erratically, I would suspect chemical foaming',
                    'If reflux was subcooled and flow was at max override, it is jet flooding',
                    'Slashing reboiler duty during foaming dumps the entire column'
                ],
                options: [
                    { letter: 'A', text: 'Audit top reflux flow rate, tray temperature profile, and reflux subcooling before touching reboiler duty', correct: true, feedback: 'Superb! Slashing reboiler duty during foaming can dump trays. Checking reflux reveals top reflux was increased to 145 m³/h, drowning upper trays in subcooled liquid (hydraulic flooding).' },
                    { letter: 'B', text: 'Immediately inject anti-foam chemical at maximum dosage', correct: false, feedback: 'Blind action! Anti-foam won\'t fix hydraulic liquid over-refluxing and contaminates downstream hydrotreater catalyst.' },
                    { letter: 'C', text: 'Slash reboiler furnace firing by 30%', correct: false, feedback: 'Dangerous! Abrupt reboiler drop collapses vapor support, dumping 40 trays of hydrocarbon liquid into column bottom.' }
                ]
            },
            {
                situation: 'Hydraulic jet flooding from over-reflux is proven. What is the validated recovery path?',
                hypothesisChips: [
                    'Gradual Reflux De-escalation',
                    'Total Flare Dump',
                    'Increase Feed Pre-heat'
                ],
                options: [
                    { letter: 'A', text: 'Gradually reduce top reflux from 3.2 to 2.4 ratio and restore stripping steam balance smoothly', correct: true, feedback: 'Validated Protocol! Relieving hydraulic downcomer choke smoothly stabilizes column DP within 35 minutes and restores naphtha specification.' },
                    { letter: 'B', text: 'Trip column feed pump and divert all inventory to slop tanks', correct: false, feedback: 'Costly error. Slop diversion of 500 barrels wastes production capacity when reflux trimming resolves the hydraulic imbalance.' }
                ]
            }
        ]
    },
    {
        id: 'compressor-trip',
        title: 'K-301 Wet Gas Compressor: Surge Prevention & Margin Recovery',
        category: 'Turbomachinery',
        difficulty: 'Hard',
        diffClass: 'diff-hard',
        source: 'Handover Case #2027-086',
        description: 'Sudden feed drop threatens multi-stage centrifugal compressor with catastrophic reverse surge cycles.',
        telemetry: [
            { label: 'Suction Mass Flow', val: '42,000 kg/h', status: 'gauge-alarm', text: '-22% DROP' },
            { label: 'Anti-Surge Margin', val: '4.2%', status: 'gauge-alarm', text: 'SURGE DANGER' },
            { label: 'Discharge Pressure', val: '14.2 bar', status: 'gauge-warning', text: 'OSCILLATING' },
            { label: 'Thrust Bearing Temp', val: '68°C', status: 'gauge-normal', text: 'NORMAL' }
        ],
        steps: [
            {
                situation: 'Feed dropped 22% abruptly. Operating point is 4.2% from surge line. Operator asks whether to trip the compressor manually. How do you respond?',
                hypothesisChips: [
                    'If 3 rapid surge oscillations occur, API 670 mandates trip',
                    'Incremental +15% recycle valve modulation can restore margin safely'
                ],
                options: [
                    { letter: 'A', text: 'Step-open hot anti-surge recycle valve by 15% and trim turbine speed by 150 RPM to restore >15% margin', correct: true, feedback: 'Exemplary! Re-routing recycle gas sustains forward mass flow through impellers, safely restoring 18% surge margin without a full plant trip.' },
                    { letter: 'B', text: 'Manually press emergency trip push button immediately', correct: false, feedback: 'Tripping K-301 trips the entire FCC complex, causing massive flaring and multi-hour restarts when recycle modulation would have saved it.' },
                    { letter: 'C', text: 'Block compressor discharge isolation valve', correct: false, feedback: 'Catastrophic! Blocking discharge guarantees violent reverse surge and mechanical destruction of impellers.' }
                ]
            }
        ]
    },
    {
        id: 'pipeline-corrosion',
        title: 'High-Pressure Pipeline PL-400: Smart Pig 80% Wall Loss',
        category: 'Pipeline Integrity',
        difficulty: 'Medium',
        diffClass: 'diff-medium',
        source: 'Handover Case #2027-087',
        description: 'In-line inspection reveals critical metal loss. Evaluate safe operating boundaries under ASME B31G before shutdown.',
        telemetry: [
            { label: 'Operating Pressure', val: '68 bar', status: 'gauge-warning', text: '85% MAOP' },
            { label: 'Max Pit Depth', val: '9.6 mm (80%)', status: 'gauge-alarm', text: 'CRITICAL' },
            { label: 'Defect Length', val: '120 mm', status: 'gauge-warning', text: 'AXIAL' },
            { label: 'Cathodic Protection', val: '-0.82 V', status: 'gauge-normal', text: 'ACTIVE' }
        ],
        steps: [
            {
                situation: 'Smart pig log flags an 80% wall thickness anomaly on an interstate crude line. What is your immediate integrity action?',
                hypothesisChips: [
                    'ASME B31G calculation determines safe operating pressure',
                    'Shutting down interstate line causes severe national supply shock'
                ],
                options: [
                    { letter: 'A', text: 'Immediately de-rate operating pressure by 20%, calculate safe operating pressure via ASME B31G, and mobilize NDT sleeve repair crew', correct: true, feedback: 'Correct Safety Standard! ASME B31G determines safe pressure margin while continuous supply is maintained at reduced pressure until permanent Type-B sleeve reinforcement.' },
                    { letter: 'B', text: 'Shut down the 500km pipeline instantly without de-rating calculations', correct: false, feedback: 'Unnecessary supply paralysis. Managed de-rating guarantees containment while excavation proceeds.' },
                    { letter: 'C', text: 'Continue normal 100% throughput until scheduled turnaround next year', correct: false, feedback: 'Severe OISD violation! 80% wall loss under 85% MAOP carries imminent rupture risk.' }
                ]
            }
        ]
    }
];

let activeScenarioObj = null;
let currentScenarioStepIndex = 0;
let scenarioScore = 0;

function initScenarioEngine() {
    renderScenarioList();

    const backBtn = document.getElementById('backToScenarios');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('scenarioPlay').style.display = 'none';
            document.getElementById('scenarioList').style.display = 'grid';
        });
    }

    const nextBtn = document.getElementById('scenarioNextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentScenarioStepIndex++;
            if (currentScenarioStepIndex < activeScenarioObj.steps.length) {
                renderScenarioStep(activeScenarioObj, currentScenarioStepIndex);
            } else {
                renderScenarioResult(activeScenarioObj);
            }
        });
    }

    const resultBack = document.getElementById('resultBackBtn');
    if (resultBack) {
        resultBack.addEventListener('click', () => {
            document.getElementById('scenarioPlay').style.display = 'none';
            document.getElementById('scenarioList').style.display = 'grid';
        });
    }

    const viewCrossShift = document.getElementById('btnViewCrossShift');
    if (viewCrossShift) {
        viewCrossShift.addEventListener('click', () => {
            navigateToSection('cross-shift');
        });
    }
}

function renderScenarioList() {
    const list = document.getElementById('scenarioList');
    if (!list) return;

    list.innerHTML = SCENARIOS.map(sc => `
        <div class="scenario-card" onclick="loadAndPlayScenario('${sc.id}')">
            <div class="scenario-card-header">
                <div class="scenario-icon-wrap"><i class="fas fa-microchip"></i></div>
                <span class="difficulty-badge ${sc.diffClass}">${sc.difficulty}</span>
            </div>
            <h3>${sc.title}</h3>
            <p>${sc.description}</p>
            <div class="scenario-footer">
                <span class="scenario-source-tag"><i class="fas fa-clipboard-check"></i> ${sc.source}</span>
                <span><i class="fas fa-bolt text-accent"></i> +150 XP</span>
            </div>
        </div>
    `).join('');
}

function loadAndPlayScenario(scenarioId) {
    const sc = SCENARIOS.find(s => s.id === scenarioId);
    if (!sc) return;

    activeScenarioObj = sc;
    currentScenarioStepIndex = 0;
    scenarioScore = 0;

    document.getElementById('scenarioList').style.display = 'none';
    const playContainer = document.getElementById('scenarioPlay');
    playContainer.style.display = 'block';

    document.getElementById('scenarioResult').style.display = 'none';
    document.querySelector('.scenario-play-card').style.display = 'block';

    document.getElementById('scenarioTitle').innerText = sc.title;
    document.getElementById('scenarioCategoryBadge').innerText = sc.category;

    // Render Telemetry
    const telemetryPanel = document.getElementById('telemetryPanel');
    if (telemetryPanel) {
        telemetryPanel.innerHTML = sc.telemetry.map(t => `
            <div class="gauge-widget">
                <div class="gauge-label">${t.label}</div>
                <div class="gauge-value">${t.val}</div>
                <div class="gauge-status ${t.status}">${t.text}</div>
            </div>
        `).join('');
    }

    renderScenarioStep(sc, 0);
}

function renderScenarioStep(sc, stepIdx) {
    const step = sc.steps[stepIdx];
    document.getElementById('scenarioStepLabel').innerText = `Stage ${stepIdx + 1} of ${sc.steps.length}`;
    document.getElementById('scenarioProgress').style.width = `${((stepIdx + 1) / sc.steps.length) * 100}%`;
    document.getElementById('scenarioDescription').innerText = step.situation;

    // Reasoning Chips
    const chipsContainer = document.getElementById('reasoningChips');
    if (chipsContainer) {
        chipsContainer.innerHTML = step.hypothesisChips.map((c, i) => `
            <span class="reason-chip ${i === 0 ? 'selected' : ''}" onclick="selectReasonChip(this)">${c}</span>
        `).join('');
    }

    // Options
    const optionsContainer = document.getElementById('scenarioOptions');
    optionsContainer.innerHTML = step.options.map((opt, i) => `
        <button class="option-btn" onclick="handleOptionSelect(${stepIdx}, ${i})">
            <span class="option-letter">${opt.letter}.</span>
            <span>${opt.text}</span>
        </button>
    `).join('');

    const feedback = document.getElementById('scenarioFeedback');
    feedback.style.display = 'none';
    document.getElementById('scenarioNextBtn').style.display = 'none';
}

function selectReasonChip(el) {
    document.querySelectorAll('.reason-chip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

function handleOptionSelect(stepIdx, optIdx) {
    const step = activeScenarioObj.steps[stepIdx];
    const selected = step.options[optIdx];
    const buttons = document.querySelectorAll('.option-btn');

    buttons.forEach((btn, i) => {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
        if (step.options[i].correct) {
            btn.classList.add('correct');
        } else if (i === optIdx && !selected.correct) {
            btn.classList.add('incorrect');
        }
    });

    const feedback = document.getElementById('scenarioFeedback');
    feedback.style.display = 'block';
    if (selected.correct) {
        scenarioScore++;
        feedback.className = 'scenario-feedback correct';
        feedback.innerHTML = `<strong><i class="fas fa-check-circle"></i> Validated Decision:</strong> ${selected.feedback}`;
    } else {
        feedback.className = 'scenario-feedback incorrect';
        feedback.innerHTML = `<strong><i class="fas fa-triangle-exclamation"></i> Procedural Deviation:</strong> ${selected.feedback}`;
    }

    document.getElementById('scenarioNextBtn').style.display = 'inline-flex';
}

function renderScenarioResult(sc) {
    document.querySelector('.scenario-play-card').style.display = 'none';
    const resultContainer = document.getElementById('scenarioResult');
    resultContainer.style.display = 'block';

    const pct = Math.round((scenarioScore / sc.steps.length) * 100);
    const xpEarned = pct >= 80 ? 150 : 80;

    document.getElementById('resultScore').innerText = `${pct}%`;
    document.getElementById('resultXP').innerText = `+${xpEarned}`;

    const breakdown = document.getElementById('resultBreakdown');
    breakdown.innerHTML = `
        <div style="margin-bottom:8px;"><strong>Structured Diagnostic Reasoning:</strong> ${pct}% compliance with benchmark expert path.</div>
        <div style="margin-bottom:8px;"><strong>Handover Continuity Integrity:</strong> 100% adherence to active watch-point constraints.</div>
        <div><strong>Cross-Shift Impact:</strong> This drill logged toward Shift B's competency profile, reducing inter-shift variance.</div>
    `;

    appState.xp += xpEarned;
    showToast(`Drill completed (+${xpEarned} XP logged)!`, 'success');
}

// ==========================================================================
// 6. PILLAR 4: AI EXPERIENCE COACH
// ==========================================================================

const COACH_RESPONSES = {
    unitNormal: "The 'unit normal' syndrome is a well-documented industrial hazard. When an outgoing shift logs 'unit normal' without details, they omit minor parameter tweaks (like a 5% bypass trim or a 0.3 bar strainer DP increase) that were made to compensate for a developing anomaly. 4 hours later, the incoming shift encounters an abrupt trip because they were blind to the pre-existing drift. ExpertFlow's 5-section model forces explicit documentation of baselines, tweaks, sensory cues, and watchpoints.",
    pump: "When evaluating a centrifugal pump during handover, never infer mechanical bearing failure from vibration alone! An acoustic 'gravel-in-a-pipe' noise combined with normal bearing temperatures (52°C) indicates thermal vapor cavitation caused by an NPSH margin collapse. If feed liquid temperature creeps up (+4°C), fluid vapor pressure rises and vapor bubbles implode against the impeller eye. Boosting vessel liquid level restores the NPSH margin without taking the pump offline.",
    column: "In distillation columns, a sharp overhead differential pressure (DP) rise (>400 mmWC) can represent either hydraulic downcomer jet flooding (from over-refluxing) or chemical tray foaming. To discriminate: check reflux temperature and flow. If reflux is abnormally cold and at high rate, you have choked the downcomers with subcooled liquid. Slashing reboiler duty will dump the trays into the bottom boot. Instead, trim top reflux ratio smoothly.",
    compressor: "When a centrifugal wet gas compressor approaches the surge control line (margin <10%), panic-tripping the compressor triggers a full FCC plant trip and multi-crore flaring. Instead, step-open the anti-surge hot gas recycle loop incrementally (+15%) to maintain forward mass flow through the impellers, while trimming turbine governor speed smoothly.",
    cues: "Weak sensory signals—such as subtle gravel crackles on pump casings, faint chemical odors near flange seals, or high-speed DCS pressure flutters—are the earliest indicators of impending equipment distress. Under the 5-section model, these are categorized under 'Section 3: Observations' so the incoming shift lead is primed to monitor them."
};

function initAICoach() {
    const sendBtn = document.getElementById('sendBtn');
    const input = document.getElementById('chatInput');

    if (sendBtn) sendBtn.addEventListener('click', handleCoachSend);
    if (input) {
        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') handleCoachSend();
        });
    }

    document.querySelectorAll('.suggestions .suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const question = chip.getAttribute('data-question');
            if (input) input.value = question;
            handleCoachSend();
        });
    });
}

function handleCoachSend() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    if (!input || !messages || !input.value.trim()) return;

    const userText = input.value.trim();
    input.value = '';

    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.innerHTML = `
        <div class="message-avatar"><i class="fas fa-user-graduate"></i></div>
        <div class="message-content">${userText}</div>
    `;
    messages.appendChild(userMsg);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
        const lower = userText.toLowerCase();
        let reply = "That is an important plant operational question. Remember our signature diagnostic probe: *What observation or discriminating check would make you change your working hypothesis?* Could you specify which asset and telemetry parameters you are evaluating?";

        if (lower.includes('unit normal') || lower.includes('fail') || lower.includes('handover')) {
            reply = COACH_RESPONSES.unitNormal;
        } else if (lower.includes('pump') || lower.includes('cavitation') || lower.includes('bearing')) {
            reply = COACH_RESPONSES.pump;
        } else if (lower.includes('column') || lower.includes('flood') || lower.includes('foam')) {
            reply = COACH_RESPONSES.column;
        } else if (lower.includes('compressor') || lower.includes('surge')) {
            reply = COACH_RESPONSES.compressor;
        } else if (lower.includes('cue') || lower.includes('subtle') || lower.includes('acoustic') || lower.includes('5-section')) {
            reply = COACH_RESPONSES.cues;
        }

        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';
        botMsg.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <p><strong><i class="fas fa-shield-halved text-accent"></i> Socratic Experience Coach:</strong></p>
                <p>${reply}</p>
                <p style="font-size:0.75rem; color:#64748b; margin-top:6px;"><em>Attribution: Grounded in 5-Section Handover Standard &amp; Experience Graph.</em></p>
            </div>
        `;
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
    }, 600);
}

// ==========================================================================
// 7. PILLAR 5: CROSS-SHIFT COMPETENCY RADAR (CHART.JS)
// ==========================================================================

function renderCrossShiftRadar() {
    const canvas = document.getElementById('skillsRadarChart');
    if (!canvas) return;

    if (radarChart) {
        radarChart.data.datasets[0].data = appState.skillsShiftA;
        radarChart.data.datasets[1].data = appState.skillsShiftB;
        radarChart.data.datasets[2].data = appState.skillsShiftC;
        radarChart.update();
    } else {
        const ctx = canvas.getContext('2d');
        radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: appState.competencyLabels,
                datasets: [
                    {
                        label: 'Shift A (Morning Crew)',
                        data: appState.skillsShiftA,
                        backgroundColor: 'rgba(0, 212, 255, 0.15)',
                        borderColor: '#00d4ff',
                        borderWidth: 2,
                        pointBackgroundColor: '#00d4ff'
                    },
                    {
                        label: 'Shift B (Evening Crew)',
                        data: appState.skillsShiftB,
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        borderColor: '#8b5cf6',
                        borderWidth: 2,
                        pointBackgroundColor: '#8b5cf6'
                    },
                    {
                        label: 'Shift C (Night Crew - Gap Identified)',
                        data: appState.skillsShiftC,
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        pointBackgroundColor: '#f59e0b',
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
                        grid: { color: 'rgba(255, 255, 255, 0.08)' },
                        pointLabels: { color: '#f1f5f9', font: { family: 'Inter', size: 10, weight: '600' } },
                        ticks: { display: false, min: 40, max: 100 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// ==========================================================================
// 8. PILLAR 6: 1-PAGE MENTOR COACHING BRIEF
// ==========================================================================

function initMentorBrief() {
    renderMentorBriefDocument();

    const btnLog = document.getElementById('btnLogMentorSession');
    if (btnLog) {
        btnLog.addEventListener('click', () => {
            // Equalize Shift C's scores on the radar!
            appState.skillsShiftC = [80, 86, 78, 75, 85];
            renderCrossShiftRadar();

            const badge = document.getElementById('shiftDisparityBadge');
            if (badge) {
                badge.className = 'tag-accent';
                badge.innerText = 'Shift Disparity Equalized (<6% Variance)';
            }

            btnLog.disabled = true;
            btnLog.innerHTML = '<i class="fas fa-check-double"></i> 15-Min Intervention Logged';
            btnLog.style.opacity = '0.7';

            showToast('15-Minute Mentoring Session logged! Shift C competency radar boosted and shift parity achieved.', 'success');
        });
    }

    const btnExport = document.getElementById('btnExportPDF');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            window.print();
        });
    }
}

function renderMentorBriefDocument() {
    const docBody = document.getElementById('mentorBriefDocBody');
    if (!docBody) return;

    docBody.innerHTML = `
        <div class="doc-section">
            <div class="doc-section-title"><i class="fas fa-bullseye"></i> 1. Targeted 15-Minute Shift Focus Objective</div>
            <p><strong>Remediating "Unit Normal" Complacency &amp; Differentiating Thermal Cavitation vs. Bearing Breakdown in Shift C</strong></p>
        </div>

        <div class="doc-section">
            <div class="doc-section-title"><i class="fas fa-triangle-exclamation"></i> 2. Diagnosed Shift C Reasoning Gap (AI Assessment)</div>
            <p>During the last 3 rotations, Shift C operators exhibited a 24% lower Weak Signal Identification score. When handed pump P-101 with elevated suction temperature and acoustic crackle, 2 junior operators immediately assumed mechanical bearing failure and attempted to trip the pump, rather than checking the suction NPSH margin.</p>
        </div>

        <div class="doc-section">
            <div class="doc-section-title"><i class="fas fa-comments"></i> 3. Three Mandatory Socratic Questions for the Mentor</div>
            <ol style="padding-left:18px; margin-top:4px;">
                <li><em>"When you inherit an 8% throttled discharge valve on Pump P-101 at 22:00, what two telemetry checks in Section 1 prove why Shift B did that?"</em></li>
                <li><em>"Why does writing 'unit normal' put your relief shift at risk if feed temperature rose by 4°C?"</em></li>
                <li><em>"What single temperature reading confirms that a vibrating pump is NOT suffering a mechanical bearing seizure?"</em></li>
            </ol>
        </div>

        <div class="doc-section" style="border-bottom:none;">
            <div class="doc-section-title"><i class="fas fa-vial-circle-check"></i> 4. Next Required Deliberate Practice Drill</div>
            <p>Assign Shift C operators to complete <strong>Scenario #1 (Pump Cavitation)</strong> and <strong>Scenario #2 (Column Jet Flooding)</strong> in the simulator before logging their next live plant handover.</p>
        </div>
    `;
}

// ==========================================================================
// 9. 5-MINUTE COMPETITION DEMO STEPPER
// ==========================================================================

const DEMO_STEPS = [
    {
        heading: "Step 1: The 'Unit Normal' Handover Failure Mode",
        content: `
            <p><strong>The Industrial Reality:</strong> "Judges, in oil refineries and chemical plants, shift handovers frequently fail because outgoing operators write 3 words: <em>'Unit Normal'</em>. They omit weak signals, minor bypass trims, or acoustic crackles."</p>
            <div style="background:rgba(239,68,68,0.08); border-left:3px solid #ef4444; padding:10px 14px; border-radius:6px; margin-top:12px; font-size:0.82rem;">
                <strong>Demo Action:</strong> Navigating to <strong>Module 1: Structured Experience Handover</strong> and revealing the hidden trap of conventional logbooks.
            </div>
        `,
        action: () => {
            navigateToSection('handover');
            const comp = document.getElementById('vagueLogComparison');
            if (comp) comp.style.display = 'grid';
        }
    },
    {
        heading: "Step 2: The Mandatory 5-Section Handover Engine",
        content: `
            <p><strong>The Solution:</strong> "ExpertFlow replaces verbal ambiguity with 5 mandatory, machine-audited sections: <strong>1. Normal State, 2. Deviations, 3. Observations (sensory/acoustic), 4. Actions Taken, and 5. Watch-Points</strong>."</p>
            <div style="background:rgba(16,185,129,0.08); border-left:3px solid #10b981; padding:10px 14px; border-radius:6px; margin-top:12px; font-size:0.82rem;">
                <strong>Demo Action:</strong> Shift B accepts the handover and traces the reasoning behind the throttled discharge valve.
            </div>
        `,
        action: () => {
            navigateToSection('handover');
            const ackBtn = document.getElementById('btnAcknowledgeHandover');
            if (ackBtn && !appState.handoverAcknowledged) ackBtn.click();
        }
    },
    {
        heading: "Step 3: Tracing the 'WHY' in the Experience Graph",
        content: `
            <p><strong>Context & Reasoning:</strong> "Standard systems log *what* happened, but never *why*. Our Experience Graph connects the asset, sensor signals, competing hypotheses, discriminating checks, and verified lessons."</p>
            <div style="background:rgba(0,212,255,0.08); border-left:3px solid #00d4ff; padding:10px 14px; border-radius:6px; margin-top:12px; font-size:0.82rem;">
                <strong>Demo Action:</strong> Showing the complete reasoning chain for P-101 Pump Cavitation.
            </div>
        `,
        action: () => {
            navigateToSection('graph');
            highlightGraphAsset(1);
        }
    },
    {
        heading: "Step 4: Standardizing Practice — 10× Scenario Drills",
        content: `
            <p><strong>Socratic Decision Discipline:</strong> "To guarantee every shift crew has the same reflexes, operators practice rare upsets in our Scenario Engine. The AI asks our signature probe: <em>'What observation would make you change your mind?'</em>"</p>
            <div style="background:rgba(139,92,246,0.08); border-left:3px solid #8b5cf6; padding:10px 14px; border-radius:6px; margin-top:12px; font-size:0.82rem;">
                <strong>Demo Action:</strong> Opening Scenario #1 with live telemetry gauges and Socratic reasoning chips.
            </div>
        `,
        action: () => {
            navigateToSection('scenarios');
            loadAndPlayScenario('pump-cavitation');
        }
    },
    {
        heading: "Step 5: Closing the Gap — Cross-Shift Radar & 1-Page Mentor Brief",
        content: `
            <p><strong>Equalizing Performance:</strong> "Finally, our Cross-Shift Competency Radar benchmarks Shift A vs. Shift B vs. Shift C. When a gap is found, the platform generates a surgical <strong>1-Page Mentor Brief</strong> that eliminates mentor prep time and unifies plant performance."</p>
            <div style="background:rgba(0,212,255,0.12); border-left:3px solid #00d4ff; padding:10px 14px; border-radius:6px; margin-top:12px; font-size:0.82rem;">
                <strong>Conclusion:</strong> <em>"No more shift lottery. Every crew operates with identical senior veteran judgment."</em>
            </div>
        `,
        action: () => navigateToSection('cross-shift')
    }
];

function initDemoMode() {
    const btnDemo = document.getElementById('btnQuickDemo');
    const overlay = document.getElementById('demoOverlay');
    const btnClose = document.getElementById('btnExitDemo');
    const btnNext = document.getElementById('btnNextDemoStep');
    const btnPrev = document.getElementById('btnPrevDemoStep');

    if (btnDemo) {
        btnDemo.addEventListener('click', () => {
            currentDemoStep = 0;
            showDemoStep(currentDemoStep);
            overlay.style.display = 'flex';
        });
    }

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (currentDemoStep < DEMO_STEPS.length - 1) {
                currentDemoStep++;
                showDemoStep(currentDemoStep);
            } else {
                overlay.style.display = 'none';
                showToast('Pitch walkthrough complete! You are ready to present.', 'success');
            }
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentDemoStep > 0) {
                currentDemoStep--;
                showDemoStep(currentDemoStep);
            }
        });
    }
}

function showDemoStep(stepIdx) {
    const step = DEMO_STEPS[stepIdx];
    document.getElementById('demoStepHeading').innerText = step.heading;
    document.getElementById('demoStepBody').innerHTML = step.content;
    document.getElementById('demoStepCounter').innerText = `Step ${stepIdx + 1} of ${DEMO_STEPS.length}`;

    const prevBtn = document.getElementById('btnPrevDemoStep');
    if (prevBtn) prevBtn.disabled = stepIdx === 0;

    const nextBtn = document.getElementById('btnNextDemoStep');
    if (nextBtn) {
        nextBtn.innerHTML = stepIdx === DEMO_STEPS.length - 1 
            ? 'Finish Pitch Demo <i class="fas fa-check"></i>' 
            : 'Next Step <i class="fas fa-chevron-right"></i>';
    }

    if (step.action) step.action();
}

// ==========================================================================
// 10. DOM READY BOOTSTRAP
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initHandoverModule();
    initScenarioEngine();
    initAICoach();
    initMentorBrief();
    initDemoMode();

    console.log('ExpertFlow: Structured Experience Handover & Cross-Shift Competency Engine loaded.');
});
