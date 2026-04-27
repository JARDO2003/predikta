/* ============================================================
   COMEO AI PRO — JAVASCRIPT
   app.js
============================================================ */

/* ============================================================
   FIREBASE — DOUBLE BASE DE DONNÉES
   DB1 (data-com-a94a8)  : écritures comptables
   DB2 (livreur-21be8)   : abonnements & gestion clients
============================================================ */
var DB1_CONFIG = {
  apiKey:"AIzaSyCPGgtXoDUycykLaTSee0S0yY0tkeJpqKI",
  authDomain:"data-com-a94a8.firebaseapp.com",
  databaseURL:"https://data-com-a94a8-default-rtdb.firebaseio.com",
  projectId:"data-com-a94a8",
  storageBucket:"data-com-a94a8.appspot.com",
  messagingSenderId:"276904640935",
  appId:"1:276904640935:web:9cd805aeba6c34c767f682"
};

var DB2_CONFIG = {
  apiKey:"AIzaSyC1pJG97RoIJL-zvrRP5OaJAIVkFNoMC1Q",
  authDomain:"livreur-21be8.firebaseapp.com",
  databaseURL:"https://livreur-21be8-default-rtdb.firebaseio.com",
  projectId:"livreur-21be8",
  storageBucket:"livreur-21be8.firebasestorage.app",
  messagingSenderId:"330461481415",
  appId:"1:330461481415:web:3c9987401062181f9731e2",
  measurementId:"G-1KWC1NCJ45"
};

var db1 = null;
var db2 = null;

/* ============================================================
   GROQ API — ROTATION DES CLÉS
============================================================ */
var GROQ_KEYS = [
  "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",
  "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",
  "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",
  "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",
  "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"
];

var _groqKeyIndex = 0;
var _groqKeyUsageCount = {};

function getNextGroqKey(preferredIndex) {
  var idx = (preferredIndex !== undefined) ? preferredIndex : _groqKeyIndex;
  _groqKeyIndex = (idx + 1) % GROQ_KEYS.length;
  return { key: GROQ_KEYS[idx], index: idx };
}

function markKeyFailed(index) {
  _groqKeyUsageCount[index] = (_groqKeyUsageCount[index] || 0) + 1;
  var nextIdx = (index + 1) % GROQ_KEYS.length;
  updateApiStatus('⚠ Rotation clé ' + (index+1) + '→' + (nextIdx+1), 'warn');
  return nextIdx;
}

function updateApiStatus(text, type) {
  var dot = document.getElementById('api-dot');
  var label = document.getElementById('api-status-text');
  if (!dot || !label) return;
  label.textContent = text;
  dot.style.background = type === 'warn' ? 'var(--gold)' : type === 'error' ? 'var(--rose)' : 'var(--emerald)';
}

/* ============================================================
   PLAN COMPTABLE SYSCOHADA REVISE 2023
============================================================ */
var PLAN_COMPTABLE={
"Classe 1 — Ressources durables":{
"101":"Capital social","1011":"Capital souscrit, non appelé","1012":"Capital souscrit, appelé, non versé","1013":"Capital souscrit, appelé, versé, non amorti","1014":"Capital souscrit, appelé, versé, amorti","102":"Capital par dotation","103":"Capital personnel","104":"Compte de l'exploitant","105":"Primes liées au capital social","1051":"Primes d'émission","1052":"Primes d'apport","106":"Écarts de réévaluation","111":"Réserve légale","112":"Réserves statutaires","121":"Report à nouveau créditeur","129":"Report à nouveau débiteur","131":"Résultat net : Bénéfice","139":"Résultat net : Perte","141":"Subventions d'équipement","151":"Amortissements dérogatoires","161":"Emprunts obligataires","162":"Emprunts et dettes auprès des établissements de crédit","163":"Avances reçues de l'État","165":"Dépôts et cautionnements reçus","166":"Intérêts courus sur emprunts","172":"Dettes de location-acquisition / crédit-bail immobilier","173":"Dettes de location-acquisition / crédit-bail mobilier","191":"Provisions pour litiges","192":"Provisions pour garanties","194":"Provisions pour pertes de change","195":"Provisions pour impôts","196":"Provisions pour pensions"
},
"Classe 2 — Actif immobilisé":{
"211":"Frais de développement","212":"Brevets, licences","213":"Logiciels et sites internet","215":"Marques","216":"Fonds commercial","217":"Droit au bail","221":"Terrains agricoles","222":"Terrains nus","223":"Terrains bâtis","231":"Bâtiments industriels sur sol propre","2311":"Bâtiments industriels","2312":"Bâtiments agricoles","2313":"Bâtiments administratifs","2314":"Bâtiments logement personnel","232":"Bâtiments sur sol d'autrui","233":"Ouvrages d'infrastructure","234":"Aménagements, agencements","241":"Matériel et outillage industriel","2411":"Matériel industriel","2412":"Outillage industriel","2413":"Matériel commercial","242":"Matériel et outillage agricole","244":"Matériel et mobilier","2441":"Matériel de bureau","2442":"Matériel informatique","2443":"Matériel bureautique","2444":"Mobilier de bureau","245":"Matériel de transport","2451":"Matériel automobile","2452":"Matériel ferroviaire","2455":"Matériel aérien","246":"Actifs biologiques","261":"Titres de participation exclusif","262":"Titres de participation conjoint","271":"Prêts et créances","272":"Prêts au personnel","275":"Dépôts et cautionnements versés","281":"Amortissements immos incorporelles","282":"Amortissements terrains","283":"Amortissements bâtiments","2831":"Amort. bâtiments industriels","2832":"Amort. bâtiments sur sol autrui","284":"Amortissements matériels","2841":"Amort. matériel industriel","2844":"Amort. matériel mobilier","2845":"Amort. matériel transport","291":"Dépréciations immos incorporelles","292":"Dépréciations immos corporelles","296":"Dépréciations titres participation"
},
"Classe 3 — Stocks":{
"31":"Marchandises","311":"Marchandises A","312":"Marchandises B","32":"Matières premières","321":"Matières premières A","33":"Autres approvisionnements","331":"Matières consommables","332":"Fournitures de bureau","35":"Produits finis","351":"Produits finis A","37":"Produits intermédiaires","371":"Produits intermédiaires","372":"Produits résiduels","391":"Dépréciations stocks marchandises","392":"Dépréciations stocks matières","396":"Dépréciations stocks produits finis"
},
"Classe 4 — Tiers":{
"401":"Fournisseurs, dettes en compte","4011":"Fournisseurs","4012":"Fournisseurs Groupe","4013":"Fournisseurs sous-traitants","4017":"Fournisseurs, retenues de garantie","402":"Fournisseurs, effets à payer","404":"Fournisseurs, acquisitions immobilisations","4041":"Fourn. immos incorporelles","4042":"Fourn. immos corporelles","408":"Fournisseurs, factures non parvenues","4081":"Factures non parvenues","409":"Fournisseurs débiteurs","4091":"Fourn. avances versées","411":"Clients","4111":"Clients","4112":"Clients Groupe","4117":"Clients, retenues de garantie","412":"Clients, effets à recevoir","4121":"Effets à recevoir","416":"Créances clients litigieuses","4161":"Créances litigieuses","4162":"Créances douteuses","418":"Clients, produits à recevoir","4181":"Factures à établir","419":"Clients créditeurs","4191":"Acomptes clients reçus","421":"Personnel, avances","4211":"Personnel, avances","4212":"Personnel, acomptes","422":"Personnel, rémunérations dues","423":"Personnel, oppositions","424":"Personnel, oeuvres sociales","4281":"Dettes provisionnées congés","431":"Sécurité sociale — CNPS","4311":"Prestations familiales","4312":"Accidents de travail","4313":"Retraite obligatoire CNPS","432":"Caisses retraite complémentaire","441":"État, impôt sur les bénéfices","442":"État, autres impôts","4421":"Impôts et taxes État","4426":"Droits de douane","4428":"Autres impôts et taxes","443":"État, T.V.A. facturée","4431":"TVA facturée sur ventes","4432":"TVA facturée sur prestations","4433":"TVA facturée sur travaux","444":"État, T.V.A. due ou crédit","4441":"État, TVA due","4449":"État, crédit TVA à reporter","445":"État, T.V.A. récupérable","4451":"TVA récup. sur immobilisations","4452":"TVA récup. sur achats","4453":"TVA récup. sur transport","4454":"TVA récup. sur services","447":"État, impôts retenus à la source","4471":"IGR/IRPP retenu","4472":"Impôts sur salaires","449":"État, créances et dettes diverses","4492":"Avances impôts versées","461":"Débiteurs divers","462":"Associés, comptes courants","465":"Associés, dividendes à payer","476":"Charges constatées d'avance","477":"Produits constatés d'avance","491":"Dépréciations comptes clients","499":"Provisions risques à court terme"
},
"Classe 5 — Trésorerie":{
"501":"Titres du Trésor","502":"Actions (titres de placement)","511":"Effets à encaisser","521":"Banques locales","5211":"Banques locales — monnaie nationale","5215":"Banques en devises","522":"Banques autres États UEMOA","525":"Banques, dépôts à terme","531":"Chèques postaux (CCP)","532":"Trésor","551":"Monnaie électronique — carte carburant","552":"Monnaie électronique — téléphone","553":"Monnaie électronique — péage","571":"Caisse siège social","5711":"Caisse — monnaie nationale","5712":"Caisse en devises","572":"Caisse succursale A","581":"Régies d'avance","585":"Virements de fonds","590":"Dépréciations titres placement"
},
"Classe 6 — Charges des activités ordinaires":{
"601":"Achats de marchandises","6011":"Achats marchandises — région","6012":"Achats marchandises — hors région","6015":"Frais sur achats marchandises","6019":"RRR obtenus sur marchandises","602":"Achats matières premières","6021":"Achats matières premières — région","6022":"Achats matières premières — hors région","603":"Variations des stocks achetés","6031":"Variations stocks marchandises","6032":"Variations stocks matières premières","604":"Achats stockés matières","6041":"Matières consommables","6042":"Matières combustibles","6047":"Fournitures de bureau","605":"Autres achats","6051":"Eau","6052":"Électricité","6053":"Autres énergies","6056":"Petit matériel outillage","612":"Transports sur ventes","614":"Transports du personnel","621":"Sous-traitance générale","622":"Locations, charges locatives","6222":"Locations bâtiments","6223":"Locations matériels","623":"Redevances location-acquisition","6232":"Crédit-bail immobilier","6233":"Crédit-bail mobilier","624":"Entretien, réparations","6241":"Entretien biens immobiliers","6242":"Entretien biens mobiliers","6243":"Maintenance","625":"Primes d'assurance","6251":"Assurances multirisques","6252":"Assurances transport","626":"Études, recherches","627":"Publicité, publications","6271":"Annonces, insertions","628":"Frais de télécommunications","6281":"Frais de téléphone","6282":"Internet et services numériques","629":"Autres services extérieurs","6291":"Frais bancaires et commissions","661":"Rémunérations du personnel","6611":"Appointements et salaires bruts","6612":"Primes et gratifications","6613":"Indemnités et avantages divers","664":"Charges sociales patronales CNPS","6641":"Cotisations patronales — prest. familiales","6642":"Cotisations patronales — accidents","6643":"Cotisations patronales — retraite","665":"Charges de formation","681":"Dotations amort. — immos corporelles","6811":"Dotations amort. bâtiments","6813":"Dotations amort. matériels industriels","6814":"Dotations amort. matériel mobilier","6815":"Dotations amort. matériel transport","682":"Dotations amort. — immos incorporelles","6821":"Dotations amort. frais développement","6822":"Dotations amort. brevets licences","691":"Dotations provisions pour risques","6941":"Dotations dépréciations stocks","6942":"Dotations dépréciations créances"
},
"Classe 7 — Produits des activités ordinaires":{
"701":"Ventes de marchandises","7011":"Ventes marchandises — région","7012":"Ventes marchandises — hors région","7019":"RRR accordés sur ventes","702":"Ventes de produits finis","7021":"Ventes produits finis — région","703":"Variations stocks produits","7031":"Variations stocks produits finis","704":"Travaux facturés","705":"Services vendus","7051":"Services vendus — région","7052":"Services vendus — hors région","706":"Produits et recettes accessoires","721":"Production immobilisée","7211":"Production immos incorporelles","7212":"Production immos corporelles","741":"Subventions d'exploitation","7411":"Subventions État","7412":"Subventions collectivités","742":"Subventions d'équilibre","751":"Revenus immeubles","761":"Revenus de participation","762":"Revenus titres de placement","763":"Intérêts de prêts","765":"Escomptes obtenus","767":"Gains de change","771":"Produits cessions immos corporelles","772":"Produits cessions immos incorporelles","781":"Reprises amortissements","791":"Reprises provisions","7941":"Reprises dépréciations stocks","7942":"Reprises dépréciations créances"
},
"Classe 8 — Charges et produits HAO":{
"811":"VNC cessions immos corporelles","812":"VNC cessions immos incorporelles","821":"Produits cessions immos corporelles","822":"Produits cessions immos incorporelles","831":"Charges H.A.O. diverses","841":"Produits H.A.O. divers","861":"Participation travailleurs bénéfices","871":"Impôt sur le résultat","8711":"Impôt minimum forfaitaire (I.M.F.)","8712":"IRPP","8713":"Impôts sur les sociétés (I.S.)"
}
};

/* ============================================================
   ENTREPRISE CONFIG
============================================================ */
var ENTREPRISE_CONFIG={
  commerce:{label:'Commerce',quickOps:['Vente marchandises crédit','Achat marchandises crédit','Encaissement client','Règlement fournisseur','Variation stock marchandises','Salaires personnel','Dotation amortissement','TVA à décaisser','Acquisition immobilisation','Emprunt bancaire'],types:[{value:'',label:'Auto IA'},{value:'vente',label:'Vente'},{value:'achat',label:'Achat'},{value:'encaissement',label:'Encaissement client'},{value:'reglement_fourn',label:'Règlement fournisseur'},{value:'variation_stock',label:'Variation stock'},{value:'salaire',label:'Salaires'},{value:'amortissement',label:'Amortissement'},{value:'tva',label:'TVA'},{value:'immobilisation',label:'Immobilisation'},{value:'emprunt',label:'Emprunt'}]},
  service:{label:'Services',quickOps:['Facturation prestation de service','Encaissement honoraires','Achat fournitures bureau','Salaires personnel','Loyer locaux professionnels','Dotation amortissement','TVA collectée','Acompte client reçu'],types:[{value:'',label:'Auto IA'},{value:'facturation',label:'Facturation'},{value:'encaissement',label:'Encaissement'},{value:'achat_fourniture',label:'Fournitures'},{value:'salaire',label:'Salaires'},{value:'loyer',label:'Loyer'},{value:'amortissement',label:'Amortissement'},{value:'tva',label:'TVA'}]},
  industrie:{label:'Industrie',quickOps:['Achat matières premières','Consommation matières premières','Constatation produits finis','Vente produits finis','Variation stock PF','Sous-traitance industrielle','Amortissement matériel industriel','Salaires ouvriers','Énergie et combustibles'],types:[{value:'',label:'Auto IA'},{value:'achat_mp',label:'Achat MP'},{value:'production',label:'Production'},{value:'vente_pf',label:'Vente PF'},{value:'stock_mp',label:'Stock MP'},{value:'stock_pf',label:'Stock PF'},{value:'salaire',label:'Salaires'},{value:'amortissement',label:'Amortissement'}]},
  banque:{label:'Banque',quickOps:['Dépôt client','Crédit court terme accordé','Intérêts sur prêts','Commissions sur services','Remboursement crédit','Dotation provisions créances','Opération de change'],types:[{value:'',label:'Auto IA'},{value:'depot',label:'Dépôts'},{value:'credit',label:'Crédits'},{value:'interets',label:'Intérêts'},{value:'commission',label:'Commissions'},{value:'change',label:'Change'}]},
  sante:{label:'Santé',quickOps:['Recettes consultations','Facturation hospitalisation','Achat médicaments','Achat matériel médical','Salaires personnel médical','Subvention État santé'],types:[{value:'',label:'Auto IA'},{value:'recette_soins',label:'Recettes soins'},{value:'achat_medicaments',label:'Médicaments'},{value:'hospitalisation',label:'Hospitalisation'},{value:'salaire',label:'Salaires'},{value:'subvention',label:'Subvention'}]},
  education:{label:'Éducation',quickOps:['Frais de scolarité encaissés','Subvention État éducation','Salaires enseignants','Achat fournitures scolaires','Achat matériel informatique'],types:[{value:'',label:'Auto IA'},{value:'frais_scolarite',label:'Scolarité'},{value:'subvention',label:'Subvention'},{value:'salaire_enseignant',label:'Salaires'},{value:'achat_fournitures',label:'Fournitures'}]},
  ong:{label:'ONG',quickOps:['Subvention bailleur de fonds','Dépenses projet terrain','Salaires équipe projet','Don en espèces reçu','Cotisations membres'],types:[{value:'',label:'Auto IA'},{value:'subvention_projet',label:'Subvention'},{value:'depense_projet',label:'Dépenses projet'},{value:'salaire',label:'Salaires'},{value:'cotisation',label:'Cotisations'}]},
  agri:{label:'Agriculture',quickOps:['Achat intrants agricoles','Vente de récoltes','Variation stock produits agricoles','Salaires saisonniers','Subvention agricole'],types:[{value:'',label:'Auto IA'},{value:'achat_intrants',label:'Intrants'},{value:'vente_recolte',label:'Vente récolte'},{value:'stock_agri',label:'Stock'},{value:'salaire_ouvrier',label:'Main-d\'oeuvre'}]},
  immo:{label:'Immobilier',quickOps:['Facture avancement travaux','Achat matériaux construction','Sous-traitance BTP','Acompte reçu sur chantier','Retenue de garantie'],types:[{value:'',label:'Auto IA'},{value:'facturation_travaux',label:'Facturation travaux'},{value:'achat_materiaux',label:'Matériaux'},{value:'sous_traitance',label:'Sous-traitance'},{value:'acompte_chantier',label:'Acomptes'}]},
  transport:{label:'Transport',quickOps:['Facturation transport','Achat carburant','Entretien véhicule','Amortissement véhicules','Salaires chauffeurs'],types:[{value:'',label:'Auto IA'},{value:'facturation_transport',label:'Facturation'},{value:'achat_carburant',label:'Carburant'},{value:'entretien',label:'Entretien'},{value:'salaire_chauffeur',label:'Salaires'}]}
};

/* ============================================================
   UTILS
============================================================ */
function fmtAmount(n){if(!n)return '';return new Intl.NumberFormat('fr-FR').format(Math.round(n))+' FCFA';}
function parseAmount(v){if(!v)return 0;return parseInt(String(v).replace(/[^0-9]/g,''))||0;}
function todayDate(){return new Date().toISOString().split('T')[0];}
function showToast(msg,dur){dur=dur||3000;var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._tid);t._tid=setTimeout(function(){t.classList.remove('show');},dur);}
function genRef(){var now=new Date();return 'JNL-'+now.getFullYear()+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')+'-'+String(Math.floor(Math.random()*900)+100);}
function escHtml(s){if(!s)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function hashPassword(str){var h=0;for(var i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;}return String(Math.abs(h));}

function getPlanLibelle(compte){
  if(!compte)return '';
  var c=String(compte);
  var classes=Object.values(PLAN_COMPTABLE);
  for(var i=0;i<classes.length;i++){if(classes[i][c])return classes[i][c];}
  for(var len=4;len>=2;len--){
    var prefix=c.substring(0,len);
    for(var j=0;j<classes.length;j++){if(classes[j][prefix])return classes[j][prefix];}
  }
  return '';
}

/* ============================================================
   AUTH
============================================================ */
var currentUser=null,currentEntrepriseType='commerce',allEcritures=[];

function switchAuth(tab){
  document.querySelectorAll('.auth-tab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.auth-form').forEach(function(f){f.classList.remove('active');});
  var tabs=document.querySelectorAll('.auth-tab');
  if(tab==='login')tabs[0].classList.add('active');else tabs[1].classList.add('active');
  document.getElementById('form-'+tab).classList.add('active');
}

function doRegister(){
  var err=document.getElementById('register-error'),suc=document.getElementById('register-success');
  err.style.display='none';suc.style.display='none';
  var nom=document.getElementById('reg-entreprise').value.trim();
  var contact=document.getElementById('reg-contact').value.trim();
  var pass=document.getElementById('reg-password').value;
  var pass2=document.getElementById('reg-password2').value;
  if(!nom||!contact||!pass){err.textContent='Tous les champs requis.';err.style.display='block';return;}
  if(pass.length<6){err.textContent='Mot de passe trop court (min 6).';err.style.display='block';return;}
  if(pass!==pass2){err.textContent='Les mots de passe ne correspondent pas.';err.style.display='block';return;}
  var btn=document.getElementById('btn-register');btn.disabled=true;btn.textContent='Création...';
  db1.collection('users').where('nom_entreprise','==',nom).get().then(function(snap){
    if(!snap.empty){err.textContent='Cette entreprise existe déjà.';err.style.display='block';btn.disabled=false;btn.textContent='Créer mon compte — 24h gratuit';return;}
    var now=Date.now();
    var userData={
      nom_entreprise:nom,contact:contact,password_hash:hashPassword(pass),created_at:now,
      trial_ends_at:now+86400000,is_subscribed:false,subscription_ends_at:0,
      subscription_type:'none',last_payment_date:0,payment_amount:0,
      type_entreprise:document.getElementById('reg-type').value||'commerce',
      secteur:document.getElementById('reg-secteur').value.trim(),
      pays:document.getElementById('reg-pays').value||'CI',
      ville:document.getElementById('reg-ville').value.trim(),
      rccm:document.getElementById('reg-rccm').value.trim(),
      regime_fiscal:document.getElementById('reg-regime').value||'reel'
    };
    var p1=db1.collection('users').add(userData);
    var p2=db2.collection('abonnements').add({
      nom_entreprise:nom,contact:contact,created_at:now,trial_ends_at:now+86400000,
      is_subscribed:false,subscription_type:'none',subscription_ends_at:0,
      last_payment_date:0,payment_amount:0,
      pays:document.getElementById('reg-pays').value||'CI',
      ville:document.getElementById('reg-ville').value.trim(),
      type_entreprise:document.getElementById('reg-type').value||'commerce',
      statut:'trial'
    });
    Promise.all([p1,p2]).then(function(){
      suc.textContent='Compte créé ! Essai 24h actif. Connectez-vous.';
      suc.style.display='block';
      setTimeout(function(){switchAuth('login');},1500);
    }).catch(function(e){
      err.textContent='Erreur : '+e.message;err.style.display='block';
    }).finally(function(){
      btn.disabled=false;btn.textContent='Créer mon compte — 24h gratuit';
    });
  }).catch(function(e){err.textContent='Erreur : '+e.message;err.style.display='block';btn.disabled=false;btn.textContent='Créer mon compte — 24h gratuit';});
}

function doLogin(){
  var err=document.getElementById('login-error');err.style.display='none';
  var nom=document.getElementById('login-entreprise').value.trim();
  var pass=document.getElementById('login-password').value;
  if(!nom||!pass){err.textContent='Remplissez tous les champs.';err.style.display='block';return;}
  var btn=document.getElementById('btn-login');btn.disabled=true;btn.textContent='Connexion...';
  db1.collection('users').where('nom_entreprise','==',nom).limit(1).get().then(function(snap){
    if(snap.empty){err.textContent='Entreprise non trouvée.';err.style.display='block';btn.disabled=false;btn.textContent='Se connecter';return;}
    var doc=snap.docs[0],data=doc.data();
    if(data.password_hash!==hashPassword(pass)){err.textContent='Mot de passe incorrect.';err.style.display='block';btn.disabled=false;btn.textContent='Se connecter';return;}
    db2.collection('abonnements').where('nom_entreprise','==',nom).limit(1).get().then(function(snap2){
      var abonnement={};
      if(!snap2.empty){
        abonnement=snap2.docs[0].data();
        if(abonnement.is_subscribed!==undefined){
          db1.collection('users').doc(doc.id).update({
            is_subscribed:abonnement.is_subscribed,
            subscription_ends_at:abonnement.subscription_ends_at||0,
            subscription_type:abonnement.subscription_type||'none',
            last_payment_date:abonnement.last_payment_date||0,
            payment_amount:abonnement.payment_amount||0
          });
        }
      }
      currentUser=Object.assign({id:doc.id},data,{
        is_subscribed:abonnement.is_subscribed!==undefined?abonnement.is_subscribed:data.is_subscribed,
        subscription_ends_at:abonnement.subscription_ends_at||data.subscription_ends_at||0,
        subscription_type:abonnement.subscription_type||data.subscription_type||'none'
      });
      afterLogin();
      btn.disabled=false;btn.textContent='Se connecter';
    }).catch(function(){
      currentUser=Object.assign({id:doc.id},data);
      afterLogin();
      btn.disabled=false;btn.textContent='Se connecter';
    });
  }).catch(function(e){err.textContent='Erreur : '+e.message;err.style.display='block';btn.disabled=false;btn.textContent='Se connecter';});
}

function forgotPassword(){var nom=document.getElementById('login-entreprise').value.trim();window.open('https://wa.me/2250508463003?text='+encodeURIComponent('Bonjour, j\'ai oublié mon mot de passe Comeo AI. Mon entreprise : '+(nom||'____')),'_blank');}

function logout(){currentUser=null;allEcritures=[];document.getElementById('app').classList.remove('active');document.getElementById('auth-overlay').style.display='flex';document.getElementById('paywall-overlay').style.display='none';document.getElementById('login-password').value='';}

function afterLogin(){
  document.getElementById('auth-overlay').style.display='none';
  document.getElementById('app').classList.add('active');
  document.getElementById('header-org').textContent='🏢 '+currentUser.nom_entreprise;
  currentEntrepriseType=currentUser.type_entreprise||'commerce';
  document.getElementById('profil-nom').value=currentUser.nom_entreprise||'';
  document.getElementById('profil-contact').value=currentUser.contact||'';
  document.getElementById('profil-type').value=currentUser.type_entreprise||'commerce';
  document.getElementById('profil-secteur').value=currentUser.secteur||'';
  document.getElementById('profil-pays').value=currentUser.pays||'CI';
  document.getElementById('profil-ville').value=currentUser.ville||'';
  document.getElementById('profil-rccm').value=currentUser.rccm||'';
  document.getElementById('profil-regime').value=currentUser.regime_fiscal||'reel';
  updateSubscriptionStatus();
  loadEcritures();
}

function updateSubscriptionStatus(){
  var now=Date.now();
  var trialActive=now<currentUser.trial_ends_at;
  var subActive=currentUser.is_subscribed&&now<currentUser.subscription_ends_at;
  var badge=document.getElementById('header-status');
  if(trialActive){
    var h=Math.ceil((currentUser.trial_ends_at-now)/3600000);
    badge.className='pill pill-warn';badge.textContent='⏳ Essai : '+h+'h';
  } else if(subActive){
    var j=Math.ceil((currentUser.subscription_ends_at-now)/86400000);
    var typeLabel=currentUser.subscription_type==='annual'?'Annuel':'Mensuel';
    badge.className='pill pill-gold';badge.textContent='✅ '+typeLabel+' ('+j+'j)';
  } else {
    badge.className='pill pill-warn';badge.textContent='🔒 Expiré';
    showPaywall();
  }
}

function showPaywall(){document.getElementById('paywall-overlay').style.display='flex';}
setInterval(function(){if(currentUser)updateSubscriptionStatus();},60000);

/* ============================================================
   DATA — ÉCRITURES (DB1)
============================================================ */
function loadEcritures(){
  if(!currentUser)return;
  db1.collection('ecritures').where('user_id','==',currentUser.id).get().then(function(snap){
    allEcritures=snap.docs.map(function(d){
      var data=d.data();
      if(data.ecritures&&Array.isArray(data.ecritures)&&(!data.lignes||!data.lignes.length)){
        data.lignes=[];data.ecritures.forEach(function(ec){(ec.lignes||[]).forEach(function(l){data.lignes.push(l);});});
      }
      return Object.assign({id:d.id},data);
    });
    allEcritures.sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
    renderDashboard();renderGrandLivre();renderBalance();renderBilan();renderResultat();renderTiers();renderTresorerie();
  }).catch(function(e){showToast('Erreur chargement : '+e.message);});
}

function saveEcriture(data){
  if(!currentUser)return Promise.resolve();
  var payload=Object.assign({},data);
  if(payload.ecritures&&Array.isArray(payload.ecritures)){
    payload.lignes=[];payload.ecritures.forEach(function(ec){(ec.lignes||[]).forEach(function(l){payload.lignes.push(l);});});
  }
  var doc=Object.assign({},payload,{user_id:currentUser.id,created_at:Date.now()});
  return db1.collection('ecritures').add(doc).then(function(ref){
    doc.id=ref.id;allEcritures.unshift(doc);allEcritures.sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
    renderDashboard();renderGrandLivre();renderBalance();renderBilan();renderResultat();renderTiers();renderTresorerie();
    showToast('✓ Écriture enregistrée');return doc;
  });
}

/* ============================================================
   DASHBOARD
============================================================ */
function renderDashboard(){
  var now=new Date(),ym=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  var thisMonth=allEcritures.filter(function(e){return e.date&&e.date.startsWith(ym);});
  var totalDebit=0,totalCredit=0,soldeTreso=0;
  thisMonth.forEach(function(e){(e.lignes||[]).forEach(function(l){totalDebit+=l.debit||0;totalCredit+=l.credit||0;});});
  allEcritures.forEach(function(e){(e.lignes||[]).forEach(function(l){if(String(l.compte||'').match(/^5[0-9]/))soldeTreso+=(l.debit||0)-(l.credit||0);});});
  document.getElementById('dash-nb-ecritures').textContent=thisMonth.length;
  document.getElementById('dash-total-debit').textContent=fmtAmount(totalDebit);
  document.getElementById('dash-total-credit').textContent=fmtAmount(totalCredit);
  document.getElementById('dash-solde-treso').textContent=fmtAmount(soldeTreso);
  var last=allEcritures.slice(0,5);
  if(!last.length){document.getElementById('dash-last-ecritures').innerHTML='<div style="color:var(--text3);font-family:var(--mono);font-size:12px;padding:10px;">Aucune écriture.</div>';return;}
  var html='<table class="data-table"><thead><tr><th>Date</th><th>Réf</th><th>Description</th><th style="text-align:right">Débit</th><th style="text-align:right">Crédit</th></tr></thead><tbody>';
  last.forEach(function(e){var td=0,tc=0;(e.lignes||[]).forEach(function(l){td+=l.debit||0;tc+=l.credit||0;});html+='<tr><td>'+escHtml(e.date)+'</td><td>'+escHtml(e.reference)+'</td><td>'+escHtml(e.description||e.titre)+'</td><td class="col-debit">'+fmtAmount(td)+'</td><td class="col-credit">'+fmtAmount(tc)+'</td></tr>';});
  document.getElementById('dash-last-ecritures').innerHTML=html+'</tbody></table>';
}

/* ============================================================
   NAVIGATION
============================================================ */
function showView(id,el){
  document.querySelectorAll('.view').forEach(function(v){v.classList.remove('active');});
  document.querySelectorAll('.sidebar-item').forEach(function(s){s.classList.remove('active');});
  document.getElementById('view-'+id).classList.add('active');
  if(el)el.classList.add('active');
  var renders={grandlivre:renderGrandLivre,balance:renderBalance,bilan:renderBilan,resultat:renderResultat,tiers:renderTiers,tresorerie:renderTresorerie,dashboard:renderDashboard,plan:renderPlan,guide:renderGuide,historique:renderHistorique};
  if(renders[id])renders[id]();
}
function switchJournalMode(mode,el){document.querySelectorAll('.panel-tab').forEach(function(t){t.classList.remove('active');});document.querySelectorAll('.journal-mode').forEach(function(m){m.classList.remove('active');});if(el)el.classList.add('active');document.getElementById('journal-mode-'+mode).classList.add('active');}

/* ============================================================
   SAISIE RAPIDE
============================================================ */
function saveManualSimple(){
  var desc=document.getElementById('op-description').value.trim();
  var date=document.getElementById('op-date').value||todayDate();
  var ref=document.getElementById('op-ref').value.trim()||genRef();
  var montant=parseAmount(document.getElementById('op-montant').value);
  if(!desc||!montant){showToast('Remplissez la description et le montant');return;}
  var ecriture={titre:desc,date:date,reference:ref,description:desc,type_entreprise:currentEntrepriseType,lignes:[{compte:'601',libelle:'Charge / Achat',debit:montant,credit:0},{compte:'5211',libelle:'Banque — monnaie nationale',debit:0,credit:montant}]};
  saveEcriture(ecriture);
  document.getElementById('output-content').innerHTML='<div class="journal-card"><div class="journal-card-header"><div class="journal-card-title">Écriture rapide enregistrée</div><div class="equilibre-ok">✓ Enregistré</div></div><div style="padding:14px;color:var(--text2);font-size:13px;font-family:var(--mono);">'+escHtml(desc)+' — '+fmtAmount(montant)+'</div></div>';
}

/* ============================================================
   SAISIE MANUELLE MULTI-LIGNES
============================================================ */
var manualLines=[];
function initManualLines(){manualLines=[{compte:'',libelle:'',debit:'',credit:''}];renderManualLines();}
function renderManualLines(){
  var tbody=document.getElementById('manual-lines-body'),html='';
  manualLines.forEach(function(line,idx){
    html+='<tr><td><input type="text" value="'+escHtml(line.compte)+'" onchange="updateManualLine('+idx+',\'compte\',this.value)" placeholder="4011"/></td><td><input type="text" value="'+escHtml(line.libelle)+'" onchange="updateManualLine('+idx+',\'libelle\',this.value)" placeholder="Libellé"/></td><td><input type="text" class="mono" value="'+escHtml(line.debit)+'" onchange="updateManualLine('+idx+',\'debit\',this.value)" placeholder="0"/></td><td><input type="text" class="mono" value="'+escHtml(line.credit)+'" onchange="updateManualLine('+idx+',\'credit\',this.value)" placeholder="0"/></td><td style="text-align:center"><button class="btn-secondary" style="padding:2px 8px;font-size:11px;" onclick="removeManualLine('+idx+')">×</button></td></tr>';
  });
  tbody.innerHTML=html;updateManualTotals();
}
function updateManualLine(idx,field,value){manualLines[idx][field]=value;updateManualTotals();}
function addManualLine(){manualLines.push({compte:'',libelle:'',debit:'',credit:''});renderManualLines();}
function removeManualLine(idx){if(manualLines.length<=1)return;manualLines.splice(idx,1);renderManualLines();}
function clearManualLines(){initManualLines();}
function updateManualTotals(){
  var td=0,tc=0;
  manualLines.forEach(function(l){td+=parseAmount(l.debit);tc+=parseAmount(l.credit);});
  var ok=Math.abs(td-tc)<1;
  document.getElementById('manual-totals').innerHTML='Total Débit : <span class="'+(ok?'ok':'err')+'">'+fmtAmount(td)+'</span> | Total Crédit : <span class="'+(ok?'ok':'err')+'">'+fmtAmount(tc)+'</span>'+(ok?' <span class="ok">✓</span>':' <span class="err">✗</span>');
}
function saveManualMulti(){
  var desc=document.getElementById('manual-desc').value.trim();
  var date=document.getElementById('manual-date').value||todayDate();
  var ref=document.getElementById('manual-ref').value.trim()||genRef();
  var td=0,tc=0,lignes=[];
  manualLines.forEach(function(l){var d=parseAmount(l.debit),c=parseAmount(l.credit);if(!l.compte&&d===0&&c===0)return;td+=d;tc+=c;lignes.push({compte:l.compte||'5211',libelle:l.libelle||'-',debit:d,credit:c});});
  if(!lignes.length){showToast('Aucune ligne à enregistrer');return;}
  if(Math.abs(td-tc)>1){showToast('Débit et Crédit doivent être égaux');return;}
  if(!desc){showToast('Veuillez saisir un libellé');return;}
  saveEcriture({titre:desc,date:date,reference:ref,description:desc,type_entreprise:currentEntrepriseType,lignes:lignes});
  document.getElementById('output-content').innerHTML='<div class="journal-card"><div class="journal-card-header"><div class="journal-card-title">Écriture enregistrée</div><div class="equilibre-ok">✓ Équilibre</div></div><div style="padding:14px;color:var(--text2);font-size:13px;font-family:var(--mono);">'+escHtml(desc)+' — '+lignes.length+' ligne(s)</div></div>';
  initManualLines();
}

/* ============================================================
   ENTREPRISE SELECT
============================================================ */
function selectEntreprise(el){document.querySelectorAll('.e-chip').forEach(function(c){c.classList.remove('active');});el.classList.add('active');currentEntrepriseType=el.dataset.type;document.getElementById('context-badge').textContent=ENTREPRISE_CONFIG[currentEntrepriseType].label;renderQuickOps();renderTypeSelect();}
function renderQuickOps(){var type=currentEntrepriseType||'commerce';document.getElementById('quick-ops-container').innerHTML=ENTREPRISE_CONFIG[type].quickOps.map(function(op){return '<span class="quick-chip" onclick="setQuick(\''+op.replace(/'/g,"\\'")+'\')">' + op + '</span>';}).join('');}
function renderTypeSelect(){var type=currentEntrepriseType||'commerce';document.getElementById('op-type').innerHTML=ENTREPRISE_CONFIG[type].types.map(function(t){return '<option value="'+t.value+'">'+t.label+'</option>';}).join('');}
function setQuick(text){document.getElementById('op-description').value=text;}

/* ============================================================
   PLAN COMPTABLE
============================================================ */
function renderPlan(filter){
  filter=filter||'';var fl=filter.toLowerCase();
  var body=document.getElementById('plan-body'),html='';
  Object.entries(PLAN_COMPTABLE).forEach(function(entry){
    var items=Object.entries(entry[1]).filter(function(kv){return !fl||kv[0].includes(fl)||kv[1].toLowerCase().includes(fl);});
    if(!items.length)return;
    html+='<div style="margin-bottom:22px;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="font-family:var(--mono);font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;font-weight:500;">'+escHtml(entry[0])+'</div><div style="flex:1;height:1px;background:var(--border);"></div></div><div class="plan-grid">';
    items.forEach(function(kv){html+='<div class="plan-item"><span class="plan-num">'+escHtml(kv[0])+'</span><span class="plan-lib">'+escHtml(kv[1])+'</span></div>';});
    html+='</div></div>';
  });
  body.innerHTML=html||'<div style="padding:30px;text-align:center;color:var(--text3);font-family:var(--mono);">Aucun compte trouvé</div>';
}
function filterPlan(val){renderPlan(val);}

/* ============================================================
   GUIDE DES OPÉRATIONS
============================================================ */
var GUIDE_DATA=[
  {section:"Ventes (Commerce & Industrie)",ops:[
    {title:"Vente marchandises crédit — HT + TVA 18%",entries:[{c:"4111",l:"Clients (TTC)",d:1,cr:0},{c:"7011",l:"Ventes de marchandises",d:0,cr:1},{c:"4431",l:"T.V.A. facturée sur ventes",d:0,cr:1}]},
    {title:"Vente prestations de service — avec TVA",entries:[{c:"4111",l:"Clients (TTC)",d:1,cr:0},{c:"705",l:"Services vendus",d:0,cr:1},{c:"4432",l:"T.V.A. facturée sur prestations",d:0,cr:1}]},
    {title:"Encaissement règlement client",entries:[{c:"5211",l:"Banques locales — monnaie nationale",d:1,cr:0},{c:"4111",l:"Clients",d:0,cr:1}]}
  ]},
  {section:"Achats & Fournisseurs",ops:[
    {title:"Achat marchandises crédit — HT + TVA",entries:[{c:"6011",l:"Achats de marchandises — région",d:1,cr:0},{c:"4452",l:"T.V.A. récupérable sur achats",d:1,cr:0},{c:"4011",l:"Fournisseurs",d:0,cr:1}]},
    {title:"Achat matières premières",entries:[{c:"6021",l:"Achats matières premières — région",d:1,cr:0},{c:"4452",l:"T.V.A. récupérable sur achats",d:1,cr:0},{c:"4011",l:"Fournisseurs",d:0,cr:1}]},
    {title:"Règlement fournisseur par banque",entries:[{c:"4011",l:"Fournisseurs",d:1,cr:0},{c:"5211",l:"Banques locales — monnaie nationale",d:0,cr:1}]}
  ]},
  {section:"Salaires & Charges sociales",ops:[
    {title:"Constatation des salaires bruts",entries:[{c:"6611",l:"Appointements et salaires bruts",d:1,cr:0},{c:"4471",l:"IGR/IRPP retenu à la source",d:0,cr:1},{c:"4313",l:"CNPS — cotisations salariales retraite",d:0,cr:1},{c:"422",l:"Personnel, rémunérations dues (net)",d:0,cr:1}]},
    {title:"Cotisations patronales CNPS",entries:[{c:"6641",l:"Cotisations patronales — prest. familiales",d:1,cr:0},{c:"6642",l:"Cotisations patronales — accidents",d:1,cr:0},{c:"6643",l:"Cotisations patronales — retraite",d:1,cr:0},{c:"431",l:"Sécurité sociale — CNPS",d:0,cr:1}]},
    {title:"Paiement salaires nets",entries:[{c:"422",l:"Personnel, rémunérations dues",d:1,cr:0},{c:"5211",l:"Banques locales — monnaie nationale",d:0,cr:1}]}
  ]},
  {section:"Immobilisations & Amortissements",ops:[
    {title:"Acquisition matériel de transport au comptant",entries:[{c:"2451",l:"Matériel automobile",d:1,cr:0},{c:"4451",l:"T.V.A. récupérable sur immobilisations",d:1,cr:0},{c:"5211",l:"Banques locales — monnaie nationale",d:0,cr:1}]},
    {title:"Dotation aux amortissements matériel",entries:[{c:"6815",l:"Dotations amort. matériel de transport",d:1,cr:0},{c:"2845",l:"Amortissements du matériel de transport",d:0,cr:1}]},
    {title:"Acquisition matériel informatique crédit",entries:[{c:"2442",l:"Matériel informatique",d:1,cr:0},{c:"4451",l:"T.V.A. récupérable sur immobilisations",d:1,cr:0},{c:"4042",l:"Fournisseurs — immobilisations corporelles",d:0,cr:1}]}
  ]},
  {section:"TVA & Fiscalité",ops:[
    {title:"Liquidation TVA mensuelle",entries:[{c:"4431",l:"T.V.A. facturée sur ventes",d:1,cr:0},{c:"4432",l:"T.V.A. facturée sur prestations",d:1,cr:0},{c:"4452",l:"T.V.A. récupérable sur achats",d:0,cr:1},{c:"4451",l:"T.V.A. récupérable sur immos",d:0,cr:1},{c:"4441",l:"État, T.V.A. due",d:0,cr:1}]},
    {title:"Paiement TVA à l'État",entries:[{c:"4441",l:"État, T.V.A. due",d:1,cr:0},{c:"5211",l:"Banques locales — monnaie nationale",d:0,cr:1}]},
    {title:"Impôt sur les bénéfices (IS)",entries:[{c:"8713",l:"Impôts sur les sociétés (I.S.)",d:1,cr:0},{c:"441",l:"État, impôt sur les bénéfices",d:0,cr:1}]}
  ]},
  {section:"Trésorerie & Financement",ops:[
    {title:"Emprunt bancaire reçu",entries:[{c:"5211",l:"Banques locales — monnaie nationale",d:1,cr:0},{c:"162",l:"Emprunts — établissements de crédit",d:0,cr:1}]},
    {title:"Remboursement annuité emprunt",entries:[{c:"162",l:"Emprunts — établissements de crédit",d:1,cr:0},{c:"6291",l:"Intérêts sur emprunts",d:1,cr:0},{c:"5211",l:"Banques locales — monnaie nationale",d:0,cr:1}]},
    {title:"Virement de fonds caisse → banque",entries:[{c:"585",l:"Virements de fonds",d:1,cr:0},{c:"5711",l:"Caisse — monnaie nationale",d:0,cr:1},{c:"5211",l:"Banques locales — monnaie nationale",d:1,cr:0},{c:"585",l:"Virements de fonds",d:0,cr:1}]}
  ]}
];

function renderGuide(){
  var body=document.getElementById('guide-body'),html='';
  GUIDE_DATA.forEach(function(sec){
    html+='<div style="margin-bottom:28px;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;"><div style="font-family:var(--serif);font-size:16px;color:var(--text);font-weight:400;font-style:italic;">'+escHtml(sec.section)+'</div><div style="flex:1;height:1px;background:var(--border);"></div></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;">';
    sec.ops.forEach(function(op){
      html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px;"><div style="font-family:var(--mono);font-size:11px;color:var(--text2);font-weight:500;margin-bottom:8px;letter-spacing:0.3px;">'+escHtml(op.title)+'</div><div style="display:flex;flex-direction:column;gap:3px;">';
      op.entries.forEach(function(e){html+='<div style="display:flex;gap:8px;font-family:var(--mono);font-size:10px;letter-spacing:0.3px;"><span style="color:var(--gold);min-width:36px;">'+e.c+'</span><span style="color:var(--text3);flex:1;">'+escHtml(e.l)+'</span>'+(e.d?'<span style="color:var(--debit);">D</span>':'<span style="opacity:0;">D</span>')+(e.cr?'<span style="color:var(--credit);">C</span>':'<span style="opacity:0;">C</span>')+'</div>';});
      html+='</div></div>';
    });
    html+='</div></div>';
  });
  body.innerHTML=html;
}

/* ============================================================
   GRAND LIVRE
============================================================ */
function renderGrandLivre(filter){
  filter=filter||'';
  var body=document.getElementById('gl-body');
  if(!allEcritures.length){body.innerHTML='<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div><h3>Grand Livre vide</h3><p>Saisissez des écritures dans le Journal.</p></div>';return;}
  var byCompte={};
  allEcritures.forEach(function(e){(e.lignes||[]).forEach(function(l){var c=String(l.compte||'');if(!c)return;if(filter&&!c.includes(filter)&&!getPlanLibelle(c).toLowerCase().includes(filter.toLowerCase()))return;if(!byCompte[c])byCompte[c]={libelle:getPlanLibelle(c)||l.libelle,lignes:[]};byCompte[c].lignes.push({date:e.date,ref:e.reference,desc:e.description||e.titre,debit:l.debit||0,credit:l.credit||0});});});
  var comptes=Object.keys(byCompte).sort();
  if(!comptes.length){body.innerHTML='<div style="padding:20px;color:var(--text3);font-family:var(--mono);">Aucun compte trouvé.</div>';return;}
  var html='';
  comptes.forEach(function(c){
    var data=byCompte[c],solde=0,td=0,tc=0,rows='';
    data.lignes.sort(function(a,b){return(a.date||'').localeCompare(b.date||'');}).forEach(function(l){solde+=(l.debit||0)-(l.credit||0);td+=l.debit||0;tc+=l.credit||0;rows+='<tr><td>'+escHtml(l.date)+'</td><td>'+escHtml(l.ref)+'</td><td>'+escHtml(l.desc)+'</td><td class="col-debit">'+fmtAmount(l.debit)+'</td><td class="col-credit">'+fmtAmount(l.credit)+'</td><td class="col-solde">'+fmtAmount(solde)+'</td></tr>';});
    html+='<div class="gl-compte"><div class="gl-compte-header"><span class="gl-compte-num">'+escHtml(c)+'</span><span class="gl-compte-lib">'+escHtml(data.libelle)+'</span><div class="gl-compte-totals"><span style="color:var(--debit)">D: '+fmtAmount(td)+'</span><span style="color:var(--credit)">C: '+fmtAmount(tc)+'</span><span style="color:var(--text)">Solde: '+fmtAmount(solde)+'</span></div></div><table class="data-table"><thead><tr><th>Date</th><th>Réf</th><th>Description</th><th style="text-align:right">Débit</th><th style="text-align:right">Crédit</th><th style="text-align:right">Solde</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  });
  body.innerHTML=html;
}

/* ============================================================
   BALANCE
============================================================ */
function getByCompte(){
  var byCompte={};
  allEcritures.forEach(function(e){(e.lignes||[]).forEach(function(l){var c=String(l.compte||'');if(!c)return;if(!byCompte[c])byCompte[c]={libelle:getPlanLibelle(c)||l.libelle,td:0,tc:0};byCompte[c].td+=l.debit||0;byCompte[c].tc+=l.credit||0;});});
  return byCompte;
}

function renderBalance(){
  var body=document.getElementById('balance-body');
  if(!allEcritures.length){body.innerHTML='<div class="empty-state"><h3>Balance vide</h3><p>Des écritures sont nécessaires.</p></div>';return;}
  var byCompte=getByCompte(),comptes=Object.keys(byCompte).sort(),totalTD=0,totalTC=0,rows='';
  comptes.forEach(function(c){var d=byCompte[c];totalTD+=d.td;totalTC+=d.tc;var solde=d.td-d.tc;rows+='<tr><td class="col-compte">'+escHtml(c)+'</td><td class="col-libelle">'+escHtml(d.libelle)+'</td><td class="col-debit">'+fmtAmount(d.td)+'</td><td class="col-credit">'+fmtAmount(d.tc)+'</td><td class="col-solde">'+(solde>=0?fmtAmount(solde):'')+'</td><td class="col-solde">'+(solde<0?fmtAmount(-solde):'')+'</td></tr>';});
  body.innerHTML='<table class="data-table"><thead><tr><th>Compte</th><th>Libellé</th><th style="text-align:right">Total Débit</th><th style="text-align:right">Total Crédit</th><th style="text-align:right">Solde D</th><th style="text-align:right">Solde C</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr style="border-top:1px solid var(--border2);"><td colspan="2" style="padding:10px 12px;font-weight:700;color:var(--text);">TOTAL GÉNÉRAL</td><td class="col-debit">'+fmtAmount(totalTD)+'</td><td class="col-credit">'+fmtAmount(totalTC)+'</td><td class="col-solde">'+(totalTD>=totalTC?fmtAmount(totalTD-totalTC):'')+'</td><td class="col-solde">'+(totalTC>totalTD?fmtAmount(totalTC-totalTD):'')+'</td></tr></tfoot></table>';
}

function exportBalanceCSV(){var csv='Compte;Libelle;Total Debit;Total Credit;Solde D;Solde C\n';var byCompte=getByCompte();Object.keys(byCompte).sort().forEach(function(c){var d=byCompte[c];var sd=d.td-d.tc;csv+=c+';"'+d.libelle+'";'+d.td+';'+d.tc+';'+(sd>=0?sd:'')+';'+(sd<0?-sd:'')+'\n';});downloadCSV(csv,'balance_'+todayDate()+'.csv');}

/* ============================================================
   BILAN
============================================================ */
function renderBilan(){
  var body=document.getElementById('bilan-body');
  if(!allEcritures.length){body.innerHTML='<div class="empty-state"><h3>Bilan vide</h3><p>Des écritures sont nécessaires.</p></div>';return;}
  var byCompte=getByCompte(),actif=[],passif=[],totalActif=0,totalPassifRaw=0;
  Object.keys(byCompte).sort().forEach(function(c){var d=byCompte[c];var solde=d.td-d.tc;var cl=c.charAt(0);if(cl==='6'||cl==='7'||cl==='8')return;if(solde>0){actif.push({compte:c,libelle:d.libelle,montant:solde});totalActif+=solde;}else if(solde<0){passif.push({compte:c,libelle:d.libelle,montant:-solde});totalPassifRaw+=(-solde);}});
  var resultat=totalActif-totalPassifRaw,totalPassif=totalPassifRaw+resultat;
  var htmlActif='',groupedA={};actif.forEach(function(a){var cl=a.compte.charAt(0);if(!groupedA[cl])groupedA[cl]=[];groupedA[cl].push(a);});
  ['2','3','4','5','1'].forEach(function(cl){if(!groupedA[cl])return;htmlActif+='<div class="bilan-section"><div class="bilan-section-title">'+escHtml(_classeName(cl))+'</div>';groupedA[cl].forEach(function(a){htmlActif+='<div class="bilan-row"><span class="label">'+escHtml(a.compte)+' — '+escHtml(a.libelle)+'</span><span class="value">'+fmtAmount(a.montant)+'</span></div>';});htmlActif+='</div>';});
  var htmlPassif='',groupedP={};passif.forEach(function(p){var cl=p.compte.charAt(0);if(!groupedP[cl])groupedP[cl]=[];groupedP[cl].push(p);});
  ['1','4','5'].forEach(function(cl){if(!groupedP[cl])return;htmlPassif+='<div class="bilan-section"><div class="bilan-section-title">'+escHtml(_classeName(cl))+'</div>';groupedP[cl].forEach(function(p){htmlPassif+='<div class="bilan-row"><span class="label">'+escHtml(p.compte)+' — '+escHtml(p.libelle)+'</span><span class="value">'+fmtAmount(p.montant)+'</span></div>';});htmlPassif+='</div>';});
  var resLabel=resultat>=0?"Résultat — Bénéfice":"Résultat — Perte";
  htmlPassif+='<div class="bilan-section"><div class="bilan-section-title">Capitaux propres</div><div class="bilan-row"><span class="label" style="color:'+(resultat>=0?'var(--debit)':'var(--credit)')+'">'+resLabel+'</span><span class="value" style="color:'+(resultat>=0?'var(--debit)':'var(--credit)')+'">'+fmtAmount(Math.abs(resultat))+'</span></div></div>';
  var eqOk=Math.abs(totalActif-totalPassif)<1;
  var eqBadge=eqOk?'<span class="equilibre-ok">✓ Actif = Passif</span>':'<span class="equilibre-err">✗ Déséquilibre</span>';
  body.innerHTML='<div class="bilan-grid"><div class="bilan-card"><div class="bilan-card-header"><span>ACTIF</span>'+eqBadge+'</div>'+htmlActif+'<div class="bilan-total-row"><span>TOTAL ACTIF</span><span class="value">'+fmtAmount(totalActif)+'</span></div></div><div class="bilan-card"><div class="bilan-card-header"><span>PASSIF</span>'+eqBadge+'</div>'+htmlPassif+'<div class="bilan-total-row"><span>TOTAL PASSIF</span><span class="value">'+fmtAmount(totalPassif)+'</span></div></div></div>';
}

function _classeName(c){return{'1':'Classe 1 — Ressources durables','2':'Classe 2 — Actif immobilisé','3':'Classe 3 — Stocks','4':'Classe 4 — Tiers','5':'Classe 5 — Trésorerie'}[c]||'Classe '+c;}

function exportBilanCSV(){var csv='Section;Compte;Libelle;Montant\n';var byCompte=getByCompte();var totalActif=0,totalPassifRaw=0;Object.keys(byCompte).sort().forEach(function(c){var d=byCompte[c];var solde=d.td-d.tc;var cl=c.charAt(0);if(cl==='6'||cl==='7'||cl==='8')return;if(solde>0){csv+='ACTIF;'+c+';"'+d.libelle+'";'+solde+'\n';totalActif+=solde;}else if(solde<0){csv+='PASSIF;'+c+';"'+d.libelle+'";'+(-solde)+'\n';totalPassifRaw+=(-solde);}});var resultat=totalActif-totalPassifRaw;csv+='PASSIF;131/139;"Resultat";'+resultat+'\n';downloadCSV(csv,'bilan_'+todayDate()+'.csv');}

/* ============================================================
   COMPTE DE RÉSULTAT
============================================================ */
function renderResultat(){
  var body=document.getElementById('resultat-body');
  if(!allEcritures.length){body.innerHTML='<div class="empty-state"><h3>Résultat vide</h3><p>Des écritures sont nécessaires.</p></div>';return;}
  var byCompte=getByCompte(),charges=[],produits=[],totalCharges=0,totalProduits=0;
  Object.keys(byCompte).sort().forEach(function(c){var d=byCompte[c];var cl=c.charAt(0);if(cl==='6'){var m=d.td-d.tc;if(m!==0){charges.push({compte:c,libelle:d.libelle,montant:m});totalCharges+=m;}}if(cl==='7'){var m2=d.tc-d.td;if(m2!==0){produits.push({compte:c,libelle:d.libelle,montant:m2});totalProduits+=m2;}}});
  var resultat=totalProduits-totalCharges;
  var resColor=resultat>=0?'var(--debit)':'var(--credit)';
  var htmlCharges='';charges.forEach(function(ch){htmlCharges+='<div class="bilan-row"><span class="label">'+escHtml(ch.compte)+' — '+escHtml(ch.libelle)+'</span><span class="value" style="color:var(--credit)">'+fmtAmount(ch.montant)+'</span></div>';});
  var htmlProduits='';produits.forEach(function(pr){htmlProduits+='<div class="bilan-row"><span class="label">'+escHtml(pr.compte)+' — '+escHtml(pr.libelle)+'</span><span class="value" style="color:var(--debit)">'+fmtAmount(pr.montant)+'</span></div>';});
  body.innerHTML='<div class="bilan-grid"><div class="bilan-card"><div class="bilan-card-header">CHARGES (Classe 6)</div><div class="bilan-section">'+htmlCharges+'</div><div class="bilan-total-row"><span>TOTAL CHARGES</span><span class="value" style="color:var(--credit)">'+fmtAmount(totalCharges)+'</span></div></div><div class="bilan-card"><div class="bilan-card-header">PRODUITS (Classe 7)</div><div class="bilan-section">'+htmlProduits+'</div><div class="bilan-total-row"><span>TOTAL PRODUITS</span><span class="value" style="color:var(--debit)">'+fmtAmount(totalProduits)+'</span></div></div></div><div style="margin-top:16px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:20px 24px;display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--serif);font-size:18px;font-weight:400;font-style:italic;color:var(--text);">Résultat de l\'exercice</span><div style="text-align:right;"><span style="font-family:var(--mono);font-weight:500;font-size:20px;color:'+resColor+';">'+(resultat>=0?'+':'')+fmtAmount(resultat)+'</span><div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:3px;letter-spacing:0.5px;">'+(resultat>=0?'BÉNÉFICE':'PERTE')+'</div></div></div>';
}

function exportResultatCSV(){var csv='Type;Compte;Libelle;Montant\n';var byCompte=getByCompte();var totalC=0,totalP=0;Object.keys(byCompte).sort().forEach(function(c){var d=byCompte[c];var cl=c.charAt(0);if(cl==='6'){var m=d.td-d.tc;if(m!==0){csv+='CHARGE;'+c+';"'+d.libelle+'";'+m+'\n';totalC+=m;}}if(cl==='7'){var m2=d.tc-d.td;if(m2!==0){csv+='PRODUIT;'+c+';"'+d.libelle+'";'+m2+'\n';totalP+=m2;}}});csv+='RESULTAT;;;'+(totalP-totalC)+'\n';downloadCSV(csv,'resultat_'+todayDate()+'.csv');}

/* ============================================================
   TIERS
============================================================ */
function renderTiers(){
  var body=document.getElementById('tiers-body');
  if(!allEcritures.length){body.innerHTML='<div class="empty-state"><h3>Aucun tiers</h3><p>Les clients et fournisseurs apparaîtront ici.</p></div>';return;}
  var byCompte=getByCompte(),clients=[],fournisseurs=[],totalClients=0,totalFourn=0;
  Object.keys(byCompte).sort().forEach(function(c){var d=byCompte[c];var solde=d.td-d.tc;if(c.startsWith('411')&&solde>0){clients.push({compte:c,libelle:d.libelle,montant:solde});totalClients+=solde;}if(c.startsWith('401')&&solde<0){fournisseurs.push({compte:c,libelle:d.libelle,montant:-solde});totalFourn+=(-solde);}});
  var htmlC='';clients.forEach(function(cl){htmlC+='<div class="bilan-row"><span class="label">'+escHtml(cl.compte)+' — '+escHtml(cl.libelle)+'</span><span class="value" style="color:var(--debit)">'+fmtAmount(cl.montant)+'</span></div>';});
  var htmlF='';fournisseurs.forEach(function(f){htmlF+='<div class="bilan-row"><span class="label">'+escHtml(f.compte)+' — '+escHtml(f.libelle)+'</span><span class="value" style="color:var(--credit)">'+fmtAmount(f.montant)+'</span></div>';});
  body.innerHTML='<div class="tiers-grid"><div class="bilan-card"><div class="bilan-card-header">CLIENTS (Comptes 411)</div><div class="bilan-section">'+htmlC+'</div><div class="bilan-total-row"><span>TOTAL À RECOUVRER</span><span class="value" style="color:var(--debit)">'+fmtAmount(totalClients)+'</span></div></div><div class="bilan-card"><div class="bilan-card-header">FOURNISSEURS (Comptes 401)</div><div class="bilan-section">'+htmlF+'</div><div class="bilan-total-row"><span>TOTAL À PAYER</span><span class="value" style="color:var(--credit)">'+fmtAmount(totalFourn)+'</span></div></div></div>';
}

function exportTiersCSV(){var csv='Type;Compte;Libelle;Montant\n';var byCompte=getByCompte();Object.keys(byCompte).sort().forEach(function(c){var d=byCompte[c];var solde=d.td-d.tc;if(c.startsWith('411')&&solde>0){csv+='CLIENT;'+c+';"'+d.libelle+'";'+solde+'\n';}if(c.startsWith('401')&&solde<0){csv+='FOURNISSEUR;'+c+';"'+d.libelle+'";'+(-solde)+'\n';}});downloadCSV(csv,'tiers_'+todayDate()+'.csv');}

/* ============================================================
   TRÉSORERIE
============================================================ */
function renderTresorerie(){
  var body=document.getElementById('tresorerie-body');
  var tresoComptes=[];allEcritures.forEach(function(e){(e.lignes||[]).forEach(function(l){var c=String(l.compte||'');if(c.match(/^5[0-9]/))tresoComptes.push(c);});});
  var unique=tresoComptes.filter(function(v,i,a){return a.indexOf(v)===i;}).sort();
  if(!unique.length){body.innerHTML='<div class="empty-state"><h3>Trésorerie vide</h3><p>Les comptes de classe 5 apparaissent ici.</p></div>';return;}
  var html='';
  unique.forEach(function(c){
    var td=0,tc=0,solde=0,rows='';
    allEcritures.forEach(function(e){(e.lignes||[]).forEach(function(l){if(String(l.compte||'')!==c)return;td+=l.debit||0;tc+=l.credit||0;solde+=(l.debit||0)-(l.credit||0);rows+='<tr><td>'+escHtml(e.date)+'</td><td>'+escHtml(e.reference)+'</td><td>'+escHtml(e.description||e.titre)+'</td><td class="col-debit">'+fmtAmount(l.debit)+'</td><td class="col-credit">'+fmtAmount(l.credit)+'</td><td class="col-solde">'+fmtAmount(solde)+'</td></tr>';});});
    html+='<div class="gl-compte"><div class="gl-compte-header"><span class="gl-compte-num">'+escHtml(c)+'</span><span class="gl-compte-lib">'+(getPlanLibelle(c)||'Compte '+c)+'</span><div class="gl-compte-totals"><span style="color:var(--debit)">D: '+fmtAmount(td)+'</span><span style="color:var(--credit)">C: '+fmtAmount(tc)+'</span><span style="color:var(--text)">Solde: '+fmtAmount(solde)+'</span></div></div><table class="data-table"><thead><tr><th>Date</th><th>Réf</th><th>Description</th><th style="text-align:right">Débit</th><th style="text-align:right">Crédit</th><th style="text-align:right">Solde</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  });
  body.innerHTML=html;
}

function exportTresorerieCSV(){var csv='Date;Reference;Description;Compte;Debit;Credit\n';allEcritures.forEach(function(e){(e.lignes||[]).forEach(function(l){var c=String(l.compte||'');if(!c.match(/^5[0-9]/))return;csv+=e.date+';"'+(e.reference||'')+'";"'+(e.description||e.titre||'').replace(/"/g,'""')+'";'+c+';'+(l.debit||0)+';'+(l.credit||0)+'\n';});});downloadCSV(csv,'tresorerie_'+todayDate()+'.csv');}

/* ============================================================
   HISTORIQUE
============================================================ */
function renderHistorique(search){
  var body=document.getElementById('historique-body');
  var monthFilter=document.getElementById('hist-month')?document.getElementById('hist-month').value:'';
  var q=(search||(document.getElementById('hist-search')?document.getElementById('hist-search').value:'')||'').toLowerCase();
  if(!allEcritures.length){body.innerHTML='<div class="empty-state"><h3>Aucune écriture</h3><p>Les journaux enregistrés apparaîtront ici.</p></div>';return;}
  var filtered=allEcritures.filter(function(e){var mm=!monthFilter||(e.date&&e.date.startsWith(monthFilter));var mq=!q||(e.description||'').toLowerCase().includes(q)||(e.titre||'').toLowerCase().includes(q)||(e.reference||'').toLowerCase().includes(q)||(e.lignes||[]).some(function(l){return(l.compte||'').includes(q)||(l.libelle||'').toLowerCase().includes(q);});return mm&&mq;});
  if(!filtered.length){body.innerHTML='<div style="padding:30px;text-align:center;color:var(--text3);font-family:var(--mono);font-size:12px;">Aucune écriture pour ces critères.</div>';return;}
  var byDate={};filtered.forEach(function(e){var d=e.date||'Sans date';if(!byDate[d])byDate[d]=[];byDate[d].push(e);});
  var dates=Object.keys(byDate).sort(function(a,b){return b.localeCompare(a);});
  var html='<div style="font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:0.8px;text-transform:uppercase;margin-bottom:16px;">'+filtered.length+' écriture(s)</div>';
  dates.forEach(function(date){
    var ecritures=byDate[date];
    html+='<div style="margin-bottom:28px;"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><span style="font-family:var(--mono);font-size:10px;background:var(--gold-glow2);border:1px solid rgba(212,168,83,0.2);color:var(--gold);padding:4px 14px;border-radius:100px;letter-spacing:0.5px;">'+escHtml(date)+'</span><div style="flex:1;height:1px;background:var(--border);"></div><span style="font-family:var(--mono);font-size:9px;color:var(--text3);letter-spacing:0.5px;text-transform:uppercase;">'+ecritures.length+' écriture(s)</span></div>';
    ecritures.forEach(function(e){
      var lignes=e.lignes||[];var totD=lignes.reduce(function(s,l){return s+(l.debit||0);},0);var totC=lignes.reduce(function(s,l){return s+(l.credit||0);},0);var eq=Math.abs(totD-totC)<1;
      var rows='';lignes.forEach(function(l){var planLib=getPlanLibelle(l.compte||'');var libDisplay=escHtml(l.libelle||'');if(planLib&&planLib!==l.libelle)libDisplay+='<span class="col-sub">'+escHtml(planLib)+'</span>';rows+='<tr><td class="col-compte">'+escHtml(l.compte||'')+'</td><td class="col-libelle">'+libDisplay+'</td><td class="col-debit">'+(l.debit?fmtAmount(l.debit):'<span class="col-empty">—</span>')+'</td><td class="col-credit">'+(l.credit?fmtAmount(l.credit):'<span class="col-empty">—</span>')+'</td></tr>';});
      html+='<div class="journal-card"><div class="journal-card-header"><div style="flex:1;"><div class="journal-card-title">'+escHtml(e.titre||e.description||'Écriture sans titre')+'</div>'+(e.analyse?'<div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:3px;letter-spacing:0.3px;">'+escHtml(e.analyse)+'</div>':'')+'</div><div class="journal-card-date">'+escHtml(e.date||'')+'</div>'+(e.reference?'<div class="journal-card-ref">'+escHtml(e.reference)+'</div>':'')+'<div class="'+(eq?'equilibre-ok':'equilibre-err')+'">'+(eq?'✓ Équilibre':'✗ Déséquilibre')+'</div></div><table class="data-table"><thead><tr><th style="width:80px">Compte</th><th>Libellé</th><th style="text-align:right;width:130px">Débit</th><th style="text-align:right;width:130px">Crédit</th></tr></thead><tbody>'+rows+'</tbody></table><div class="journal-totals"><div class="total-item"><span class="total-label">Total Débit</span><span class="total-debit">'+fmtAmount(totD)+'</span></div><div class="total-item"><span class="total-label">Total Crédit</span><span class="total-credit">'+fmtAmount(totC)+'</span></div></div></div>';
    });
    html+='</div>';
  });
  body.innerHTML=html;
}

function exportHistoriqueCSV(){var csv='Date;Reference;Description;Compte;Libelle;Debit;Credit\n';allEcritures.forEach(function(e){(e.lignes||[]).forEach(function(l){csv+=e.date+';'+(e.reference||'')+';"'+(e.description||e.titre||'').replace(/"/g,'""')+'";"'+(l.compte||'')+'";"'+(getPlanLibelle(l.compte)||l.libelle||'').replace(/"/g,'""')+'";'+(l.debit||0)+';'+(l.credit||0)+'\n';});});downloadCSV(csv,'historique_journal_'+todayDate()+'.csv');}

/* ============================================================
   PROFIL
============================================================ */
function saveProfilEntreprise(){
  if(!currentUser)return;
  var nom=document.getElementById('profil-nom').value.trim();
  if(!nom){showToast('Le nom est requis');return;}
  var updateData={
    nom_entreprise:nom,contact:document.getElementById('profil-contact').value.trim(),
    type_entreprise:document.getElementById('profil-type').value,
    secteur:document.getElementById('profil-secteur').value.trim(),
    pays:document.getElementById('profil-pays').value,
    ville:document.getElementById('profil-ville').value.trim(),
    rccm:document.getElementById('profil-rccm').value.trim(),
    regime_fiscal:document.getElementById('profil-regime').value,
    updated_at:Date.now()
  };
  var p1=db1.collection('users').doc(currentUser.id).update(updateData);
  var p2=db2.collection('abonnements').where('nom_entreprise','==',currentUser.nom_entreprise).limit(1).get().then(function(snap2){
    if(!snap2.empty){return db2.collection('abonnements').doc(snap2.docs[0].id).update({nom_entreprise:nom,type_entreprise:updateData.type_entreprise,pays:updateData.pays,ville:updateData.ville,updated_at:Date.now()});}
  });
  Promise.all([p1,p2]).then(function(){
    currentUser.nom_entreprise=nom;
    currentUser.type_entreprise=document.getElementById('profil-type').value;
    currentEntrepriseType=currentUser.type_entreprise;
    document.getElementById('header-org').textContent='🏢 '+nom;
    var s=document.getElementById('profil-success');s.style.display='block';
    setTimeout(function(){s.style.display='none';},3000);
    showToast('✓ Profil mis à jour');
  }).catch(function(e){showToast('Erreur : '+e.message);});
}

/* ============================================================
   EXPORT UTILITAIRES
============================================================ */
function downloadCSV(csv,filename){var blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);showToast('Export effectué');}
function getEnteteEntreprise(){if(!currentUser)return '';return '<div style="margin-bottom:18px;border-bottom:2px solid #d4a853;padding-bottom:10px;"><h1 style="margin:0;font-size:18pt;color:#0c0e14;">'+escHtml(currentUser.nom_entreprise||'')+'</h1><div style="color:#555;font-size:10pt;margin-top:4px;">'+(currentUser.rccm?'RCCM: '+escHtml(currentUser.rccm)+' | ':'')+escHtml(currentUser.regime_fiscal||'')+' | '+escHtml(currentUser.ville||'')+', '+escHtml(currentUser.pays||'CI')+'</div></div>';}

function _buildBilanTable(){var byCompte=getByCompte();var actif=[],passif=[],totalActif=0,totalPassifRaw=0;Object.keys(byCompte).sort().forEach(function(c){var d=byCompte[c];var solde=d.td-d.tc;var cl=c.charAt(0);if(cl==='6'||cl==='7'||cl==='8')return;if(solde>0){actif.push({compte:c,libelle:d.libelle,montant:solde});totalActif+=solde;}else if(solde<0){passif.push({compte:c,libelle:d.libelle,montant:-solde});totalPassifRaw+=(-solde);}});var resultat=totalActif-totalPassifRaw;var html='<table border="1" style="width:100%;border-collapse:collapse;"><thead><tr><th>Compte Actif</th><th>Libellé</th><th>Montant</th><th>Compte Passif</th><th>Libellé</th><th>Montant</th></tr></thead><tbody>';var maxLen=Math.max(actif.length,passif.length+1);for(var i=0;i<maxLen;i++){var a=actif[i]||null;var p=passif[i]||null;if(i===passif.length)p={compte:'131/139',libelle:"Résultat exercice",montant:resultat};html+='<tr>';if(a){html+='<td>'+escHtml(a.compte)+'</td><td>'+escHtml(a.libelle)+'</td><td style="text-align:right">'+fmtAmount(a.montant)+'</td>';}else{html+='<td></td><td></td><td></td>';}if(p){html+='<td>'+escHtml(p.compte)+'</td><td>'+escHtml(p.libelle)+'</td><td style="text-align:right">'+fmtAmount(p.montant)+'</td>';}else{html+='<td></td><td></td><td></td>';}html+='</tr>';}html+='<tr style="font-weight:bold"><td colspan="2">TOTAL ACTIF</td><td style="text-align:right">'+fmtAmount(totalActif)+'</td><td colspan="2">TOTAL PASSIF</td><td style="text-align:right">'+fmtAmount(totalPassifRaw+resultat)+'</td></tr></tbody></table>';return html;}

function _buildResultatTable(){var byCompte=getByCompte();var charges=[],produits=[],totalC=0,totalP=0;Object.keys(byCompte).sort().forEach(function(c){var d=byCompte[c];var cl=c.charAt(0);if(cl==='6'){var m=d.td-d.tc;if(m!==0){charges.push({compte:c,libelle:d.libelle,montant:m});totalC+=m;}}if(cl==='7'){var m2=d.tc-d.td;if(m2!==0){produits.push({compte:c,libelle:d.libelle,montant:m2});totalP+=m2;}}});var resultat=totalP-totalC;var html='<table border="1" style="width:100%;border-collapse:collapse;"><thead><tr><th>Charges (Cl.6)</th><th>Libellé</th><th>Montant</th><th>Produits (Cl.7)</th><th>Libellé</th><th>Montant</th></tr></thead><tbody>';var maxLen=Math.max(charges.length,produits.length);for(var i=0;i<maxLen;i++){var ch=charges[i]||null;var pr=produits[i]||null;html+='<tr>';if(ch){html+='<td>'+escHtml(ch.compte)+'</td><td>'+escHtml(ch.libelle)+'</td><td style="text-align:right">'+fmtAmount(ch.montant)+'</td>';}else{html+='<td></td><td></td><td></td>';}if(pr){html+='<td>'+escHtml(pr.compte)+'</td><td>'+escHtml(pr.libelle)+'</td><td style="text-align:right">'+fmtAmount(pr.montant)+'</td>';}else{html+='<td></td><td></td><td></td>';}html+='</tr>';}html+='<tr style="font-weight:bold"><td colspan="2">TOTAL CHARGES</td><td style="text-align:right">'+fmtAmount(totalC)+'</td><td colspan="2">TOTAL PRODUITS</td><td style="text-align:right">'+fmtAmount(totalP)+'</td></tr>';html+='<tr style="font-weight:bold;background:#f0f4ff"><td colspan="3">RÉSULTAT '+(resultat>=0?'BÉNÉFICE':'PERTE')+'</td><td colspan="3" style="text-align:right">'+fmtAmount(Math.abs(resultat))+'</td></tr></tbody></table>';return html;}

function exportWord(contenu,nomFichier){var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+nomFichier+'</title><style>body{font-family:Arial,sans-serif;font-size:12pt;margin:2cm;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 10px;}th{background:#f5f0e8;font-weight:bold;}h2{color:#8b6820;}</style></head><body>'+contenu+'</body></html>';var blob=new Blob(['\ufeff'+html],{type:'application/msword;charset=utf-8'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=nomFichier+'.doc';a.click();URL.revokeObjectURL(url);showToast('Export Word effectué');}
function exportExcel(tableHtml,nomFichier){var html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>'+tableHtml+'</body></html>';var blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=nomFichier+'.xls';a.click();URL.revokeObjectURL(url);showToast('Export Excel effectué');}
function exportPDF(contenu,nomFichier){var w=window.open('','_blank','width=900,height=700');if(!w){showToast('Autorisez les popups pour le PDF');return;}w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+nomFichier+'</title><style>body{font-family:Arial,sans-serif;font-size:11pt;margin:1.5cm;background:#fff;color:#000;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:5px 8px;}th{background:#f5f0e8;}h2{color:#8b6820;}@media print{button{display:none!important;}}</style></head><body>'+contenu+'<br/><button onclick="window.print()" style="margin-top:20px;padding:10px 24px;background:#d4a853;color:#000;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-weight:700;">🖨️ Imprimer / PDF</button></body></html>');w.document.close();}

function exportBalanceWord(){var t=document.querySelector('#balance-body table');if(!t){showToast('Aucune balance');return;}exportWord(getEnteteEntreprise()+'<h2>Balance des Comptes — SYSCOHADA 2023</h2>'+t.outerHTML,'balance_'+todayDate());}
function exportBalanceExcel(){var t=document.querySelector('#balance-body table');if(!t){showToast('Aucune balance');return;}exportExcel(t.outerHTML,'balance_'+todayDate());}
function exportBalancePDF(){var t=document.querySelector('#balance-body table');exportPDF(getEnteteEntreprise()+'<h2>Balance des Comptes — SYSCOHADA 2023</h2>'+(t?t.outerHTML:''),'balance_'+todayDate());}
function exportBilanExcel(){if(!allEcritures.length){showToast('Aucune donnée');return;}exportExcel(_buildBilanTable(),'bilan_'+todayDate());}
function exportBilanWord(){if(!allEcritures.length){showToast('Aucune donnée');return;}exportWord(getEnteteEntreprise()+'<h2>Bilan — SYSCOHADA 2023</h2>'+_buildBilanTable(),'bilan_'+todayDate());}
function exportBilanPDF(){if(!allEcritures.length){showToast('Aucune donnée');return;}exportPDF(getEnteteEntreprise()+'<h2>Bilan — SYSCOHADA 2023</h2>'+_buildBilanTable(),'bilan_'+todayDate());}
function exportResultatExcel(){if(!allEcritures.length){showToast('Aucune donnée');return;}exportExcel(_buildResultatTable(),'resultat_'+todayDate());}
function exportResultatWord(){if(!allEcritures.length){showToast('Aucune donnée');return;}exportWord(getEnteteEntreprise()+'<h2>Compte de Résultat — SYSCOHADA 2023</h2>'+_buildResultatTable(),'resultat_'+todayDate());}
function exportResultatPDF(){if(!allEcritures.length){showToast('Aucune donnée');return;}exportPDF(getEnteteEntreprise()+'<h2>Compte de Résultat — SYSCOHADA 2023</h2>'+_buildResultatTable(),'resultat_'+todayDate());}

/* ============================================================
   GROQ AI — PROMPTS SYSTÈME
============================================================ */
var SYSTEM_GENERATE=`Tu es Comeo AI, expert-comptable OHADA certifié, spécialiste du PLAN COMPTABLE SYSCOHADA RÉVISÉ 2023 (OHADA).
Tu utilises EXCLUSIVEMENT les numéros de comptes du SYSCOHADA 2023 ci-dessous. NE JAMAIS inventer de numéros.

COMPTES CLÉS SYSCOHADA 2023 :
CLASSE 1 : 101(Capital social), 111(Réserve légale), 121(Report à nouveau créditeur), 131(Résultat bénéfice), 139(Résultat perte), 141(Subventions d'équipement), 162(Emprunts établissements de crédit), 165(Dépôts et cautionnements reçus)
CLASSE 2 : 211(Frais de développement), 213(Logiciels), 231(Bâtiments sur sol propre), 2311(Bâtiments industriels), 2313(Bâtiments administratifs), 2451(Matériel automobile), 2442(Matériel informatique), 2441(Matériel de bureau), 2444(Mobilier de bureau), 2831(Amort. bâtiments), 2841(Amort. matériel industriel), 2844(Amort. matériel mobilier), 2845(Amort. matériel transport)
CLASSE 3 : 31(Marchandises), 311(Marchandises A), 32(Matières premières), 35(Produits finis), 351(Produits finis A)
CLASSE 4 FOURNISSEURS : 4011(Fournisseurs ordinaires), 4012(Fournisseurs Groupe), 4013(Fournisseurs sous-traitants), 4017(Retenues garantie fourn.), 402(Fournisseurs effets à payer), 4041(Fourn. immos incorporelles), 4042(Fourn. immos corporelles), 4081(Fourn. factures non parvenues), 4091(Fourn. avances versées)
CLASSE 4 CLIENTS : 4111(Clients ordinaires), 4112(Clients Groupe), 4117(Retenues garantie clients), 4121(Effets à recevoir), 4161(Créances litigieuses), 4162(Créances douteuses), 4181(Factures à établir), 4191(Acomptes clients reçus)
CLASSE 4 PERSONNEL : 4211(Personnel avances), 4212(Personnel acomptes), 422(Personnel rémunérations dues), 4281(Dettes provisionnées congés)
CLASSE 4 ORGANISMES SOCIAUX : 431(CNPS sécurité sociale), 4311(Prestations familiales CNPS), 4312(Accidents travail CNPS), 4313(Retraite obligatoire CNPS)
CLASSE 4 ÉTAT : 441(Impôt sur bénéfices), 4421(Impôts et taxes État), 4426(Droits de douane), 4431(TVA facturée sur ventes), 4432(TVA facturée sur prestations), 4433(TVA facturée sur travaux), 4441(TVA due à l'État), 4451(TVA récupérable sur immos), 4452(TVA récupérable sur achats), 4453(TVA récupérable transport), 4454(TVA récupérable services), 4471(IGR/IRPP retenu à la source), 4472(Impôts sur salaires), 4492(Avances impôts versées)
CLASSE 5 : 5211(Banques locales monnaie nationale), 5215(Banques en devises), 531(Chèques postaux CCP), 5711(Caisse monnaie nationale), 5712(Caisse devises), 552(Monnaie électronique téléphone), 585(Virements de fonds)
CLASSE 6 ACHATS : 6011(Achats marchandises région), 6012(Achats marchandises hors région), 6021(Achats matières premières région), 6031(Variations stocks marchandises), 6032(Variations stocks matières premières), 6041(Matières consommables), 6042(Matières combustibles), 6047(Fournitures de bureau), 6051(Eau), 6052(Électricité), 6056(Petit matériel outillage)
CLASSE 6 SERVICES : 621(Sous-traitance générale), 6222(Locations bâtiments), 6223(Locations matériels), 6232(Crédit-bail immobilier), 6233(Crédit-bail mobilier), 6241(Entretien biens immobiliers), 6242(Entretien biens mobiliers), 6243(Maintenance), 6251(Assurances multirisques), 6252(Assurances transport), 6261(Études et recherches), 6271(Annonces insertions), 6281(Frais téléphone), 6291(Frais bancaires commissions)
CLASSE 6 PERSONNEL : 6611(Appointements salaires bruts), 6612(Primes et gratifications), 6641(Cotisations patronales prestations familiales), 6642(Cotisations patronales accidents), 6643(Cotisations patronales retraite)
CLASSE 6 AMORTISSEMENTS : 6811(Amort. bâtiments), 6812(Amort. aménagements), 6813(Amort. matériels industriels), 6814(Amort. matériel mobilier), 6815(Amort. matériel transport), 6821(Amort. frais développement), 6822(Amort. brevets licences), 6941(Dépréciations stocks), 6942(Dépréciations créances clients)
CLASSE 7 : 7011(Ventes marchandises région), 7012(Ventes marchandises hors région), 705(Services vendus), 7051(Services région), 7031(Variation stocks PF), 721(Production immobilisée), 741(Subventions d'exploitation), 7411(Subventions État), 761(Dividendes revenus participations), 7942(Reprises dépréciations créances)
CLASSE 8 : 811(VNC cessions immos corp.), 821(Produits cessions immos corp.), 8713(Impôts sur sociétés IS), 861(Participation travailleurs bénéfices)

RÈGLES ABSOLUES :
1. JSON valide uniquement, guillemets doubles obligatoires
2. TVA OHADA = 18% : TTC donné → HT = ARRONDI(TTC/1.18,0), TVA = TTC - HT
3. DÉBIT avant CRÉDIT dans chaque écriture
4. Équilibre strict : somme(debit) = somme(credit) pour CHAQUE écriture
5. Toujours utiliser les comptes à 3 ou 4 chiffres selon le plan ci-dessus
6. N'utilise JAMAIS de comptes inventés

RETOURNE UNIQUEMENT CE JSON :
{"titre":"","date":"","reference":"","type_entreprise":"","ecritures":[{"etape":"","lignes":[{"compte":"","libelle":"","debit":0,"credit":0}]}],"analyse":"","notes":""}`;

var SYSTEM_DETECT=`Tu es expert-comptable OHADA SYSCOHADA 2023. Analyse l'opération et détermine les étapes comptables.
CRITIQUE: JSON valide uniquement, guillemets doubles.
RETOURNE: {"etapes":["Étape 1","Étape 2"],"titre":"Titre court","analyse":"Explication","notes":""}`;

var SYSTEM_ETAPE=`Tu es Comeo AI, expert-comptable OHADA SYSCOHADA 2023. Génère l'écriture COMPLÈTE et ÉQUILIBRÉE pour l'étape demandée.
Lignes débitrices EN PREMIER. TVA=18%. Équilibre obligatoire.
Utilise EXCLUSIVEMENT les numéros SYSCOHADA 2023 : 4011,4111,5211,6011,7011,4431,4452,4441,6611,422,4313,4471,6641,6642,6643,2451,2442,6815,2845,4042,4451 etc.
JSON valide uniquement.
RETOURNE: {"etape":"","lignes":[{"compte":"","libelle":"","debit":0,"credit":0}]}`;

/* ============================================================
   GROQ AI — APPELS API AVEC ROTATION
============================================================ */
function _sanitize(str){return str.replace(/\\/g,' ').replace(/[\u0000-\u001F\u007F-\u009F]/g,' ').replace(/\t/g,' ').replace(/\r\n/g,' ').replace(/\r/g,' ').replace(/\n/g,' ').replace(/"/g,"'").replace(/[^\x20-\x7E\xA0-\uFFFF]/g,' ').trim();}

function _groqFetchWithRotation(systemPrompt, userMessage, maxTokens, attemptKeyIndex, attempts) {
  if(attempts <= 0) return Promise.reject(new Error('Toutes les clés API sont temporairement limitées. Réessayez dans 1 minute.'));
  var keyInfo = getNextGroqKey(attemptKeyIndex);
  updateApiStatus('Clé '+(keyInfo.index+1)+'/'+GROQ_KEYS.length+' active', 'ok');
  return fetch("https://api.groq.com/openai/v1/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+keyInfo.key},
    body:JSON.stringify({
      model:"llama-3.3-70b-versatile",
      max_tokens:maxTokens||1400,
      temperature:0.05,
      messages:[
        {role:"system",content:_sanitize(systemPrompt)},
        {role:"user",content:_sanitize(userMessage)}
      ]
    })
  }).then(function(res){
    if(res.status===429||res.status===503||res.status===502){
      var nextIdx = markKeyFailed(keyInfo.index);
      return _groqFetchWithRotation(systemPrompt, userMessage, maxTokens, nextIdx, attempts-1);
    }
    return res.json().then(function(data){
      if(data.error){
        var nextIdx = markKeyFailed(keyInfo.index);
        if(data.error.code==='rate_limit_exceeded'||data.error.type==='rate_limit_exceeded'){
          return _groqFetchWithRotation(systemPrompt, userMessage, maxTokens, nextIdx, attempts-1);
        }
        throw new Error('API Groq: '+(data.error.message||'Erreur inconnue'));
      }
      if(!data.choices||!data.choices[0]||!data.choices[0].message)throw new Error('Réponse Groq invalide');
      var content=data.choices[0].message.content||'';
      updateApiStatus('Clé '+(keyInfo.index+1)+' OK', 'ok');
      return content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,' ').trim();
    });
  }).catch(function(err){
    if(err.message.indexOf('Toutes les clés')!==-1)throw err;
    var nextIdx = markKeyFailed(keyInfo.index);
    return _groqFetchWithRotation(systemPrompt, userMessage, maxTokens, nextIdx, attempts-1);
  });
}

function _groqFetch(keyIndex, systemPrompt, userMessage, maxTokens) {
  return _groqFetchWithRotation(systemPrompt, userMessage, maxTokens, keyIndex, GROQ_KEYS.length);
}

function _parseJSON(raw){
  var clean=raw.replace(/```json\s*/gi,'').replace(/```\s*/gi,'').trim();
  var js=clean.indexOf('{'),je=clean.lastIndexOf('}');
  if(js===-1)throw new Error('Cliquez sur générer pour confirmer analyse MARCIO DEV');
  clean=clean.slice(js,je+1);
  try{return JSON.parse(clean);}catch(e0){}
  try{
    var fixed=clean.replace(/'/g,'"').replace(/,\s*([\]}])/g,'$1').replace(/("(?:[^"\\]|\\.)*")/g,function(m){return m.replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t');}).replace(/\\(?!["\\/bfnrtu])/g,' ').replace(/[\u0000-\u001F\u007F]/g,' ');
    return JSON.parse(fixed);
  }catch(e1){}
  try{
    var rebuilt='',inStr=false,esc=false;
    for(var i=0;i<clean.length;i++){var ch=clean[i];if(esc){rebuilt+=ch;esc=false;continue;}if(ch==='\\'){esc=true;rebuilt+=ch;continue;}if(ch==='"'){inStr=!inStr;rebuilt+=ch;continue;}if(ch==="'"){inStr=!inStr;rebuilt+='"';continue;}if(inStr){if(ch==='\n'){rebuilt+='\\n';continue;}if(ch==='\r'){rebuilt+='\\r';continue;}if(ch==='\t'){rebuilt+='\\t';continue;}if(ch.charCodeAt(0)<32)continue;}rebuilt+=ch;}
    rebuilt=rebuilt.replace(/,\s*([\]}])/g,'$1');
    return JSON.parse(rebuilt);
  }catch(e2){throw new Error('Veillez cliquez sur générer pour valider');}
}

function groqCall(userMessage){
  var startKey = _groqKeyIndex;
  return _groqFetch(startKey, SYSTEM_DETECT, userMessage, 600).then(function(rawDetect){
    var detect=_parseJSON(rawDetect);var etapes=detect.etapes||[];
    if(etapes.length<=1){
      return _groqFetch(_groqKeyIndex, SYSTEM_GENERATE, userMessage, 2200).then(function(raw){return _parseJSON(raw);});
    }
    showToast('⚙️ '+etapes.length+' étapes — rotation des clés...',5000);
    var promises=etapes.map(function(etape,i){
      var kIdx=(startKey+i)%GROQ_KEYS.length;
      var msg=userMessage+'\n\nContexte: '+etapes.join(' | ')+'\nGénère UNIQUEMENT l\'écriture équilibrée pour : '+etape;
      return _groqFetch(kIdx, SYSTEM_ETAPE, msg, 1000).then(function(raw){
        var parsed=_parseJSON(raw);parsed.etape=parsed.etape||etape;return parsed;
      });
    });
    return Promise.all(promises).then(function(ecrituresParEtape){
      var lignesGlobales=[];ecrituresParEtape.forEach(function(ec){(ec.lignes||[]).forEach(function(l){lignesGlobales.push(l);});});
      return{titre:detect.titre||'',analyse:detect.analyse||'',notes:detect.notes||'',ecritures:ecrituresParEtape,lignes:lignesGlobales};
    });
  });
}

/* ============================================================
   GÉNÉRATION JOURNAL IA
============================================================ */
var isGenerating=false;
function generateJournal(){
  if(isGenerating)return;
  var desc=document.getElementById('op-description').value.trim();
  var date=document.getElementById('op-date').value||todayDate();
  var ref=document.getElementById('op-ref').value.trim()||genRef();
  var montant=document.getElementById('op-montant').value.trim();
  var type=document.getElementById('op-type').value;
  var extra=document.getElementById('op-extra').value.trim();
  if(!desc){showToast("Décrivez l'opération");return;}
  isGenerating=true;
  document.getElementById('btn-generate').disabled=true;
  var cfg=ENTREPRISE_CONFIG[currentEntrepriseType];
  document.getElementById('output-content').innerHTML='<div class="loading-state"><div class="spinner"></div><div style="font-family:var(--mono);font-size:12px;letter-spacing:0.5px;">Analyse SYSCOHADA 2023 en cours... <span id="api-key-indicator" style="color:var(--gold);">Clé '+((_groqKeyIndex%GROQ_KEYS.length)+1)+'/'+GROQ_KEYS.length+'</span></div></div>';
  var userMsg='SECTEUR: '+cfg.label+'\nOPERATION: '+desc;
  if(montant)userMsg+='\nMontant: '+montant+' FCFA';
  if(type)userMsg+='\nType: '+type;
  if(extra)userMsg+='\nDétails: '+extra;
  userMsg+='\nDate: '+date+' | Réf: '+ref;
  userMsg+='\nIMPORTANT: Utilise les numéros de comptes SYSCOHADA 2023 exacts. Banque = 5211, Clients = 4111, Fournisseurs = 4011, TVA collectée = 4431, TVA récup. achats = 4452, TVA récup. immos = 4451, Salaires = 6611, CNPS = 431, IRPP = 4471.';
  groqCall(userMsg).then(function(data){
    var result=(typeof data==='string')?_parseJSON(data):data;
    result.type_entreprise=cfg.label;result.date=date;result.reference=ref;result.description=desc;
    renderJournal(result,desc,date,ref);
    return saveEcriture(result);
  }).catch(function(err){
    document.getElementById('output-content').innerHTML='<div class="empty-state"><div class="empty-icon" style="border-color:rgba(244,97,122,0.2);background:rgba(244,97,122,0.06)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><h3 style="color:var(--rose)">Erreur</h3><p>'+escHtml(err.message)+'</p></div>';
    updateApiStatus('Erreur', 'error');
    showToast('Erreur : '+err.message);
  }).finally(function(){isGenerating=false;document.getElementById('btn-generate').disabled=false;});
}

function renderJournal(result,opDesc,date,ref){
  var ecritures=result.ecritures||[];
  var isMulti=ecritures.length>0&&Array.isArray(ecritures[0]&&ecritures[0].lignes);
  var cardsHTML='';
  if(isMulti){
    ecritures.forEach(function(ec,idx){
      var lignes=ec.lignes||[];
      var totD=lignes.reduce(function(s,l){return s+(l.debit||0);},0);var totC=lignes.reduce(function(s,l){return s+(l.credit||0);},0);var eq=Math.abs(totD-totC)<1;
      var rows='';
      lignes.forEach(function(e){var planLib=getPlanLibelle(e.compte||'');rows+='<tr><td class="col-compte">'+escHtml(e.compte||'')+'</td><td class="col-libelle">'+escHtml(e.libelle||'')+(planLib&&planLib!==e.libelle?'<span class="col-sub">'+escHtml(planLib)+'</span>':'')+'</td><td class="col-debit">'+(e.debit?fmtAmount(e.debit):'<span class="col-empty">—</span>')+'</td><td class="col-credit">'+(e.credit?fmtAmount(e.credit):'<span class="col-empty">—</span>')+'</td></tr>';});
      cardsHTML+='<div class="journal-card"><div class="journal-card-header"><div class="journal-card-title"><span style="background:var(--gold-glow2);border:1px solid rgba(212,168,83,0.2);color:var(--gold);font-family:var(--mono);font-size:9px;padding:2px 8px;border-radius:4px;margin-right:8px;letter-spacing:0.5px;">ÉCR. '+(idx+1)+'</span>'+escHtml(ec.etape||'')+'</div><div class="'+(eq?'equilibre-ok':'equilibre-err')+'">'+(eq?'✓ Équilibre':'✗ Déséq.')+'</div></div><table class="data-table"><thead><tr><th style="width:80px">Compte</th><th>Libellé</th><th style="text-align:right;width:120px">Débit</th><th style="text-align:right;width:120px">Crédit</th></tr></thead><tbody>'+rows+'</tbody></table><div class="journal-totals"><div class="total-item"><span class="total-label">Total Débit</span><span class="total-debit">'+fmtAmount(totD)+'</span></div><div class="total-item"><span class="total-label">Total Crédit</span><span class="total-credit">'+fmtAmount(totC)+'</span></div></div></div>';
    });
    if(ecritures.length>1){cardsHTML='<div style="background:rgba(212,168,83,0.05);border:1px solid rgba(212,168,83,0.15);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-family:var(--mono);font-size:11px;color:var(--text2);letter-spacing:0.3px;"><span style="color:var(--gold);font-weight:500;">'+ecritures.length+' écriture(s) — Clés rotatives utilisées</span></div>'+cardsHTML;}
  } else {
    var lignes=ecritures,totD=lignes.reduce(function(s,l){return s+(l.debit||0);},0),totC=lignes.reduce(function(s,l){return s+(l.credit||0);},0),eq=Math.abs(totD-totC)<1,rows='';
    lignes.forEach(function(e){var planLib=getPlanLibelle(e.compte||'');rows+='<tr><td class="col-compte">'+escHtml(e.compte||'')+'</td><td class="col-libelle">'+escHtml(e.libelle||'')+(planLib&&planLib!==e.libelle?'<span class="col-sub">'+escHtml(planLib)+'</span>':'')+'</td><td class="col-debit">'+(e.debit?fmtAmount(e.debit):'<span class="col-empty">—</span>')+'</td><td class="col-credit">'+(e.credit?fmtAmount(e.credit):'<span class="col-empty">—</span>')+'</td></tr>';});
    cardsHTML='<div class="journal-card"><div class="journal-card-header"><div class="journal-card-title">'+escHtml(result.titre||opDesc)+'</div><div class="journal-card-date">'+escHtml(result.date||date)+'</div><div class="journal-card-ref">'+escHtml(result.reference||ref)+'</div><div class="'+(eq?'equilibre-ok':'equilibre-err')+'">'+(eq?'✓ Équilibre':'✗ Déséquilibre')+'</div></div><table class="data-table"><thead><tr><th style="width:80px">Compte</th><th>Libellé</th><th style="text-align:right;width:120px">Débit</th><th style="text-align:right;width:120px">Crédit</th></tr></thead><tbody>'+rows+'</tbody></table><div class="journal-totals"><div class="total-item"><span class="total-label">Total Débit</span><span class="total-debit">'+fmtAmount(totD)+'</span></div><div class="total-item"><span class="total-label">Total Crédit</span><span class="total-credit">'+fmtAmount(totC)+'</span></div></div></div>';
  }
  document.getElementById('output-content').innerHTML='<div class="ai-analysis"><div class="ai-analysis-header"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>Analyse IA · SYSCOHADA 2023 · '+escHtml(result.type_entreprise||'')+'</div><div class="ai-analysis-text">'+escHtml(result.analyse||'').replace(/\n/g,'<br>')+'</div>'+(result.notes?'<div style="margin-top:8px;font-family:var(--mono);font-size:10px;color:var(--text3);">'+escHtml(result.notes)+'</div>':'')+'</div>'+cardsHTML+'<div class="btn-row" style="margin-top:8px;"><button class="btn-action" onclick="window.print()">🖨️ Imprimer</button><button class="btn-action" onclick="exportCurrentJournalCSV()">CSV</button><button class="btn-action" onclick="exportCurrentJournalExcel()">Excel</button><button class="btn-action" onclick="exportCurrentJournalWord()">Word</button><button class="btn-action" onclick="exportCurrentJournalPDF()">PDF</button></div>';
  window._lastJournalResult=result;
}

function exportCurrentJournalCSV(){if(window._lastJournalResult)exportJournalCSV(window._lastJournalResult);}
function exportJournalCSV(result){var csv='Ecriture;Compte;Libelle;Debit;Credit\n';var ec=result.ecritures||[];if(ec.length>0&&ec[0]&&Array.isArray(ec[0].lignes)){ec.forEach(function(e,i){(e.lignes||[]).forEach(function(l){csv+='"'+(e.etape||'Ecriture '+(i+1))+'";'+l.compte+';"'+(l.libelle||'').replace(/"/g,'""')+'";'+(l.debit||0)+';'+(l.credit||0)+'\n';});});}else{ec.forEach(function(l){csv+='"";'+l.compte+';"'+(l.libelle||'').replace(/"/g,'""')+'";'+(l.debit||0)+';'+(l.credit||0)+'\n';});}downloadCSV(csv,'journal_'+(result.reference||'export')+'.csv');}
function exportCurrentJournalWord(){if(!window._lastJournalResult){showToast('Aucune écriture');return;}var r=window._lastJournalResult;var html=getEnteteEntreprise()+'<h2>Journal — '+escHtml(r.titre||r.description||'')+'</h2>';(r.ecritures||[]).forEach(function(ec,i){html+='<h3>Écriture '+(i+1)+' : '+escHtml(ec.etape||'')+'</h3><table><thead><tr><th>Compte</th><th>Libellé</th><th>Débit</th><th>Crédit</th></tr></thead><tbody>';(ec.lignes||[]).forEach(function(l){html+='<tr><td>'+escHtml(l.compte)+'</td><td>'+escHtml(l.libelle)+'</td><td>'+fmtAmount(l.debit)+'</td><td>'+fmtAmount(l.credit)+'</td></tr>';});html+='</tbody></table>';});exportWord(html,'journal_'+(r.reference||todayDate()));}
function exportCurrentJournalExcel(){if(!window._lastJournalResult){showToast('Aucune écriture');return;}var r=window._lastJournalResult;var html='<table><thead><tr><th>Étape</th><th>Compte</th><th>Libellé</th><th>Débit</th><th>Crédit</th></tr></thead><tbody>';(r.ecritures||[]).forEach(function(ec,i){(ec.lignes||[]).forEach(function(l){html+='<tr><td>'+escHtml(ec.etape||'Écriture '+(i+1))+'</td><td>'+escHtml(l.compte)+'</td><td>'+escHtml(l.libelle)+'</td><td>'+fmtAmount(l.debit)+'</td><td>'+fmtAmount(l.credit)+'</td></tr>';});});html+='</tbody></table>';exportExcel(html,'journal_'+(r.reference||todayDate()));}
function exportCurrentJournalPDF(){if(!window._lastJournalResult){showToast('Aucune écriture');return;}var r=window._lastJournalResult;var html=getEnteteEntreprise()+'<h2>Journal — '+escHtml(r.titre||r.description||'')+'</h2>';(r.ecritures||[]).forEach(function(ec,i){html+='<h3>Écriture '+(i+1)+' : '+escHtml(ec.etape||'')+'</h3><table><thead><tr><th>Compte</th><th>Libellé</th><th>Débit</th><th>Crédit</th></tr></thead><tbody>';(ec.lignes||[]).forEach(function(l){html+='<tr><td>'+escHtml(l.compte)+'</td><td>'+escHtml(l.libelle)+'</td><td>'+fmtAmount(l.debit)+'</td><td>'+fmtAmount(l.credit)+'</td></tr>';});html+='</tbody></table>';});exportPDF(html,'journal_'+(r.reference||todayDate()));}

/* ============================================================
   INIT
============================================================ */
window.addEventListener('load',function(){
  if(typeof firebase==='undefined'){
    document.getElementById('auth-overlay').innerHTML='<div style="color:var(--rose);font-family:var(--mono);padding:40px;text-align:center;position:relative;z-index:1;"><h2>⚠️ Erreur de chargement</h2><p style="margin-top:12px;color:var(--text2);">Firebase n\'a pas pu se charger.<br>Vérifiez votre connexion.</p><button onclick="location.reload()" style="margin-top:20px;padding:12px 24px;background:var(--gold);color:#0c0e14;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-family:var(--font);">Recharger</button></div>';
    return;
  }

  var app1;
  if(!firebase.apps.find(function(a){return a.name==='db1';})){
    app1=firebase.initializeApp(DB1_CONFIG,'db1');
  } else {
    app1=firebase.app('db1');
  }
  db1=firebase.firestore(app1);

  var app2;
  if(!firebase.apps.find(function(a){return a.name==='db2';})){
    app2=firebase.initializeApp(DB2_CONFIG,'db2');
  } else {
    app2=firebase.app('db2');
  }
  db2=firebase.firestore(app2);

  document.getElementById('op-date').value=todayDate();
  document.getElementById('manual-date').value=todayDate();
  renderQuickOps();renderTypeSelect();renderPlan();renderGuide();initManualLines();

  document.getElementById('op-description').addEventListener('keydown',function(e){if(e.key==='Enter'&&e.ctrlKey){e.preventDefault();generateJournal();}});
  document.getElementById('form-login').addEventListener('submit',function(e){e.preventDefault();doLogin();});
  document.getElementById('form-register').addEventListener('submit',function(e){e.preventDefault();doRegister();});

  updateApiStatus('API prête · '+GROQ_KEYS.length+' clés', 'ok');
});
