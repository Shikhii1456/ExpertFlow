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
    ],
    language: 'en',
    seniorMode: false,
    fontScaleIndex: 1,
    viewMode: 'simple'
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
// 1.1 BILINGUAL REPOSITORIES & LOCALIZATION DICTIONARY (HINDI / ENGLISH)
// ==========================================================================

const HANDOVER_DATA_HI = {
    pump: {
        assetName: "P-101 हेवी नैफ्था सेंट्रीफ्यूगल बूस्टर पंप (क्रूड डिस्टिलेशन यूनिट)",
        normal: [
            { label: "फीड थ्रूपुट", val: "850 m³/h (100% रेटेड डिजाइन थ्रूपुट)" },
            { label: "डिस्चार्ज प्रेशर", val: "14.2 kg/cm² स्थिर" },
            { label: "मोटर पावर और एम्प्स", val: "315 kW • 52 एम्पीयर (तीनों फेज संतुलित)" },
            { label: "ल्यूब ऑयल प्रेशर", val: "2.1 bar @ 44°C (डुप्लेक्स कूलर चालू)" }
        ],
        deviations: [
            { label: "कूलिंग बाईपास स्थिति", val: "प्री-हीट सर्ज को रोकने के लिए 11:30 बजे मैनुअल बाईपास 5% खोला गया" },
            { label: "सक्शन स्ट्रेनर DP", val: "शिफ्ट A के दौरान 0.15 bar से बढ़कर 0.42 bar हुआ" },
            { label: "सक्शन ड्रम स्तर", val: "डीसॉल्टर वॉश स्विंग के कारण 48% पर (लक्ष्य: 60%)" }
        ],
        observations: [
            { label: "ध्वनि संकेत (Acoustic)", val: "13:10 बजे सक्शन नोजल के पास बजरी जैसी चरमराहट (gravel crackle) सुनी गई" },
            { label: "केसिंग कंपन (Vibration)", val: "2.1 mm/s से बढ़कर 4.6 mm/s हुआ (अलार्म सीमा: 7.0 mm/s)" },
            { label: "बेयरिंग हाउसिंग तापमान", val: "52°C पर सामान्य (मैकेनिकल सीजर की संभावना खारिज)" }
        ],
        actions: [
            { label: "डिस्चार्ज वाल्व नियंत्रण", val: "पंप को BEP (सर्वोत्तम दक्षता बिंदु) पर लाने के लिए डिस्चार्ज वाल्व 8% थ्रॉटल किया" },
            { label: "NPSH गणना", val: "NPSHa: 3.4m बनाम NPSHr: 3.2m की गणना की (0.2m का क्रिटिकल मार्जिन)" },
            { label: "ल्यूब ऑयल नमूना", val: "दृश्य निरीक्षण: साफ, कोई धातु के कण या बैबिट बुरादा नहीं" }
        ],
        watchpoints: [
            { label: "प्राथमिक निगरानी (PRIORITY)", val: "सक्शन तरल तापमान: यदि तापमान 82°C से ऊपर जाता है, तो तीव्र वेपर कैविटेशन शुरू हो जाएगी" },
            { label: "अनिर्णीत परिकल्पना", val: "सक्शन स्ट्रेनर का आंशिक जाम होना बनाम थर्मल वेपर बबल निर्माण" },
            { label: "OISD-119 एस्केलेशन नियम", val: "यदि कंपन 6.5 mm/s से अधिक हो, तो OISD-119 के तहत तुरंत स्टैंडबाय पंप P-101B चालू करें" }
        ],
        graphFocusId: 1
    },
    column: {
        assetName: "C-201 एटमॉस्फेरिक डिस्टिलेशन कॉलम (42 सीव ट्रे)",
        normal: [
            { label: "क्रूड चार्ज दर", val: "1,200 m³/h (फ्लैश जोन पर 365°C तक प्री-हीटेड)" },
            { label: "कॉलम टॉप प्रेशर", val: "1.45 kg/cm² गेज" },
            { label: "बॉटम स्ट्रिपिंग स्टीम", val: "4.2 T/h @ 12 bar सैचुरेटेड" },
            { label: "नैफ्था ड्रा दर", val: "210 m³/h विनिर्देशानुसार" }
        ],
        deviations: [
            { label: "टॉप रिफ्लक्स फ्लो ओवरराइड", val: "कंट्रोलर मैनुअल 145 m³/h पर सेट (सामान्य: 120 m³/h)" },
            { label: "ओवरहेड DP वृद्धि दर", val: "पिछले 90 मिनट में DP 240 mmWC से बढ़कर 395 mmWC हुआ" },
            { label: "रिफ्लक्स सब-कूलिंग", val: "42°C पर वापसी (अत्यधिक ठंडा, जिससे भारी आंतरिक संघनन हो रहा है)" }
        ],
        observations: [
            { label: "रिफ्लक्स संचायक स्तर", val: "स्तर तेजी से बदल रहा है (साइट ग्लास पर ±15% उतार-चढ़ाव)" },
            { label: "मध्यम खंड डेल्टा-T", val: "DCS ट्रेंड पर ट्रे 18-24 तापमान में 8°C की गिरावट देखी गई" },
            { label: "उत्पाद गंध परीक्षण", val: "13:30 बजे लाइट नैफ्था नमूने में भारी हाइड्रोकार्बन टेल की गंध" }
        ],
        actions: [
            { label: "रीबॉयलर हीट होल्ड", val: "रीबॉयलर फ्यूल गैस में कटौती नहीं की (ट्रे डंपिंग को रोका)" },
            { label: "नमूना जांच", val: "प्रयोगशाला ASTM D86 डिस्टिलेशन कर्व ऑडिट के लिए टॉप नैफ्था नमूना भेजा" },
            { label: "एंटी-फोम तैयारी", val: "सत्यापित किया कि एंटी-फोम केमिकल इंजेक्शन स्किड तैयार और उपलब्ध है" }
        ],
        watchpoints: [
            { label: "हाइड्रोलिक फ्लडिंग जोखिम", val: "कॉलम DP पर नजर रखें: यदि DP 430 mmWC तक पहुंचता है, तो डाउनकमर चोक हो जाएंगे" },
            { label: "रिफ्लक्स डी-एस्केलेशन", val: "आने वाले लीड को टॉप रिफ्लक्स फ्लो 5 m³/h के चरणों में घटाकर 125 m³/h तक लाना चाहिए" },
            { label: "OISD-108 सुरक्षा सीमा", val: "यदि ओवरहेड दबाव 2.8 kg/cm² पर पहुंचता है, तो तुरंत फ्लेयर डाइवर्जन निष्पादित करें" }
        ],
        graphFocusId: 2
    },
    compressor: {
        assetName: "K-301 टू-स्टेज सेंट्रीफ्यूगल वेट गैस कंप्रेसर (FCC यूनिट)",
        normal: [
            { label: "सक्शन मास फ्लो", val: "54,000 kg/h वेट हाइड्रोकार्बन गैस" },
            { label: "डिस्चार्ज प्रेशर", val: "14.8 bar गेज" },
            { label: "टर्बाइन गवर्नर गति", val: "6,800 RPM (रेटेड: 7,200 RPM)" },
            { label: "सील ऑयल डेल्टा-P", val: "रेफरेंस गैस चैंबर से 1.4 bar ऊपर" }
        ],
        deviations: [
            { label: "एंटी-सर्ज रीसायकल वाल्व", val: "डीसॉल्टर फीड स्विंग को बफर करने के लिए बायस +8% खोला गया" },
            { label: "सक्शन ड्रम KO स्तर", val: "बूट स्तर बढ़कर 68% हुआ (ऑटो ड्रेन वाल्व मैनुअल संचालित किया)" },
            { label: "सर्ज मार्जिन बफर", val: "वर्तमान में 12% पर (परिचालन सीमा: >10%)" }
        ],
        observations: [
            { label: "डिस्चार्ज प्रेशर उतार-चढ़ाव", val: "हाई-स्पीड ट्रेंड पर ±0.3 bar प्रेशर फ्लटर देखा गया" },
            { label: "रेडियल कंपन", val: "ड्राइव एंड कंपन: 2.8 mm/s; नॉन-ड्राइव एंड: 3.2 mm/s (स्थिर)" },
            { label: "इंटरस्टेज कूलर तापमान", val: "आउटलेट तापमान 44°C पर (सामान्य)" }
        ],
        actions: [
            { label: "मैनुअल KO बूट ड्रेन", val: "लिक्विड स्लगिंग जोखिम समाप्त करने के लिए सक्शन ड्रम ड्रेन वाल्व चलाया" },
            { label: "गवर्नर कैलिब्रेशन जांच", val: "स्पीड ट्रांसमीटर रिडंडेंसी सही पाई गई" },
            { label: "FCC समन्वय", val: "अपस्ट्रीम फीड स्विंग से पहले सूचित करने के लिए FCC बोर्ड इंजीनियर को निर्देश दिया" }
        ],
        watchpoints: [
            { label: "सर्ज लाइन निकटता", val: "सर्ज मार्जिन पर नजर रखें: यदि अपस्ट्रीम प्रवाह >10% गिरता है, तो रीसायकल लूप तुरंत +15% खोलें" },
            { label: "लिक्विड कैरीओवर खतरा", val: "इम्पेलर में लिक्विड ड्रॉपलेट जाने से रोकने के लिए हर 30 मिनट में KO ड्रम बूट स्तर जांचें" },
            { label: "API 670 ट्रिप सीमा", val: "10 सेकंड के भीतर 3 सर्ज दोलन होने पर ऑटोमैटिक शटडाउन होगा" }
        ],
        graphFocusId: 3
    },
    pipeline: {
        assetName: "PL-400 24-इंच इंटरस्टेट क्रूड सप्लाई पाइपलाइन (500 किमी)",
        normal: [
            { label: "लाइन ऑपरेटिंग प्रेशर", val: "68 bar (MAOP 80 bar का 85%)" },
            { label: "प्रवाह वेग (Velocity)", val: "1.8 m/s निरंतर क्रूड ट्रांसमिशन" },
            { label: "कैथोडिक सुरक्षा", val: "-0.85 V बनाम Cu/CuSO4 संदर्भ इलेक्ट्रोड" },
            { label: "मध्यवर्ती स्टेशन प्रवाह", val: "बूस्टर स्टेशन 1 से 4 तक संतुलित" }
        ],
        deviations: [
            { label: "ऑपरेटिंग प्रेशर डी-रेट", val: "असंगति मूल्यांकन तक 74 bar से घटाकर 68 bar किया गया" },
            { label: "प्रेशर ट्रांसमीटर 12", val: "0.4 bar ट्रांसमीटर ऑफसेट के कारण डुअल सेंसर एवरेजिंग चालू" }
        ],
        observations: [
            { label: "स्मार्ट पिग असंगति ध्वज", val: "इन-लाइन निरीक्षण (ILI) रिपोर्ट में MP 142.6 पर 80% वाल लॉस पिट चिन्हित" },
            { label: "मृदा प्रतिरोधकता जांच", val: "बाहरी मृदा सर्वेक्षण में स्थानीय कोटिंग अलगाव क्षेत्र देखा गया" }
        ],
        actions: [
            { label: "ASME B31G मूल्यांकन", val: "सुरक्षित परिचालन दबाव: 69.4 bar आकलित (वर्तमान में सुरक्षित 68 bar पर चालू)" },
            { label: "उत्खनन सूचना जारी", val: "टाइप-B प्रेशर स्लीव मरम्मत के लिए फील्ड NDT टीम तैनात की गई" },
            { label: "गश्त आवृत्ति बढ़ाई", val: "माइलपोस्ट 140-145 पर हवाई और पैदल गश्त आवृत्ति दोगुनी की" }
        ],
        watchpoints: [
            { label: "दबाव सीमा (BOUNDARY)", val: "पंप शुरू करते समय 70 bar से अधिक के प्रेशर स्पाइक्स पर सख्त रोक" },
            { label: "मरम्मत उत्खनन", val: "मैनुअल खुदाई पाइप क्राउन तक पहुंचने पर फील्ड से वायरलेस पुष्टि अनिवार्य" },
            { label: "OISD-141 अनुपालन", val: "SCADA कंसोल पर रीयल-टाइम लीक डिटेक्शन मॉनिटरिंग सक्रिय" }
        ],
        graphFocusId: 4
    }
};

const VOICE_DEBRIEFS_HI = {
    pump: {
        durationSec: 28,
        durationStr: "00:28",
        transcript: "कुणाल, P-101 पर त्वरित ब्रीफिंग। लगभग 11:30 बजे सक्शन नोजल पर हल्की बजरी जैसी चरमराहट देखी गई और कंपन बढ़कर 4.6 mm/s हो गया। घबराकर पंप बंद मत करना—हमने बेयरिंग हाउसिंग तापमान जांचा है और यह 52°C पर पूरी तरह सामान्य है। यह थर्मल वेपर कैविटेशन है क्योंकि आज सक्शन तरल लगभग 4°C अधिक गर्म था। हमने अपस्ट्रीम सक्शन ड्रम स्तर 1.2 मीटर बढ़ाया और डिस्चार्ज को 8% थ्रॉटल किया। निगरानी बिंदु: सक्शन तरल तापमान सख्ती से 82°C से नीचे रखें। यदि कंपन 6.5 mm/s को पार करता है, तो तुरंत स्टैंडबाय पंप P-101B चालू करें।",
        entities: [
            { cls: "pill-asset", icon: "fa-industry", text: "उपकरण: P-101 सेंट्रीफ्यूगल पंप" },
            { cls: "pill-cue", icon: "fa-ear-listen", text: "ध्वनि संकेत: सक्शन पर बजरी जैसी चरमराहट" },
            { cls: "pill-param", icon: "fa-wave-square", text: "सेंसर: 4.6 mm/s कंपन (चेतावनी)" },
            { cls: "pill-check", icon: "fa-stethoscope", text: "जांच: 52°C बेयरिंग तापमान (सीजर खारिज)" },
            { cls: "pill-hypo", icon: "fa-code-branch", text: "निदान: थर्मल NPSH वेपर कैविटेशन" },
            { cls: "pill-boundary", icon: "fa-triangle-exclamation", text: "सीमा: तापमान < 82°C | ट्रिप कटओवर > 6.5 mm/s" }
        ]
    },
    column: {
        durationSec: 26,
        durationStr: "00:26",
        transcript: "शिफ्ट B टीम, एटमॉस्फेरिक कॉलम C-201 पर ध्यान दें। 10:00 बजे क्रूड बदलने के बाद टॉप डिफरेंशियल प्रेशर 395 mmWC तक पहुंच गया। रीबॉयलर फायरिंग कम न करें—रिफ्लक्स 42°C पर सब-कूल्ड था, जिससे डाउनकमर चोकिंग हुई, न कि रीबॉयलर फोमिंग। हमने टॉप रिफ्लक्स प्रवाह 145 से घटाकर 125 m³/h किया है। निगरानी बिंदु: टॉप DP पर पैनी नजर रखें; यदि यह 430 mmWC छूता है, तो रिफ्लक्स 5 m³/h और घटाएं। यदि कॉलम प्रेशर 2.8 kg/cm² पहुंचता है, तो तुरंत फ्लेयर डाइवर्जन करें।",
        entities: [
            { cls: "pill-asset", icon: "fa-industry", text: "उपकरण: C-201 डिस्टिलेशन कॉलम" },
            { cls: "pill-cue", icon: "fa-wave-square", text: "संकेत: ओवरहेड DP स्पाइक (395 mmWC)" },
            { cls: "pill-param", icon: "fa-temperature-low", text: "सेंसर: रिफ्लक्स 42°C पर सब-कूल्ड" },
            { cls: "pill-check", icon: "fa-stethoscope", text: "जांच: ट्रे तापमान स्थिर (फोमिंग खारिज)" },
            { cls: "pill-hypo", icon: "fa-code-branch", text: "निदान: डाउनकमर हाइड्रोलिक जेट फ्लडिंग" },
            { cls: "pill-boundary", icon: "fa-triangle-exclamation", text: "सीमा: DP < 430 mmWC | फ्लेयर 2.8 kg/cm²" }
        ]
    },
    compressor: {
        durationSec: 25,
        durationStr: "00:25",
        transcript: "कंट्रोल रूम लीड, वेट गैस कंप्रेसर K-301 पर नोट करें। अपस्ट्रीम FCC फीड स्विंग होने पर सक्शन मास फ्लो 22% गिरा। एंटी-सर्ज मार्जिन घटकर 12% रह गया। हमने तुरंत एंटी-सर्ज हॉट गैस बाईपास 15% खोला और टर्बाइन गति संतुलित की। मशीन को ट्रिप न करें—फॉरवर्ड फ्लो अब स्थिर है। निगरानी बिंदु: सर्ज मार्जिन 15% से ऊपर रखें और लिक्विड कैरीओवर से बचाव के लिए हर 30 मिनट में नॉकआउट ड्रम बूट स्तर जांचें।",
        entities: [
            { cls: "pill-asset", icon: "fa-industry", text: "उपकरण: K-301 वेट गैस कंप्रेसर" },
            { cls: "pill-cue", icon: "fa-gauge-high", text: "संकेत: एंटी-सर्ज मार्जिन 12% तक गिरा" },
            { cls: "pill-param", icon: "fa-wind", text: "सेंसर: सक्शन मास फ्लो -22% गिरा" },
            { cls: "pill-check", icon: "fa-stethoscope", text: "जांच: शाफ्ट कंपन 28 µm पर स्थिर" },
            { cls: "pill-hypo", icon: "fa-code-branch", text: "निदान: फीड कमी से सर्ज की संभावना" },
            { cls: "pill-boundary", icon: "fa-triangle-exclamation", text: "सीमा: मार्जिन > 15% | API 670 3-सर्ज ट्रिप" }
        ]
    },
    pipeline: {
        durationSec: 27,
        durationStr: "00:27",
        transcript: "पाइपलाइन प्रेषण, क्रूड ट्रंकलाइन PL-400 पर ब्रीफिंग। इंटेलिजेंट पिगिंग इनलाइन इंस्पेक्शन ने 80% वाल लॉस विसंगति (किलोमीटर 142 पर 9.6mm बाहरी जंग) चिन्हित की है। ASME B31G गणना के आधार पर, हमने सुरक्षित परिचालन के लिए दबाव 68 bar तक सीमित कर दिया है ताकि स्लीव मरम्मत टीम आने तक आपूर्ति जारी रहे। निगरानी बिंदु: बूस्टर पंप शुरू करते समय 70 bar से ऊपर प्रेशर स्पाइक न होने दें, और SCADA लीक डिटेक्शन सक्रिय रखें।",
        entities: [
            { cls: "pill-asset", icon: "fa-industry", text: "उपकरण: PL-400 24-इंच क्रूड ट्रंकलाइन" },
            { cls: "pill-cue", icon: "fa-magnifying-glass-chart", text: "संकेत: स्मार्ट पिग ILI विसंगति (80% वाल लॉस)" },
            { cls: "pill-param", icon: "fa-gauge-simple-high", text: "सेंसर: ऑपरेटिंग दबाव 68 bar तक सीमित" },
            { cls: "pill-check", icon: "fa-stethoscope", text: "जांच: ASME B31G सुरक्षित परिचालन मान्य" },
            { cls: "pill-hypo", icon: "fa-code-branch", text: "निदान: बाहरी कोटिंग क्षति व पिटिंग" },
            { cls: "pill-boundary", icon: "fa-triangle-exclamation", text: "सीमा: दबाव < 70 bar | OISD-141 निगरानी" }
        ]
    }
};

const COMPREHENSION_QUIZZES_HI = {
    pump: {
        question: "शिफ्ट A ने दर्ज किया कि पंप P-101 में बजरी जैसी चरमराहट सुनाई दी और कंपन 4.6 mm/s तक बढ़ गया। शिफ्ट A ने मैकेनिकल बेयरिंग ओवरहॉल के लिए पंप को बाहर निकालने का निर्णय क्यों स्थगित किया?",
        options: [
            { text: "बेयरिंग हाउसिंग का तापमान 52°C पर सामान्य था (75°C विफलता सीमा से काफी नीचे), जिससे सिद्ध हुआ कि यह थर्मल वेपर कैविटेशन था, बेयरिंग सीजर नहीं।", correct: true },
            { text: "स्टैंडबाय पंप P-101B वार्षिक ओवरहॉल के लिए अलग किया गया था।", correct: false },
            { text: "शिफ्ट इंजीनियर शिफ्ट खत्म होने से पहले मेंटेनेंस को सूचित करना भूल गया।", correct: false }
        ],
        watchpoints: [
            "NPSH वेपर प्रेशर सीमा: सक्शन तरल तापमान (+4°C बढ़ा हुआ) सख्ती से 82°C से नीचे रहना चाहिए।",
            "सक्रिय अनिर्णीत परिकल्पना: सक्शन स्ट्रेनर का आंशिक अवरोध बनाम थर्मल वेपर बबल निर्माण।",
            "OISD-119 एस्केलेशन सीमा: यदि कंपन 6.5 mm/s से अधिक हो, तो स्टैंडबाय पंप P-101B तुरंत चालू करें।"
        ]
    },
    column: {
        question: "कॉलम C-201 का टॉप डिफरेंशियल प्रेशर (DP) बढ़कर 395 mmWC हो गया। शिफ्ट A ने रीबॉयलर फर्नेस हीट ड्यूटी में कटौती क्यों नहीं की?",
        options: [
            { text: "फोमिंग/फ्लडिंग के दौरान रीबॉयलर हीट काटने से 40 ट्रे का तरल हाइड्रोकार्बन कॉलम बॉटम बूट में डंप हो सकता है।", correct: true },
            { text: "फर्नेस फ्यूल गैस कंट्रोल वाल्व 100% खुला अटक गया था।", correct: false },
            { text: "DCS रीबॉयलर तापमान सेंसर कैलिब्रेशन से बाहर था।", correct: false }
        ],
        watchpoints: [
            "हाइड्रोलिक चोक: ओवरहेड DP पर नजर रखें; यदि DP 430 mmWC तक पहुंचता है, तो डाउनकमर भर जाएंगे।",
            "रिफ्लक्स डी-एस्केलेशन: आने वाले लीड को रिफ्लक्स प्रवाह 5 m³/h के चरणों में 125 m³/h की ओर ट्रिम करना चाहिए।",
            "OISD-108 सुरक्षा सीमा: यदि कॉलम दबाव 2.8 kg/cm² पहुंचता है, तो तत्काल फ्लेयर डाइवर्जन निष्पादित करें।"
        ]
    },
    compressor: {
        question: "कंप्रेसर K-301 पर एंटी-सर्ज मार्जिन घटकर 12% रह गया। मशीन ट्रिप करने से पहले सही प्रतिक्रिया क्या है?",
        options: [
            { text: "एंटी-सर्ज हॉट गैस रीसायकल लूप +15% खोलें और फॉरवर्ड फ्लो बनाए रखने के लिए टर्बाइन गति धीरे-धीरे संतुलित करें।", correct: true },
            { text: "पूरी FCC को बंद करने के लिए तुरंत मैनुअल इमरजेंसी ट्रिप पुश बटन दबाएं।", correct: false },
            { text: "कंप्रेसर डिस्चार्ज आइसोलेशन वाल्व को ब्लॉक करें।", correct: false }
        ],
        watchpoints: [
            "सर्ज मार्जिन निकटता: यदि फीड प्रवाह >10% गिरता है, तो रीसायकल लूप तुरंत +15% खोलें।",
            "लिक्विड स्लग जोखिम: इम्पेलर्स की सुरक्षा के लिए हर 30 मिनट में सक्शन KO ड्रम बूट स्तर जांचें।",
            "API 670 थ्रेशोल्ड: 10 सेकंड के भीतर 3 तीव्र सर्ज दोलन होने पर ऑटोमैटिक सेफ्टी ट्रिप अनिवार्य है।"
        ]
    },
    pipeline: {
        question: "स्मार्ट पिग ILI ने पाइपलाइन PL-400 पर 80% वाल लॉस (9.6mm पिट) चिन्हित किया। स्लीव मरम्मत से पहले क्या निरंतर परिचालन की अनुमति देता है?",
        options: [
            { text: "ASME B31G अवशिष्ट शक्ति गणना के आधार पर ऑपरेटिंग दबाव को 68 bar तक डी-रेट करना।", correct: true },
            { text: "दबी हुई पाइप पर बाहरी एपॉक्सी पेंट लगाना।", correct: false },
            { text: "10 गुना रासायनिक खुराक पर संक्षारण अवरोधक पंप करना।", correct: false }
        ],
        watchpoints: [
            "दबाव सीमा: बूस्टर पंप शुरू करने के दौरान 70 bar से अधिक के दबाव स्पाइक पर सख्त प्रतिबंध।",
            "NDT मरम्मत टीम: जब हाथ से खुदाई पाइप क्राउन तक पहुंचे तो रेडियो पुष्टि आवश्यक है।",
            "OISD-141 निगरानी: SCADA कंसोल पर निरंतर रिसाव पहचान निगरानी सक्रिय रखें।"
        ]
    }
};

const TRANSLATIONS = {
    en: {
        bannerTitle: '<strong>ExpertFlow:</strong> Operational Continuity & Cross-Shift Competency',
        shiftA: '<i class="fas fa-sun"></i> Shift A (Outgoing)',
        shiftB: '<i class="fas fa-cloud-sun"></i> Shift B (Incoming Lead)',
        seniorBtnActive: 'Senior Mode (Active)',
        seniorBtnInactive: 'Senior Mode (40+)',
        demoBtn: '5-Min Demo',
        nav: {
            overview: 'Executive Overview',
            handover: '1. Structured Handover',
            graph: '2. Experience Graph',
            scenarios: '3. Scenario Engine',
            coach: '4. AI Experience Coach',
            'cross-shift': '5. Cross-Shift Competency',
            'mentor-brief': '6. 1-Page Mentor Brief'
        },
        secHeaders: {
            title1: '<i class="fas fa-gauge text-accent"></i> Normal State',
            desc1: 'Baseline Operating Parameters',
            title2: '<i class="fas fa-arrows-split-up-and-left text-warning"></i> Deviations',
            desc2: 'Overrides & Parameter Tweaks',
            title3: '<i class="fas fa-eye text-purple"></i> Observations',
            desc3: 'Acoustic, Sensory & Weak Signals',
            title4: '<i class="fas fa-wrench text-success"></i> Actions Taken',
            desc4: 'Adjustments & Maintenance Done',
            title5: '<i class="fas fa-bell text-danger"></i> Watch-Points',
            desc5: 'Critical Items for Incoming Shift'
        },
        units: {
            pump: 'P-101 Booster Pump (Cavitation)',
            column: 'C-201 Distillation (Tray Flooding)',
            compressor: 'K-301 Wet Gas Compressor (Surge)',
            pipeline: 'PL-400 Interstate Pipeline (Wall Loss)'
        },
        voice: {
            playBtn: 'Play Verbal Debrief',
            pauseBtn: 'Pause Verbal Debrief',
            applyBtn: '<i class="fas fa-bolt"></i> Auto-Populate 5 Handover Sections from Audio'
        },
        signoff: {
            blindBtn: '<i class="fas fa-eye-slash"></i> Test Blind Sign-Off Block',
            traceBtn: '<i class="fas fa-project-diagram"></i> Trace Reasoning in Graph',
            ackBtn: '<i class="fas fa-shield-halved"></i> Verify & Assume Control'
        },
        gate: {
            modalTitle: 'Active Handover Comprehension Gate',
            modalSub: 'Assuming operational control of Unit requires verified situational awareness. Blind sign-offs are strictly forbidden.',
            dwellTitle: 'Review Dwell-Time Compliance:',
            part1Title: '<i class="fas fa-list-check text-warning"></i> Part 1: Itemized Affirmation of Shift A Watch-Points (Mandatory)',
            part1Helper: 'You must explicitly review and affirm each active operational constraint logged by Shift A:',
            part2Title: '<i class="fas fa-brain text-accent"></i> Part 2: Socratic Cognitive Verification Probe',
            part2Helper: 'Generated from Shift A\'s specific input: Prove that you read the diagnostic rationale before assuming control.',
            part3Title: '<i class="fas fa-shield-halved text-success"></i> Part 3: Dual-Presence Biometric Verification (OISD-166 & IEC 62443)',
            part3Helper: 'Air-gapped on-premise verification against official refinery HR onboarding records. Mandatory physical co-presence of both Shift In-Charges at CCR Console.',
            cancelBtn: 'Cancel & Re-read Log',
            confirmBtn: '<i class="fas fa-signature"></i> Affirm & Seal Handover'
        },
        viewMode: {
            simpleBtn: '<i class="fas fa-hand-pointer"></i> Simple View',
            detailedBtn: '<i class="fas fa-sliders"></i> Detailed View',
            assetTag: 'MONITORED REFINERY EQUIPMENT:',
            step1Title: 'Operational Health & Key Readings',
            step1Sub: 'Live parameters verified across Shift A',
            step2Title: 'Spoken Shift Debrief (Voice Summary)',
            step2Sub: 'Listen to the outgoing lead engineer\'s verbal debrief',
            playText: 'Listen to Verbal Debrief',
            pauseText: 'Pause Verbal Debrief',
            step3Title: 'Critical Watchpoints & Action Rules',
            step3Sub: 'Mandatory constraints you must observe during Shift B',
            signTitle: 'Ready to Assume Shift Custody?',
            signSub: 'Shift A (R. Verma • #IOCL-8821) signed off. Confirm above items to assume operational control as Shift B Lead (K. Mukherjee).',
            acceptBtn: '<i class="fas fa-shield-halved"></i> Confirm & Assume Shift Control',
            acceptedBtn: '<i class="fas fa-check-double"></i> Shift Control Assumed (Shift B Active)'
        }
    },
    hi: {
        bannerTitle: '<strong>ExpertFlow:</strong> परिचालन निरंतरता एवं क्रॉस-शिफ्ट दक्षता',
        shiftA: '<i class="fas fa-sun"></i> शिफ्ट A (आउटगोइंग)',
        shiftB: '<i class="fas fa-cloud-sun"></i> शिफ्ट B (इनकमिंग लीड)',
        seniorBtnActive: 'सीनियर मोड (सक्रिय)',
        seniorBtnInactive: 'सीनियर मोड (40+)',
        demoBtn: '5-मिनट डेमो',
        nav: {
            overview: 'कार्यकारी अवलोकन (Overview)',
            handover: '1. संरचित हैंडओवर (Handover)',
            graph: '2. अनुभव ग्राफ (Experience Graph)',
            scenarios: '3. परिदृश्य सिम्युलेटर (Scenarios)',
            coach: '4. एआई अनुभव कोच (AI Coach)',
            'cross-shift': '5. क्रॉस-शिफ्ट दक्षता (Competency)',
            'mentor-brief': '6. 1-पेज मेंटर ब्रीफ (Mentor Brief)'
        },
        secHeaders: {
            title1: '<i class="fas fa-gauge text-accent"></i> खंड 1: सामान्य परिचालन आधार रेखा',
            desc1: 'दबाव, तापमान, प्रवाह दर, वाल्व स्थिति',
            title2: '<i class="fas fa-arrows-split-up-and-left text-warning"></i> खंड 2: परिचालन विचलन',
            desc2: 'प्रक्रियात्मक ओवरराइड, बाईपास, मैनुअल बायस',
            title3: '<i class="fas fa-eye text-purple"></i> खंड 3: सूक्ष्म संकेत व प्रेक्षण',
            desc3: 'ध्वनि, कंपन, थर्मल और दृष्टिगोचर संकेत',
            title4: '<i class="fas fa-wrench text-success"></i> खंड 4: की गई कार्रवाइयां व कारण',
            desc4: 'किए गए अंतरिम समायोजन और तकनीकी कारण',
            title5: '<i class="fas fa-bell text-danger"></i> खंड 5: अनिर्णीत निगरानी बिंदु',
            desc5: 'सुरक्षा सीमाएं, ट्रिप लिमिट और विफलता थ्रेशोल्ड'
        },
        units: {
            pump: 'P-101 बूस्टर पंप (कैविटेशन)',
            column: 'C-201 डिस्टिलेशन (ट्रे फ्लडिंग)',
            compressor: 'K-301 वेट गैस कंप्रेसर (सर्ज)',
            pipeline: 'PL-400 इंटरस्टेट पाइपलाइन (वाल लॉस)'
        },
        voice: {
            playBtn: 'मौखिक ब्रीफिंग सुनें',
            pauseBtn: 'मौखिक ब्रीफिंग रोकें',
            applyBtn: '<i class="fas fa-bolt"></i> ऑडियो से सीधे 5 खंड स्वतः भरें (बिना टाइप किए)'
        },
        signoff: {
            blindBtn: '<i class="fas fa-eye-slash"></i> अंधाधुंध हस्ताक्षर अवरोध परीक्षण',
            traceBtn: '<i class="fas fa-project-diagram"></i> ग्राफ में तर्क श्रृंखला देखें',
            ackBtn: '<i class="fas fa-shield-halved"></i> सत्यापित करें व प्रभार ग्रहण करें'
        },
        gate: {
            modalTitle: 'सक्रिय हैंडओवर समझ सत्यापन गेट (OISD-166)',
            modalSub: 'इकाई का परिचालन प्रभार लेने के लिए सिद्ध स्थिति-बोध अनिवार्य है। अंधाधुंध हस्ताक्षर पर पूर्ण प्रतिबंध है।',
            dwellTitle: 'समीक्षा ध्यान-अवधि अनुपालन:',
            part1Title: '<i class="fas fa-list-check text-warning"></i> भाग 1: शिफ्ट A के निगरानी बिंदुओं की पुष्टि (अनिवार्य)',
            part1Helper: 'शिफ्ट A द्वारा दर्ज की गई प्रत्येक सक्रिय परिचालन सीमा की स्पष्ट रूप से पुष्टि करें:',
            part2Title: '<i class="fas fa-brain text-accent"></i> भाग 2: सुकराती संज्ञानात्मक सत्यापन प्रश्न (Socratic Probe)',
            part2Helper: 'शिफ्ट A के विशिष्ट इनपुट से उत्पन्न: प्रभार लेने से पहले सिद्ध करें कि आपने नैदानिक तर्क पढ़ा है।',
            part3Title: '<i class="fas fa-shield-halved text-success"></i> भाग 3: दोहरी उपस्थिति बायोमेट्रिक सत्यापन (Dual-Presence)',
            part3Helper: 'रिफाइनरी एचआर रिकॉर्ड से स्थानीय मिलान। सीसीआर कंसोल पर दोनों शिफ्ट प्रभारियों की भौतिक उपस्थिति अनिवार्य है।',
            cancelBtn: 'रद्द करें व लॉग पुनः पढ़ें',
            confirmBtn: '<i class="fas fa-signature"></i> सत्यापित करें व हैंडओवर सील करें'
        },
        viewMode: {
            simpleBtn: '<i class="fas fa-hand-pointer"></i> सरल मोड (Simple)',
            detailedBtn: '<i class="fas fa-sliders"></i> विस्तृत मोड (Detailed)',
            assetTag: 'निगरानी अधीन रिफाइनरी उपकरण:',
            step1Title: 'परिचालन स्थिति एवं मुख्य रीडिंग',
            step1Sub: 'शिफ्ट A के दौरान सत्यापित मुख्य पैरामीटर',
            step2Title: 'मौखिक शिफ्ट ब्रीफिंग (ऑडियो सारांश)',
            step2Sub: 'आउटगोइंग लीड इंजीनियर की मौखिक ब्रीफिंग सुनें',
            playText: 'मौखिक ब्रीफिंग सुनें',
            pauseText: 'मौखिक ब्रीफिंग रोकें',
            step3Title: 'महत्वपूर्ण निगरानी बिंदु व सुरक्षा नियम',
            step3Sub: 'अनिवार्य परिचालन सीमाएं जिनका पालन करना आवश्यक है',
            signTitle: 'क्या आप शिफ्ट प्रभार लेने के लिए तैयार हैं?',
            signSub: 'शिफ्ट A (आर. वर्मा • #IOCL-8821) द्वारा हस्ताक्षरित। शिफ्ट B लीड (के. मुखर्जी) के रूप में नियंत्रण स्वीकार करें।',
            acceptBtn: '<i class="fas fa-shield-halved"></i> पुष्टि करें व शिफ्ट प्रभार ग्रहण करें',
            acceptedBtn: '<i class="fas fa-check-double"></i> शिफ्ट प्रभार ग्रहण किया गया (Shift B सक्रिय)'
        }
    }
};

// ==========================================================================
// 1.2 SIMPLE OPERATOR CONSOLE REPOSITORIES (DISTRACTION-FREE VIEW)
// ==========================================================================

const SIMPLE_VIEW_DATA = {
    pump: {
        assetName: "P-101 Heavy Naphtha Centrifugal Booster Pump (Crude Distillation Unit)",
        healthStatus: "Attention Required",
        healthClass: "attention",
        readings: [
            { name: "Feed Throughput", val: "850 m³/h", status: "100% Design", statusCls: "ok", boxCls: "" },
            { name: "Discharge Pressure", val: "14.2 kg/cm²", status: "Normal Steady", statusCls: "ok", boxCls: "" },
            { name: "Suction Liquid Temp", val: "78°C (+4°C)", status: "Elevated Risk", statusCls: "warn", boxCls: "warn" },
            { name: "Casing Vibration", val: "4.6 mm/s", status: "Warning (Trip 6.5)", statusCls: "warn", boxCls: "warn" }
        ],
        transcript: "Kunal, quick briefing on P-101. Around 11:30 we noticed a slight gravel crackle at the suction nozzle and vibration rose to 4.6 mm/s. Don't panic and pull the pump—we checked bearing temp and it's normal at 52°C. It's thermal cavitation because suction liquid ran 4°C hot. We boosted upstream suction drum level by 1.2m and trimmed discharge. Watch-point: keep suction liquid below 82°C. If vibration crosses 6.5 mm/s, commission standby pump P-101B.",
        watchpoints: [
            { badge: "TEMPERATURE BOUNDARY", badgeCls: "limit", text: "Suction liquid temperature must stay strictly below 82°C to prevent acute vapor cavitation." },
            { badge: "ACTIVE SURVEILLANCE", badgeCls: "active", text: "Observe suction strainer differential pressure; inspect if DP climbs above 0.6 bar." },
            { badge: "OISD-119 ESCALATION", badgeCls: "trip", text: "If casing vibration exceeds 6.5 mm/s, immediately commission standby pump P-101B." }
        ]
    },
    column: {
        assetName: "C-201 Atmospheric Distillation Column (42 Sieve Trays)",
        healthStatus: "DP Attention Required",
        healthClass: "attention",
        readings: [
            { name: "Crude Charge Rate", val: "1,200 m³/h", status: "Normal Feed", statusCls: "ok", boxCls: "" },
            { name: "Overhead DP", val: "395 mmWC", status: "Approaching Choke", statusCls: "warn", boxCls: "warn" },
            { name: "Top Reflux Flow", val: "125 m³/h", status: "Trimmed (-20 m³/h)", statusCls: "ok", boxCls: "" },
            { name: "Column Top Pressure", val: "1.45 kg/cm²", status: "Normal (Trip 2.8)", statusCls: "ok", boxCls: "" }
        ],
        transcript: "Shift B team, heads up on Atmospheric Column C-201. Top differential pressure crept up to 395 mmWC after the 10:00 crude switch. Do not cut reboiler firing—the reflux was subcooled at 42°C, causing downcomer choking, not reboiler foaming. We trimmed top reflux flow smoothly from 145 down to 125 m³/h. Watch-point: watch top DP closely; if it touches 430 mmWC, cut reflux by another 5 m³/h. If column overhead hits 2.8 kg/cm², execute immediate flare diversion.",
        watchpoints: [
            { badge: "HYDRAULIC CHOKE LIMIT", badgeCls: "limit", text: "Keep top differential pressure strictly under 430 mmWC to prevent downcomer choking." },
            { badge: "REFLUX DE-ESCALATION", badgeCls: "active", text: "Incoming lead must continue trimming cold reflux flow in 5 m³/h increments down toward 120 m³/h." },
            { badge: "OISD-108 SAFETY LIMIT", badgeCls: "trip", text: "If column overhead pressure touches 2.8 kg/cm², execute immediate emergency flare diversion." }
        ]
    },
    compressor: {
        assetName: "K-301 Two-Stage Centrifugal Wet Gas Compressor (FCC Unit)",
        healthStatus: "Surge Margin Alert",
        healthClass: "attention",
        readings: [
            { name: "Suction Mass Flow", val: "42,100 kg/h", status: "-22% Feed Swing", statusCls: "warn", boxCls: "warn" },
            { name: "Anti-Surge Margin", val: "12%", status: "Near Limit (Min 10%)", statusCls: "warn", boxCls: "warn" },
            { name: "Governor Speed", val: "8,150 RPM", status: "Trimmed Smoothly", statusCls: "ok", boxCls: "" },
            { name: "Discharge Pressure", val: "14.8 bar", status: "Steady Forward Flow", statusCls: "ok", boxCls: "" }
        ],
        transcript: "Control lead, note on Wet Gas Compressor K-301. Suction mass flow dipped by 22% when upstream FCC cat-cracker swung feed. Anti-surge margin collapsed to 12%. We immediately step-opened the anti-surge hot gas bypass valve by 15% and trimmed turbine speed. Whatever you do, do not trip the machine—forward flow is now stable. Watch-point: keep surge margin above 15% and inspect the suction knockout drum boot level every 30 minutes for liquid carryover.",
        watchpoints: [
            { badge: "SURGE MARGIN RULE", badgeCls: "limit", text: "Maintain anti-surge margin strictly above 15%; step-open hot recycle loop if feed swings >10%." },
            { badge: "LIQUID CARRYOVER DANGER", badgeCls: "active", text: "Manually inspect and drain suction knock-out drum boot every 30 minutes to protect impellers." },
            { badge: "API 670 TRIP PROTOCOL", badgeCls: "trip", text: "3 rapid surge oscillations within 10 seconds will trigger automatic compressor shutdown." }
        ]
    },
    pipeline: {
        assetName: "PL-400 24-Inch Interstate Crude Supply Pipeline (500 km)",
        healthStatus: "Operating Under De-rate",
        healthClass: "attention",
        readings: [
            { name: "Operating Pressure", val: "68 bar", status: "De-rated (MAOP 80)", statusCls: "ok", boxCls: "" },
            { name: "Transmission Rate", val: "1,850 m³/h", status: "Normal Flow", statusCls: "ok", boxCls: "" },
            { name: "Smart Pig Anomaly", val: "80% Pit Depth", status: "KM 142.4 Defect", statusCls: "err", boxCls: "err" },
            { name: "SCADA Leak Detection", val: "Normal (0 Leaks)", status: "High Alert CPM", statusCls: "ok", boxCls: "" }
        ],
        transcript: "Pipeline dispatch, briefing on Crude Trunkline PL-400. Intelligent pigging inline inspection flagged an immediate 80% wall loss anomaly—a 9.6mm external corrosion pit at kilometer 142. Based on ASME B31G calculations, we de-rated line operating pressure to 68 bar so throughput can continue safely until the sleeve repair crew arrives. Watch-point: strictly forbid pressure surges above 70 bar during booster pump starts, and maintain SCADA leak detection monitoring active.",
        watchpoints: [
            { badge: "PRESSURE SURGE CEILING", badgeCls: "limit", text: "Strictly forbid pressure transient spikes above 70 bar during booster pump starts." },
            { badge: "FIELD NDT PROTOCOL", badgeCls: "active", text: "Incoming shift must receive radio confirmation from excavation crew when hand-digging reaches pipe crown." },
            { badge: "OISD-141 SCADA SURVEILLANCE", badgeCls: "trip", text: "Maintain continuous computational mass-balance leak detection algorithm on high alert." }
        ]
    }
};

const SIMPLE_VIEW_DATA_HI = {
    pump: {
        assetName: "P-101 हेवी नैफ्था सेंट्रीफ्यूगल बूस्टर पंप (क्रूड डिस्टिलेशन यूनिट)",
        healthStatus: "विशेष ध्यान अपेक्षित",
        healthClass: "attention",
        readings: [
            { name: "फीड थ्रूपुट", val: "850 m³/h", status: "100% सामान्य", statusCls: "ok", boxCls: "" },
            { name: "डिस्चार्ज प्रेशर", val: "14.2 kg/cm²", status: "स्थिर सामान्य", statusCls: "ok", boxCls: "" },
            { name: "सक्शन तरल तापमान", val: "78°C (+4°C)", status: "बढ़ा हुआ (कैविटेशन जोखिम)", statusCls: "warn", boxCls: "warn" },
            { name: "केसिंग कंपन", val: "4.6 mm/s", status: "चेतावनी (ट्रिप सीमा 6.5)", statusCls: "warn", boxCls: "warn" }
        ],
        transcript: "कुणाल, P-101 पर त्वरित ब्रीफिंग। लगभग 11:30 बजे सक्शन नोजल पर हल्की बजरी जैसी चरमराहट देखी गई और कंपन बढ़कर 4.6 mm/s हो गया। घबराकर पंप बंद मत करना—हमने बेयरिंग हाउसिंग तापमान जांचा है और यह 52°C पर पूरी तरह सामान्य है। यह थर्मल वेपर कैविटेशन है क्योंकि आज सक्शन तरल लगभग 4°C अधिक गर्म था। हमने अपस्ट्रीम सक्शन ड्रम स्तर 1.2 मीटर बढ़ाया और डिस्चार्ज को 8% थ्रॉटल किया। निगरानी बिंदु: सक्शन तरल तापमान सख्ती से 82°C से नीचे रखें। यदि कंपन 6.5 mm/s को पार करता है, तो तुरंत स्टैंडबाय पंप P-101B चालू करें।",
        watchpoints: [
            { badge: "तापमान सीमा", badgeCls: "limit", text: "सक्शन तरल तापमान को सख्ती से 82°C से नीचे रखें ताकि तीव्र वेपर कैविटेशन न हो।" },
            { badge: "सक्रिय निगरानी", badgeCls: "active", text: "सक्शन स्ट्रेनर DP पर नजर रखें; यदि यह 0.6 bar से ऊपर जाए तो तुरंत जांचें।" },
            { badge: "OISD-119 एस्केलेशन", badgeCls: "trip", text: "यदि केसिंग कंपन 6.5 mm/s को पार करता है, तो स्टैंडबाय पंप P-101B तुरंत चालू करें।" }
        ]
    },
    column: {
        assetName: "C-201 एटमॉस्फेरिक डिस्टिलेशन कॉलम (42 सीव ट्रे)",
        healthStatus: "DP ध्यान अपेक्षित",
        healthClass: "attention",
        readings: [
            { name: "क्रूड चार्ज दर", val: "1,200 m³/h", status: "सामान्य फीड", statusCls: "ok", boxCls: "" },
            { name: "ओवरहेड DP", val: "395 mmWC", status: "उच्च (चोक सीमा 430)", statusCls: "warn", boxCls: "warn" },
            { name: "टॉप रिफ्लक्स फ्लो", val: "125 m³/h", status: "संतुलित (-20 m³/h)", statusCls: "ok", boxCls: "" },
            { name: "कॉलम टॉप प्रेशर", val: "1.45 kg/cm²", status: "स्थिर (सुरक्षा 2.8)", statusCls: "ok", boxCls: "" }
        ],
        transcript: "शिफ्ट B टीम, एटमॉस्फेरिक कॉलम C-201 पर ध्यान दें। 10:00 बजे क्रूड बदलने के बाद टॉप डिफरेंशियल प्रेशर 395 mmWC तक पहुंच गया। रीबॉयलर फायरिंग कम न करें—रिफ्लक्स 42°C पर सब-कूल्ड था, जिससे डाउनकमर चोकिंग हुई, न कि रीबॉयलर फोमिंग। हमने टॉप रिफ्लक्स प्रवाह 145 से घटाकर 125 m³/h किया है। निगरानी बिंदु: टॉप DP पर पैनी नजर रखें; यदि यह 430 mmWC छूता है, तो रिफ्लक्स 5 m³/h और घटाएं। यदि कॉलम प्रेशर 2.8 kg/cm² पहुंचता है, तो तुरंत फ्लेयर डाइवर्जन करें।",
        watchpoints: [
            { badge: "हाइड्रोलिक चोक सीमा", badgeCls: "limit", text: "टॉप डिफ्रेंशियल प्रेशर को 430 mmWC से नीचे रखें ताकि डाउनकमर फ्लडिंग न हो।" },
            { badge: "रिफ्लक्स डी-एस्केलेशन", badgeCls: "active", text: "इनकमिंग लीड को कोल्ड रिफ्लक्स प्रवाह 5 m³/h के चरणों में घटाकर 120 m³/h तक लाना चाहिए।" },
            { badge: "OISD-108 सुरक्षा नियम", badgeCls: "trip", text: "यदि कॉलम दबाव 2.8 kg/cm² पहुंचता है, तो तत्काल आपातकालीन फ्लेयर डाइवर्जन निष्पादित करें।" }
        ]
    },
    compressor: {
        assetName: "K-301 टू-स्टेज सेंट्रीफ्यूगल वेट गैस कंप्रेसर (FCC यूनिट)",
        healthStatus: "सर्ज मार्जिन चेतावनी",
        healthClass: "attention",
        readings: [
            { name: "सक्शन मास फ्लो", val: "42,100 kg/h", status: "-22% फीड स्विंग", statusCls: "warn", boxCls: "warn" },
            { name: "एंटी-सर्ज मार्जिन", val: "12%", status: "कम मार्जिन (न्यूनतम 10%)", statusCls: "warn", boxCls: "warn" },
            { name: "गवर्नर गति", val: "8,150 RPM", status: "संतुलित", statusCls: "ok", boxCls: "" },
            { name: "डिस्चार्ज प्रेशर", val: "14.8 bar", status: "स्थिर फॉरवर्ड फ्लो", statusCls: "ok", boxCls: "" }
        ],
        transcript: "कंट्रोल रूम लीड, वेट गैस कंप्रेसर K-301 पर नोट करें। अपस्ट्रीम FCC फीड स्विंग होने पर सक्शन मास फ्लो 22% गिरा। एंटी-सर्ज मार्जिन घटकर 12% रह गया। हमने तुरंत एंटी-सर्ज हॉट गैस बाईपास 15% खोला और टर्बाइन गति संतुलित की। मशीन को ट्रिप न करें—फॉरवर्ड फ्लो अब स्थिर है। निगरानी बिंदु: सर्ज मार्जिन 15% से ऊपर रखें और लिक्विड कैरीओवर से बचाव के लिए हर 30 मिनट में नॉकआउट ड्रम बूट स्तर जांचें।",
        watchpoints: [
            { badge: "सर्ज मार्जिन सीमा", badgeCls: "limit", text: "सर्ज मार्जिन सख्ती से 15% से ऊपर रखें; यदि फीड >10% गिरे तो रीसायकल तुरंत खोलें।" },
            { badge: "लिक्विड कैरीओवर खतरा", badgeCls: "active", text: "इम्पेलर्स की सुरक्षा के लिए हर 30 मिनट में सक्शन KO ड्रम बूट स्तर जांचें व ड्रेन करें।" },
            { badge: "API 670 ट्रिप नियम", badgeCls: "trip", text: "10 सेकंड के भीतर 3 तीव्र सर्ज दोलन होने पर ऑटोमैटिक कंप्रेसर शटडाउन होगा।" }
        ]
    },
    pipeline: {
        assetName: "PL-400 24-इंच इंटरस्टेट क्रूड सप्लाई पाइपलाइन (500 किमी)",
        healthStatus: "डी-रेट पर परिचालन",
        healthClass: "attention",
        readings: [
            { name: "ऑपरेटिंग प्रेशर", val: "68 bar", status: "डी-रेटेड (MAOP 80)", statusCls: "ok", boxCls: "" },
            { name: "ट्रांसमिशन दर", val: "1,850 m³/h", status: "सामान्य प्रवाह", statusCls: "ok", boxCls: "" },
            { name: "स्मार्ट पिग असंगति", val: "80% वाल लॉस", status: "KM 142.4 खराबी", statusCls: "err", boxCls: "err" },
            { name: "SCADA लीक डिटेक्शन", val: "सामान्य (0 लीक)", status: "सक्रिय निगरानी", statusCls: "ok", boxCls: "" }
        ],
        transcript: "पाइपलाइन प्रेषण, क्रूड ट्रंकलाइन PL-400 पर ब्रीफिंग। इंटेलिजेंट पिगिंग इनलाइन इंस्पेक्शन ने 80% वाल लॉस विसंगति (किलोमीटर 142 पर 9.6mm बाहरी जंग) चिन्हित की है। ASME B31G गणना के आधार पर, हमने सुरक्षित परिचालन के लिए दबाव 68 bar तक सीमित कर दिया है ताकि स्लीव मरम्मत टीम आने तक आपूर्ति जारी रहे। निगरानी बिंदु: बूस्टर पंप शुरू करते समय 70 bar से ऊपर प्रेशर स्पाइक न होने दें, और SCADA लीक डिटेक्शन सक्रिय रखें।",
        watchpoints: [
            { badge: "दबाव स्पाइक सीमा", badgeCls: "limit", text: "बूस्टर पंप चालू करते समय 70 bar से अधिक के प्रेशर स्पाइक्स पर सख्त रोक है।" },
            { badge: "फील्ड NDT प्रोटोकॉल", badgeCls: "active", text: "हाथ से खुदाई पाइप क्राउन तक पहुंचने पर फील्ड टीम से वायरलेस पुष्टि अनिवार्य है।" },
            { badge: "OISD-141 SCADA निगरानी", badgeCls: "trip", text: "SCADA पर रीयल-टाइम मास-बैलेंस लीक डिटेक्शन एल्गोरिदम को हाई अलर्ट पर रखें।" }
        ]
    }
};

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
    renderSimpleOperatorView(key);
    updateVoiceDebriefForUnit(key);
}

function renderHandoverCanvas(key) {
    const isHindi = appState.language === 'hi';
    const dataSource = isHindi ? HANDOVER_DATA_HI : HANDOVER_DATA;
    const data = dataSource[key] || HANDOVER_DATA[key];
    const assetEl = document.getElementById('handoverTargetAsset');
    if (assetEl) assetEl.innerText = `${isHindi ? 'संयंत्र उपकरण' : 'Asset'}: ${data.assetName}`;

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
// 3.14 SIMPLE OPERATOR VIEW CONTROLLER (DISTRACTION-FREE 4-STEP CONSOLE)
// ==========================================================================

function renderSimpleOperatorView(unitKey) {
    const isHindi = appState.language === 'hi';
    const dataSource = isHindi ? SIMPLE_VIEW_DATA_HI : SIMPLE_VIEW_DATA;
    const data = dataSource[unitKey] || SIMPLE_VIEW_DATA[unitKey] || SIMPLE_VIEW_DATA.pump;

    // 1. Monitored Asset Name
    const assetEl = document.getElementById('simpleTargetAssetName');
    if (assetEl) assetEl.innerText = data.assetName;

    // 2. Health Pill
    const healthEl = document.getElementById('simpleHealthPill');
    if (healthEl) {
        healthEl.className = `simple-health-pill ${data.healthClass}`;
        const icon = data.healthClass === 'attention' ? 'fa-triangle-exclamation' : (data.healthClass === 'nominal' ? 'fa-circle-check' : 'fa-info-circle');
        healthEl.innerHTML = `<i class="fas ${icon}"></i> ${data.healthStatus}`;
    }

    // 3. Traffic-Light Readings Grid
    const readingsGrid = document.getElementById('simpleReadingsGrid');
    if (readingsGrid && Array.isArray(data.readings)) {
        readingsGrid.innerHTML = data.readings.map(r => `
            <div class="simple-reading-box ${r.boxCls}">
                <div class="reading-name">${r.name}</div>
                <div class="reading-val">${r.val}</div>
                <div class="reading-status ${r.statusCls}">${r.status}</div>
            </div>
        `).join('');
    }

    // 4. Verbal Debrief Transcript
    const transcriptEl = document.getElementById('simpleTranscriptText');
    if (transcriptEl) {
        transcriptEl.innerText = `"${data.transcript}"`;
    }

    // 5. Critical Watchpoints List
    const watchList = document.getElementById('simpleWatchpointsList');
    if (watchList && Array.isArray(data.watchpoints)) {
        watchList.innerHTML = data.watchpoints.map(w => `
            <div class="simple-watchpoint-item">
                <div class="simple-watch-content">
                    <span class="simple-watch-badge ${w.badgeCls}">${w.badge}</span>
                    <div class="simple-watch-text">${w.text}</div>
                </div>
            </div>
        `).join('');
    }

    // 6. Sync equipment selector chips
    document.querySelectorAll('.simple-chip').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-unit') === unitKey);
    });

    // 7. Sync Shift Acceptance Button State
    const acceptBtn = document.getElementById('btnSimpleAcceptHandover');
    if (acceptBtn) {
        if (appState.handoverAcknowledged) {
            acceptBtn.disabled = true;
            acceptBtn.innerHTML = '<i class="fas fa-check-double"></i> <span>' + 
                (isHindi ? 'हैंडओवर हस्ताक्षरित व स्वीकृत ✓' : 'Shift Custody Transferred ✓') + '</span>';
            acceptBtn.style.opacity = '0.85';
            acceptBtn.style.cursor = 'default';
        } else {
            acceptBtn.disabled = false;
            acceptBtn.innerHTML = '<i class="fas fa-shield-halved"></i> <span id="lblSimpleAcceptText">' + 
                (isHindi ? 'पुष्टि करें व शिफ्ट प्रभार ग्रहण करें' : 'Confirm & Assume Shift Control') + '</span>';
            acceptBtn.style.opacity = '1';
            acceptBtn.style.cursor = 'pointer';
        }
    }
}

function setViewMode(mode, silent = false) {
    appState.viewMode = mode;
    const btnSimple = document.getElementById('btnViewSimple');
    const btnDetailed = document.getElementById('btnViewDetailed');
    const isHindi = appState.language === 'hi';

    if (mode === 'simple') {
        document.body.classList.add('simple-view-active');
        if (btnSimple) btnSimple.classList.add('active');
        if (btnDetailed) btnDetailed.classList.remove('active');
        renderSimpleOperatorView(appState.activeUnitKey);
        if (!silent) {
            showToast(
                isHindi 
                    ? 'सरल ऑपरेटर दृश्य सक्रिय: शांत, स्पष्ट और विकर्षण-मुक्त 4-चरण कंसोल' 
                    : 'Simple Operator View Active: Clean, distraction-free 4-step guided console.',
                'info'
            );
        }
    } else {
        document.body.classList.remove('simple-view-active');
        if (btnSimple) btnSimple.classList.remove('active');
        if (btnDetailed) btnDetailed.classList.add('active');
        renderHandoverCanvas(appState.activeUnitKey);
        if (!silent) {
            showToast(
                isHindi 
                    ? 'विस्तृत इंजीनियरिंग डैशबोर्ड सक्रिय: पूर्ण 5-खंड विश्लेषणात्मक दृश्य' 
                    : 'Detailed Engineering View Active: Full 5-section diagnostic workspace.',
                'info'
            );
        }
    }

    localStorage.setItem('expertflow_viewmode', mode);
}

function updateSimplePlayButton(isPlaying) {
    const playBtn = document.getElementById('btnSimplePlayAudio');
    const playIcon = document.getElementById('simplePlayIcon');
    const playText = document.getElementById('lblSimplePlayText');
    const isHindi = appState.language === 'hi';

    if (playBtn) {
        if (isPlaying) {
            playBtn.classList.add('playing');
            if (playIcon) playIcon.className = 'fas fa-pause';
            if (playText) playText.innerText = isHindi ? 'ब्रीफिंग रोकें (Pause)' : 'Pause Verbal Debrief';
        } else {
            playBtn.classList.remove('playing');
            if (playIcon) playIcon.className = 'fas fa-play';
            if (playText) playText.innerText = isHindi ? 'मौखिक ब्रीफिंग सुनें (Play)' : 'Listen to Verbal Debrief';
        }
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
    const isHindi = appState.language === 'hi';
    const dataSource = isHindi ? VOICE_DEBRIEFS_HI : VOICE_DEBRIEFS;
    const fallbackData = VOICE_DEBRIEFS[unitKey] || VOICE_DEBRIEFS.pump;
    const data = dataSource[unitKey] || fallbackData;

    const transcriptEl = document.getElementById('voiceTranscriptText');
    if (transcriptEl) transcriptEl.innerText = `"${data.transcript}"`;

    const totalTimeEl = document.getElementById('voiceTotalTime');
    if (totalTimeEl) totalTimeEl.innerText = data.durationStr || fallbackData.durationStr;

    const currTimeEl = document.getElementById('voiceCurrentTime');
    if (currTimeEl) currTimeEl.innerText = "00:00";

    const statusPill = document.getElementById('voiceStatusPill');
    if (statusPill) {
        statusPill.innerHTML = isHindi 
            ? `<i class="fas fa-volume-high text-success"></i> ऑडियो तैयार (${data.durationStr || fallbackData.durationStr})`
            : `<i class="fas fa-volume-high text-success"></i> Audio Ready (${data.durationStr || fallbackData.durationStr})`;
    }

    const pillsContainer = document.getElementById('voiceEntityPills');
    if (pillsContainer) {
        pillsContainer.innerHTML = data.entities.map(e => `
            <span class="entity-pill ${e.cls}"><i class="fas ${e.icon}"></i> ${e.text}</span>
        `).join('');
    }
}

function playVoiceDebrief() {
    const unitKey = appState.activeUnitKey;
    const isHindi = appState.language === 'hi';
    const dataSource = isHindi ? VOICE_DEBRIEFS_HI : VOICE_DEBRIEFS;
    const fallbackData = VOICE_DEBRIEFS[unitKey] || VOICE_DEBRIEFS.pump;
    const data = dataSource[unitKey] || fallbackData;

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
    if (playText) playText.innerText = isHindi ? 'मौखिक ब्रीफिंग रोकें' : 'Pause Verbal Debrief';
    if (btnStop) btnStop.style.display = 'inline-flex';
    if (waveform) waveform.classList.add('active');

    updateSimplePlayButton(true);

    // Speech Synthesis
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(data.transcript);
        utter.rate = voiceState.speed;
        utter.pitch = 0.95;

        const voices = window.speechSynthesis.getVoices();
        if (isHindi) {
            const preferredHi = voices.find(v => (v.lang && (v.lang.startsWith('hi') || v.lang.includes('IN'))));
            if (preferredHi) utter.voice = preferredHi;
            utter.lang = 'hi-IN';
        } else {
            const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('George') || v.name.includes('Natural') || v.name.includes('Male')));
            if (preferred) utter.voice = preferred;
            utter.lang = 'en-US';
        }

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
    const durationSec = data.durationSec || fallbackData.durationSec || 28;
    const totalDuration = durationSec / voiceState.speed;
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

    updateSimplePlayButton(false);
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

    updateSimplePlayButton(false);
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

            const btnSimpleAck = document.getElementById('btnSimpleAcceptHandover');
            if (btnSimpleAck) {
                btnSimpleAck.disabled = true;
                btnSimpleAck.innerHTML = '<i class="fas fa-check-double"></i> <span>' + 
                    (appState.language === 'hi' ? 'हैंडओवर हस्ताक्षरित व स्वीकृत ✓' : 'Shift Custody Transferred ✓') + '</span>';
                btnSimpleAck.style.opacity = '0.85';
                btnSimpleAck.style.cursor = 'default';
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
    const isHindi = appState.language === 'hi';
    const quizSource = isHindi ? COMPREHENSION_QUIZZES_HI : COMPREHENSION_QUIZZES;
    const fallbackQuiz = COMPREHENSION_QUIZZES[unitKey] || COMPREHENSION_QUIZZES.pump;
    const quizData = quizSource[unitKey] || fallbackQuiz;

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

    const prefix1 = isHindi ? 'परिचालन सीमा' : 'Operational Boundary';
    const prefix2 = isHindi ? 'निगरानी परिकल्पना' : 'Surveillance Hypothesis';
    const prefix3 = isHindi ? 'एस्केलेशन थ्रेशोल्ड' : 'Escalation Threshold';

    if (chk1 && chk1.nextElementSibling) chk1.nextElementSibling.innerHTML = `<strong>${prefix1}:</strong> ${quizData.watchpoints[0]}`;
    if (chk2 && chk2.nextElementSibling) chk2.nextElementSibling.innerHTML = `<strong>${prefix2}:</strong> ${quizData.watchpoints[1]}`;
    if (chk3 && chk3.nextElementSibling) chk3.nextElementSibling.innerHTML = `<strong>${prefix3}:</strong> ${quizData.watchpoints[2]}`;

    // Populate Quiz Question
    const qText = document.getElementById('quizQuestionText');
    const probeTitle = isHindi ? 'नैदानिक समझ सत्यापन' : 'Diagnostic Comprehension Probe';
    if (qText) qText.innerHTML = `<strong>${probeTitle}:</strong> ${quizData.question}`;

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
        showToast(
            isHindi 
                ? 'सिम्युलेटेड अंधाधुंध हस्ताक्षर: देखें कैसे सिस्टम ने शिफ्ट B को रोका और समझ सत्यापन की मांग की!'
                : 'SIMULATED BLIND SIGN-OFF: Notice how the system intercepts Shift B and demands cognitive verification!', 
            'warning'
        );
    }
}

function handleQuizOptionClick(optIdx, isCorrect) {
    const buttons = document.querySelectorAll('.quiz-opt-btn');
    const fbBox = document.getElementById('quizFeedbackBox');
    const isHindi = appState.language === 'hi';

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
            fbBox.innerHTML = isHindi 
                ? '<strong><i class="fas fa-check-circle"></i> संज्ञानात्मक जांच उत्तीर्ण:</strong> सही! आपने शिफ्ट A के नैदानिक तर्क को सत्यापित कर दिया है। हैंडओवर सील करने के लिए नीचे दिए गए तीनों निगरानी बिंदुओं की पुष्टि करें।'
                : '<strong><i class="fas fa-check-circle"></i> Cognitive Check Passed:</strong> Correct! You verified Shift A\'s diagnostic rationale. Complete the watch-point affirmations below to seal handover.';
        } else {
            fbBox.className = 'quiz-feedback err';
            fbBox.innerHTML = isHindi
                ? '<strong><i class="fas fa-triangle-exclamation"></i> अंधाधुंध हस्ताक्षर अवरोधित:</strong> गलत उत्तर! इससे स्पष्ट होता है कि आपने शिफ्ट A के नैदानिक प्रेक्षणों की समीक्षा नहीं की। कृपया खंड 3 और 4 की पुनर्समीक्षा करें।'
                : '<strong><i class="fas fa-triangle-exclamation"></i> Blind Sign-off Intercepted:</strong> Incorrect! Your answer indicates you did not review Shift A\'s diagnostic checks. Review Section 3 & Section 4 in the handover canvas.';
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
// 9.5 40+ SENIOR OPERATOR ACCESSIBILITY & BILINGUAL ENGINE
// ==========================================================================

let currentFontScaleIndex = 1; // 0: 13.5px, 1: 15px (Normal), 2: 17px, 3: 19px
const FONT_SCALES = [
    { size: '13.5px', label: 'sm' },
    { size: '15px',   label: 'md' },
    { size: '17px',   label: 'lg' },
    { size: '19px',   label: 'xl' }
];

function initAccessibilityControls() {
    const btnSenior = document.getElementById('btnToggleSeniorMode');
    const btnDecr = document.getElementById('btnFontDecr');
    const btnReset = document.getElementById('btnFontReset');
    const btnIncr = document.getElementById('btnFontIncr');
    const btnLangEN = document.getElementById('btnLangEN');
    const btnLangHI = document.getElementById('btnLangHI');

    // Load saved preferences if available
    const savedSenior = localStorage.getItem('expertflow_seniormode');
    if (savedSenior === 'true') {
        setSeniorOperatorMode(true, true);
    }

    const savedFontScale = localStorage.getItem('expertflow_fontscale');
    if (savedFontScale !== null) {
        applyFontScaleIndex(parseInt(savedFontScale, 10));
    }

    const savedLang = localStorage.getItem('expertflow_lang') || 'en';
    if (savedLang === 'hi') {
        setLanguage('hi', true);
    }

    if (btnSenior) {
        btnSenior.addEventListener('click', () => {
            const isSenior = !document.body.classList.contains('senior-operator-mode');
            setSeniorOperatorMode(isSenior);
        });
    }

    if (btnDecr) {
        btnDecr.addEventListener('click', () => {
            adjustFontScale(-1);
        });
    }
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            applyFontScaleIndex(1);
            showToast(appState.language === 'hi' ? 'फॉन्ट आकार रीसेट किया गया।' : 'Font size reset to default.', 'info');
        });
    }
    if (btnIncr) {
        btnIncr.addEventListener('click', () => {
            adjustFontScale(1);
        });
    }

    if (btnLangEN) {
        btnLangEN.addEventListener('click', () => {
            setLanguage('en');
        });
    }
    if (btnLangHI) {
        btnLangHI.addEventListener('click', () => {
            setLanguage('hi');
        });
    }

    // View Mode Toggle (Simple Operator View vs Detailed Engineering Dashboard)
    const btnViewSimple = document.getElementById('btnViewSimple');
    const btnViewDetailed = document.getElementById('btnViewDetailed');

    if (btnViewSimple) {
        btnViewSimple.addEventListener('click', () => {
            setViewMode('simple');
        });
    }
    if (btnViewDetailed) {
        btnViewDetailed.addEventListener('click', () => {
            setViewMode('detailed');
        });
    }

    // Equipment Selector Chips in Simple View
    document.querySelectorAll('.simple-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const unit = chip.getAttribute('data-unit');
            if (unit) switchUnitPreset(unit);
        });
    });

    // Audio Play/Pause Button in Simple View
    const btnSimpleAudio = document.getElementById('btnSimplePlayAudio');
    if (btnSimpleAudio) {
        btnSimpleAudio.addEventListener('click', () => {
            if (voiceState.isPlaying) {
                pauseVoiceDebrief();
            } else {
                playVoiceDebrief();
            }
        });
    }

    // Handover Signoff in Simple View (triggers OISD-166 verification gate)
    const btnSimpleAccept = document.getElementById('btnSimpleAcceptHandover');
    if (btnSimpleAccept) {
        btnSimpleAccept.addEventListener('click', () => {
            if (!appState.handoverAcknowledged) {
                openComprehensionGateModal(false);
            }
        });
    }

    // Restore saved view mode preference (default: simple for clean operator experience)
    const savedViewMode = localStorage.getItem('expertflow_viewmode') || 'simple';
    setViewMode(savedViewMode, true);
}

function setSeniorOperatorMode(enable, silent = false) {
    appState.seniorMode = !!enable;
    const btnSenior = document.getElementById('btnToggleSeniorMode');
    const labelSenior = document.getElementById('labelSeniorMode');
    const isHindi = appState.language === 'hi';

    if (enable) {
        document.body.classList.add('senior-operator-mode');
        if (btnSenior) btnSenior.classList.add('active');
        if (labelSenior) labelSenior.innerText = isHindi ? 'सीनियर मोड (सक्रिय)' : 'Senior Mode (Active)';
        if (!silent) {
            showToast(
                isHindi 
                    ? 'सीनियर ऑपरेटर मोड सक्रिय: बड़ा फॉन्ट, उच्च कंट्रास्ट, 48px+ टच-टारगेट (40+ ऑपरेटरों के लिए उपयुक्त)'
                    : 'Senior Operator Mode (40+) ENGAGED: Enlarged fonts, ultra-high contrast & 48px+ touch targets enabled.', 
                'info'
            );
        }
    } else {
        document.body.classList.remove('senior-operator-mode');
        if (btnSenior) btnSenior.classList.remove('active');
        if (labelSenior) labelSenior.innerText = isHindi ? 'सीनियर मोड (40+)' : 'Senior Mode (40+)';
        if (!silent) {
            showToast(
                isHindi ? 'सामान्य डिस्प्ले मोड पर वापस आ गए।' : 'Reverted to Standard UI Mode.', 
                'info'
            );
        }
    }
    localStorage.setItem('expertflow_seniormode', String(enable));
}

function adjustFontScale(delta) {
    let nextIdx = currentFontScaleIndex + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= FONT_SCALES.length) nextIdx = FONT_SCALES.length - 1;
    applyFontScaleIndex(nextIdx);

    const isHindi = appState.language === 'hi';
    const label = FONT_SCALES[nextIdx].label.toUpperCase();
    showToast(
        isHindi ? `फॉन्ट स्केल: ${label}` : `Font Scale adjusted: ${label}`, 
        'info'
    );
}

function applyFontScaleIndex(idx) {
    if (idx < 0) idx = 0;
    if (idx >= FONT_SCALES.length) idx = FONT_SCALES.length - 1;
    currentFontScaleIndex = idx;
    appState.fontScaleIndex = idx;

    if (idx === 1) {
        document.documentElement.style.fontSize = '';
    } else {
        document.documentElement.style.fontSize = FONT_SCALES[idx].size;
    }

    const btnDecr = document.getElementById('btnFontDecr');
    const btnReset = document.getElementById('btnFontReset');
    const btnIncr = document.getElementById('btnFontIncr');

    if (btnReset) btnReset.classList.toggle('active', idx === 1);
    if (btnDecr) btnDecr.classList.toggle('active', idx === 0);
    if (btnIncr) btnIncr.classList.toggle('active', idx >= 2);

    localStorage.setItem('expertflow_fontscale', String(idx));
}

function setLanguage(lang, silent = false) {
    appState.language = lang;
    const btnEN = document.getElementById('btnLangEN');
    const btnHI = document.getElementById('btnLangHI');

    if (btnEN) btnEN.classList.toggle('active', lang === 'en');
    if (btnHI) btnHI.classList.toggle('active', lang === 'hi');

    if (lang === 'hi') {
        document.body.classList.add('lang-hindi');
    } else {
        document.body.classList.remove('lang-hindi');
    }

    applyTranslations(lang);

    // Refresh dynamic components in chosen language
    renderHandoverCanvas(appState.activeUnitKey);
    updateVoiceDebriefForUnit(appState.activeUnitKey);

    localStorage.setItem('expertflow_lang', lang);

    if (!silent) {
        showToast(
            lang === 'hi'
                ? 'भाषा हिन्दी में बदली गई (Bilingual Hindi Mode Active)'
                : 'Language switched to English (Standard)',
            'info'
        );
    }
}

function applyTranslations(lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

    // Header elements
    const bannerTitle = document.getElementById('txtBannerTitle');
    if (bannerTitle) bannerTitle.innerHTML = t.bannerTitle;

    const shiftA = document.getElementById('txtShiftATag');
    if (shiftA) shiftA.innerHTML = t.shiftA;

    const shiftB = document.getElementById('txtShiftBTag');
    if (shiftB) shiftB.innerHTML = t.shiftB;

    const labelSenior = document.getElementById('labelSeniorMode');
    if (labelSenior) {
        labelSenior.innerText = appState.seniorMode ? t.seniorBtnActive : t.seniorBtnInactive;
    }

    const demoBtn = document.getElementById('txtBtnDemo');
    if (demoBtn) demoBtn.innerText = t.demoBtn;

    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        const sec = item.getAttribute('data-section');
        const span = item.querySelector('span:not(.nav-badge)');
        if (span && t.nav[sec]) {
            span.innerText = t.nav[sec];
        }
    });

    // 5 Section headers
    const secT1 = document.getElementById('lblSecTitle1');
    const secD1 = document.getElementById('lblSecDesc1');
    if (secT1) secT1.innerHTML = t.secHeaders.title1;
    if (secD1) secD1.innerText = t.secHeaders.desc1;

    const secT2 = document.getElementById('lblSecTitle2');
    const secD2 = document.getElementById('lblSecDesc2');
    if (secT2) secT2.innerHTML = t.secHeaders.title2;
    if (secD2) secD2.innerText = t.secHeaders.desc2;

    const secT3 = document.getElementById('lblSecTitle3');
    const secD3 = document.getElementById('lblSecDesc3');
    if (secT3) secT3.innerHTML = t.secHeaders.title3;
    if (secD3) secD3.innerText = t.secHeaders.desc3;

    const secT4 = document.getElementById('lblSecTitle4');
    const secD4 = document.getElementById('lblSecDesc4');
    if (secT4) secT4.innerHTML = t.secHeaders.title4;
    if (secD4) secD4.innerText = t.secHeaders.desc4;

    const secT5 = document.getElementById('lblSecTitle5');
    const secD5 = document.getElementById('lblSecDesc5');
    if (secT5) secT5.innerHTML = t.secHeaders.title5;
    if (secD5) secD5.innerText = t.secHeaders.desc5;

    // Unit presets
    const btnPump = document.getElementById('btnUnitPump');
    if (btnPump) btnPump.innerText = t.units.pump;
    const btnCol = document.getElementById('btnUnitColumn');
    if (btnCol) btnCol.innerText = t.units.column;
    const btnComp = document.getElementById('btnUnitCompressor');
    if (btnComp) btnComp.innerText = t.units.compressor;
    const btnPipe = document.getElementById('btnUnitPipeline');
    if (btnPipe) btnPipe.innerText = t.units.pipeline;

    // Voice debrief buttons
    const playText = document.getElementById('voicePlayText');
    if (playText) playText.innerText = voiceState.isPlaying ? t.voice.pauseBtn : t.voice.playBtn;
    const applyBtn = document.getElementById('btnApplyVoiceToHandover');
    if (applyBtn) applyBtn.innerHTML = t.voice.applyBtn;

    // Signoff buttons
    const blindBtn = document.getElementById('btnTestBlindSignOff');
    if (blindBtn) blindBtn.innerHTML = t.signoff.blindBtn;
    const traceBtn = document.getElementById('btnTraceReasoningFromHandover');
    if (traceBtn) traceBtn.innerHTML = t.signoff.traceBtn;
    const ackBtn = document.getElementById('btnAcknowledgeHandover');
    if (ackBtn && !appState.handoverAcknowledged) ackBtn.innerHTML = t.signoff.ackBtn;

    // Gate modal
    const gateTitle = document.getElementById('gateModalHeaderTitle');
    if (gateTitle) gateTitle.innerText = t.gate.modalTitle;
    const gateSub = document.getElementById('gateModalHeaderSub');
    if (gateSub) gateSub.innerText = t.gate.modalSub;
    const dwellTitle = document.getElementById('dwellTitleText');
    if (dwellTitle) dwellTitle.innerText = t.gate.dwellTitle;
    const part1T = document.getElementById('gatePart1Title');
    if (part1T) part1T.innerHTML = t.gate.part1Title;
    const part1H = document.getElementById('gatePart1Helper');
    if (part1H) part1H.innerText = t.gate.part1Helper;
    const part2T = document.getElementById('gatePart2Title');
    if (part2T) part2T.innerHTML = t.gate.part2Title;
    const part2H = document.getElementById('gatePart2Helper');
    if (part2H) part2H.innerText = t.gate.part2Helper;
    const part3T = document.getElementById('gatePart3Title');
    if (part3T) part3T.innerHTML = t.gate.part3Title;
    const part3H = document.getElementById('gatePart3Helper');
    if (part3H) part3H.innerText = t.gate.part3Helper;
    const cancelBtn = document.getElementById('btnCancelGateModal');
    if (cancelBtn) cancelBtn.innerText = t.gate.cancelBtn;
    const confirmBtn = document.getElementById('btnConfirmActiveVerification');
    if (confirmBtn && !appState.handoverAcknowledged) confirmBtn.innerHTML = t.gate.confirmBtn;

    // Simple Operator View Translations
    if (t.viewMode) {
        const lblSimple = document.getElementById('lblViewSimple');
        if (lblSimple) lblSimple.innerText = lang === 'hi' ? 'सरल मोड (Simple)' : 'Simple View';
        const lblDetailed = document.getElementById('lblViewDetailed');
        if (lblDetailed) lblDetailed.innerText = lang === 'hi' ? 'विस्तृत मोड (Detailed)' : 'Detailed View';

        const assetTag = document.getElementById('lblSimpleAssetTag');
        if (assetTag) assetTag.innerText = t.viewMode.assetTag;

        const s1Title = document.getElementById('lblSimpleStep1Title');
        const s1Sub = document.getElementById('lblSimpleStep1Sub');
        if (s1Title) s1Title.innerText = t.viewMode.step1Title;
        if (s1Sub) s1Sub.innerText = t.viewMode.step1Sub;

        const s2Title = document.getElementById('lblSimpleStep2Title');
        const s2Sub = document.getElementById('lblSimpleStep2Sub');
        if (s2Title) s2Title.innerText = t.viewMode.step2Title;
        if (s2Sub) s2Sub.innerText = t.viewMode.step2Sub;

        const playText = document.getElementById('lblSimplePlayText');
        if (playText) playText.innerText = voiceState.isPlaying ? t.viewMode.pauseText : t.viewMode.playText;

        const s3Title = document.getElementById('lblSimpleStep3Title');
        const s3Sub = document.getElementById('lblSimpleStep3Sub');
        if (s3Title) s3Title.innerText = t.viewMode.step3Title;
        if (s3Sub) s3Sub.innerText = t.viewMode.step3Sub;

        const signTitle = document.getElementById('lblSimpleSignTitle');
        const signSub = document.getElementById('lblSimpleSignSub');
        if (signTitle) signTitle.innerText = t.viewMode.signTitle;
        if (signSub) signSub.innerText = t.viewMode.signSub;

        const acceptText = document.getElementById('lblSimpleAcceptText');
        if (acceptText && !appState.handoverAcknowledged) {
            acceptText.innerText = lang === 'hi' ? 'पुष्टि करें व शिफ्ट प्रभार ग्रहण करें' : 'Confirm & Assume Shift Control';
        }
    }

    if (appState.viewMode === 'simple') {
        renderSimpleOperatorView(appState.activeUnitKey);
    }
}

// ==========================================================================
// 10. DOM READY BOOTSTRAP
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initAccessibilityControls();
    initNavigation();
    initHandoverModule();
    initScenarioEngine();
    initAICoach();
    initMentorBrief();
    initDemoMode();

    console.log('ExpertFlow: Structured Experience Handover & Cross-Shift Competency Engine loaded.');
});
