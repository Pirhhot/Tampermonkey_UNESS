// ==UserScript==
// @name         UNESS - Dashboard Global (Moyennes & Erreurs)
// @namespace    https://entrainement.uness.fr/
// @version      2.2.0
// @description  Bouton unique pour calculer la moyenne pondérée par tentative et analyser les erreurs par dossier et par spécialité EDN (classification prioritaire par question).
// @author       Thomas Berthomier
// @match        https://entrainement.uness.fr/annales/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=uness.fr
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // 1. BASE DE CONNAISSANCES & CLASSIFICATION DES ERREURS (EDN)
    // =========================================================================
    const UE_SPECIALTIES = [
        {
            id: "pedia", label: "Pédiatrie", color: "#f59e0b", weak: true,
            kw: ["enfant", "nourrisson", "nouveau-ne", "neonat", "pediatr", "bebe", "adolescen", "mois de vie", "carnet de sante", "courbe de croissance", "ans et demi"],
            themes: [
                { name: "Croissance / retard staturo-pondéral", kw: ["croissance", "staturo", "retard statural", "taille cible", "vitesse de croissance", "age osseux", "petite taille", "ds)", " ds ", "courbe de taille", "hormone de croissance", "gh "] },
                { name: "Puberté normale et pathologique", kw: ["puberte", "pubert", "tanner", "premature", "menarche", "thelarche"] },
                { name: "Alimentation du nourrisson", kw: ["allaitement", "lait maternel", "preparation pour nourrisson", "diversification", "biberon", "vitamine d", "vitamine k"] },
                { name: "Suivi du nourrisson / développement", kw: ["developpement psychomoteur", "examen obligatoire", "tenue de tete", "marche acquise", "langage", "depistage auditif", "guthrie"] },
                { name: "Vaccinations", kw: ["vaccin", "rappel", "calendrier vaccinal", "rougeole", "coqueluche"] },
                { name: "Fièvre aiguë de l'enfant / déshydratation", kw: ["fievre aigue", "purpura fulminans", "convulsion febrile", "gastro-enterite", "deshydratation", "solute de rehydratation"] },
                { name: "Handicap / troubles des apprentissages", kw: ["mdph", "ulis", "handicap", "trouble du neurodeveloppement", "pai", "scolarit"] },
                { name: "Maltraitance / enfance en danger", kw: ["maltraitance", "signalement", "enfant en danger", "bebe secoue", "information preoccupante"] },
                { name: "Boiterie de l'enfant", kw: ["boiterie", "epiphysiolyse", "osteochondrite", "rhume de hanche", "synovite"] },
                { name: "Néonatologie", kw: ["prematur", "ictere neonatal", "detresse respiratoire du nouveau", "apgar", "salle de naissance"] },
            ],
        },
        {
            id: "dig", label: "Hépato-gastro-entérologie", color: "#10b981",
            kw: ["digesti", "hepat", "foie", "colon", "rect", "estomac", "duoden", "oesophag", "pancrea", "biliaire", "cholest", "transaminase", "endoscop", "coloscop", "fogd", "selles", "diarrhee", "constipation", "ascite", "abdomen", "abdominal", "proctolog", "intestin", "grele", "coeliaque"],
            themes: [
                { name: "RGO / œsophage", kw: ["reflux", "rgo", "oesophag", "pyrosis", "dysphagie"] },
                { name: "Ulcère gastro-duodénal / H. pylori", kw: ["ulcere", "helicobacter", "pylori", "ipp", "gastrite"] },
                { name: "Hémorragie digestive", kw: ["hemorragie digestive", "hematemese", "mel", "rectorragie", "varices oesophag"] },
                { name: "Cirrhose et complications", kw: ["cirrhose", "ascite", "encephalopathie hepatique", "child", "hypertension portale", "chc", "carcinome hepato"] },
                { name: "Hépatites virales", kw: ["hepatite b", "hepatite c", "vhb", "vhc", "aghbs", "hepatite virale"] },
                { name: "Pancréatite", kw: ["pancreatite", "lipase"] },
                { name: "Lithiase biliaire / cholécystite / angiocholite", kw: ["lithiase biliaire", "cholecyst", "angiocholite", "vesicule"] },
                { name: "MICI (Crohn / RCH)", kw: ["crohn", "rectocolite", "rch", "mici"] },
                { name: "Diarrhée / maladie cœliaque", kw: ["diarrhee", "coeliaque", "malabsorption", "anti-transglutaminase"] },
                { name: "Cancer colorectal", kw: ["cancer colorectal", "adenocarcinome colique", "polype", "cancer du colon", "cancer du rectum"] },
                { name: "Occlusion / urgences abdominales", kw: ["occlusion", "appendicite", "peritonite", "sigmoidite", "diverticul", "hernie"] },
            ],
        },
        {
            id: "pneumo", label: "Pneumologie", color: "#3b82f6",
            kw: ["pneumo", "poumon", "pulmonaire", "bronch", "respiratoire", "dyspnee", "toux", "spirometr", "efr", "tdm thoracique", "radiographie thoracique", "pleur", "sao2", "gaz du sang", "oxygen"],
            themes: [
                { name: "Asthme / allergies respiratoires", kw: ["asthme", "beta-2", "corticoide inhale", "debit expiratoire de pointe", "dep", "sifflement"] },
                { name: "BPCO / insuffisance respiratoire", kw: ["bpco", "tabagi", "insuffisance respiratoire", "emphyseme", "vems", "tiffeneau"] },
                { name: "Pneumopathies infectieuses", kw: ["pneumopathie", "pneumonie", "legionell", "pneumocoque", "foyer"] },
                { name: "Tuberculose", kw: ["tuberculose", "bk", "quantiferon", "idr"] },
                { name: "Embolie pulmonaire", kw: ["embolie pulmonaire", "angioscanner", "d-dimeres", "wells"] },
                { name: "Cancer du poumon", kw: ["cancer bronchique", "cancer du poumon", "nodule pulmonaire", "carcinome bronch"] },
                { name: "Plèvre (épanchement, pneumothorax)", kw: ["epanchement pleural", "pneumothorax", "pleuresie", "ponction pleurale"] },
                { name: "Mucoviscidose", kw: ["mucoviscidose", "test de la sueur", "cftr"] },
                { name: "Bronchiolite / détresse respiratoire de l'enfant", kw: ["bronchiolite", "desobstruction rhinopharyngee", "detresse respiratoire", "gene respiratoire", "laryngite", "corps etranger"] },
            ],
        },
        {
            id: "cardio", label: "Cardiologie / vasculaire", color: "#ef4444",
            kw: ["cardi", "coeur", "ecg", "electrocardiogramme", "tachycard", "bradycard", "souffle", "tension arterielle", "pression arterielle", "coronar", "troponine", "echocardiograph", "vascul", "arter"],
            themes: [
                { name: "Hypertension artérielle", kw: ["hta", "hypertension arterielle"] },
                { name: "Syndrome coronarien aigu", kw: ["sca", "infarctus", "st+", "sus-decalage", "angor", "coronarographie", "troponine"] },
                { name: "Insuffisance cardiaque", kw: ["insuffisance cardiaque", "bnp", "oap", "oedeme aigu", "fevg"] },
                { name: "Fibrillation atriale / troubles du rythme", kw: ["fibrillation", "flutter", "arythmie", "anticoagulation", "cha2ds2", "tachycardie ventriculaire"] },
                { name: "Valvulopathies / endocardite", kw: ["valvulopathie", "retrecissement aortique", "insuffisance mitrale", "endocardite", "duke"] },
                { name: "Péricardite / myocardite", kw: ["pericardite", "myocardite", "tamponnade"] },
                { name: "Thrombose veineuse", kw: ["thrombose veineuse", "tvp", "phlebite", "heparine", "aod"] },
                { name: "Artériopathie / AAA", kw: ["arteriopathie", "aomi", "claudication", "anevrisme"] },
                { name: "Cardiopathies congénitales", kw: ["cardiopathie congenitale", "cia", "civ", "canal arteriel", "tetralogie"] },
            ],
        },
        {
            id: "neuro", label: "Neurologie", color: "#8b5cf6",
            kw: ["neurolog", "cerebr", "encephal", "crise", "convulsi", "deficit moteur", "paralysie", "irm cerebrale", "ponction lombaire", "cephalee", "conscience", "glasgow", "nerf", "neuropathie", "medullaire"],
            themes: [
                { name: "AVC / AIT", kw: ["avc", "ait", "accident vasculaire", "thrombolyse", "thrombectomie", "hemiplegie", "aphasie"] },
                { name: "Épilepsie / crises convulsives", kw: ["epilep", "crise convulsive", "etat de mal", "eeg", "convulsion"] },
                { name: "Céphalées / migraine", kw: ["cephalee", "migraine", "hemorragie meningee", "hsa"] },
                { name: "Méningites / méningo-encéphalites", kw: ["meningite", "meningo-encephalite", "syndrome meninge", "raideur de nuque"] },
                { name: "Sclérose en plaques", kw: ["sclerose en plaques", "sep", "nevrite optique"] },
                { name: "Parkinson / mouvements anormaux", kw: ["parkinson", "tremblement", "dopa"] },
                { name: "Neuropathies / Guillain-Barré", kw: ["guillain", "polyradiculo", "neuropathie peripherique", "emg"] },
                { name: "Troubles cognitifs / démences", kw: ["alzheimer", "demence", "troubles cognitifs", "mmse"] },
                { name: "Coma / trouble de conscience", kw: ["coma", "glasgow", "trouble de la conscience"] },
            ],
        },
        {
            id: "endoc", label: "Endocrinologie / diabéto / nutrition", color: "#ec4899",
            kw: ["endocrin", "hormon", "thyroid", "tsh", "t4", "diabet", "glycemie", "insulin", "surrenal", "cortisol", "hypophys", "obesite", "imc", "nutrition", "denutrition"],
            themes: [
                { name: "Diabète", kw: ["diabet", "hba1c", "acidocetose", "insulin", "metformine", "hypoglycemie"] },
                { name: "Hypothyroïdie", kw: ["hypothyroid", "levothyrox", "hashimoto"] },
                { name: "Hyperthyroïdie / nodule thyroïdien", kw: ["hyperthyroid", "basedow", "graves", "nodule thyroid", "goitre", "thyrotoxicose"] },
                { name: "Insuffisance surrénale / Cushing", kw: ["insuffisance surrenal", "addison", "cushing", "hypercorticisme", "synacthene"] },
                { name: "Hypophyse", kw: ["hypophys", "prolactin", "adenome hypophysaire", "acromegalie", "deficit en gh"] },
                { name: "Obésité / dénutrition", kw: ["obesite", "denutrition", "imc", "anorexie mentale"] },
                { name: "Calcium / dyslipidémie", kw: ["hypercalcemie", "hypocalcemie", "parathyr", "dyslipidemie", "ldl", "cholesterol"] },
            ],
        },
        {
            id: "nephro", label: "Néphrologie / urologie", color: "#06b6d4",
            kw: ["rein", "renal", "nephr", "creatinin", "dfg", "proteinurie", "hematurie", "uro", "vessie", "prostat", "kaliemie", "natremie", "ionogramme", "dialyse"],
            themes: [
                { name: "Insuffisance rénale aiguë", kw: ["insuffisance renale aigue", "ira", "anurie", "oligurie"] },
                { name: "Insuffisance rénale chronique", kw: ["insuffisance renale chronique", "irc", "dialyse", "mrc"] },
                { name: "Troubles hydro-électrolytiques", kw: ["hyponatremie", "hypernatremie", "hyperkaliemie", "hypokaliemie", "dyskaliemie", "dysnatremie", "acidose", "alcalose"] },
                { name: "Syndrome néphrotique / glomérulopathies", kw: ["syndrome nephrotique", "glomerul", "nephropathie a iga", "syndrome nephritique"] },
                { name: "Infections urinaires", kw: ["infection urinaire", "pyelonephrite", "cystite", "ecbu", "bandelette urinaire"] },
                { name: "Lithiase / colique néphrétique", kw: ["colique nephretique", "lithiase urinaire", "calcul"] },
                { name: "Prostate / tumeurs urologiques", kw: ["prostat", "psa", "tumeur de vessie", "cancer du rein"] },
            ],
        },
        {
            id: "infectio", label: "Infectiologie", color: "#84cc16",
            kw: ["infecti", "antibio", "bacteri", "viral", "sepsis", "choc septique", "hemoculture", "fievre", "crp", "procalcitonine"],
            themes: [
                { name: "Sepsis / choc septique", kw: ["sepsis", "choc septique", "bacteriemie", "hemoculture", "qsofa"] },
                { name: "VIH / IST", kw: ["vih", "sida", "syphilis", "chlamydia", "gonocoque", "ist"] },
                { name: "Fièvre au retour de voyage / paludisme", kw: ["paludisme", "plasmodium", "voyage", "frottis sanguin"] },
                { name: "Infections cutanées", kw: ["erysipele", "dermohypodermite", "fasciite", "impetigo"] },
                { name: "Infections ostéo-articulaires", kw: ["arthrite septique", "osteomyelite", "spondylodiscite"] },
                { name: "Antibiothérapie", kw: ["amoxicilline", "ceftriaxone", "antibiotherapie", "cefotaxime", "vancomycine", "gentamicine"] },
            ],
        },
        {
            id: "gyneco", label: "Gynécologie-obstétrique", color: "#d946ef",
            kw: ["gyneco", "obstetri", "grossesse", "enceinte", "accouchement", "uterus", "ovaire", "sein", "menstru", "regles", "contracep", "amenorrhee", "sa)", "semaines d'amenorrhee"],
            themes: [
                { name: "Grossesse / suivi prénatal", kw: ["grossesse", "suivi prenatal", "echographie obstetricale", "beta-hcg", "terme"] },
                { name: "Pré-éclampsie / HTA gravidique", kw: ["pre-eclampsie", "preeclampsie", "hellp", "hta gravidique", "eclampsie"] },
                { name: "Hémorragies / GEU", kw: ["grossesse extra-uterine", "geu", "metrorragie", "hemorragie du post-partum", "placenta"] },
                { name: "Contraception / IVG", kw: ["contracep", "pilule", "diu", "ivg", "sterilet"] },
                { name: "Aménorrhée / troubles du cycle", kw: ["amenorrhee", "spm", "dysmenorrhee", "sopk"] },
                { name: "Cancers gynéco / sein", kw: ["cancer du sein", "mammographie", "cancer du col", "frottis", "hpv", "cancer de l'ovaire", "endometre"] },
                { name: "Ménopause", kw: ["menopause", "ths", "bouffees de chaleur"] },
            ],
        },
        {
            id: "hemato", label: "Hématologie / oncologie", color: "#f43f5e",
            kw: ["hemato", "anemie", "hemoglobine", "plaquette", "thrombopen", "leucocyt", "neutropen", "lymphom", "leucemie", "myelome", "hemostase", "transfusion", "nfs", "oncolog", "chimiotherap", "metasta", "tumeur", "cancer"],
            themes: [
                { name: "Anémies", kw: ["anemie", "ferritine", "carence martiale", "vgm", "reticulocyte", "hemolyse", "drepanocytose", "thalassemie"] },
                { name: "Thrombopénie / purpura", kw: ["thrombopenie", "purpura", "pti", "plaquette"] },
                { name: "Hémostase / anticoagulants", kw: ["hemophilie", "willebrand", "tca", "tp ", "avk", "inr", "anticoagul"] },
                { name: "Leucémies / lymphomes / myélome", kw: ["leucemie", "lymphome", "hodgkin", "myelome", "adenopathie", "blastes"] },
                { name: "Transfusion", kw: ["transfusion", "culot globulaire", "groupe sanguin", "rai"] },
                { name: "Oncologie générale / soins palliatifs", kw: ["chimiotherap", "radiotherap", "soins palliatifs", "metasta", "annonce", "rcp"] },
            ],
        },
        {
            id: "rhumato", label: "Rhumatologie / orthopédie / médecine interne", color: "#a16207",
            kw: ["rhumat", "articul", "arthr", "osseu", "os ", "fracture", "rachis", "lombalgie", "genou", "hanche", "epaule", "lupus", "vascularite", "auto-immun", "anticorps anti", "osteoporose"],
            themes: [
                { name: "Fractures / traumatologie", kw: ["fracture", "entorse", "luxation", "traumatisme"] },
                { name: "Arthrites (PR, spondyloarthrite, goutte)", kw: ["polyarthrite rhumatoide", "spondylarthrite", "spondyloarthrite", "goutte", "chondrocalcinose", "arthrite"] },
                { name: "Lombalgie / sciatique", kw: ["lombalgie", "sciatique", "lombosciatique", "hernie discale", "radiculalgie"] },
                { name: "Ostéoporose / maladies osseuses", kw: ["osteoporose", "densitometrie", "maladie osseuse", "rachitisme", "osteomalacie"] },
                { name: "Lupus / vascularites / maladies systémiques", kw: ["lupus", "vascularite", "horton", "sclerodermie", "sjogren", "kawasaki", "maladie systemique"] },
            ],
        },
        {
            id: "psy", label: "Psychiatrie / addictologie", color: "#64748b",
            kw: ["psychiatr", "depress", "anxie", "suicid", "psychose", "schizophr", "bipolai", "addict", "alcool", "cannabis", "opiac", "sevrage", "trouble du comportement"],
            themes: [
                { name: "Dépression / risque suicidaire", kw: ["depress", "suicid", "antidepresseur", "isrs"] },
                { name: "Troubles anxieux", kw: ["anxie", "attaque de panique", "toc", "phobie", "stress post"] },
                { name: "Troubles psychotiques / bipolaires", kw: ["schizophr", "psychose", "bipolai", "manie", "delire", "antipsychotique", "lithium"] },
                { name: "Addictions", kw: ["alcool", "cannabis", "tabac", "opiac", "sevrage", "addict"] },
                { name: "Troubles du neurodéveloppement / TCA", kw: ["tdah", "autisme", "tsa", "anorexie", "boulimie", "trouble des conduites alimentaires"] },
            ],
        },
        {
            id: "urg", label: "Urgences / réanimation", color: "#dc2626",
            kw: ["urgence", "reanimation", "choc", "arret cardio", "detresse", "samu", "intoxication", "polytraumat", "remplissage"],
            themes: [
                { name: "États de choc", kw: ["etat de choc", "choc hypovolemique", "choc anaphylactique", "remplissage", "noradrenaline"] },
                { name: "Arrêt cardio-respiratoire", kw: ["arret cardio", "rcp", "massage cardiaque", "defibrill"] },
                { name: "Intoxications", kw: ["intoxication", "paracetamol", "monoxyde de carbone", "antidote"] },
                { name: "Anaphylaxie / allergie", kw: ["anaphyla", "adrenaline", "oedeme de quincke", "urticaire"] },
                { name: "Polytraumatisé / brûlures", kw: ["polytraumat", "brulure", "traumatisme cranien"] },
            ],
        },
        {
            id: "orl_oph_derm", label: "ORL / ophtalmo / dermato", color: "#0ea5e9",
            kw: ["orl", "oreille", "audition", "surdite", "nez", "sinus", "larynx", "oeil", "ophtalm", "vision", "visuel", "cornee", "retine", "peau", "cutane", "dermat", "eruption", "lesion elementaire"],
            themes: [
                { name: "Otites / surdité", kw: ["otite", "surdite", "audiogramme", "tympan"] },
                { name: "Angines / infections ORL", kw: ["angine", "sinusite", "rhinopharyngite", "laryngite", "epiglottite"] },
                { name: "Œil rouge / baisse d'acuité", kw: ["oeil rouge", "baisse d'acuite", "glaucome", "uveite", "conjonctivite", "strabisme"] },
                { name: "Dermatoses / éruptions", kw: ["eczema", "psoriasis", "acne", "urticaire", "exantheme", "varicelle", "rougeole", "scarlatine"] },
                { name: "Tumeurs cutanées", kw: ["melanome", "carcinome basocellulaire", "naevus"] },
            ],
        },
        {
            id: "transversal", label: "Santé publique / pharmaco / médico-légal", color: "#78716c",
            kw: ["sante publique", "epidemiolog", "sensibilite", "specificite", "valeur predictive", "incidence", "prevalence", "declaration obligatoire", "certificat", "consentement", "ethique", "iatrogen", "pharmacovigilance", "interaction medicamenteuse"],
            themes: [
                { name: "Épidémiologie / biostatistiques", kw: ["sensibilite", "specificite", "valeur predictive", "incidence", "prevalence", "odds ratio", "risque relatif"] },
                { name: "Éthique / droits du patient / certificats", kw: ["consentement", "secret medical", "certificat", "personne de confiance", "directives anticipees"] },
                { name: "Iatrogénie / pharmacologie", kw: ["iatrogen", "effet indesirable", "interaction medicamenteuse", "pharmacovigilance", "contre-indication"] },
                { name: "Prévention / dépistage", kw: ["depistage", "prevention", "declaration obligatoire"] },
            ],
        },
    ];

    function ueNormalize(s) {
        return (s || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[’']/g, "'")
            .replace(/œ/g, "oe");
    }

    const _ueRegexCache = new Map();
    function ueCount(text, kw) {
        let re = _ueRegexCache.get(kw);
        if (!re) {
            const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            re = new RegExp("(?:^|[^a-z0-9])" + esc, "g");
            _ueRegexCache.set(kw, re);
        }
        re.lastIndex = 0;
        const m = text.match(re);
        return m ? m.length : 0;
    }

    function ueClassifyText(qText, ctxText, hintText) {
        const q = ueNormalize(qText);
        const ctx = ueNormalize(ctxText);
        const h = ueNormalize(hintText);

        let best = null;
        for (const sp of UE_SPECIALTIES) {
            let score = 0;
            const w = sp.weak ? 0.25 : 1;
            for (const kw of sp.kw) score += w * (2 * ueCount(q, kw) + ueCount(ctx, kw));

            let bestTheme = null;
            for (const th of sp.themes) {
                let ts = 0;
                for (const kw of th.kw) ts += 3 * ueCount(q, kw) + ueCount(ctx, kw);
                if (ts > 0 && (!bestTheme || ts > bestTheme.score)) bestTheme = { theme: th, score: ts };
            }
            if (bestTheme) score += bestTheme.score;

            const labelWords = ueNormalize(sp.label).split(/[\s/,()-]+/).filter((w) => w.length > 4);
            if (labelWords.some((lw) => h.includes(lw.slice(0, 6)))) score += 1.5;

            if (score > 0 && (!best || score > best.score)) {
                best = { sp, score, theme: bestTheme && bestTheme.theme };
            }
        }
        return best;
    }

    function ueClassify(parts, hint) {
        // Étape 1 : Analyse prioritaire dans la question et l'énoncé du cas
        let res = ueClassifyText(parts.question || "", parts.enonce || "", hint || "");

        // Étape 2 : Si la question seule ne permet pas de classifier (score 0), analyse des propositions/réponses/feedback
        if (!res) {
            const answerItemsText = [
                parts.choices || "",
                parts.answer || "",
                parts.correction || "",
                parts.feedback || ""
            ].join(" \n ");
            res = ueClassifyText(answerItemsText, parts.enonce || "", hint || "");
        }

        if (!res) {
            return { specialty: { id: "autre", label: "Non classé", color: "#9ca3af" }, theme: { name: "Autre" } };
        }
        return { specialty: res.sp, theme: res.theme || { name: "Général" } };
    }

    // =========================================================================
    // 2. STOCKAGE ET OUTILS UTILES
    // =========================================================================
    const STORE_KEY = "ueErreurs.v1";
    const parser = new DOMParser();

    const clean = (s) => (s || "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
    const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    async function getDoc(url) {
        const r = await fetch(url, { credentials: "same-origin" });
        if (!r.ok) throw new Error(`HTTP ${r.status} sur ${url}`);
        return parser.parseFromString(await r.text(), "text/html");
    }

    const hasGM = typeof GM_getValue === "function" && typeof GM_setValue === "function";
    async function loadStore() {
        try {
            if (hasGM) return GM_getValue(STORE_KEY, {}) || {};
            return (await chrome.storage.local.get(STORE_KEY))[STORE_KEY] || {};
        } catch { return {}; }
    }
    async function saveResult(res) {
        try {
            const store = await loadStore();
            store[res.title] = res;
            if (hasGM) GM_setValue(STORE_KEY, store);
            else await chrome.storage.local.set({ [STORE_KEY]: store });
        } catch {}
    }

    // Exécution parallèle avec pool de concurrence (4 requêtes simultanées)
    async function mapConcurrent(items, concurrency, fn) {
        const results = new Array(items.length);
        let index = 0;
        const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
            while (index < items.length) {
                const i = index++;
                results[i] = await fn(items[i], i);
            }
        });
        await Promise.all(workers);
        return results;
    }

    // =========================================================================
    // 3. PARSING & EXTRACTION DES DONNÉES (MOYENNES & ERREURS)
    // =========================================================================
    function getQuizLinks() {
        const links = [];
        const quizElements = document.querySelectorAll('li.activity.modtype_quiz');

        quizElements.forEach((el, idx) => {
            const a = el.querySelector('a.aalink, a[href*="/mod/quiz/view.php"]');
            if (a) {
                const instanceSpan = el.querySelector('.instancename');
                let name = clean(el.getAttribute("data-activityname") || (instanceSpan ? instanceSpan.childNodes[0].textContent : a.textContent));
                links.push({
                    url: new URL(a.getAttribute("href"), location.href).href,
                    name: name || `Dossier ${idx + 1}`
                });
            }
        });
        return links;
    }

    function reviewLinkFromQuiz(doc, base) {
        const links = [...doc.querySelectorAll('a[href*="/mod/quiz/review.php"]')];
        if (!links.length) return null;
        const u = new URL(links[links.length - 1].getAttribute("href"), base);
        u.searchParams.set("showall", "1");
        return u.href;
    }

    function parseQuizAttempts(doc) {
        const summaryTable = doc.querySelector('table.quizattemptsummary');
        if (!summaryTable) return { totalQuestions: 0, attempts: [] };

        let totalQuestions = 0;
        const thPoints = summaryTable.querySelector('thead th.c2');
        if (thPoints) {
            const match = thPoints.textContent.match(/Points\s*\/\s*([\d,.]+)/i);
            if (match) totalQuestions = parseFloat(match[1].replace(',', '.'));
        }

        const attempts = [];
        const rows = summaryTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const stateTd = row.querySelector('td.c1');
            const pointsTd = row.querySelector('td.c2');
            const noteTd = row.querySelector('td.c3');
            const numTd = row.querySelector('td.c0');

            if (stateTd && stateTd.textContent.includes('Terminée') && pointsTd && noteTd) {
                const attemptNum = parseInt(numTd.textContent.trim(), 10) || (attempts.length + 1);
                const pointsObtained = parseFloat(pointsTd.textContent.replace(',', '.'));
                const note20 = parseFloat(noteTd.textContent.replace(',', '.'));

                attempts.push({ attempt: attemptNum, points: pointsObtained, note: note20 });
            }
        });

        return { totalQuestions, attempts };
    }

    function userAnswer(que) {
        const parts = [];
        que.querySelectorAll(".answer input[type=checkbox]:checked, .answer input[type=radio]:checked").forEach((inp) => {
            const row = inp.closest("div[class^='r'], .r0, .r1, tr, label") || inp.parentElement;
            const lbl = row?.querySelector("[data-region='answer-label'], label") || row;
            parts.push(clean(lbl?.innerText || lbl?.textContent));
        });
        que.querySelectorAll(".ablock input[type=text], .ablock textarea, .formulation input[type=text]").forEach((inp) => {
            if (inp.value) parts.push(inp.value);
        });
        que.querySelectorAll(".ablock select").forEach((sel) => {
            const o = sel.options[sel.selectedIndex];
            if (o && o.value) parts.push(clean(o.textContent));
        });
        return parts.filter(Boolean).join(" | ") || "(pas de réponse détectée)";
    }

    function wrongChoices(que) {
        const wrong = [];
        que.querySelectorAll(".answer > div").forEach((row) => {
            const inp = row.querySelector("input[type=checkbox], input[type=radio]");
            if (!inp) return;
            const label = clean(row.querySelector("[data-region='answer-label']")?.innerText || row.innerText);
            const isChecked = inp.checked || inp.hasAttribute("checked");
            if (isChecked && row.classList.contains("incorrect")) wrong.push(label);
        });
        return { wrong };
    }

    function parseReview(doc, reviewUrl, dossierName, hint) {
        const errors = [];
        let enonce = "";
        let total = 0;

        doc.querySelectorAll(".que").forEach((que) => {
            const text = (sel) => clean([...que.querySelectorAll(sel)].map((e) => e.innerText || e.textContent).join("\n"));

            if (que.classList.contains("description") || que.classList.contains("informationitem")) {
                enonce += "\n" + text(".qtext");
                return;
            }
            total++;
            const state = que.classList.contains("incorrect")
                ? "incorrect"
                : que.classList.contains("partiallycorrect")
                ? "partiel"
                : que.classList.contains("notanswered") || que.classList.contains("gaveup")
                ? "non répondu"
                : null;
            if (!state) return;

            const qno = clean(que.querySelector(".info .qno")?.textContent) || String(total);
            const grade = clean(que.querySelector(".info .grade")?.textContent).replace(/^Note de\s*/i, "");
            const question = text(".formulation .qtext");
            const choices = text(".answer");
            const correction = text(".rightanswer");
            const feedback = text(".outcome .feedback, .outcome .generalfeedback, .generalfeedback");
            const { wrong } = wrongChoices(que);
            const ans = userAnswer(que);

            const cls = ueClassify({
                question,
                choices,
                answer: ans,
                correction,
                feedback,
                enonce
            }, hint + " " + dossierName);

            errors.push({
                dossier: dossierName,
                qno,
                state,
                grade,
                question,
                enonce: clean(enonce).slice(0, 600),
                answer: ans,
                wrong,
                correction,
                feedback,
                link: reviewUrl + (que.id ? "#" + que.id : ""),
                specialty: { id: cls.specialty.id, label: cls.specialty.label, color: cls.specialty.color },
                theme: cls.theme.name + (cls.theme.item ? ` (item ${cls.theme.item})` : ""),
            });
        });
        return { errors, total };
    }

    // =========================================================================
    // 4. MOTEUR D'ANALYSE PRINCIPAL
    // =========================================================================
    async function runAnalysis(onProgress) {
        const path = location.pathname;
        const title = (document.title || "").split("|")[0].replace(/^Annale\s*:\s*/i, "").trim() || "Annale";
        let dossiers = [];

        if (path.includes("/course/view.php")) {
            dossiers = getQuizLinks();
        } else if (path.includes("/mod/quiz/review.php")) {
            const u = new URL(location.href);
            u.searchParams.set("showall", "1");
            dossiers = [{ reviewUrl: u.href, name: clean(document.title.split(":")[0].split("|")[0]) }];
        } else if (path.includes("/mod/quiz/view.php")) {
            dossiers = [{ url: location.href, name: clean((document.title.split(":").pop() || "").split("|")[0]) }];
        }

        if (!dossiers.length) throw new Error("Aucun dossier trouvé sur cette page.");

        let processed = 0;
        const totalDossiers = dossiers.length;
        const averageResults = [];
        const errorResults = [];
        const skipped = [];
        let totalQCount = 0;

        await mapConcurrent(dossiers, 4, async (d) => {
            try {
                let quizDoc = null;
                let reviewUrl = d.reviewUrl;

                if (d.url) {
                    quizDoc = await getDoc(d.url);
                    if (!reviewUrl) reviewUrl = reviewLinkFromQuiz(quizDoc, d.url);
                }

                if (quizDoc) {
                    const avgData = parseQuizAttempts(quizDoc);
                    averageResults.push({
                        name: d.name,
                        questions: avgData.totalQuestions,
                        attempts: avgData.attempts
                    });
                }

                if (reviewUrl) {
                    const reviewDoc = await getDoc(reviewUrl);
                    const { errors, total } = parseReview(reviewDoc, reviewUrl, d.name, title);
                    totalQCount += total;
                    errorResults.push(...errors);
                } else {
                    skipped.push(`${d.name} (pas de tentative terminée)`);
                }
            } catch (err) {
                skipped.push(`${d.name} (${err.message})`);
            } finally {
                processed++;
                onProgress(processed, totalDossiers, `Analyse dossier (${processed}/${totalDossiers})…`);
            }
        });

        const fullResult = {
            title,
            url: location.href,
            date: new Date().toISOString(),
            averages: averageResults,
            errors: errorResults,
            totalQ: totalQCount,
            skipped
        };

        await saveResult(fullResult);
        return fullResult;
    }

    // =========================================================================
    // 5. INTERFACE D'AFFICHAGE MODALE UNIFIÉE (SHADOW DOM)
    // =========================================================================
    let host = null, root = null;

    function initUI() {
        if (document.getElementById('uness-global-host')) return;

        host = document.createElement("div");
        host.id = "uness-global-host";
        document.body.appendChild(host);

        root = host.attachShadow({ mode: "open" });
        root.innerHTML = `
        <style>
            :host { all: initial; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            * { box-sizing: border-box; }

            .fab {
                position: fixed; right: 25px; bottom: 25px; z-index: 999999;
                background: linear-gradient(135deg, #0f4c81, #1e3a8a); color: #fff;
                border: none; border-radius: 50px; padding: 13px 24px;
                font-size: 14px; font-weight: 700; box-shadow: 0 4px 18px rgba(0,0,0,0.3);
                cursor: pointer; transition: all 0.2s ease-in-out; display: flex; align-items: center; gap: 8px;
            }
            .fab:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 6px 22px rgba(0,0,0,0.35); }
            .fab[disabled] { opacity: 0.8; cursor: progress; }

            .modal-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px);
                z-index: 9999999; display: none; align-items: center; justify-content: center;
            }
            .modal-overlay.open { display: flex; }

            .modal-card {
                background: #ffffff; border-radius: 14px; width: 92%; max-width: 950px; height: 85vh;
                display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                animation: fadeIn 0.2s ease-out;
            }
            @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }

            header { background: #0f4c81; color: #ffffff; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
            header h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #fff; }
            header .sub { font-size: 0.82rem; color: #cbd5e1; margin-top: 3px; }
            .close-btn { background: none; border: none; color: #fff; font-size: 1.8rem; cursor: pointer; line-height: 1; opacity: 0.8; }
            .close-btn:hover { opacity: 1; }

            .tab-bar { display: flex; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 0 20px; gap: 8px; }
            .tab-btn {
                padding: 12px 18px; border: none; background: none; font-size: 13.5px; font-weight: 600;
                color: #64748b; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.15s;
            }
            .tab-btn:hover { color: #0f4c81; }
            .tab-btn.active { color: #0f4c81; border-bottom-color: #0f4c81; background: #fff; }

            .toolbar { display: flex; gap: 8px; flex-wrap: wrap; padding: 10px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; align-items: center; }
            .toolbar button, .toolbar select { font-size: 12px; padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-weight: 500; }
            .toolbar button:hover { background: #e2e8f0; }

            .modal-body { padding: 20px; overflow-y: auto; flex: 1; background: #ffffff; color: #1e293b; font-size: 13.5px; }

            /* Tab 1: Moyennes */
            .grid-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 15px; margin-bottom: 25px; }
            .card-att { background: #f8fafc; border-left: 4px solid #0f4c81; padding: 16px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
            .card-att .lbl { font-size: 0.78rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
            .card-att .val { font-size: 2.1rem; font-weight: 800; color: #0f4c81; margin: 4px 0; }
            .card-att .val span { font-size: 1.1rem; color: #475569; font-weight: 600; }
            .card-att .sub { font-size: 0.8rem; color: #64748b; }

            table.data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 10px; }
            table.data-table th { background: #f1f5f9; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; text-align: left; font-weight: 600; }
            table.data-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }

            /* Tab 2: Erreurs */
            .bars { margin-bottom: 20px; background: #f8fafc; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; }
            .bar { display: grid; grid-template-columns: 180px 1fr 30px; gap: 10px; align-items: center; margin: 5px 0; font-size: 12.5px; cursor: pointer; }
            .bar:hover { opacity: 0.85; }
            .bar .track { background: #e2e8f0; border-radius: 4px; height: 10px; overflow: hidden; }
            .bar .fill { height: 100%; border-radius: 4px; }
            .bar .lbl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }

            details.dossier-group { border: 1px solid #cbd5e1; border-radius: 8px; margin: 10px 0; overflow: hidden; background: #ffffff; }
            details.dossier-group > summary { padding: 11px 15px; font-weight: 700; cursor: pointer; display: flex; gap: 8px; align-items: center; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
            .count-badge { margin-left: auto; background: #e2e8f0; color: #334155; border-radius: 999px; padding: 2px 10px; font-weight: 600; font-size: 11.5px; }

            .err { border-left: 4px solid #ef4444; background: #fcfcfc; border-radius: 6px; padding: 10px 14px; margin: 10px 0; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
            .err.partiel { border-left-color: #f59e0b; }
            .err .meta { display: flex; gap: 8px; align-items: center; font-weight: 600; margin-bottom: 6px; flex-wrap: wrap; }
            .err .meta a { margin-left: auto; font-weight: 500; color: #1d4ed8; text-decoration: none; font-size: 12px; }
            .tag { font-size: 11px; padding: 2px 7px; border-radius: 4px; background: #fee2e2; color: #991b1b; }
            .err.partiel .tag { background: #fef3c7; color: #92400e; }
            .q { white-space: pre-wrap; margin: 6px 0; color: #1f2937; line-height: 1.45; font-size: 13.5px; }
            .row { margin: 4px 0; }
            .row.bad { color: #b91c1c; }
            .row.good { color: #15803d; }
            .fb summary { cursor: pointer; color: #475569; font-size: 12px; margin-top: 6px; }
            .fb div { white-space: pre-wrap; color: #374151; margin-top: 4px; background: #f8fafc; padding: 8px 12px; border-radius: 5px; }

            .empty-msg { padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
            .warn-msg { color: #92400e; background: #fffbeb; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 12.5px; border: 1px solid #fef3c7; }

            /* Progress Bar */
            .prog-container { text-align: center; padding: 40px 20px; }
            .prog-bar-outer { width: 100%; max-width: 400px; height: 12px; background: #e2e8f0; border-radius: 10px; margin: 15px auto; overflow: hidden; }
            .prog-bar-inner { height: 100%; background: #0f4c81; width: 0%; transition: width 0.2s; }
        </style>

        <button class="fab" id="fab-btn">📊 Analyse Annales & Moyennes</button>

        <div class="modal-overlay" id="modal-overlay">
            <div class="modal-card">
                <header>
                    <div>
                        <h3 id="m-title">Synthèse globale de l'épreuve</h3>
                        <div class="sub" id="m-sub">Chargement…</div>
                    </div>
                    <button class="close-btn" id="m-close" title="Fermer">&times;</button>
                </header>

                <div class="tab-bar">
                    <button class="tab-btn active" id="tab-btn-avg">📊 Moyennes & Notes</button>
                    <button class="tab-btn" id="tab-btn-err">🔍 Analyse des Erreurs EDN</button>
                </div>

                <div class="toolbar" id="toolbar" style="display:none;">
                    <select id="scope-select">
                        <option value="current">Cette annale</option>
                        <option value="all">Toutes les annales analysées</option>
                    </select>
                    <button id="btn-expand">Tout déplier</button>
                    <button id="btn-export">⬇ Export Markdown (Erreurs)</button>
                    <button id="btn-rerun">↻ Relancer l'analyse</button>
                </div>

                <div class="modal-body" id="m-body">
                    <div class="prog-container">
                        <div style="font-weight: 600; color: #0f4c81;" id="prog-text">Initialisation...</div>
                        <div class="prog-bar-outer"><div class="prog-bar-inner" id="prog-fill"></div></div>
                    </div>
                </div>
            </div>
        </div>
        `;

        const fab = root.getElementById("fab-btn");
        const overlay = root.getElementById("modal-overlay");
        const closeBtn = root.getElementById("m-close");
        const tabAvg = root.getElementById("tab-btn-avg");
        const tabErr = root.getElementById("tab-btn-err");
        const scopeSelect = root.getElementById("scope-select");
        const btnExpand = root.getElementById("btn-expand");
        const btnExport = root.getElementById("btn-export");
        const btnRerun = root.getElementById("btn-rerun");

        let activeTab = "avg"; // "avg" | "err"
        let currentData = null;

        function openModal() { overlay.classList.add("open"); }
        function closeModal() { overlay.classList.remove("open"); }

        fab.addEventListener("click", () => {
            openModal();
            if (!currentData) execute();
        });
        closeBtn.addEventListener("click", closeModal);
        overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

        tabAvg.addEventListener("click", () => {
            activeTab = "avg";
            tabAvg.classList.add("active");
            tabErr.classList.remove("active");
            renderCurrentTab();
        });

        tabErr.addEventListener("click", () => {
            activeTab = "err";
            tabErr.classList.add("active");
            tabAvg.classList.remove("active");
            renderCurrentTab();
        });

        btnRerun.addEventListener("click", () => execute());

        scopeSelect.addEventListener("change", async (e) => {
            if (e.target.value === "all") {
                const store = await loadStore();
                const annales = Object.values(store);
                const allErrors = annales.flatMap((a) => a.errors.map((err) => ({ ...err, annale: a.title })));
                const totalQ = annales.reduce((s, a) => s + a.totalQ, 0);
                const combinedAvg = annales.flatMap(a => a.averages || []);

                renderView({
                    title: "Toutes les annales analysées",
                    sub: `${annales.length} annale(s) · ${allErrors.length} erreur(s) sur ${totalQ} questions`,
                    averages: combinedAvg,
                    errors: allErrors,
                    skipped: []
                });
            } else if (currentData) {
                renderCurrentTab();
            }
        });

        btnExpand.addEventListener("click", () => {
            const body = root.getElementById("m-body");
            const ds = [...body.querySelectorAll("details.dossier-group")];
            const shouldOpen = !ds.every((d) => d.open);
            ds.forEach((d) => (d.open = shouldOpen));
            btnExpand.textContent = shouldOpen ? "Tout replier" : "Tout déplier";
        });

        btnExport.addEventListener("click", async () => {
            if (scopeSelect.value === "all") {
                const store = await loadStore();
                const errors = Object.values(store).flatMap((a) => a.errors.map((e) => ({ ...e, dossier: `${a.title} › ${e.dossier}` })));
                downloadMarkdown("erreurs-toutes-annales.md", toMarkdown(errors, "toutes les annales"));
            } else if (currentData) {
                downloadMarkdown(`erreurs-${currentData.title.replace(/[^\w-]+/g, "_").slice(0, 50)}.md`, toMarkdown(currentData.errors, currentData.title));
            }
        });

        async function execute() {
            fab.disabled = true;
            root.getElementById("toolbar").style.display = "none";
            const mBody = root.getElementById("m-body");
            mBody.innerHTML = `
                <div class="prog-container">
                    <div style="font-weight: 600; color: #0f4c81;" id="prog-text">Lancement de l'analyse…</div>
                    <div class="prog-bar-outer"><div class="prog-bar-inner" id="prog-fill"></div></div>
                </div>
            `;

            try {
                currentData = await runAnalysis((done, total, msg) => {
                    const textEl = root.getElementById("prog-text");
                    const fillEl = root.getElementById("prog-fill");
                    if (textEl) textEl.textContent = msg;
                    if (fillEl) fillEl.style.width = `${Math.round((done / total) * 100)}%`;
                });

                root.getElementById("toolbar").style.display = "flex";
                scopeSelect.value = "current";
                renderCurrentTab();
            } catch (err) {
                mBody.innerHTML = `<div class="empty-msg">⚠️ Erreur lors de l'analyse : ${esc(err.message)}</div>`;
            } finally {
                fab.disabled = false;
            }
        }

        function renderCurrentTab() {
            if (!currentData) return;
            const nErr = currentData.errors.length;
            const pct = currentData.totalQ ? Math.round((100 * nErr) / currentData.totalQ) : 0;

            renderView({
                title: currentData.title,
                sub: `${nErr} erreur(s) sur ${currentData.totalQ} questions (${pct}%) · Analysé le ${new Date(currentData.date).toLocaleDateString("fr-FR")}`,
                averages: currentData.averages,
                errors: currentData.errors,
                skipped: currentData.skipped
            });
        }

        function renderView(viewData) {
            root.getElementById("m-title").textContent = viewData.title;
            root.getElementById("m-sub").textContent = viewData.sub;

            const mBody = root.getElementById("m-body");

            if (activeTab === "avg") {
                mBody.innerHTML = renderAveragesHTML(viewData.averages);
            } else {
                mBody.innerHTML = renderErrorsHTML(viewData.errors, viewData.skipped);
                bindErrorEvents();
            }
        }

        function bindErrorEvents() {
            root.querySelectorAll(".bar").forEach((b) =>
                b.addEventListener("click", () => {
                    const spId = b.dataset.sp;
                    root.querySelectorAll("details.dossier-group").forEach(d => {
                        if (d.querySelector(`.err[data-sp="${spId}"]`)) {
                            d.open = true;
                        }
                    });
                    const firstEl = root.querySelector(`.err[data-sp="${spId}"]`);
                    if (firstEl) {
                        firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
                        const originalBg = firstEl.style.backgroundColor;
                        firstEl.style.transition = "background-color 0.4s ease";
                        firstEl.style.backgroundColor = "#eff6ff";
                        setTimeout(() => { firstEl.style.backgroundColor = originalBg || "#fcfcfc"; }, 1500);
                    }
                })
            );
        }

        if (typeof GM_registerMenuCommand !== 'undefined') {
            GM_registerMenuCommand("📊 Ouvrir Dashboard UNESS", () => {
                openModal();
                if (!currentData) execute();
            });
        }
    }

    // =========================================================================
    // 6. GENERATION DU CODE HTML DES ONGLETS & MARKDOWN
    // =========================================================================

    // Onglet 1 : Moyennes Pondérées
    function renderAveragesHTML(results) {
        if (!results || results.length === 0) {
            return `<div class="empty-msg">Aucune donnée de note disponible.</div>`;
        }

        const attemptsMap = {};
        results.forEach(res => {
            res.attempts.forEach(att => {
                if (!attemptsMap[att.attempt]) {
                    attemptsMap[att.attempt] = { totalPoints: 0, totalMax: 0, count: 0 };
                }
                attemptsMap[att.attempt].totalPoints += att.points;
                attemptsMap[att.attempt].totalMax += res.questions;
                attemptsMap[att.attempt].count++;
            });
        });

        const attemptKeys = Object.keys(attemptsMap).sort((a, b) => a - b);
        if (attemptKeys.length === 0) {
            return `<div class="warn-msg">Aucune tentative terminée n'a été trouvée pour cette épreuve.</div>`;
        }

        let cardsHtml = `<div class="grid-cards">`;
        attemptKeys.forEach(attNum => {
            const stats = attemptsMap[attNum];
            const avg20 = stats.totalMax > 0 ? (stats.totalPoints / stats.totalMax) * 20 : 0;
            cardsHtml += `
                <div class="card-att">
                    <div class="lbl">Tentative ${attNum}</div>
                    <div class="val">${avg20.toFixed(2)} <span>/ 20</span></div>
                    <div class="sub">${stats.totalPoints.toFixed(2)} / ${stats.totalMax} pts (${stats.count} dossiers)</div>
                </div>
            `;
        });
        cardsHtml += `</div>`;

        let tableHtml = `
            <h4 style="margin: 15px 0 10px; font-weight: 700;">Détail par dossier</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Dossier</th>
                        <th style="text-align: center;">Nb Questions</th>
                        ${attemptKeys.map(k => `<th style="text-align: center;">Tentative ${k}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        results.forEach(res => {
            tableHtml += `
                <tr>
                    <td><strong>${esc(res.name)}</strong></td>
                    <td style="text-align: center;">${res.questions || '-'}</td>
            `;

            attemptKeys.forEach(k => {
                const att = res.attempts.find(a => a.attempt == k);
                if (att) {
                    tableHtml += `
                        <td style="text-align: center;">
                            <strong style="color: #0f4c81;">${att.note.toFixed(2)}</strong> / 20
                            <br><small style="color: #64748b;">(${att.points}/${res.questions} pts)</small>
                        </td>`;
                } else {
                    tableHtml += `<td style="text-align: center; color: #94a3b8;">-</td>`;
                }
            });

            tableHtml += `</tr>`;
        });

        tableHtml += `</tbody></table>`;
        return cardsHtml + tableHtml;
    }

    // Onglet 2 : Analyse des Erreurs (Ordre par Dossier + Chart Synthétique)
    function groupErrorsBySpecialty(errors) {
        const bySp = new Map();
        for (const e of errors) {
            if (!bySp.has(e.specialty.id)) bySp.set(e.specialty.id, { sp: e.specialty, count: 0 });
            bySp.get(e.specialty.id).count++;
        }
        return [...bySp.values()].sort((a, b) => b.count - a.count);
    }

    function groupErrorsByDossier(errors) {
        const byDossier = new Map();
        for (const e of errors) {
            if (!byDossier.has(e.dossier)) byDossier.set(e.dossier, []);
            byDossier.get(e.dossier).push(e);
        }
        return byDossier;
    }

    function renderErrorsHTML(errors, skipped = []) {
        if (!errors.length) {
            return `<div class="empty-msg">🎉 Aucune erreur trouvée !</div>` +
                (skipped.length ? `<div class="warn-msg">Ignorés : ${skipped.map(esc).join(", ")}</div>` : "");
        }

        const spGroups = groupErrorsBySpecialty(errors);
        const max = spGroups[0].count;

        let html = skipped.length ? `<div class="warn-msg">Ignorés : ${skipped.map(esc).join(", ")}</div>` : "";
        html += `<div class="bars"><div style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Répartition par matière (cliquer pour filtrer)</div>` + 
            spGroups.map((g) =>
            `<div class="bar" data-sp="${esc(g.sp.id)}" title="Cliquer pour aller aux erreurs de ${esc(g.sp.label)}">
                <span class="lbl">${esc(g.sp.label)}</span>
                <span class="track"><span class="fill" style="display:block;width:${(g.count / max) * 100}%;background:${g.sp.color}"></span></span>
                <span>${g.count}</span>
            </div>`).join("") + `</div>`;

        const byDossier = groupErrorsByDossier(errors);

        for (const [dossierName, list] of byDossier) {
            html += `<details class="dossier-group" open>
                <summary>
                    <span style="font-size: 0.95rem; font-weight: 700; color: #0f4c81;">📁 ${esc(dossierName)}</span>
                    <span class="count-badge">${list.length} erreur${list.length > 1 ? 's' : ''}</span>
                </summary>
                <div style="padding: 6px 14px 12px;">`;

            for (const e of list) {
                html += `<div class="err ${e.state === "partiel" ? "partiel" : ""}" data-sp="${esc(e.specialty.id)}">
                    <div class="meta">
                        <span style="font-size: 0.95rem;"><strong>Q${esc(e.qno)}</strong></span>
                        <span class="tag">${esc(e.state)} (${esc(e.grade)})</span>
                        <span style="background:${e.specialty.color}18; color:${e.specialty.color}; border:1px solid ${e.specialty.color}40; padding: 2px 8px; border-radius: 4px; font-size: 11.5px; font-weight: 600;">
                            ${esc(e.specialty.label)} · ${esc(e.theme)}
                        </span>
                        <a href="${esc(e.link)}" target="_blank" rel="noopener">voir ↗</a>
                    </div>
                    ${e.annale ? `<div class="row"><b>Annale :</b> ${esc(e.annale)}</div>` : ""}
                    <div class="q">${esc(e.question.slice(0, 500))}</div>
                    <div class="row bad"><b>Ma réponse :</b> ${esc(e.answer)}</div>
                    ${e.wrong?.length ? `<div class="row bad"><b>Cochées à tort :</b> ${esc(e.wrong.join(" | "))}</div>` : ""}
                    ${e.correction ? `<div class="row good"><b>Correction :</b> ${esc(e.correction)}</div>` : ""}
                    ${e.feedback ? `<details class="fb"><summary>Feedback</summary><div>${esc(e.feedback)}</div></details>` : ""}
                </div>`;
            }

            html += `</div></details>`;
        }
        return html;
    }

    // Export Markdown
    function toMarkdown(errors, title) {
        let md = `# Erreurs – ${title}\n\n`;
        const byDossier = groupErrorsByDossier(errors);
        for (const [dossierName, list] of byDossier) {
            md += `## ${dossierName} (${list.length} erreur${list.length > 1 ? 's' : ''})\n\n`;
            for (const e of list) {
                md += `- **Q${e.qno}** [${e.specialty.label} – ${e.theme}] (${e.state}, ${e.grade})\n`;
                md += `  - Question : ${e.question.replace(/\n/g, " ")}\n`;
                md += `  - Ma réponse : ${e.answer.replace(/\n/g, " ")}\n`;
                if (e.correction) md += `  - Correction : ${e.correction.replace(/\n/g, " ")}\n`;
                if (e.feedback) md += `  - Feedback : ${e.feedback.replace(/\n/g, " ")}\n`;
            }
            md += "\n";
        }
        return md;
    }

    function downloadMarkdown(filename, text) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }

    // Initialisation
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
})();
