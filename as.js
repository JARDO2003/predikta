  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
  const firebaseConfig = {
    apiKey: "AIzaSyCPGgtXoDUycykLaTSee0S0yY0tkeJpqKI",
    authDomain: "data-com-a94a8.firebaseapp.com",
    databaseURL: "https://data-com-a94a8-default-rtdb.firebaseio.com",
    projectId: "data-com-a94a8",
    storageBucket: "data-com-a94a8.appspot.com",
    messagingSenderId: "276904640935",
    appId: "1:276904640935:web:9cd805aeba6c34c767f682",
    measurementId: "G-FYQCWY5G4S"
  };
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  window._db = db; window._fbCollection = collection; window._fbAddDoc = addDoc;
  window._fbGetDocs = getDocs; window._fbDeleteDoc = deleteDoc; window._fbDoc = doc;
  window._fbQuery = query; window._fbOrderBy = orderBy; window._fbSetDoc = setDoc;
  window._fbGetDoc = getDoc; window._fbReady = true;
  document.dispatchEvent(new Event('firebase-ready'));

// ══════════════════════════════════════════
// PLAN COMPTABLE SYSCOHADA
// ══════════════════════════════════════════
const PC = {"101":"CAPITAL SOCIAL","1011":"Capital souscrit non appelé","1012":"Capital souscrit appelé non versé","1013":"Capital souscrit appelé versé non amorti","102":"CAPITAL PAR DOTATION","103":"CAPITAL PERSONNEL","104":"COMPTE DE L'EXPLOITANT","105":"PRIMES LIEES AU CAPITAL","106":"ECARTS DE REEVALUATION","111":"RESERVE LEGALE","112":"RESERVES STATUTAIRES","118":"AUTRES RESERVES","121":"REPORT A NOUVEAU CREDITEUR","129":"REPORT A NOUVEAU DEBITEUR","131":"RESULTAT NET BENEFICE","139":"RESULTAT NET PERTE","141":"SUBVENTIONS D'EQUIPEMENT","151":"AMORTISSEMENTS DEROGATOIRES","161":"EMPRUNTS OBLIGATAIRES","162":"EMPRUNTS ETABLISSEMENTS DE CREDIT","163":"AVANCES RECUES DE L'ETAT","164":"AVANCES RECUES COMPTES COURANTS","165":"DEPOTS ET CAUTIONNEMENTS RECUS","166":"INTERETS COURUS","168":"AUTRES EMPRUNTS ET DETTES","191":"PROVISIONS POUR LITIGES","192":"PROVISIONS POUR GARANTIES","194":"PROVISIONS POUR PERTES DE CHANGE","195":"PROVISIONS POUR IMPOTS","196":"PROVISIONS RETRAITES","198":"AUTRES PROVISIONS","211":"FRAIS DE DEVELOPPEMENT","212":"BREVETS LICENCES","213":"LOGICIELS ET SITES","215":"MARQUES","216":"FONDS COMMERCIAL","221":"TERRAINS NUS","222":"TERRAINS BATIS","231":"BATIMENTS INDUSTRIELS","232":"BATIMENTS ADMINISTRATIFS","241":"MATERIEL ET OUTILLAGE","2441":"Matériel de bureau","2442":"Matériel informatique","2443":"Matériel bureautique","2444":"Mobilier de bureau","245":"MATERIEL DE TRANSPORT","2451":"Matériel automobile","261":"TITRES DE PARTICIPATION","271":"PRETS ET CREANCES","272":"PRETS AU PERSONNEL","2812":"Amort. immobilisations incorporelles","2813":"Amort. bâtiments","2841":"Amort. matériel et outillage","2844":"Amort. matériel et mobilier","2845":"Amort. matériel de transport","2915":"Dépréciation fonds commercial","311":"MARCHANDISES A","312":"MARCHANDISES B","321":"MATIERES PREMIERES","331":"MATIERES CONSOMMABLES","334":"FOURNITURES DE BUREAU","335":"EMBALLAGES","361":"PRODUITS FINIS","391":"Dépréciations des stocks","401":"FOURNISSEURS DETTES EN COMPTE","4011":"Fournisseurs","4012":"Fournisseurs Groupe","402":"FOURNISSEURS EFFETS A PAYER","404":"FOURNISSEURS IMMO","408":"FOURNISSEURS FACTURES NON PARVENUES","4082":"Fournisseurs groupe FNP","4091":"Fournisseurs avances versées","4098":"Fournisseurs RRR à obtenir","411":"CLIENTS","4111":"Clients","4112":"Clients Groupe","412":"CLIENTS EFFETS A RECEVOIR","418":"CLIENTS PRODUITS A RECEVOIR","4181":"Clients factures à établir","4191":"Clients avances reçues","4198":"Clients RRR à accorder","421":"PERSONNEL AVANCES ET ACOMPTES","4212":"Personnel acomptes","422":"PERSONNEL REMUNERATIONS DUES","431":"SECURITE SOCIALE","432":"CAISSES DE RETRAITE","441":"ETAT IMPOT SUR LES BENEFICES","442":"ETAT IMPOTS ET TAXES","4431":"TVA facturée sur ventes","4432":"TVA facturée sur prestations","4433":"TVA facturée sur travaux","4441":"Etat TVA due","4449":"Etat crédit de TVA","4451":"TVA récupérable sur immobilisations","4452":"TVA récupérable sur achats","4453":"TVA récupérable sur transport","4454":"TVA récupérable sur services","447":"ETAT IMPOTS RETENUS","4486":"Etat charges à payer","4492":"Etat avances impôts","4495":"Etat subventions exploitation","476":"CHARGES CONSTATEES D'AVANCE","477":"PRODUITS CONSTATES D'AVANCE","481":"FOURNISSEURS D'INVESTISSEMENTS","491":"DEPRECIATIONS COMPTES CLIENTS","4912":"Dépréciations clients","501":"TITRES DU TRESOR","512":"EFFETS A L'ENCAISSEMENT","513":"CHEQUES A ENCAISSER","521":"BANQUES LOCALES","5211":"Banques monnaie nationale","5215":"Banques devises","531":"CHEQUES POSTAUX","552":"MONNAIE ELECTRONIQUE MOBILE","561":"CREDITS DE TRESORERIE","571":"CAISSE SIEGE SOCIAL","5711":"Caisse monnaie nationale","5712":"Caisse devises","572":"CAISSE SUCCURSALE","585":"VIREMENTS DE FONDS","590":"DEPRECIATIONS TITRES","601":"ACHATS DE MARCHANDISES","6011":"Achats dans la Région","6012":"Achats hors Région","6015":"Frais sur achats","6019":"RRR obtenus sur achats","602":"ACHATS MATIERES PREMIERES","604":"ACHATS MATIERES CONSOMMABLES","6055":"Fournitures bureau non stockables","605":"AUTRES ACHATS","608":"ACHATS D'EMBALLAGES","6031":"Variation de stocks de marchandises","6032":"Variation stocks matières","612":"TRANSPORTS SUR VENTES","614":"TRANSPORTS DU PERSONNEL","621":"SOUS-TRAITANCE","622":"LOCATIONS","624":"ENTRETIEN REPARATIONS","625":"PRIMES D'ASSURANCE","626":"ETUDES RECHERCHES","627":"PUBLICITE","628":"TELECOMMUNICATIONS","631":"FRAIS BANCAIRES","632":"REMUNERATIONS INTERMEDIAIRES","634":"REDEVANCES BREVETS","635":"COTISATIONS","638":"AUTRES CHARGES EXTERNES","641":"IMPOTS ET TAXES DIRECTS","645":"IMPOTS ET TAXES INDIRECTS","651":"PERTES SUR CREANCES","654":"VCN CESSIONS IMMO","656":"PERTE DE CHANGE COMMERCIALE","658":"CHARGES DIVERSES","661":"REMUNERATIONS PERSONNEL","6611":"Appointements salaires","6612":"Primes et gratifications","6613":"Congés payés","662":"REMUNERATIONS NON NATIONAL","663":"INDEMNITES FORFAITAIRES","664":"CHARGES SOCIALES","6641":"Charges sociales nationales","671":"INTERETS DES EMPRUNTS","673":"ESCOMPTES ACCORDES","674":"AUTRES INTERETS","676":"PERTES DE CHANGE FINANCIERES","681":"DAP AMORTISSEMENTS","6812":"DAP incorporelles","6813":"DAP corporelles","691":"DOTATIONS PROVISIONS","6911":"Dotations provisions exploitation","6913":"DAP immo incorporelles","6594":"Charges pour dépréciations créances","6593":"Charges pour dépréciations stocks","701":"VENTES DE MARCHANDISES","7011":"Ventes dans la Région","7012":"Ventes hors Région","7019":"RRR accordés","702":"VENTES DE PRODUITS FINIS","705":"TRAVAUX FACTURES","706":"SERVICES VENDUS","707":"PRODUITS ACCESSOIRES","711":"SUBVENTIONS PRODUITS","718":"AUTRES SUBVENTIONS","721":"IMMO INCORPORELLES PRODUITES","722":"IMMO CORPORELLES PRODUITES","751":"PROFITS SUR CREANCES","754":"PRODUITS CESSIONS IMMO","756":"GAINS DE CHANGE COMMERCIAUX","758":"PRODUITS DIVERS","759":"REPRISES DEPRECIATIONS","771":"INTERETS PRETS","772":"REVENUS PARTICIPATIONS","773":"ESCOMPTES OBTENUS","774":"REVENUS DE PLACEMENT","776":"GAINS DE CHANGE FINANCIERS","781":"TRANSFERTS CHARGES","791":"REPRISES PROVISIONS","7594":"Reprises dépréciations créances","7593":"Reprises dépréciations stocks","811":"IMMO INCORPORELLES HAO","812":"IMMO CORPORELLES HAO","821":"PRODUITS CESSIONS INCORPORELLES","822":"PRODUITS CESSIONS CORPORELLES","831":"CHARGES HAO CONSTATEES","834":"PERTES CREANCES HAO","851":"DOTATIONS PROVISIONS REGLEMENTEES","852":"DOTATIONS AMORTISSEMENTS HAO","854":"DOTATIONS PROVISIONS RISQUES HAO","861":"REPRISES PROVISIONS REGLEMENTEES","871":"PARTICIPATION BENEFICES","881":"SUBVENTIONS D'EQUILIBRE","891":"IMPOTS SUR BENEFICES","895":"IMPOT MINIMUM FORFAITAIRE"};
const CLASS_NAMES={'1':'Capitaux','2':'Immobilisations','3':'Stocks','4':'Tiers','5':'Trésorerie','6':'Charges','7':'Produits','8':'Spéciaux'};
const NATURE_MAP={'1':'Passif','2':'Actif','3':'Actif','4':'Mixte','5':'Actif','6':'Charge','7':'Produit','8':'Spécial'};
const JOURNAL_NAMES={'AC':'Achats','VE':'Ventes','BQ':'Banque','CA':'Caisse','OD':'Opérations Diverses','IN':'Inventaire','AN':'À Nouveau'};
const JOURNAL_ICONS={'AC':'🛒','VE':'💰','BQ':'🏦','CA':'💵','OD':'📋','IN':'📦','AN':'📂'};

// ══ Étiquettes lisibles par type d'écriture dans un groupe ══
function getStepLabel(ecr, idx, total) {
  const jnl = ecr.journal;
  if(jnl === 'IN') return 'Mouvement de stock';
  if(jnl === 'AC') return 'Constatation facture achat';
  if(jnl === 'VE') return 'Constatation facture vente';
  if(jnl === 'BQ') return idx === 0 ? 'Règlement banque' : 'Règlement banque';
  if(jnl === 'CA') return idx === 0 ? 'Règlement caisse' : 'Règlement caisse';
  if(jnl === 'OD') return 'Opération diverse';
  if(jnl === 'AN') return 'À nouveau';
  return ecr.libelle || 'Écriture';
}

let ecritures=[], lignes=[], pieceCounter=1, currentProfile=null, isAILoading=false;
let exportFormat='pdf';
let ecrQueue = [], ecrQueueIdx = 0;
let currentGroupId = null; // ID du groupe courant pour lier les 3 écritures

const GROQ_API_KEY = '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';

// MOBILE SIDEBAR
function toggleMobileSidebar() {
  const sb = document.getElementById('mainSidebar');
  const ov = document.getElementById('sidebarOverlay');
  sb.classList.toggle('open');
  ov.classList.toggle('show');
}
function closeMobileSidebar() {
  document.getElementById('mainSidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ══════════════════════════════════════════
// SYSTEM PROMPT
// ══════════════════════════════════════════
function buildSystemPrompt(contextData) {
  const { nbEcritures, companyName, exercice, ecrituresResume, totalDebit, totalCredit, comptesSoldes, allDates } = contextData;
  const today = new Date().toISOString().split('T')[0];
  return `Tu es COMEO AI v4, expert-comptable SYSCOHADA senior dédié à l'entreprise "${companyName}" pour l'exercice ${exercice}.
Date du jour : ${today}

═══════════════════════════
RÈGLE FONDAMENTALE — 3 ÉCRITURES INDÉPENDANTES
═══════════════════════════

Pour tout achat ou vente, tu DOIS passer OBLIGATOIREMENT 3 écritures SÉPARÉES.
Chaque écriture est précédée de son propre marqueur ###ECRITURE###.

ÉCRITURE 1 — CONSTATATION FACTURE (journal AC ou VE)
Achat comptant : D 601 + D 4452 / C 571 ou 521
Achat à crédit : D 601 + D 4452 / C 4011
Vente comptant : D 571 ou 521 / C 701 + C 4431
Vente à crédit  : D 4111 / C 701 + C 4431

ÉCRITURE 2 — MOUVEMENT DE STOCK (journal IN)
Achat  : D 311 ou 312 / C 6031  (montant = HT de l'achat)
Vente  : D 6031 / C 311 ou 312  (montant = coût d'achat)

ÉCRITURE 3 — RÈGLEMENT (journal BQ ou CA si à crédit)
Achat à crédit payé  : D 4011 / C 521 ou 571
Vente à crédit encaissée : D 521 ou 571 / C 4111

CALCULS TVA (18%) :
TTC → HT = TTC ÷ 1.18  |  TVA = TTC − HT
HT  → TVA = HT × 18%   |  TTC = HT × 1.18

CONTEXTE COMPTABLE :
- Entreprise : ${companyName} | Exercice : ${exercice}
- Écritures : ${nbEcritures} | Débit : ${totalDebit} | Crédit : ${totalCredit}
${comptesSoldes ? `- Soldes : ${comptesSoldes}` : ''}
${allDates ? `- Dates avec écritures : ${allDates}` : ''}

═══════════════════════════
FILTRAGE PAR DATE / PÉRIODE
═══════════════════════════

Pour les demandes de période (ex: "opérations du 16 avril", "journal de janvier"), réponds avec :
###FILTRE###{"type":"journal","dateDebut":"2026-04-16","dateFin":"2026-04-16","journal":"","compte":""}

Pour balance : ###FILTRE###{"type":"balance","dateDebut":"","dateFin":"","journal":"","compte":""}
Pour grand livre compte : ###FILTRE###{"type":"grandlivre","dateDebut":"","dateFin":"","journal":"","compte":"XXX"}

═══════════════════════════
FORMAT RÉPONSE — ÉCRITURES
═══════════════════════════

Pour achat/vente, utilise EXACTEMENT ce format :

[Calculs commentés : HT, TVA, TTC]

**Écriture 1 — Constatation facture**
[tableau HTML]
###ECRITURE###{"journal":"AC","libelle":"Description précise","lignes":[{"compte":"601","libelle":"Achats marchandises","debit":423729,"credit":0},...]}

**Écriture 2 — Mouvement de stock**
[tableau HTML]
###ECRITURE###{"journal":"IN","libelle":"Entrée en stock — marchandises","lignes":[...]}

**Écriture 3 — Règlement**
[tableau HTML]
###ECRITURE###{"journal":"CA","libelle":"Règlement espèces","lignes":[...]}

⛔ Chaque écriture DOIT être équilibrée (Débit = Crédit).
⛔ Montants ENTIERS (pas de décimales).
⛔ TOUJOURS EN FRANÇAIS.`;
}

// AUTH
function switchTab(t) {
  document.getElementById('tab-login').classList.toggle('active', t==='login');
  document.getElementById('tab-register').classList.toggle('active', t==='register');
  document.getElementById('form-login').style.display = t==='login'?'flex':'none';
  document.getElementById('form-register').style.display = t==='register'?'flex':'none';
}
async function doRegister() {
  const company=document.getElementById('r-company').value.trim();
  const compte701=document.getElementById('r-compte701').value.trim()||'701';
  const exercice=document.getElementById('r-exercice').value.trim()||'2024';
  const pass=document.getElementById('r-pass').value;
  const err=document.getElementById('r-err'); err.classList.remove('show');
  if(!company){err.textContent="Nom d'entreprise requis";err.classList.add('show');return;}
  if(pass.length<4){err.textContent='Mot de passe trop court';err.classList.add('show');return;}
  const profileId=company.toLowerCase().replace(/[^a-z0-9]/g,'_');
  try {
    await waitForFirebase();
    const docRef=window._fbDoc(window._db,'profiles',profileId);
    const snap=await window._fbGetDoc(docRef);
    if(snap.exists()){err.textContent='Ce nom existe déjà.';err.classList.add('show');return;}
    await window._fbSetDoc(docRef,{company,compte701,exercice,password:btoa(pass),createdAt:new Date().toISOString()});
    toast('Profil créé ! Connectez-vous.','success'); switchTab('login');
    document.getElementById('l-company').value=company;
  } catch(e){err.textContent='Erreur: '+e.message;err.classList.add('show');}
}
async function doLogin() {
  const company=document.getElementById('l-company').value.trim();
  const pass=document.getElementById('l-pass').value;
  const err=document.getElementById('l-err'); err.classList.remove('show');
  if(!company||!pass){err.textContent='Remplissez tous les champs';err.classList.add('show');return;}
  const profileId=company.toLowerCase().replace(/[^a-z0-9]/g,'_');
  try {
    await waitForFirebase();
    const docRef=window._fbDoc(window._db,'profiles',profileId);
    const snap=await window._fbGetDoc(docRef);
    if(!snap.exists()){err.textContent="Entreprise introuvable.";err.classList.add('show');return;}
    const profile=snap.data();
    if(atob(profile.password)!==pass){err.textContent='Mot de passe incorrect';err.classList.add('show');return;}
    currentProfile={...profile,id:profileId};
    localStorage.setItem('syscohada_session',JSON.stringify({profileId,company}));
    await loadApp();
  } catch(e){err.textContent='Erreur: '+e.message;err.classList.add('show');}
}
function doLogout() {
  if(!confirm('Se déconnecter ?'))return;
  localStorage.removeItem('syscohada_session');
  currentProfile=null; ecritures=[];
  document.getElementById('appShell').style.display='none';
  document.getElementById('authOverlay').style.display='flex';
}
function waitForFirebase() {
  return new Promise(r=>{if(window._fbReady){r();return;}document.addEventListener('firebase-ready',r,{once:true});});
}
async function loadApp() {
  document.getElementById('authOverlay').style.display='none';
  document.getElementById('appShell').style.display='grid';
  document.getElementById('topCompanyName').textContent=currentProfile.company;
  document.getElementById('exerciceYear').value=currentProfile.exercice||'2024';
  await loadEcrituresFromFirestore();
  updateStats(); renderPlanComptable(); initSaisie();
}

// FIRESTORE
async function loadEcrituresFromFirestore() {
  try {
    const col=window._fbCollection(window._db,'profiles',currentProfile.id,'ecritures');
    const q=window._fbQuery(col,window._fbOrderBy('date','asc'));
    const snap=await window._fbGetDocs(q);
    ecritures=[]; snap.forEach(d=>ecritures.push({...d.data(),_docId:d.id}));
    pieceCounter=ecritures.length+1;
  } catch(e){toast('Erreur chargement: '+e.message,'error');}
}
async function saveEcritureToFirestore(ecriture) {
  try {
    const col=window._fbCollection(window._db,'profiles',currentProfile.id,'ecritures');
    const docRef=await window._fbAddDoc(col,ecriture);
    ecriture._docId=docRef.id; return docRef.id;
  } catch(e){toast('Erreur sauvegarde: '+e.message,'error');return null;}
}
async function deleteEcritureFromFirestore(docId) {
  try { await window._fbDeleteDoc(window._fbDoc(window._db,'profiles',currentProfile.id,'ecritures',docId)); }
  catch(e){toast('Erreur suppression: '+e.message,'error');}
}

// NAVIGATION
const VIEW_KEYS={dashboard:'tableau',saisie:'saisie',journal:'journal',grandlivre:'grand',balance:'balance',bilan:'bilan',resultat:'résultat',tresorerie:'trésor',plancomptable:'plan'};
const RENDERERS={journal:renderJournal,grandlivre:renderGrandLivre,balance:renderBalance,bilan:renderBilan,resultat:renderResultat,tresorerie:renderTresorerie,plancomptable:renderPlanComptable,saisie:initSaisie};
function navigate(view) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  const key=VIEW_KEYS[view]||view;
  document.querySelectorAll('.nav-item').forEach(n=>{if(n.textContent.toLowerCase().includes(key))n.classList.add('active');});
  if(RENDERERS[view])RENDERERS[view]();
}

// STATS
function updateStats() {
  let tD=0,tC=0;
  ecritures.forEach(e=>e.lignes.forEach(l=>{tD+=l.debit||0;tC+=l.credit||0;}));
  const all=ecritures.flatMap(e=>e.lignes);
  const prod=all.filter(l=>l.compte?.[0]==='7').reduce((s,l)=>s+(l.credit||0),0);
  const chg=all.filter(l=>l.compte?.[0]==='6').reduce((s,l)=>s+(l.debit||0),0);
  const res=prod-chg; const eq=Math.abs(tD-tC)<0.01;
  document.getElementById('s-ecritures').textContent=ecritures.length;
  document.getElementById('s-debit').textContent=fn(tD);
  document.getElementById('s-credit').textContent=fn(tC);
  const eq_el=document.getElementById('s-equil');
  eq_el.textContent=eq?'✓ OK':'✗ Déséq.'; eq_el.className='val '+(eq?'g':'r');
  document.getElementById('dash-nb').textContent=ecritures.length;
  document.getElementById('dash-debit').textContent=fs(tD);
  document.getElementById('dash-credit').textContent=fs(tC);
  const re=document.getElementById('dash-res');
  re.textContent=fs(res); re.style.color=res>=0?'var(--green)':'var(--red)';
  const yr=document.getElementById('exerciceYear').value;
  const bd=document.getElementById('bilanDate'); const ry=document.getElementById('resultatYear');
  if(bd)bd.textContent='31/12/'+yr; if(ry)ry.textContent=yr;
}
function fn(n){return Number(n||0).toLocaleString('fr-FR',{maximumFractionDigits:0});}
function fs(n){const a=Math.abs(n);if(a>=1e9)return(n/1e9).toFixed(1)+' Md';if(a>=1e6)return(n/1e6).toFixed(1)+' M';if(a>=1e3)return(n/1e3).toFixed(0)+' K';return(n||0).toFixed(0);}

// SAISIE
function initSaisie() {
  document.getElementById('ecr-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('ecr-piece').placeholder='N°'+String(pieceCounter).padStart(5,'0');
  if(lignes.length===0){addLigne();addLigne();}
  renderLignes();
  updateQueueBar();
}
function addLigne(compte='',libelle='',debit='',credit=''){lignes.push({compte,libelle,debit,credit});renderLignes();}
function removeLigne(i){lignes.splice(i,1);renderLignes();}

// ══════════════════════════════════════════
// AUTO SAVE — AVEC GROUPID COMMUN
// ══════════════════════════════════════════
async function autoSaveAllEcritures() {
  if(ecrQueue.length === 0) { toast('Aucune écriture en file d\'attente','error'); return; }
  const total = ecrQueue.length;
  const bar = document.getElementById('autoSaveBar');
  const msg = document.getElementById('autoSaveMsg');
  const prog = document.getElementById('autoSaveProgress');
  bar.classList.add('show');
  const date = document.getElementById('ecr-date').value || new Date().toISOString().split('T')[0];

  // IMPORTANT : même groupId pour toutes les écritures du lot IA
  const groupId = 'grp_' + Date.now();
  // Libellé principal = premier libellé de la queue (ex: "Achat marchandises HT…")
  const groupLibelle = ecrQueue[0]?.libelle || 'Opération ' + new Date().toLocaleDateString('fr-FR');

  let saved = 0;
  const errors = [];

  for(let i = 0; i < ecrQueue.length; i++) {
    const ecr = ecrQueue[i];
    msg.innerHTML = `<strong>Enregistrement ${i+1}/${total}</strong> — [${ecr.journal}] ${ecr.libelle || 'Écriture '+(i+1)}`;
    prog.style.width = ((i / total) * 100) + '%';
    const valid = (ecr.lignes || []).filter(l => l.compte && (l.debit || l.credit));
    if(valid.length < 2) { errors.push(`Écriture ${i+1}: moins de 2 lignes valides`); continue; }
    let d=0, c=0;
    valid.forEach(l => { d += Math.round(parseFloat(l.debit)||0); c += Math.round(parseFloat(l.credit)||0); });
    if(Math.abs(d-c) > 2) { errors.push(`Écriture ${i+1} [${ecr.journal}]: non équilibrée`); continue; }
    const piece = 'N°'+String(pieceCounter).padStart(5,'0');
    const ecriture = {
      id: Date.now() + i, date, journal: ecr.journal || 'OD', piece,
      libelle: ecr.libelle || 'Écriture IA',
      groupId,          // ← lie les 3 écritures ensemble
      groupLibelle,     // ← titre commun du groupe
      groupSize: total, // ← combien d'écritures dans ce groupe
      groupIdx: i,      // ← position dans le groupe (0, 1, 2)
      createdAt: new Date().toISOString(),
      lignes: valid.map(l => ({
        compte: String(l.compte),
        libelle: l.libelle || PC[String(l.compte)] || '',
        debit: Math.round(parseFloat(l.debit)||0),
        credit: Math.round(parseFloat(l.credit)||0)
      }))
    };
    const docId = await saveEcritureToFirestore(ecriture);
    if(docId) { ecritures.push(ecriture); pieceCounter++; saved++; }
    await new Promise(r => setTimeout(r, 150));
  }
  prog.style.width = '100%';
  await new Promise(r => setTimeout(r, 400));
  bar.classList.remove('show');
  ecrQueue = []; ecrQueueIdx = 0; lignes = [];
  updateQueueBar(); hideMultiEcrBanner(); hideSaisieNotif(); dismissFillBanner();
  updateStats();
  if(errors.length > 0) {
    toast(`⚠️ ${saved}/${total} écritures enregistrées — ${errors.length} erreur(s)`, 'error');
  } else {
    toast(`✅ ${saved} écriture${saved>1?'s':''} enregistrée${saved>1?'s':''} et groupée${saved>1?'s':''} !`, 'success');
  }
  setTimeout(() => { navigate('journal'); renderJournal(); }, 500);
  initSaisie();
}

async function autoSaveAllFromNotif() { hideSaisieNotif(); await autoSaveAllEcritures(); }

function setEcritureQueue(ecritures_ai) {
  ecrQueue = ecritures_ai; ecrQueueIdx = 0;
  if(ecrQueue.length > 0) { loadEcritureFromQueue(0); updateQueueBar(); }
}

function loadEcritureFromQueue(idx) {
  if(idx >= ecrQueue.length) return;
  const ecr = ecrQueue[idx];
  lignes = ecr.lignes.map(l=>({
    compte: String(l.compte||''),
    libelle: l.libelle || PC[String(l.compte)] || '',
    debit: Math.round(parseFloat(l.debit)||0),
    credit: Math.round(parseFloat(l.credit)||0)
  }));
  const jSelect = document.getElementById('ecr-journal');
  if(jSelect && ecr.journal) jSelect.value = ecr.journal;
  const libInput = document.getElementById('ecr-libelle');
  if(libInput && ecr.libelle) libInput.value = ecr.libelle;
  const dateInput = document.getElementById('ecr-date');
  if(dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];
  renderLignes();
  const banner = document.getElementById('aiFillBanner');
  const desc = document.getElementById('aiFillDesc');
  const num = document.getElementById('aiFillNum');
  if(banner && desc) {
    desc.textContent = ecr.libelle || 'Écriture préparée par COMEO AI';
    if(num) num.textContent = ecrQueue.length > 1 ? `(${idx+1}/${ecrQueue.length})` : '';
    banner.classList.add('show');
  }
}

function updateQueueBar() {
  const bar = document.getElementById('saisieQueueBar');
  const counter = document.getElementById('sqbCounter');
  const remaining = ecrQueue.length - ecrQueueIdx;
  if(remaining > 0) {
    bar.classList.add('show');
    counter.textContent = remaining + ' écriture' + (remaining>1?'s':'');
    const btnAll = document.getElementById('btnValidateAll');
    if(btnAll) btnAll.style.display = remaining > 1 ? 'inline-flex' : 'none';
  } else { bar.classList.remove('show'); }
}

function skipToNextEcriture() {
  ecrQueueIdx++;
  if(ecrQueueIdx < ecrQueue.length) {
    loadEcritureFromQueue(ecrQueueIdx); updateQueueBar();
    toast('Écriture '+(ecrQueueIdx+1)+'/'+ecrQueue.length+' chargée','info');
  } else {
    ecrQueue = []; ecrQueueIdx = 0; lignes = []; addLigne(); addLigne(); renderLignes();
    updateQueueBar(); dismissFillBanner();
  }
}

function dismissFillBanner() { document.getElementById('aiFillBanner').classList.remove('show'); }

function showMultiEcrBanner(ecritures_ai) {
  const banner = document.getElementById('multiEcrBanner');
  const list = document.getElementById('mebList');
  const title = document.getElementById('mebTitle');
  if(!banner) return;
  title.textContent = `COMEO AI a préparé ${ecritures_ai.length} écriture${ecritures_ai.length>1?'s':''} liées`;
  list.innerHTML = ecritures_ai.map((e,i)=>
    `<li><span class="meb-n">${i+1}</span><span class="meb-jnl">${e.journal||'OD'}</span><span>${e.libelle||'Écriture '+(i+1)}</span></li>`
  ).join('');
  banner.classList.add('show');
  setTimeout(()=>banner.classList.remove('show'), 60000);
}
function hideMultiEcrBanner() { document.getElementById('multiEcrBanner').classList.remove('show'); }

function showSaisieNotif(libelle, count) {
  const notif = document.getElementById('saisieNotif');
  const body = document.getElementById('saisieNotifBody');
  if(count > 1) {
    body.textContent = `${count} écritures liées préparées. Cliquez "Tout enregistrer" pour les grouper automatiquement.`;
  } else {
    body.textContent = `"${libelle||'Écriture'}" — Vérifiez et enregistrez.`;
  }
  notif.classList.add('show');
  setTimeout(()=>notif.classList.remove('show'), 15000);
}
function hideSaisieNotif() { document.getElementById('saisieNotif').classList.remove('show'); }
function goToSaisie() {
  hideSaisieNotif(); navigate('saisie');
  setTimeout(()=>{
    const lignesCard = document.querySelector('#view-saisie .card:last-of-type');
    if(lignesCard) lignesCard.scrollIntoView({behavior:'smooth'});
  }, 200);
}

// RENDER LIGNES
function renderLignes() {
  const tbody=document.getElementById('lignesBody'); tbody.innerHTML='';
  const cardContainer=document.getElementById('lignesCardContainer'); cardContainer.innerHTML='';
  lignes.forEach((l,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><div class="asw">
        <input type="text" value="${l.compte}" placeholder="Compte…" style="width:100%;font-family:var(--font-mono)"
          oninput="lignes[${i}].compte=this.value;updateAccountSuggest(${i},this,'table')"
          onblur="hideDropdown('t-${i}')">
        <div class="adrop" id="drop-t-${i}"></div>
      </div></td>
      <td><input type="text" value="${l.libelle||''}" placeholder="Libellé…" style="width:100%" oninput="lignes[${i}].libelle=this.value"></td>
      <td><input type="text" value="${l.debit||''}" placeholder="0" style="text-align:right;width:100%;font-family:var(--font-mono)" oninput="lignes[${i}].debit=parseFloat(this.value.replace(/[^0-9.]/g,''))||0;updateBalance()"></td>
      <td><input type="text" value="${l.credit||''}" placeholder="0" style="text-align:right;width:100%;font-family:var(--font-mono)" oninput="lignes[${i}].credit=parseFloat(this.value.replace(/[^0-9.]/g,''))||0;updateBalance()"></td>
      <td><button class="del-line" onclick="removeLigne(${i})">✕</button></td>`;
    tbody.appendChild(tr);
    const card=document.createElement('div');
    card.className='ligne-card';
    card.innerHTML=`
      <div class="ligne-card-row">
        <div class="ligne-card-field">
          <div class="ligne-card-label">Compte</div>
          <div style="position:relative">
            <input class="ligne-card-input" type="text" value="${l.compte}" placeholder="Compte…" style="font-family:var(--font-mono)"
              oninput="lignes[${i}].compte=this.value;updateAccountSuggest(${i},this,'card')"
              onblur="hideDropdown('c-${i}')">
            <div class="adrop" id="drop-c-${i}"></div>
          </div>
        </div>
        <div class="ligne-card-field">
          <div class="ligne-card-label">Libellé</div>
          <input class="ligne-card-input" type="text" value="${l.libelle||''}" placeholder="Libellé…" oninput="lignes[${i}].libelle=this.value">
        </div>
      </div>
      <div class="ligne-card-row">
        <div class="ligne-card-field">
          <div class="ligne-card-label" style="color:var(--blue)">Débit (FCFA)</div>
          <input class="ligne-card-input" type="number" value="${l.debit||''}" placeholder="0" style="font-family:var(--font-mono)"
            oninput="lignes[${i}].debit=parseFloat(this.value)||0;updateBalance()">
        </div>
        <div class="ligne-card-field">
          <div class="ligne-card-label" style="color:var(--green)">Crédit (FCFA)</div>
          <input class="ligne-card-input" type="number" value="${l.credit||''}" placeholder="0" style="font-family:var(--font-mono)"
            oninput="lignes[${i}].credit=parseFloat(this.value)||0;updateBalance()">
        </div>
      </div>
      <div class="ligne-card-actions">
        <button class="del-line" style="opacity:.6" onclick="removeLigne(${i})">✕ Supprimer</button>
      </div>`;
    cardContainer.appendChild(card);
  });
  updateBalance();
}

function updateAccountSuggest(idx, input, mode) {
  const q=input.value.toLowerCase().trim();
  const dropId = mode==='card' ? 'c-'+idx : 't-'+idx;
  const drop=document.getElementById('drop-'+dropId);
  if(!drop) return;
  if(!q||q.length<2){drop.classList.remove('open');return;}
  const matches=Object.entries(PC).filter(([code,lib])=>code.startsWith(q)||lib.toLowerCase().includes(q)).slice(0,12);
  if(!matches.length){drop.classList.remove('open');return;}
  drop.innerHTML=matches.map(([code,lib])=>
    `<div class="aoption" onmousedown="selectAccount(${idx},'${code}','${lib.replace(/'/g,"\\'")}')">
      <span class="code">${code}</span><span class="name">${lib.substring(0,46)}</span>
    </div>`).join('');
  drop.classList.add('open');
}
function selectAccount(idx,code,lib) { lignes[idx].compte=code; if(!lignes[idx].libelle)lignes[idx].libelle=lib.substring(0,54); renderLignes(); }
function hideDropdown(id){setTimeout(()=>{const d=document.getElementById('drop-'+id);if(d)d.classList.remove('open');},200);}

function updateBalance() {
  let d=0,c=0; lignes.forEach(l=>{d+=parseFloat(l.debit)||0;c+=parseFloat(l.credit)||0;});
  const s=d-c;
  document.getElementById('totalDebitDisplay').textContent=fn(d);
  document.getElementById('totalCreditDisplay').textContent=fn(c);
  const el=document.getElementById('soldeDisplay');
  el.textContent=fn(Math.abs(s)); el.className='val '+(Math.abs(s)<0.01?'bok':'bbad');
}

// VALIDATION MANUELLE (écriture isolée, pas de groupId)
async function saveEcriture() {
  const date=document.getElementById('ecr-date').value;
  const journal=document.getElementById('ecr-journal').value;
  const piece=document.getElementById('ecr-piece').value||'N°'+String(pieceCounter).padStart(5,'0');
  const libelle=document.getElementById('ecr-libelle').value;
  if(!date){toast('Veuillez saisir une date','error');return;}
  const valid=lignes.filter(l=>l.compte&&(l.debit||l.credit));
  if(valid.length<2){toast('Au moins 2 lignes requises','error');return;}
  let d=0,c=0; valid.forEach(l=>{d+=parseFloat(l.debit)||0;c+=parseFloat(l.credit)||0;});
  if(Math.abs(d-c)>0.01){toast("Écriture non équilibrée — Débit: "+fn(d)+" / Crédit: "+fn(c),'error');return;}

  // Si on est dans une file de queue (mode IA), utiliser le groupId courant
  let groupInfo = {};
  if(ecrQueue.length > 0 && currentGroupId) {
    groupInfo = {
      groupId: currentGroupId,
      groupLibelle: ecrQueue[0]?.libelle || libelle,
      groupSize: ecrQueue.length,
      groupIdx: ecrQueueIdx
    };
  }

  const ecriture={
    id:Date.now(), date, journal, piece, libelle,
    ...groupInfo,
    createdAt:new Date().toISOString(),
    lignes:valid.map(l=>({compte:String(l.compte),libelle:l.libelle||PC[String(l.compte)]||'',debit:Math.round(parseFloat(l.debit)||0),credit:Math.round(parseFloat(l.credit)||0)}))
  };
  const docId = await saveEcritureToFirestore(ecriture);
  if(!docId) return;
  ecritures.push(ecriture); pieceCounter++; updateStats(); dismissFillBanner();
  const jnlLabel = JOURNAL_NAMES[journal] || journal;
  toast(`✓ Écriture [${jnlLabel}] enregistrée — Pièce ${piece}`,'success');
  ecrQueueIdx++;
  if(ecrQueueIdx < ecrQueue.length) {
    loadEcritureFromQueue(ecrQueueIdx); updateQueueBar();
    toast(`→ Écriture ${ecrQueueIdx+1}/${ecrQueue.length} prête à valider`,'info');
  } else {
    ecrQueue = []; ecrQueueIdx = 0; currentGroupId = null; lignes = []; updateQueueBar();
    document.getElementById('ecr-libelle').value=''; document.getElementById('ecr-piece').value='';
    hideSaisieNotif(); initSaisie();
  }
}

// FILTRAGE COMMUN
function getEcrituresFiltrees(opts={}) {
  const { dateDebut, dateFin, journal, compte } = opts;
  return ecritures.filter(e => {
    if(dateDebut && e.date < dateDebut) return false;
    if(dateFin && e.date > dateFin) return false;
    if(journal && e.journal !== journal) return false;
    if(compte) return e.lignes.some(l => l.compte && l.compte.startsWith(compte));
    return true;
  });
}

// ══════════════════════════════════════════
// ★★★ JOURNAL — GROUPÉ PAR OPÉRATION (groupId)
// ══════════════════════════════════════════

function resetJournalFiltre() {
  document.getElementById('jnl-date-debut').value='';
  document.getElementById('jnl-date-fin').value='';
  document.getElementById('journalFilter').value='';
  document.getElementById('journalSearch').value='';
  document.getElementById('journal-analyse').style.display='none';
  renderJournal();
}

function formatDateFR(dateStr) {
  if(!dateStr) return '';
  const [y,m,d] = dateStr.split('-');
  const mois = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${parseInt(d)} ${mois[parseInt(m)]} ${y}`;
}

// Fonction principale : regroupe les écritures par groupId
function renderJournal() {
  const search = (document.getElementById('journalSearch').value||'').toLowerCase();
  const filter = document.getElementById('journalFilter').value;
  const dateDebut = document.getElementById('jnl-date-debut').value;
  const dateFin = document.getElementById('jnl-date-fin').value;
  const content = document.getElementById('journalContent');
  const footer = document.getElementById('journal-totaux-footer');

  const ecFiltrees = getEcrituresFiltrees({ dateDebut, dateFin, journal: filter });

  // Filtrage par recherche
  const ecFiltered = ecFiltrees.filter(e => {
    if(!search) return true;
    if((e.libelle||'').toLowerCase().includes(search)) return true;
    if((e.groupLibelle||'').toLowerCase().includes(search)) return true;
    if((e.piece||'').toLowerCase().includes(search)) return true;
    return e.lignes.some(l =>
      (l.compte||'').includes(search) ||
      (l.libelle||'').toLowerCase().includes(search) ||
      (PC[l.compte]||'').toLowerCase().includes(search)
    );
  });

  if(!ecFiltered.length) {
    content.innerHTML = `<div class="empty-state"><div class="icon">≡</div><p>Aucune écriture pour cette sélection</p></div>`;
    footer.style.display = 'none';
    return;
  }

  // ── ÉTAPE 1 : Construire des groupes ──
  // Groupes IA : écritures ayant un groupId commun
  // Écritures isolées : groupId absent ou unique
  const groupMap = {}; // groupId → [ecritures]
  const soloList = []; // écritures sans groupe

  ecFiltered.forEach(e => {
    if(e.groupId) {
      if(!groupMap[e.groupId]) groupMap[e.groupId] = [];
      groupMap[e.groupId].push(e);
    } else {
      soloList.push(e);
    }
  });

  // Convertir les groupes en tableau trié par date
  const groups = [];

  // Groupes IA
  Object.values(groupMap).forEach(ecrs => {
    const sorted = [...ecrs].sort((a,b) => (a.groupIdx||0) - (b.groupIdx||0));
    groups.push({
      type: 'groupe',
      date: sorted[0].date,
      ecritures: sorted,
      libelle: sorted[0].groupLibelle || sorted[0].libelle || 'Opération',
      isGroupe: true
    });
  });

  // Écritures isolées = chacune est son propre "groupe" d'une écriture
  soloList.forEach(e => {
    groups.push({
      type: 'solo',
      date: e.date,
      ecritures: [e],
      libelle: e.libelle || 'Écriture',
      isGroupe: false
    });
  });

  // Trier tous les groupes par date
  groups.sort((a,b) => a.date.localeCompare(b.date) || (a.ecritures[0].createdAt||'').localeCompare(b.ecritures[0].createdAt||''));

  // ── ÉTAPE 2 : Grouper par date (séparateur visuel) ──
  const byDate = {};
  groups.forEach(g => {
    if(!byDate[g.date]) byDate[g.date] = [];
    byDate[g.date].push(g);
  });

  let totalD = 0, totalC = 0, totalLignes = 0, totalEcritures = 0;
  let html = '';

  const dates = Object.keys(byDate).sort();
  dates.forEach(date => {
    html += `<div class="jnl-date-sep">
      <div class="jnl-date-sep-line"></div>
      <div class="jnl-date-sep-label">📅 ${formatDateFR(date)}</div>
      <div class="jnl-date-sep-line"></div>
    </div>`;

    byDate[date].forEach(group => {
      // Total du groupe
      let groupD = 0, groupC = 0;
      group.ecritures.forEach(e => {
        e.lignes.forEach(l => { groupD += l.debit||0; groupC += l.credit||0; });
        totalLignes += e.lignes.length;
        totalEcritures++;
      });
      // On divise par 2 pour le total "économique" (débit = crédit en comptabilité en partie double)
      const groupMontant = groupD; // = groupC si équilibré
      totalD += groupD; totalC += groupC;

      // Déterminer le type dominant du groupe
      const mainJournal = group.ecritures[0]?.journal || 'OD';
      const icon = JOURNAL_ICONS[mainJournal] || '📋';

      // IDs des docs pour suppression de groupe
      const docIds = group.ecritures.map(e => `'${e._docId}'`).join(',');
      const ecrIds = group.ecritures.map(e => e.id).join(',');

      if(group.isGroupe) {
        // ── GROUPE DE 3 ÉCRITURES ──
        html += `<div class="jnl-groupe">
          <!-- EN-TÊTE GROUPE -->
          <div class="jnl-groupe-header">
            <div class="jnl-groupe-icon">${icon}</div>
            <div class="jnl-groupe-info">
              <div class="jnl-groupe-libelle" title="${(group.libelle||'').replace(/"/g,'&quot;')}">${group.libelle}</div>
              <div class="jnl-groupe-meta">${date} · ${group.ecritures.length} écritures liées · ${group.ecritures.map(e=>e.piece||'—').join(' · ')}</div>
            </div>
            <div class="jnl-groupe-total">
              <div class="jnl-groupe-total-label">Montant total</div>
              <div class="jnl-groupe-total-val">${fn(groupMontant)} FCFA</div>
            </div>
            <span class="jnl-groupe-badge-count">${group.ecritures.length} écriture${group.ecritures.length>1?'s':''}</span>
            <button class="jnl-groupe-del" onclick="deleteGroupe([${docIds}],[${ecrIds}])" title="Supprimer tout le groupe">✕ Tout supprimer</button>
          </div>
          <!-- CORPS : liste des écritures -->
          <div class="jnl-groupe-body">
            ${group.ecritures.map((e, eIdx) => renderEcritureInGroupe(e, eIdx, group.ecritures.length)).join('')}
          </div>
        </div>`;
      } else {
        // ── ÉCRITURE ISOLÉE (saisie manuelle) ──
        const e = group.ecritures[0];
        let eD = 0, eC = 0;
        e.lignes.forEach(l => { eD += l.debit||0; eC += l.credit||0; });
        const equil = Math.abs(eD - eC) < 1;
        const jnlCls = e.journal || 'OD';

        html += `<div class="jnl-groupe">
          <div class="jnl-groupe-header">
            <div class="jnl-groupe-icon">${JOURNAL_ICONS[jnlCls]||'📋'}</div>
            <div class="jnl-groupe-info">
              <div class="jnl-groupe-libelle">${e.libelle||'<em style="opacity:.4">Sans libellé</em>'}</div>
              <div class="jnl-groupe-meta">${date} · ${e.piece||'—'} · ${JOURNAL_NAMES[jnlCls]||jnlCls}</div>
            </div>
            <div class="jnl-groupe-total">
              <div class="jnl-groupe-total-label">Débit / Crédit</div>
              <div class="jnl-groupe-total-val" style="font-size:11px"><span style="color:#60a5fa">${fn(eD)}</span> / <span style="color:#4ade80">${fn(eC)}</span></div>
            </div>
            <span class="jnl-step-equil ${equil?'ok':'nok'}">${equil?'✓ EQ':'✗ NEQ'}</span>
            <button class="jnl-groupe-del" onclick="deleteEcriture('${e._docId}',${e.id})" title="Supprimer">✕</button>
          </div>
          <div class="jnl-groupe-body">
            ${renderEcritureInGroupe(e, 0, 1)}
          </div>
        </div>`;
      }
    });
  });

  content.innerHTML = html;

  // Footer
  footer.style.display = 'block';
  document.getElementById('jnl-nb-groupes').textContent = groups.length;
  document.getElementById('jnl-nb-ecr').textContent = totalEcritures;
  document.getElementById('jnl-nb-lignes').textContent = totalLignes;
  document.getElementById('jnl-total-debit').textContent = fn(totalD) + ' FCFA';
  document.getElementById('jnl-total-credit').textContent = fn(totalC) + ' FCFA';
  const eqEl = document.getElementById('jnl-equil-label');
  const balanced = Math.abs(totalD - totalC) < 1;
  eqEl.textContent = balanced ? '✓ Équilibré' : '✗ Déséquilibré';
  eqEl.className = 'jnl-footer-val ' + (balanced ? 'eq' : 'neq');
}

// Rendu d'une écriture individuelle à l'intérieur d'un groupe
function renderEcritureInGroupe(e, eIdx, totalInGroupe) {
  let eD = 0, eC = 0;
  e.lignes.forEach(l => { eD += l.debit||0; eC += l.credit||0; });
  const equil = Math.abs(eD - eC) < 1;
  const jnlCls = e.journal || 'OD';
  const stepLabel = getStepLabel(e, eIdx, totalInGroupe);

  return `<div class="jnl-ecriture type-${jnlCls}">
    <!-- Sous-en-tête de cette écriture -->
    <div class="jnl-ecriture-subheader">
      ${totalInGroupe > 1 ? `<span class="jnl-step-badge">${eIdx+1}</span>` : ''}
      <span class="jnl-step-jnl-badge ${jnlCls}">${jnlCls}</span>
      <span class="jnl-step-label">${stepLabel}</span>
      <span class="jnl-step-piece">${e.piece||'—'} · ${JOURNAL_NAMES[jnlCls]||jnlCls}</span>
      <span class="jnl-step-totaux" style="margin-left:auto">
        <span style="color:#60a5fa">${fn(eD)}</span> / <span style="color:#4ade80">${fn(eC)}</span>
      </span>
      <span class="jnl-step-equil ${equil?'ok':'nok'}">${equil?'✓':'✗'}</span>
      <button class="jnl-step-del" onclick="deleteEcriture('${e._docId}',${e.id})" title="Supprimer cette écriture">✕</button>
    </div>

    <!-- Lignes comptables -->
    <div class="jnl-ecriture-body">
      <table class="jnl-lignes-table">
        <thead>
          <tr>
            <th style="width:200px">Compte</th>
            <th>Libellé</th>
            <th class="right" style="width:140px">Débit (FCFA)</th>
            <th class="right" style="width:140px">Crédit (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          ${e.lignes.map(l => `
            <tr>
              <td>
                <div class="jnl-compte-badge">
                  <span class="jnl-compte-code">${l.compte}</span>
                  <span class="jnl-compte-name" title="${PC[l.compte]||''}">${(PC[l.compte]||'').substring(0,22)}</span>
                </div>
              </td>
              <td><span class="jnl-libelle-ligne">${l.libelle||e.libelle||'—'}</span></td>
              <td class="jnl-debit-cell">${l.debit ? fn(l.debit) : '<span style="color:var(--line2)">—</span>'}</td>
              <td class="jnl-credit-cell">${l.credit ? fn(l.credit) : '<span style="color:var(--line2)">—</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// Supprimer tout un groupe
async function deleteGroupe(docIds, ids) {
  if(!confirm(`Supprimer ce groupe de ${docIds.length} écriture${docIds.length>1?'s':''} ?`))return;
  for(const docId of docIds) await deleteEcritureFromFirestore(docId);
  ids.forEach(id => { ecritures = ecritures.filter(e => e.id !== id); });
  updateStats(); renderJournal();
  toast(`${docIds.length} écriture${docIds.length>1?'s':''} supprimée${docIds.length>1?'s':''}`,'info');
}

async function deleteEcriture(docId, id) {
  if(!confirm('Supprimer cette écriture ?'))return;
  await deleteEcritureFromFirestore(docId);
  ecritures = ecritures.filter(e => e.id !== id);
  updateStats(); renderJournal(); toast('Écriture supprimée','info');
}

// GRAND LIVRE
function getMap(opts={}) {
  const ecFiltrees = opts.filtrer ? getEcrituresFiltrees(opts) : ecritures;
  const map={};
  ecFiltrees.forEach(e=>e.lignes.forEach(l=>{
    if(!l.compte)return;
    if(!map[l.compte])map[l.compte]={debit:0,credit:0,mvts:[]};
    map[l.compte].debit+=l.debit||0; map[l.compte].credit+=l.credit||0;
    map[l.compte].mvts.push({date:e.date,piece:e.piece||'',journal:e.journal,libelle:l.libelle||e.libelle||'',debit:l.debit||0,credit:l.credit||0});
  }));
  return map;
}
function resetGLFiltre() {
  document.getElementById('gl-date-debut').value='';
  document.getElementById('gl-date-fin').value='';
  document.getElementById('glSearch').value='';
  renderGrandLivre();
}
function renderGrandLivre() {
  const search=document.getElementById('glSearch').value.toLowerCase();
  const dateDebut=document.getElementById('gl-date-debut').value;
  const dateFin=document.getElementById('gl-date-fin').value;
  const opts = dateDebut||dateFin ? {filtrer:true,dateDebut,dateFin} : {};
  const map=getMap(opts), content=document.getElementById('grandLivreContent');
  const comptes=Object.keys(map).sort();
  if(!comptes.length){content.innerHTML='<div class="empty-state"><div class="icon">⊞</div><p>Aucun mouvement</p></div>';return;}
  const filtered=comptes.filter(c=>!search||c.includes(search)||(PC[c]||'').toLowerCase().includes(search));
  content.innerHTML=filtered.map(code=>{
    const acc=map[code],s=acc.debit-acc.credit,lib=PC[code]||'Compte '+code,isD=s>=0;
    return `<div class="gl-account">
      <div class="gl-account-header" onclick="toggleGL('gl-${code}')">
        <span class="gl-code">${code}</span><span class="gl-name">${lib.substring(0,46)}</span>
        <span style="color:rgba(255,255,255,.3);font-size:10px;font-family:var(--font-mono);margin-right:6px">${acc.mvts.length} mvt${acc.mvts.length>1?'s':''}</span>
        <span class="gl-balance ${isD?'debit':'credit'}">${isD?'Sd':'Sc'} ${fn(Math.abs(s))} FCFA</span>
      </div>
      <div id="gl-${code}" style="display:none">
        <div style="overflow-x:auto">
        <table class="dt">
          <thead><tr><th>Date</th><th>Jnl</th><th>Pièce</th><th>Libellé</th><th style="text-align:right">Débit</th><th style="text-align:right">Crédit</th><th style="text-align:right">Solde</th></tr></thead>
          <tbody>${acc.mvts.map((m,i)=>{
            const rD=acc.mvts.slice(0,i+1).reduce((s,x)=>s+x.debit,0);
            const rC=acc.mvts.slice(0,i+1).reduce((s,x)=>s+x.credit,0);
            const rs=rD-rC;
            return `<tr>
              <td style="font-family:var(--font-mono);font-size:10px">${m.date}</td>
              <td><span class="ct">${m.journal}</span></td>
              <td style="font-family:var(--font-mono);font-size:9.5px;color:var(--muted)">${m.piece}</td>
              <td>${m.libelle}</td>
              <td class="debit">${m.debit?fn(m.debit):''}</td>
              <td class="credit">${m.credit?fn(m.credit):''}</td>
              <td style="text-align:right;font-family:var(--font-mono);font-size:11px;color:${rs>=0?'#60a5fa':'#4ade80'}">
                ${rs>=0?'Sd ':'Sc '}${fn(Math.abs(rs))}</td>
            </tr>`;
          }).join('')}
          <tr class="total-row"><td colspan="4" style="text-align:right">TOTAUX</td>
            <td class="debit">${fn(acc.debit)}</td><td class="credit">${fn(acc.credit)}</td>
            <td style="text-align:right;font-family:var(--font-mono);color:${isD?'#60a5fa':'#4ade80'}">
              ${isD?'Sd ':'Sc '}${fn(Math.abs(s))}</td>
          </tr></tbody>
        </table>
        </div>
      </div>
    </div>`;
  }).join('');
}
function toggleGL(id){const el=document.getElementById(id);el.style.display=el.style.display==='none'?'block':'none';}

// BALANCE
function resetBalanceFiltre() {
  document.getElementById('bal-date-debut').value='';
  document.getElementById('bal-date-fin').value='';
  document.getElementById('bal-journal').value='';
  document.getElementById('bal-classe').value='';
  document.getElementById('balance-analyse').style.display='none';
  renderBalance();
}
function renderBalance() {
  const dateDebut=document.getElementById('bal-date-debut').value;
  const dateFin=document.getElementById('bal-date-fin').value;
  const journal=document.getElementById('bal-journal').value;
  const classe=document.getElementById('bal-classe').value;
  const opts = (dateDebut||dateFin||journal) ? {filtrer:true,dateDebut,dateFin,journal} : {};
  const map=getMap(opts), tbody=document.getElementById('balanceBody');
  let comptes=Object.keys(map).sort();
  if(classe) comptes = comptes.filter(c=>c.startsWith(classe));
  if(!comptes.length){tbody.innerHTML='<tr><td colspan="6"><div class="empty-state"><p>Aucune donnée pour cette sélection</p></div></td></tr>';return;}
  let tD=0,tC=0,tSD=0,tSC=0;
  const rows=comptes.map(code=>{
    const acc=map[code],s=acc.debit-acc.credit,sd=s>0?s:0,sc=s<0?-s:0;
    tD+=acc.debit;tC+=acc.credit;tSD+=sd;tSC+=sc;
    return `<tr>
      <td><span class="ct">${code}</span></td>
      <td style="font-size:11px">${(PC[code]||'').substring(0,42)}</td>
      <td class="debit">${fn(acc.debit)}</td><td class="credit">${fn(acc.credit)}</td>
      <td style="text-align:right;font-family:var(--font-mono);color:#2563eb">${sd?fn(sd):''}</td>
      <td style="text-align:right;font-family:var(--font-mono);color:#16a34a">${sc?fn(sc):''}</td>
    </tr>`;
  });
  rows.push(`<tr class="total-row"><td colspan="2">TOTAUX GÉNÉRAUX</td>
    <td class="debit">${fn(tD)}</td><td class="credit">${fn(tC)}</td>
    <td style="text-align:right;font-family:var(--font-mono)">${fn(tSD)}</td>
    <td style="text-align:right;font-family:var(--font-mono)">${fn(tSC)}</td>
  </tr>`);
  tbody.innerHTML=rows.join('');
}

// BILAN
function renderBilan() {
  const dateArrete = document.getElementById('bilan-date-arrete')?.value;
  const opts = dateArrete ? {filtrer:true, dateFin:dateArrete} : {};
  const map=getMap(opts), content=document.getElementById('bilanContent');
  if(!Object.keys(map).length){content.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="icon">⊠</div><p>Saisissez des écritures pour générer le bilan</p></div>';return;}
  const actif={immob:{title:'ACTIF IMMOBILISÉ',comptes:[]},stocks:{title:'STOCKS ET EN-COURS',comptes:[]},creances:{title:'CRÉANCES ET EMPLOIS ASSIMILÉS',comptes:[]},treso:{title:'TRÉSORERIE-ACTIF',comptes:[]}};
  const passif={cap:{title:'CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES',comptes:[]},df:{title:'DETTES FINANCIÈRES',comptes:[]},dct:{title:'PASSIF CIRCULANT',comptes:[]},tp:{title:'TRÉSORERIE-PASSIF',comptes:[]}};
  Object.entries(map).forEach(([code,acc])=>{
    const s=acc.debit-acc.credit,cl=code[0],e={code,lib:(PC[code]||code).substring(0,40),solde:Math.abs(s)};
    if(cl==='2'){if(s>0)actif.immob.comptes.push(e);}
    else if(cl==='3'){if(s>0)actif.stocks.comptes.push(e);}
    else if(cl==='4'){if(s>0)actif.creances.comptes.push(e);else if(s<0)passif.dct.comptes.push({...e,solde:Math.abs(s)});}
    else if(cl==='5'){if(s>0)actif.treso.comptes.push(e);else passif.tp.comptes.push({...e,solde:Math.abs(s)});}
    else if(cl==='1'){const n=parseInt(code);(n<=160?passif.cap:passif.df).comptes.push({code,lib:(PC[code]||code).substring(0,40),solde:Math.abs(s)});}
  });
  const rc=sections=>sections.map(s=>{
    if(!s.comptes.length)return'';
    const total=s.comptes.reduce((sum,c)=>sum+c.solde,0);
    return `<div class="bilan-section">
      <div class="bilan-section-title">${s.title}</div>
      ${s.comptes.map(c=>`<div class="bilan-line"><span class="acc-code">${c.code}</span><span class="acc-name">${c.lib}</span><span class="acc-amount">${fn(c.solde)}</span></div>`).join('')}
      <div class="bilan-line" style="font-weight:700;border-bottom:none;margin-top:3px"><span class="acc-code"></span><span class="acc-name" style="color:var(--ink)">Sous-total</span><span class="acc-amount">${fn(total)}</span></div>
    </div>`;
  }).join('');
  const tA=[...actif.immob.comptes,...actif.stocks.comptes,...actif.creances.comptes,...actif.treso.comptes].reduce((s,c)=>s+c.solde,0);
  const tP=[...passif.cap.comptes,...passif.df.comptes,...passif.dct.comptes,...passif.tp.comptes].reduce((s,c)=>s+c.solde,0);
  const label = dateArrete ? `Arrêté au ${dateArrete}` : `Exercice ${document.getElementById('exerciceYear').value}`;
  content.innerHTML=`
    <div class="bilan-col"><div class="bilan-col-header actif">ACTIF — ${label}</div>${rc(Object.values(actif))}<div class="bilan-total"><span>TOTAL ACTIF</span><span>${fn(tA)} FCFA</span></div></div>
    <div class="bilan-col"><div class="bilan-col-header passif">PASSIF — ${label}</div>${rc(Object.values(passif))}<div class="bilan-total"><span>TOTAL PASSIF</span><span>${fn(tP)} FCFA</span></div></div>`;
}

// RESULTAT
function renderResultat() {
  const map=getMap(),content=document.getElementById('resultatContent');
  if(!Object.keys(map).length){content.innerHTML='<div class="empty-state"><div class="icon">↗</div><p>Aucune donnée</p></div>';return;}
  const gt=pfx=>Object.entries(map).filter(([c])=>pfx.some(p=>c.startsWith(p))).reduce((s,[,a])=>s+(a.debit-a.credit),0);
  const ventes=Math.abs(gt(['701','702','703','704','705']));
  const prodsAcc=Math.abs(gt(['707']));
  const autrProd=Math.abs(gt(['75','718','711']));
  const achats=gt(['601','602','603','604','605','608']);
  const transports=gt(['612','614']);
  const servExt=gt(['621','622','624','625','626','627','628','631','632','634','635','638']);
  const impTaxes=gt(['641','645']);
  const autresChg=gt(['651','654','658']);
  const personnel=gt(['661','662','663','664']);
  const dap=gt(['681','691','697']);
  const revFin=Math.abs(gt(['771','772','773','774','776','777']));
  const chgFin=gt(['671','673','674','676']);
  const haoP=Math.abs(gt(['821','822','841']));
  const haoC=gt(['811','812','831','834','839','851','852','854']);
  const imp=gt(['891','895']);
  const mc = ventes - Math.abs(gt(['601'])) - gt(['6031']);
  const ca = ventes + prodsAcc;
  const va = ca + autrProd - Math.abs(gt(['601','602','604','605','608'])) - gt(['6031','6032']) - transports - servExt - impTaxes - autresChg;
  const ebe = va - personnel;
  const re = ebe - dap;
  const rf = revFin - chgFin;
  const rao = re + rf;
  const rhao = haoP - haoC;
  const res = rao + rhao - imp;
  const rr=(lbl,val,cls='')=>`<div class="rrow ${cls}"><span>${lbl}</span><span class="amount ${val>=0?'pos':'neg'}">${fn(Math.abs(val))} FCFA${val<0?' (−)':''}</span></div>`;
  content.innerHTML=`<div class="rlist">
    <div class="rrow header"><span>COMPTE DE RÉSULTAT — SYSCOHADA</span><span></span></div>
    ${rr('Ventes de marchandises (701)',ventes,'sub')}
    ${rr('Achats + Var. stocks (601+6031)',-(Math.abs(gt(['601']))+gt(['6031'])),'sub')}
    ${rr('→ Marge commerciale (XA)',mc,'total')}
    ${rr('Produits accessoires (707+75)',prodsAcc+autrProd,'sub')}
    ${rr('→ CA net et autres produits (XB)',ca,'total')}
    ${rr('Transports + Services extérieurs',-(transports+servExt),'sub')}
    ${rr('Impôts et taxes (641+645)',-(impTaxes+autresChg),'sub')}
    ${rr('→ Valeur ajoutée (XC)',va,'total')}
    ${rr('Charges de personnel (661–664)',-(personnel),'sub')}
    ${rr('→ EBE (XD)',ebe,'total')}
    ${rr('Dotations amort. et prov. (681+691)',-(dap),'sub')}
    ${rr('→ Résultat d\'exploitation (XE)',re,'total')}
    <div class="divider"></div>
    <div class="rrow header"><span>RÉSULTAT FINANCIER</span><span></span></div>
    ${rr('Revenus financiers (77)',revFin,'sub')}
    ${rr('Charges financières (67)',-(chgFin),'sub')}
    ${rr('→ Résultat financier (XF)',rf,'total')}
    ${rr('→ RAO = RE + RF (XG)',rao,'total')}
    <div class="divider"></div>
    <div class="rrow header"><span>RÉSULTAT H.A.O.</span><span></span></div>
    ${rr('Produits HAO',haoP,'sub')}${rr('Charges HAO',-(haoC),'sub')}
    ${rr('→ RHAO (XH)',rhao,'total')}
    <div class="divider"></div>
    ${rr('IS / IBP (891)',-(imp),'sub')}
    <div class="rrow result"><span>${res>=0?'RÉSULTAT NET — BÉNÉFICE ✓':'RÉSULTAT NET — PERTE ✗'}</span>
      <span class="amount ${res>=0?'pos':'neg'}">${fn(Math.abs(res))} FCFA</span>
    </div>
  </div>`;
}

// TRESORERIE
function renderTresorerie() {
  const map=getMap(),content=document.getElementById('tresorerieContent');
  const tc=Object.entries(map).filter(([c])=>c.startsWith('5'));
  if(!tc.length){content.innerHTML='<div class="empty-state"><div class="icon">◎</div><p>Aucun mouvement de trésorerie</p></div>';return;}
  const total=tc.reduce((s,[,a])=>s+(a.debit-a.credit),0);
  content.innerHTML=`<div class="rlist">
    <div class="rrow header"><span>COMPTES DE TRÉSORERIE (Classe 5)</span><span></span></div>
    ${tc.map(([code,acc])=>{const s=acc.debit-acc.credit;return`<div class="rrow sub"><span><span class="ct">${code}</span> <span style="margin-left:6px">${(PC[code]||'').substring(0,34)}</span></span><span class="amount ${s>=0?'pos':'neg'}">${fn(Math.abs(s))} FCFA${s<0?' (Cr)':''}</span></div>`;}).join('')}
    <div class="rrow result"><span>Trésorerie nette</span><span class="amount ${total>=0?'pos':'neg'}">${fn(Math.abs(total))} FCFA</span></div>
  </div>`;
}

// PLAN COMPTABLE
function renderPlanComptable() {
  const search=document.getElementById('pcSearch')?.value?.toLowerCase()||'';
  const cls=document.getElementById('pcClass')?.value||'';
  const tbody=document.getElementById('pcBody'); if(!tbody)return;
  const entries=Object.entries(PC).filter(([code,lib])=>{
    if(cls&&!code.startsWith(cls))return false;
    if(search&&!code.includes(search)&&!lib.toLowerCase().includes(search))return false;
    return true;
  }).slice(0,300);
  if(!entries.length){tbody.innerHTML='<tr><td colspan="4"><div class="empty-state"><p>Aucun compte trouvé</p></div></td></tr>';return;}
  tbody.innerHTML=entries.map(([code,lib])=>{
    const cl=code[0],isH=lib===lib.toUpperCase()&&lib.length>3,pad=(code.length-1)*10;
    return `<tr>
      <td><span class="ct">${code}</span></td>
      <td style="padding-left:${Math.min(pad,30)}px;font-weight:${isH?'600':'400'};color:${isH?'var(--ink)':'var(--slate)'}">${lib.substring(0,70)}</td>
      <td style="color:var(--muted);font-size:11px">${CLASS_NAMES[cl]||''}</td>
      <td><span style="font-size:10px;padding:2px 7px;border-radius:3px;background:var(--surface3);color:var(--muted)">${NATURE_MAP[cl]||''}</span></td>
    </tr>`;
  }).join('');
}

// EXPORT
function openExportModal(){document.getElementById('exportModal').style.display='flex';selectExport('pdf');}
function closeExportModal(){document.getElementById('exportModal').style.display='none';}
function selectExport(fmt){
  exportFormat=fmt;
  document.getElementById('opt-pdf').classList.toggle('selected',fmt==='pdf');
  document.getElementById('opt-word').classList.toggle('selected',fmt==='word');
}
function doExport(){closeExportModal();if(exportFormat==='pdf')exportPDF();else exportWord();}

function exportPDF() {
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const yr=document.getElementById('exerciceYear').value;
  const company=currentProfile?.company||'Entreprise';
  const pageW=210, now=new Date().toLocaleDateString('fr-FR');
  doc.setFillColor(10,11,16);doc.rect(0,0,pageW,22,'F');
  doc.setTextColor(212,168,83);doc.setFontSize(14);doc.setFont('helvetica','bold');
  doc.text('SYSCOHADA Pro v4',14,10);
  doc.setFontSize(7);doc.setFont('helvetica','normal');
  doc.text('COMEO AI v4 — Expert Comptable OHADA 2023',14,16);
  doc.setTextColor(255,255,255);doc.setFontSize(8);
  doc.text(company,pageW-14,10,{align:'right'});doc.text('Exercice '+yr,pageW-14,16,{align:'right'});
  doc.setTextColor(10,11,16);doc.setFontSize(16);doc.setFont('helvetica','bold');
  doc.text('JOURNAL GÉNÉRAL',14,34);
  doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(130,128,112);
  doc.text('Édité le '+now,14,40);
  doc.setDrawColor(212,168,83);doc.setLineWidth(0.5);doc.line(14,43,pageW-14,43);
  let tableData=[],totalD=0,totalC=0;
  ecritures.forEach(e=>{e.lignes.forEach(l=>{
    tableData.push([e.date,e.journal,e.piece||'',l.compte,(PC[l.compte]||'').substring(0,28),l.libelle||e.libelle||'',l.debit?fn(l.debit):'',l.credit?fn(l.credit):'']);
    totalD+=l.debit||0;totalC+=l.credit||0;
  });});
  doc.autoTable({startY:48,head:[['Date','Jnl','N° Pièce','Compte','Libellé compte','Libellé opération','Débit FCFA','Crédit FCFA']],body:tableData,foot:[['','','','','','TOTAUX',fn(totalD),fn(totalC)]],
    styles:{font:'helvetica',fontSize:7.5,cellPadding:2.5},
    headStyles:{fillColor:[10,11,16],textColor:[212,168,83],fontStyle:'bold',fontSize:7},
    footStyles:{fillColor:[30,34,54],textColor:[212,168,83],fontStyle:'bold',fontSize:8},
    alternateRowStyles:{fillColor:[250,248,244]},
    columnStyles:{0:{cellWidth:18},1:{cellWidth:10,halign:'center'},2:{cellWidth:18},3:{cellWidth:16,fontStyle:'bold'},4:{cellWidth:28},5:{cellWidth:36},6:{cellWidth:22,halign:'right'},7:{cellWidth:22,halign:'right'}},
    margin:{left:14,right:14}
  });
  doc.save(`SYSCOHADA_v4_${company.replace(/\s+/g,'_')}_${yr}.pdf`);
  toast('✓ PDF exporté','success');
}

function exportWord() {
  const yr=document.getElementById('exerciceYear').value;
  const company=currentProfile?.company||'Entreprise';
  const now=new Date().toLocaleDateString('fr-FR');
  let jRows='',totalD=0,totalC=0;
  ecritures.forEach(e=>{e.lignes.forEach(l=>{
    jRows+=`<tr><td>${e.date}</td><td>${e.journal}</td><td>${e.piece||''}</td><td>${l.compte}</td><td>${(PC[l.compte]||'').substring(0,28)}</td><td>${l.libelle||e.libelle||''}</td><td style="text-align:right">${l.debit?fn(l.debit):''}</td><td style="text-align:right">${l.credit?fn(l.credit):''}</td></tr>`;
    totalD+=l.debit||0;totalC+=l.credit||0;
  });});
  const th='background:#0a0b10;color:#d4a853;padding:6px 10px;text-align:left;font-size:9pt;text-transform:uppercase';
  const td='border-bottom:1px solid #e0dbd0;padding:5px 10px';
  const html=`<html><head><meta charset="utf-8"><style>body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt}table{width:100%;border-collapse:collapse;margin-bottom:20pt}th{${th}}td{${td}}tr:nth-child(even) td{background:#faf8f4}</style></head>
  <body>
  <h1 style="font-family:Georgia,serif;font-size:16pt;color:#0a0b10">SYSCOHADA Pro v4 — ${company} — Exercice ${yr}</h1>
  <p>Édité le ${now}</p>
  <h2>Journal Général</h2>
  <table><thead><tr><th>Date</th><th>Jnl</th><th>Pièce</th><th>Compte</th><th>Libellé compte</th><th>Libellé</th><th>Débit</th><th>Crédit</th></tr></thead>
  <tbody>${jRows}</tbody><tfoot><tr><td colspan="6" style="font-weight:bold;text-align:right">TOTAUX</td><td style="font-weight:bold;text-align:right">${fn(totalD)}</td><td style="font-weight:bold;text-align:right">${fn(totalC)}</td></tr></tfoot></table>
  </body></html>`;
  const blob=new Blob([html],{type:'application/msword;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`SYSCOHADA_v4_${company.replace(/\s+/g,'_')}_${yr}.doc`;a.click();URL.revokeObjectURL(url);
  toast('✓ Document Word exporté','success');
}

// ══════════════════════════════════════════
// COMEO AI v4 — MOTEUR IA
// ══════════════════════════════════════════
function handleAiKey(e,ctx){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendToAI(ctx);}}
function quickAI(text){document.getElementById('aiInput').value=text;navigate('dashboard');sendToAI('dashboard');}

function buildAIContext() {
  let tD=0,tC=0;
  ecritures.forEach(e=>e.lignes.forEach(l=>{tD+=l.debit||0;tC+=l.credit||0;}));
  const map = getMap();
  const comptesSoldes = Object.entries(map).slice(0,10).map(([c,a])=>{
    const s=a.debit-a.credit;
    return `${c}:${s>=0?'Sd':'Sc'}${fn(Math.abs(s))}`;
  }).join(' | ');
  const dernieres = ecritures.slice(-5).map(e=>`${e.date} [${e.journal}] ${e.libelle||'—'}`).join(' ; ');
  const allDates = [...new Set(ecritures.map(e=>e.date))].sort().join(', ');
  return {
    nbEcritures: ecritures.length,
    companyName: currentProfile?.company || 'Entreprise',
    exercice: document.getElementById('exerciceYear')?.value || '2024',
    totalDebit: fn(tD),
    totalCredit: fn(tC),
    comptesSoldes,
    ecrituresResume: dernieres,
    allDates
  };
}

async function sendToAI(context) {
  if(isAILoading) return;
  const inputId = context==='dashboard' ? 'aiInput' : `aiInput-${context}`;
  const input = document.getElementById(inputId);
  const msg = input.value.trim(); if(!msg) return;
  isAILoading = true; input.value = '';
  const sendBtnId = context==='dashboard' ? 'aiSendBtn' : null;
  if(sendBtnId) document.getElementById(sendBtnId).disabled = true;
  appendMsg(context,'user',msg);
  const tid = appendTyping(context);

  const ctxData = buildAIContext();
  const systemPrompt = buildSystemPrompt(ctxData);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Authorization':`Bearer ${GROQ_API_KEY}`},
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 3500,
        temperature: 0.1,
        messages: [
          {role:'system', content: systemPrompt},
          {role:'user', content: msg}
        ]
      })
    });
    removeTyping(context, tid);
    if(!response.ok) {
      const e2 = await response.json().catch(()=>({}));
      throw new Error(e2.error?.message || 'Erreur API '+response.status);
    }
    const data = await response.json();
    const fullText = data.choices?.[0]?.message?.content || 'Pas de réponse.';

    const filtreMarker = fullText.indexOf('###FILTRE###');

    if(filtreMarker !== -1) {
      const displayText = fullText.substring(0, filtreMarker).trim();
      const jsonStr = fullText.substring(filtreMarker + 12).trim();
      if(displayText) appendMsg(context, 'ai', displayText);
      try {
        const clean = jsonStr.replace(/```json|```/g,'').trim();
        const jsonMatch = clean.match(/(\{[\s\S]*?\})/);
        if(jsonMatch) {
          const filtre = JSON.parse(jsonMatch[1]);
          applyFiltreAndNavigate(filtre, context);
        }
      } catch(pe) { console.warn('Filtre parse error:', pe); }

    } else if(fullText.includes('###ECRITURE###')) {
      const parts = fullText.split('###ECRITURE###');
      const textBeforeFirst = parts[0].trim();
      const ecrituresAI = [];

      for(let i = 1; i < parts.length; i++) {
        const segment = parts[i].trim();
        const jsonMatch2 = segment.match(/(\{[\s\S]*\})/);
        const matched = jsonMatch2 ? jsonMatch2[1] : null;
        if(matched) {
          try {
            const cleanJson = matched.replace(/```json|```/g,'').trim();
            const ecr = JSON.parse(cleanJson);
            if(ecr.lignes && ecr.lignes.length >= 2) {
              let d=0, c=0;
              ecr.lignes.forEach(l=>{d+=Math.round(parseFloat(l.debit)||0);c+=Math.round(parseFloat(l.credit)||0);});
              ecr.lignes = ecr.lignes.map(l=>({...l,debit:Math.round(parseFloat(l.debit)||0),credit:Math.round(parseFloat(l.credit)||0)}));
              if(Math.abs(d-c) <= 2) ecrituresAI.push(ecr);
            }
          } catch(pe) { console.warn('JSON parse error écriture', i, ':', pe.message); }
        }
      }

      if(textBeforeFirst) appendMsg(context, 'ai', textBeforeFirst);

      if(ecrituresAI.length === 0) {
        appendMsg(context, 'ai', '⚠️ Je n\'ai pas pu extraire les écritures. Veuillez réessayer.');
      } else {
        // Générer le groupId commun ici, avant la sauvegarde
        currentGroupId = 'grp_' + Date.now();
        const confirmMsg = `✅ <strong>${ecrituresAI.length} écriture${ecrituresAI.length>1?'s':''} liées</strong> préparées et groupées :<br>` +
          ecrituresAI.map((e,i)=>`<br><strong>${i+1}. [${e.journal}]</strong> ${e.libelle}`).join('') +
          `<br><br>⚡ Cliquez <strong>"Tout enregistrer"</strong> pour les valider — elles seront groupées dans le journal.`;
        appendMsg(context, 'ai', confirmMsg);
        setEcritureQueue(ecrituresAI);
        if(context === 'saisie') {
          toast(`✨ ${ecrituresAI.length} écriture${ecrituresAI.length>1?'s':''} préparée${ecrituresAI.length>1?'s':''}  — liées`,'info');
        } else {
          showMultiEcrBanner(ecrituresAI);
          showSaisieNotif(ecrituresAI[0]?.libelle || msg.substring(0,40), ecrituresAI.length);
        }
      }

    } else {
      appendMsg(context, 'ai', fullText);
    }

  } catch(err) {
    removeTyping(context, tid);
    appendMsg(context,'ai',`Je rencontre une difficulté technique : ${err.message}. Veuillez réessayer.`);
  }
  isAILoading = false;
  if(sendBtnId) document.getElementById(sendBtnId).disabled = false;
}

// Application filtre et navigation
function applyFiltreAndNavigate(filtre, context) {
  const { type, dateDebut, dateFin, journal, compte } = filtre;
  if(type === 'journal') {
    navigate('journal');
    if(dateDebut) document.getElementById('jnl-date-debut').value = dateDebut;
    if(dateFin) document.getElementById('jnl-date-fin').value = dateFin;
    if(journal) document.getElementById('journalFilter').value = journal;
    renderJournal();
    const analyseEl = document.getElementById('journal-analyse');
    if(analyseEl) {
      analyseEl.style.display = 'block';
      const label = dateDebut === dateFin ? formatDateFR(dateDebut) : `${formatDateFR(dateDebut)} au ${formatDateFR(dateFin)}`;
      analyseEl.innerHTML = `<div class="analyse-title">📋 Journal — ${label || 'Exercice complet'}</div>Affichage des écritures pour la période demandée.`;
    }
  } else if(type === 'balance') {
    navigate('balance');
    if(dateDebut) document.getElementById('bal-date-debut').value = dateDebut;
    if(dateFin) document.getElementById('bal-date-fin').value = dateFin;
    if(journal) document.getElementById('bal-journal').value = journal;
    renderBalance();
  } else if(type === 'grandlivre') {
    navigate('grandlivre');
    if(dateDebut) document.getElementById('gl-date-debut').value = dateDebut;
    if(dateFin) document.getElementById('gl-date-fin').value = dateFin;
    if(compte) document.getElementById('glSearch').value = compte;
    renderGrandLivre();
    if(compte) setTimeout(()=>{const el=document.getElementById('gl-'+compte);if(el)el.style.display='block';},200);
  } else if(type === 'bilan') {
    navigate('bilan');
    if(dateFin) document.getElementById('bilan-date-arrete').value = dateFin;
    renderBilan();
  }
}

function appendMsg(context, role, text) {
  const msgId = context==='dashboard' ? 'aiMessages' : `aiMessages-${context}`;
  const c = document.getElementById(msgId); if(!c) return;
  const d = document.createElement('div');
  d.className = 'msg ' + role;
  d.innerHTML = `<div class="msg-av">${role==='ai'?'C':'U'}</div><div class="msg-body">${fmt(text)}</div>`;
  c.appendChild(d); c.scrollTop = c.scrollHeight;
}
function appendTyping(context) {
  const id = 't'+Date.now();
  const msgId = context==='dashboard' ? 'aiMessages' : `aiMessages-${context}`;
  const c = document.getElementById(msgId); if(!c) return id;
  const d = document.createElement('div');
  d.className = 'msg ai'; d.id = id;
  d.innerHTML = `<div class="msg-av">C</div><div class="msg-body"><div class="typing"><span></span><span></span><span></span></div></div>`;
  c.appendChild(d); c.scrollTop = c.scrollHeight; return id;
}
function removeTyping(context, id) { const el=document.getElementById(id); if(el)el.remove(); }

function fmt(text) {
  if(!text) return '';
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`(.*?)`/g,'<code>$1</code>')
    .replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>')
    .replace(/&lt;table&gt;/gi,'<table>').replace(/&lt;\/table&gt;/gi,'</table>')
    .replace(/&lt;thead&gt;/gi,'<thead>').replace(/&lt;\/thead&gt;/gi,'</thead>')
    .replace(/&lt;tbody&gt;/gi,'<tbody>').replace(/&lt;\/tbody&gt;/gi,'</tbody>')
    .replace(/&lt;tfoot&gt;/gi,'<tfoot>').replace(/&lt;\/tfoot&gt;/gi,'</tfoot>')
    .replace(/&lt;tr&gt;/gi,'<tr>').replace(/&lt;\/tr&gt;/gi,'</tr>')
    .replace(/&lt;th(&gt;|(\s[^&]*)&gt;)/gi,(_,m)=>'<th'+(m.replace(/&gt;/g,'>').replace(/&lt;/g,'<')))
    .replace(/&lt;\/th&gt;/gi,'</th>')
    .replace(/&lt;td(&gt;|(\s[^&]*)&gt;)/gi,(_,m)=>'<td'+(m.replace(/&gt;/g,'>').replace(/&lt;/g,'<')))
    .replace(/&lt;\/td&gt;/gi,'</td>')
    .replace(/&lt;strong&gt;/gi,'<strong>').replace(/&lt;\/strong&gt;/gi,'</strong>')
    .replace(/&lt;em&gt;/gi,'<em>').replace(/&lt;\/em&gt;/gi,'</em>')
    .replace(/&lt;br&gt;/gi,'<br>').replace(/&lt;br\/&gt;/gi,'<br>');
}

// TOAST
function toast(message, type='info') {
  const c = document.getElementById('toastContainer');
  const d = document.createElement('div'); d.className = 'toast '+type;
  const icons={success:'✓',error:'✕',info:'i'};
  const colors={success:'#4ade80',error:'#f87171',info:'#d4a853'};
  d.innerHTML = `<span style="font-weight:700;color:${colors[type]||colors.info}">${icons[type]||'i'}</span><span>${message}</span>`;
  c.appendChild(d);
  setTimeout(()=>d.style.opacity='0',3500); setTimeout(()=>d.remove(),4100);
}

// INIT
document.addEventListener('firebase-ready', async () => {
  const session = localStorage.getItem('syscohada_session');
  if(session) {
    try {
      const {profileId} = JSON.parse(session);
      const docRef = window._fbDoc(window._db,'profiles',profileId);
      const snap = await window._fbGetDoc(docRef);
      if(snap.exists()) {
        currentProfile = {...snap.data(), id:profileId};
        await loadApp(); return;
      }
    } catch(e) { localStorage.removeItem('syscohada_session'); }
  }
});
// Exposition des fonctions globales (nécessaire avec type="module")
window.doLogin = doLogin;
window.doRegister = doRegister;
window.doLogout = doLogout;
window.switchTab = switchTab;
window.navigate = navigate;
window.sendToAI = sendToAI;
window.handleAiKey = handleAiKey;
window.quickAI = quickAI;
window.addLigne = addLigne;
window.removeLigne = removeLigne;
window.saveEcriture = saveEcriture;
window.updateAccountSuggest = updateAccountSuggest;
window.selectAccount = selectAccount;
window.hideDropdown = hideDropdown;
window.updateBalance = updateBalance;
window.autoSaveAllEcritures = autoSaveAllEcritures;
window.autoSaveAllFromNotif = autoSaveAllFromNotif;
window.skipToNextEcriture = skipToNextEcriture;
window.dismissFillBanner = dismissFillBanner;
window.hideMultiEcrBanner = hideMultiEcrBanner;
window.hideSaisieNotif = hideSaisieNotif;
window.goToSaisie = goToSaisie;
window.toggleGL = toggleGL;
window.deleteEcriture = deleteEcriture;
window.deleteGroupe = deleteGroupe;
window.openExportModal = openExportModal;
window.closeExportModal = closeExportModal;
window.selectExport = selectExport;
window.doExport = doExport;
window.renderJournal = renderJournal;
window.renderGrandLivre = renderGrandLivre;
window.renderBalance = renderBalance;
window.renderBilan = renderBilan;
window.renderPlanComptable = renderPlanComptable;
window.resetJournalFiltre = resetJournalFiltre;
window.resetGLFiltre = resetGLFiltre;
window.resetBalanceFiltre = resetBalanceFiltre;
window.updateStats = updateStats;
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
