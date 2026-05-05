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
// CONFIGURATION SERVEUR — Chargée depuis Firestore (server_config)
// Les clés API Groq et l'ordre des modèles sont gérés via server.html
// JAMAIS de clé API en dur dans ce fichier
// ══════════════════════════════════════════
let GROQ_API_KEYS  = [];   // Chargées depuis server_config/groq_keys
let GROQ_MODELS    = [];   // Chargées depuis server_config/models
let groqKeyIdx     = 0;    // Index rotation clés
let groqModelIdx   = 0;    // Index rotation modèles
let serverConfigLoaded = false;

async function loadServerConfig() {
  try {
    const [keysSnap, modelsSnap] = await Promise.all([
      getDoc(doc(db, 'server_config', 'groq_keys')),
      getDoc(doc(db, 'server_config', 'models'))
    ]);

    if (keysSnap.exists()) {
      const rawKeys = keysSnap.data().keys || [];
      GROQ_API_KEYS = rawKeys.map(k => k.value).filter(Boolean);
    }

    if (modelsSnap.exists()) {
      GROQ_MODELS = modelsSnap.data().list || [];
    }

    // Valeurs par défaut si Firestore vide
    if (GROQ_MODELS.length === 0) {
      GROQ_MODELS = [
        'llama-3.3-70b-versatile',
        'qwen/qwen3-32b',
        'meta-llama/llama-4-scout-17b-16e-instruct'
      ];
    }

    serverConfigLoaded = true;
    console.log(`[COMEO] Config chargée — ${GROQ_API_KEYS.length} clé(s) Groq, ${GROQ_MODELS.length} modèle(s)`);
  } catch (e) {
    console.warn('[COMEO] Erreur chargement config serveur :', e.message);
    // Fallback modèles uniquement (sans clé — l'IA sera désactivée)
    GROQ_MODELS = ['llama-3.3-70b-versatile', 'qwen/qwen3-32b', 'meta-llama/llama-4-scout-17b-16e-instruct'];
  }
}

// ══════════════════════════════════════════
// PLAN COMPTABLE SYSCOHADA RÉVISÉ 2017
// ══════════════════════════════════════════
const PC = {
  "10":"CAPITAL","101":"CAPITAL SOCIAL","1011":"Capital souscrit, non appelé","1012":"Capital souscrit, appelé, non versé","1013":"Capital souscrit, appelé, versé, non amorti","1014":"Capital souscrit, appelé, versé, amorti","1018":"Capital souscrit soumis à des conditions particulières","102":"CAPITAL PAR DOTATION","1021":"Dotation initiale","1022":"Dotations complémentaires","1028":"Autres dotations","103":"CAPITAL PERSONNEL","104":"COMPTE DE L'EXPLOITANT","1041":"Apports temporaires","1042":"Opérations courantes","1043":"Rémunérations, impôts et autres charges personnelles","1047":"Prélèvements d'autoconsommation","1048":"Autres prélèvements","105":"PRIMES LIEES AU CAPITAL SOCIAL","1051":"Primes d'émission","1052":"Primes d'apport","1053":"Primes de fusion","1054":"Primes de conversion","1058":"Autres primes","106":"ECARTS DE REEVALUATION","1061":"Ecarts de réévaluation légale","1062":"Ecarts de réévaluation libre","109":"APPORTEURS, CAPITAL SOUSCRIT, NON APPELE",
  "11":"RESERVES","111":"RESERVE LEGALE","112":"RESERVES STATUTAIRES OU CONTRACTUELLES","113":"RESERVES REGLEMENTEES","118":"AUTRES RESERVES","1181":"Réserves facultatives","1188":"Réserves diverses",
  "12":"REPORT A NOUVEAU","121":"REPORT A NOUVEAU CREDITEUR","129":"REPORT A NOUVEAU DEBITEUR",
  "13":"RESULTAT NET DE L'EXERCICE","130":"RESULTAT EN INSTANCE D'AFFECTATION","131":"RESULTAT NET : BENEFICE","139":"RESULTAT NET : PERTE",
  "14":"SUBVENTIONS D'INVESTISSEMENT","141":"SUBVENTIONS D'EQUIPEMENT","148":"AUTRES SUBVENTIONS D'INVESTISSEMENT",
  "15":"PROVISIONS REGLEMENTEES ET FONDS ASSIMILES","151":"AMORTISSEMENTS DEROGATOIRES","155":"PROVISIONS REGLEMENTEES RELATIVES AUX IMMOBILISATIONS","157":"PROVISIONS POUR INVESTISSEMENT",
  "16":"EMPRUNTS ET DETTES ASSIMILEES","161":"EMPRUNTS OBLIGATAIRES","162":"EMPRUNTS ET DETTES AUPRES DES ETABLISSEMENTS DE CREDIT","163":"AVANCES RECUES DE L'ETAT","164":"AVANCES RECUES ET COMPTES COURANTS BLOQUES","165":"DEPOTS ET CAUTIONNEMENTS RECUS","166":"INTERETS COURUS","168":"AUTRES EMPRUNTS ET DETTES",
  "17":"DETTES DE LOCATION-ACQUISITION","172":"DETTES DE LOCATION-ACQUISITION / CREDIT-BAIL IMMOBILIER","173":"DETTES DE LOCATION-ACQUISITION / CREDIT-BAIL MOBILIER",
  "18":"DETTES LIEES A DES PARTICIPATIONS","181":"DETTES LIEES A DES PARTICIPATIONS","184":"COMPTES PERMANENTS BLOQUES DES ETABLISSEMENTS ET SUCCURSALES",
  "19":"PROVISIONS POUR RISQUES ET CHARGES","191":"PROVISIONS POUR LITIGES","192":"PROVISIONS POUR GARANTIES DONNEES AUX CLIENTS","194":"PROVISIONS POUR PERTES DE CHANGE","195":"PROVISIONS POUR IMPOTS","196":"PROVISIONS POUR PENSIONS ET OBLIGATIONS SIMILAIRES","198":"AUTRES PROVISIONS POUR RISQUES ET CHARGES",
  "21":"IMMOBILISATIONS INCORPORELLES","211":"FRAIS DE DEVELOPPEMENT","212":"BREVETS, LICENCES, CONCESSIONS ET DROITS SIMILAIRES","213":"LOGICIELS ET SITES INTERNET","215":"MARQUES","216":"FONDS COMMERCIAL","217":"DROIT AU BAIL","219":"AUTRES DROITS ET VALEURS INCORPORELS",
  "22":"TERRAINS","221":"TERRAINS AGRICOLES ET FORESTIERS","222":"TERRAINS NUS","223":"TERRAINS BATIS","224":"TRAVAUX DE MISE EN VALEUR DES TERRAINS","228":"AUTRES TERRAINS",
  "23":"BATIMENTS, INSTALLATIONS TECHNIQUES ET AGENCEMENTS","231":"BATIMENTS INDUSTRIELS, AGRICOLES, ADMINISTRATIFS ET COMMERCIAUX SUR SOL PROPRE","2311":"Bâtiments industriels","2312":"Bâtiments agricoles","2313":"Bâtiments administratifs et commerciaux","232":"BATIMENTS SUR SOL D'AUTRUI","234":"AMENAGEMENTS, AGENCEMENTS ET INSTALLATIONS TECHNIQUES","235":"AMENAGEMENTS DE BUREAUX","239":"BATIMENTS EN COURS",
  "24":"MATERIEL, MOBILIER ET ACTIFS BIOLOGIQUES","241":"MATERIEL ET OUTILLAGE INDUSTRIEL ET COMMERCIAL","2411":"Matériel industriel","2412":"Outillage industriel","242":"MATERIEL ET OUTILLAGE AGRICOLE","244":"MATERIEL ET MOBILIER","2441":"Matériel de bureau","2442":"Matériel informatique","2443":"Matériel bureautique","2444":"Mobilier de bureau","2445":"Matériel et mobilier - immeubles de placement","245":"MATERIEL DE TRANSPORT","2451":"Matériel automobile","2452":"Matériel ferroviaire","2453":"Matériel fluvial, lagunaire","2454":"Matériel naval","2455":"Matériel aérien","246":"ACTIFS BIOLOGIQUES","248":"AUTRES MATERIELS ET MOBILIERS","249":"MATERIELS EN COURS",
  "25":"AVANCES ET ACOMPTES VERSES SUR IMMOBILISATIONS","251":"Avances sur immobilisations incorporelles","252":"Avances sur immobilisations corporelles",
  "26":"TITRES DE PARTICIPATION","261":"Titres contrôle exclusif","262":"Titres contrôle conjoint","263":"Titres influence notable","268":"Autres titres de participation",
  "27":"AUTRES IMMOBILISATIONS FINANCIERES","271":"PRETS ET CREANCES","272":"PRETS AU PERSONNEL","273":"CREANCES SUR L'ETAT","274":"TITRES IMMOBILISES","275":"DEPOTS ET CAUTIONNEMENTS VERSES","276":"INTERETS COURUS","277":"CREANCES RATTACHEES A DES PARTICIPATIONS","278":"IMMOBILISATIONS FINANCIERES DIVERSES",
  "28":"AMORTISSEMENTS","281":"AMORTISSEMENTS DES IMMOBILISATIONS INCORPORELLES","2811":"Amortissements frais de développement","2812":"Amortissements brevets, licences","2813":"Amortissements logiciels et sites internet","2815":"Amortissements fonds commercial","2818":"Amortissements autres droits","282":"AMORTISSEMENTS DES TERRAINS","2824":"Amortissements travaux de mise en valeur","283":"AMORTISSEMENTS DES BATIMENTS","2831":"Amortissements bâtiments sol propre","2832":"Amortissements bâtiments sol d'autrui","2834":"Amortissements installations techniques","2835":"Amortissements aménagements de bureaux","284":"AMORTISSEMENTS DU MATERIEL","2841":"Amortissements matériel industriel et commercial","2842":"Amortissements matériel agricole","2844":"Amortissements matériel et mobilier","2845":"Amortissements matériel de transport","2846":"Amortissements actifs biologiques","2848":"Amortissements autres matériels",
  "29":"DEPRECIATIONS DES IMMOBILISATIONS","291":"Dépréciations immobilisations incorporelles","293":"Dépréciations bâtiments","294":"Dépréciations matériel","296":"Dépréciations titres de participation","297":"Dépréciations autres immobilisations financières",
  "31":"MARCHANDISES","311":"MARCHANDISES A","312":"MARCHANDISES B","313":"ACTIFS BIOLOGIQUES","318":"MARCHANDISES HORS ACTIVITES ORDINAIRES",
  "32":"MATIERES PREMIERES ET FOURNITURES LIEES","321":"MATIERES A","322":"MATIERES B","323":"FOURNITURES",
  "33":"AUTRES APPROVISIONNEMENTS","331":"MATIERES CONSOMMABLES","332":"FOURNITURES D'ATELIER ET D'USINE","333":"FOURNITURES DE MAGASIN","334":"FOURNITURES DE BUREAU","335":"EMBALLAGES","338":"AUTRES MATIERES",
  "34":"PRODUITS EN COURS","341":"Produits en cours","342":"Travaux en cours",
  "35":"SERVICES EN COURS","351":"Etudes en cours","352":"Prestations de services en cours",
  "36":"PRODUITS FINIS","361":"PRODUITS FINIS A","362":"PRODUITS FINIS B",
  "37":"PRODUITS INTERMEDIAIRES ET RESIDUELS","371":"Produits intermédiaires","372":"Produits résiduels",
  "38":"STOCKS EN COURS DE ROUTE","381":"Marchandises en cours de route","382":"Matières premières en cours de route","387":"Stock en consignation ou en dépôt",
  "39":"DEPRECIATIONS DES STOCKS","391":"Dépréciations marchandises","392":"Dépréciations matières premières","393":"Dépréciations autres approvisionnements","396":"Dépréciations produits finis",
  "40":"FOURNISSEURS ET COMPTES RATTACHES","401":"FOURNISSEURS, DETTES EN COMPTE","4011":"Fournisseurs","4012":"Fournisseurs Groupe","4013":"Fournisseurs sous-traitants","4016":"Fournisseurs, réserve de propriété","4017":"Fournisseurs, retenues de garantie","402":"FOURNISSEURS, EFFETS A PAYER","404":"FOURNISSEURS, ACQUISITIONS COURANTES D'IMMOBILISATIONS","4041":"Fournisseurs dettes en compte, immobilisations incorporelles","4042":"Fournisseurs dettes en compte, immobilisations corporelles","408":"FOURNISSEURS, FACTURES NON PARVENUES","409":"FOURNISSEURS DEBITEURS","4091":"Fournisseurs avances et acomptes versés","4094":"Fournisseurs créances pour emballages et matériels à rendre","4098":"Fournisseurs, rabais, remises, ristournes et autres avoirs à obtenir",
  "41":"CLIENTS ET COMPTES RATTACHES","411":"CLIENTS","4111":"Clients","4112":"Clients – Groupe","4114":"Clients, Etat et Collectivités publiques","412":"CLIENTS, EFFETS A RECEVOIR EN PORTEFEUILLE","413":"CLIENTS, CHEQUES, EFFETS ET AUTRES VALEURS IMPAYES","414":"CREANCES SUR CESSIONS COURANTES D'IMMOBILISATIONS","415":"CLIENTS, EFFETS ESCOMPTES NON ECHUS","416":"CREANCES CLIENTS LITIGIEUSES OU DOUTEUSES","418":"CLIENTS, PRODUITS A RECEVOIR","419":"CLIENTS CREDITEURS","4191":"Clients, avances et acomptes reçus","4194":"Clients, dettes pour emballages et matériels consignés",
  "42":"PERSONNEL","421":"PERSONNEL, AVANCES ET ACOMPTES","4211":"Personnel, avances","4212":"Personnel, acomptes","422":"PERSONNEL, REMUNERATIONS DUES","423":"PERSONNEL, OPPOSITIONS, SAISIES-ARRETS","424":"PERSONNEL, OEUVRES SOCIALES INTERNES","425":"REPRESENTANTS DU PERSONNEL","426":"PERSONNEL, PARTICIPATION AUX BENEFICES ET AU CAPITAL","427":"PERSONNEL – DEPOTS","428":"PERSONNEL, CHARGES A PAYER ET PRODUITS A RECEVOIR","4281":"Dettes provisionnées pour congés à payer","4286":"Autres charges à payer",
  "43":"ORGANISMES SOCIAUX","431":"SECURITE SOCIALE","4311":"Prestations familiales","4312":"Accidents de travail","4313":"Caisse de retraite obligatoire","432":"CAISSES DE RETRAITE COMPLEMENTAIRE","433":"AUTRES ORGANISMES SOCIAUX","438":"ORGANISMES SOCIAUX, CHARGES A PAYER ET PRODUITS A RECEVOIR",
  "44":"ETAT ET COLLECTIVITES PUBLIQUES","441":"ETAT, IMPOT SUR LES BENEFICES","442":"ETAT, AUTRES IMPOTS ET TAXES","4421":"Impôts et taxes d'Etat","4422":"Impôts et taxes collectivités publiques","4426":"Droits de douane","4428":"Autres impôts et taxes","443":"ETAT, T.V.A. FACTUREE","4431":"T.V.A. facturée sur ventes","4432":"T.V.A. facturée sur prestations de services","444":"ETAT, T.V.A. DUE OU CREDIT DE T.V.A.","4441":"Etat, T.V.A. due","4449":"Etat, crédit de T.V.A. à reporter","445":"ETAT, T.V.A. RECUPERABLE","4451":"T.V.A. récupérable sur immobilisations","4452":"T.V.A. récupérable sur achats","4453":"T.V.A. récupérable sur transport","4454":"T.V.A. récupérable sur services extérieurs","4455":"T.V.A. récupérable sur factures non parvenues","447":"ETAT, IMPOTS RETENUS A LA SOURCE","4471":"Impôt Général sur le revenu","4472":"Impôts sur salaires","4473":"Contribution nationale","4474":"Contribution nationale de solidarité","4478":"Autres impôts et contributions","448":"ETAT, CHARGES A PAYER ET PRODUITS A RECEVOIR","449":"ETAT, CREANCES ET DETTES DIVERSES","4491":"Etat, obligations cautionnées","4492":"Etat, avances et acomptes versés sur impôts","4494":"Etat, subventions d'investissement à recevoir","4495":"Etat, subventions d'exploitation à recevoir",
  "45":"ORGANISMES INTERNATIONAUX","451":"OPERATIONS AVEC LES ORGANISMES AFRICAINS","452":"OPERATIONS AVEC LES AUTRES ORGANISMES INTERNATIONAUX",
  "46":"APPORTEURS, ASSOCIES ET GROUPE","461":"APPORTEURS, OPERATIONS SUR LE CAPITAL","462":"ASSOCIES, COMPTES COURANTS","463":"ASSOCIES, OPERATIONS FAITES EN COMMUN ET GIE","465":"ASSOCIES, DIVIDENDES A PAYER","466":"GROUPE, COMPTES COURANTS","469":"ENTITE, DIVIDENDES A RECEVOIR",
  "47":"DEBITEURS ET CREDITEURS DIVERS","471":"DEBITEURS ET CREDITEURS DIVERS","4711":"Débiteurs divers","4712":"Créditeurs divers","4715":"Rémunérations d'administrateurs non associés","472":"CREANCES ET DETTES SUR TITRES DE PLACEMENT","473":"INTERMEDIAIRES - OPERATIONS FAITES POUR COMPTE DE TIERS","474":"COMPTE DE REPARTITION PERIODIQUE DES CHARGES ET DES PRODUITS","476":"CHARGES CONSTATEES D'AVANCE","477":"PRODUITS CONSTATES D'AVANCE","478":"ECARTS DE CONVERSION - ACTIF","479":"ECARTS DE CONVERSION - PASSIF",
  "48":"CREANCES ET DETTES HORS ACTIVITES ORDINAIRES (HAO)","481":"FOURNISSEURS D'INVESTISSEMENTS","4811":"Immobilisations incorporelles","4812":"Immobilisations corporelles","482":"FOURNISSEURS D'INVESTISSEMENTS, EFFETS A PAYER","485":"CREANCES SUR CESSIONS D'IMMOBILISATIONS","488":"AUTRES CREANCES HORS ACTIVITES ORDINAIRES",
  "49":"DEPRECIATIONS ET PROVISIONS POUR RISQUES A COURT TERME","490":"Dépréciations comptes fournisseurs","491":"Dépréciations comptes clients","492":"Dépréciations comptes personnel","493":"Dépréciations comptes organismes sociaux","494":"Dépréciations comptes Etat","497":"Dépréciations comptes débiteurs divers","499":"PROVISIONS POUR RISQUES A COURT TERME",
  "50":"TITRES DE PLACEMENT","501":"TITRES DU TRESOR ET BONS DE CAISSE A COURT TERME","502":"ACTIONS","503":"OBLIGATIONS","508":"AUTRES TITRES DE PLACEMENT ET CREANCES ASSIMILEES",
  "51":"VALEURS A ENCAISSER","511":"EFFETS A ENCAISSER","512":"EFFETS A L'ENCAISSEMENT","513":"CHEQUES A ENCAISSER","514":"CHEQUES A L'ENCAISSEMENT","515":"CARTES DE CREDIT A ENCAISSER","518":"AUTRES VALEURS A L'ENCAISSEMENT",
  "52":"BANQUES","521":"BANQUES LOCALES","5211":"Banques en monnaie nationale","5215":"Banques en devises","522":"BANQUES AUTRES ETATS REGION","523":"BANQUES AUTRES ETATS ZONE MONETAIRE","524":"BANQUES HORS ZONE MONETAIRE","525":"BANQUES DEPOT A TERME","526":"BANQUES, INTERETS COURUS",
  "53":"ETABLISSEMENTS FINANCIERS ET ASSIMILES","531":"CHEQUES POSTAUX","532":"TRESOR","533":"SOCIETES DE GESTION ET D'INTERMEDIATION","538":"AUTRES ORGANISMES FINANCIERS",
  "54":"INSTRUMENTS DE TRESORERIE","541":"OPTIONS DE TAUX D'INTERET","542":"OPTIONS DE TAUX DE CHANGE","545":"AVOIRS D'OR ET AUTRES METAUX PRECIEUX",
  "55":"INSTRUMENTS DE MONNAIE ELECTRONIQUE","551":"MONNAIE ELECTRONIQUE - CARTE CARBURANT","552":"MONNAIE ELECTRONIQUE - TELEPHONE PORTABLE","553":"MONNAIE ELECTRONIQUE - CARTE PEAGE","554":"PORTE-MONNAIE ELECTRONIQUE","558":"AUTRES INSTRUMENTS DE MONNAIES ELECTRONIQUES",
  "56":"BANQUES, CREDITS DE TRESORERIE ET D'ESCOMPTE","561":"CREDITS DE TRESORERIE","564":"ESCOMPTE DE CREDITS DE CAMPAGNE","565":"ESCOMPTE DE CREDITS ORDINAIRES",
  "57":"CAISSE","571":"CAISSE SIEGE SOCIAL","5711":"Caisse en monnaie nationale","5712":"Caisse en devises","572":"CAISSE SUCCURSALE A","573":"CAISSE SUCCURSALE B",
  "58":"REGIES D'AVANCES, ACCREDITIFS ET VIREMENTS","581":"REGIES D'AVANCE","582":"ACCREDITIFS","585":"VIREMENTS DE FONDS","588":"AUTRES VIREMENTS INTERNES",
  "59":"DEPRECIATIONS ET PROVISIONS POUR RISQUE A COURT TERME","590":"Dépréciations titres de placement","591":"Dépréciations titres et valeurs à encaisser","592":"Dépréciations comptes banques","599":"Provisions pour risque à court terme à caractère financier",
  "60":"ACHATS ET VARIATIONS DE STOCKS","601":"ACHATS DE MARCHANDISES","6011":"dans la Région","6012":"hors Région","6015":"frais sur achats","6019":"Rabais, Remises et Ristournes obtenus","602":"ACHATS DE MATIERES PREMIERES ET FOURNITURES LIEES","6021":"dans la Région","6022":"hors Région","603":"VARIATIONS DES STOCKS DE BIENS ACHETES","6031":"Variations des stocks de marchandises","6032":"Variations des stocks de matières premières","6033":"Variations des stocks d'autres approvisionnements","604":"ACHATS STOCKES DE MATIERES ET FOURNITURES CONSOMMABLES","6041":"Matières consommables","6042":"Matières combustibles","6043":"Produits d'entretien","6044":"Fournitures d'atelier et d'usine","6046":"Fournitures de magasin","6047":"Fournitures de bureau","605":"AUTRES ACHATS","6051":"Fournitures non stockables – Eau","6052":"Fournitures non stockables - Electricité","6053":"Fournitures non stockables – Autres énergies","6054":"Fournitures d'entretien non stockables","6055":"Fournitures de bureau non stockables","6056":"Achats de petit matériel et outillage","6057":"Achats d'études et prestations de services","6058":"Achats de travaux, matériels et équipements","608":"ACHATS D'EMBALLAGES","6081":"Emballages perdus","6082":"Emballages récupérables non identifiables",
  "61":"TRANSPORTS","612":"TRANSPORTS SUR VENTES","613":"TRANSPORTS POUR LE COMPTE DE TIERS","614":"TRANSPORTS DU PERSONNEL","616":"TRANSPORTS DE PLIS","618":"AUTRES FRAIS DE TRANSPORT","6181":"Voyages et déplacements","6182":"Transports entre établissements ou chantiers","6183":"Transports administratifs",
  "62":"SERVICES EXTERIEURS","621":"SOUS-TRAITANCE GENERALE","622":"LOCATIONS, CHARGES LOCATIVES","6221":"Locations de terrains","6222":"Locations de bâtiments","6223":"Locations de matériels et outillages","6224":"Malis sur emballages","6225":"Locations d'emballages","6228":"Locations et charges locatives diverses","623":"REDEVANCES DE LOCATION-ACQUISITION","6232":"Crédit-bail immobilier","6233":"Crédit-bail mobilier","624":"ENTRETIEN, REPARATIONS, REMISE EN ETAT ET MAINTENANCE","6241":"Entretien et réparations des biens immobiliers","6242":"Entretien et réparations des biens mobiliers","6243":"Maintenance","625":"PRIMES D'ASSURANCE","6251":"Assurances multirisques","6252":"Assurances matériel de transport","6253":"Assurances risques d'exploitation","626":"ETUDES, RECHERCHES ET DOCUMENTATION","6261":"Etudes et recherches","6265":"Documentation générale","627":"PUBLICITE, PUBLICATIONS, RELATIONS PUBLIQUES","6271":"Annonces, insertions","6272":"Catalogues, imprimés publicitaires","628":"FRAIS DE TELECOMMUNICATIONS","6281":"Frais de téléphone","6282":"Frais de télex","6283":"Frais de télécopie","6288":"Autres frais de télécommunications",
  "63":"AUTRES SERVICES EXTERIEURS","631":"FRAIS BANCAIRES","6311":"Frais sur titres (vente, garde)","6312":"Frais sur effets","6313":"Location de coffres","6315":"Commissions sur cartes de crédit","6316":"Frais d'émission d'emprunts","6318":"Autres frais bancaires","632":"REMUNERATIONS D'INTERMEDIAIRES ET DE CONSEILS","6322":"Commissions et courtages sur ventes","6324":"Honoraires des professions réglementées","6325":"Frais d'actes et de contentieux","6327":"Rémunérations des autres prestataires de services","633":"FRAIS DE FORMATION DU PERSONNEL","634":"REDEVANCES POUR BREVETS, LICENCES, LOGICIELS, CONCESSIONS, DROITS ET VALEURS SIMILAIRES","6342":"Redevances pour brevets, licences","6343":"Redevances pour logiciels","6344":"Redevances pour marques","6346":"Redevances pour concessions, droits et valeurs similaires","635":"COTISATIONS","6351":"Cotisations","637":"REMUNERATIONS DE PERSONNEL EXTERIEUR A L'ENTITE","6371":"Personnel intérimaire","6372":"Personnel détaché ou prêté à l'entité","638":"AUTRES CHARGES EXTERNES","6381":"Frais de recrutement du personnel","6382":"Frais de déménagement","6383":"Réceptions","6384":"Missions","6388":"Charges externes diverses",
  "64":"IMPOTS ET TAXES","641":"IMPOTS ET TAXES DIRECTS","6411":"Impôts fonciers et taxes annexes","6412":"Patentes, licences et taxes annexes","6413":"Taxes sur appointements et salaires","6414":"Taxes d'apprentissage","6415":"Formation professionnelle continue","6418":"Autres impôts et taxes directs","645":"IMPOTS ET TAXES INDIRECTS","646":"DROITS D'ENREGISTREMENT","6461":"Droits de mutation","6462":"Droits de timbre","6463":"Taxes sur les véhicules de société","647":"PENALITES, AMENDES FISCALES","648":"AUTRES IMPOTS ET TAXES",
  "65":"AUTRES CHARGES","651":"PERTES SUR CREANCES CLIENTS ET AUTRES DEBITEURS","654":"VALEURS COMPTABLES DES CESSIONS COURANTES D'IMMOBILISATIONS","6541":"Immobilisations incorporelles","6542":"Immobilisations corporelles","656":"PERTE DE CHANGE SUR CREANCES ET DETTES COMMERCIALES","657":"PENALITES ET AMENDES PENALES","658":"CHARGES DIVERSES","6581":"Indemnités de fonction et autres rémunérations d'administrateurs","6582":"Dons","6583":"Mécénat","6588":"Autres charges diverses","659":"CHARGES POUR DEPRECIATIONS ET PROVISIONS",
  "66":"CHARGES DE PERSONNEL","661":"REMUNERATIONS DIRECTES VERSEES AU PERSONNEL NATIONAL","6611":"Appointements salaires et commissions","6612":"Primes et gratifications","6613":"Congés payés","6614":"Indemnités de préavis, de licenciement et de recherche d'embauche","6615":"Indemnités de maladie versées aux travailleurs","6616":"Supplément familial","6617":"Avantages en nature","6618":"Autres rémunérations directes","662":"REMUNERATIONS DIRECTES VERSEES AU PERSONNEL NON NATIONAL","663":"INDEMNITES FORFAITAIRES VERSEES AU PERSONNEL","6631":"Indemnités de logement","6632":"Indemnités de représentation","6633":"Indemnités d'expatriation","6634":"Indemnités de transport","6638":"Autres indemnités et avantages divers","664":"CHARGES SOCIALES","6641":"Charges sociales sur rémunération du personnel national","6642":"Charges sociales sur rémunération du personnel non national","666":"REMUNERATIONS ET CHARGES SOCIALES DE L'EXPLOITANT INDIVIDUEL","667":"REMUNERATION TRANSFEREE DE PERSONNEL EXTERIEUR","668":"AUTRES CHARGES SOCIALES","6681":"Versements aux Syndicats et Comités d'entreprise","6684":"Médecine du travail et pharmacie","6685":"Assurances et organismes de santé","6686":"Assurances retraite et fonds de pensions","6688":"Charges sociales diverses",
  "67":"FRAIS FINANCIERS ET CHARGES ASSIMILEES","671":"INTERETS DES EMPRUNTS","6711":"Emprunts obligataires","6712":"Emprunts auprès des établissements de crédit","672":"INTERETS DANS LOYERS DE LOCATION ACQUISITION","673":"ESCOMPTES ACCORDES","674":"AUTRES INTERETS","6741":"Avances reçues et dépôts créditeurs","6742":"Comptes courants bloqués","6744":"Intérêts sur dettes commerciales","6745":"Intérêts bancaires et sur opérations de financement","675":"ESCOMPTES DES EFFETS DE COMMERCE","676":"PERTES DE CHANGE FINANCIERES","677":"PERTES SUR TITRES DE PLACEMENT","679":"CHARGES POUR DEPRECIATIONS ET PROVISIONS POUR RISQUES FINANCIERES",
  "68":"DOTATIONS AUX AMORTISSEMENTS","681":"DOTATIONS AUX AMORTISSEMENTS D'EXPLOITATION","6812":"Dotations aux amortissements des immobilisations incorporelles","6813":"Dotations aux amortissements des immobilisations corporelles",
  "69":"DOTATIONS AUX PROVISIONS ET AUX DEPRECIATIONS","691":"DOTATIONS AUX PROVISIONS ET AUX DEPRECIATIONS D'EXPLOITATION","6911":"Dotations aux provisions pour risques et charges","6913":"Dotations aux dépréciations des immobilisations incorporelles","6914":"Dotations aux dépréciations des immobilisations corporelles","697":"DOTATIONS AUX PROVISIONS ET AUX DEPRECIATIONS FINANCIERES","6971":"Dotations aux provisions pour risques et charges financiers","6972":"Dotations aux dépréciations des immobilisations financières",
  "70":"VENTES","701":"VENTES DE MARCHANDISES","7011":"dans la Région","7012":"hors Région","7013":"aux entités du groupe dans la Région","7015":"sur internet","7019":"Rabais, remises, ristournes accordés","702":"VENTES DE PRODUITS FINIS","703":"VENTES DE PRODUITS INTERMEDIAIRES","704":"VENTES DE PRODUITS RESIDUELS","705":"TRAVAUX FACTURES","706":"SERVICES VENDUS","7061":"dans la Région","7062":"hors Région","707":"PRODUITS ACCESSOIRES","7071":"Ports, emballages perdus et autres frais facturés","7072":"Commissions et courtages","7073":"Locations et redevances de location - financement","7074":"Bonis sur reprises et cessions d'emballages","7075":"Mise à disposition de personnel","7076":"Redevances pour brevets, logiciels, marques et droits similaires","7077":"Services exploités dans l'intérêt du personnel","7078":"Autres produits accessoires",
  "71":"SUBVENTIONS D'EXPLOITATION","711":"SUR PRODUITS A L'EXPORTATION","712":"SUR PRODUITS A L'IMPORTATION","713":"SUR PRODUITS DE PEREQUATION","714":"INDEMNITES ET SUBVENTIONS D'EXPLOITATION","718":"AUTRES SUBVENTIONS D'EXPLOITATION","7181":"Versées par l'Etat et les collectivités publiques","7182":"Versées par les organismes internationaux","7183":"Versées par des tiers",
  "72":"PRODUCTION IMMOBILISEE","721":"IMMOBILISATIONS INCORPORELLES","722":"IMMOBILISATIONS CORPORELLES","724":"PRODUCTION AUTO-CONSOMMEE","726":"IMMOBILISATIONS FINANCIERES",
  "73":"VARIATIONS DES STOCKS DE BIENS ET DE SERVICES PRODUITS","734":"VARIATIONS DES STOCKS DE PRODUITS EN COURS","736":"VARIATIONS DES STOCKS DE PRODUITS FINIS","737":"VARIATIONS DES STOCKS DE PRODUITS INTERMEDIAIRES ET RESIDUELS",
  "75":"AUTRES PRODUITS","751":"PROFITS SUR CREANCES CLIENTS ET AUTRES DEBITEURS","754":"PRODUITS DES CESSIONS COURANTES D'IMMOBILISATIONS","7541":"Immobilisations incorporelles","7542":"Immobilisations corporelles","756":"GAINS DE CHANGE SUR CREANCES ET DETTES COMMERCIALES","758":"PRODUITS DIVERS","7581":"Indemnités de fonction et autres rémunérations d'administrateurs","7582":"Indemnités d'assurances reçues","7588":"Autres produits divers","759":"REPRISES DE CHARGES POUR DEPRECIATIONS ET PROVISIONS",
  "77":"REVENUS FINANCIERS ET PRODUITS ASSIMILES","771":"INTERETS DE PRETS ET CREANCES DIVERSES","7712":"Intérêts de prêts","7713":"Intérêts sur créances diverses","772":"REVENUS DE PARTICIPATIONS ET AUTRES TITRES IMMOBILISES","7721":"Revenus des titres de participation","773":"ESCOMPTES OBTENUS","774":"REVENUS DE PLACEMENT","7745":"Revenus des obligations","7746":"Revenus des titres de placement","775":"INTERETS DANS LOYERS DE LOCATION-FINANCEMENT","776":"GAINS DE CHANGE FINANCIERS","777":"GAINS SUR CESSIONS DE TITRES DE PLACEMENT","778":"GAINS SUR RISQUES FINANCIERS","779":"REPRISES DE CHARGES POUR DEPRECIATIONS ET PROVISIONS FINANCIERES",
  "78":"TRANSFERTS DE CHARGES","781":"TRANSFERTS DE CHARGES D'EXPLOITATION","787":"TRANSFERTS DE CHARGES FINANCIERES",
  "79":"REPRISES DE PROVISIONS, DE DEPRECIATIONS ET AUTRES","791":"REPRISES DE PROVISIONS ET DEPRECIATIONS D'EXPLOITATION","797":"REPRISES DE PROVISIONS ET DEPRECIATIONS FINANCIERES","799":"REPRISES DE SUBVENTIONS D'INVESTISSEMENT",
  "81":"VALEURS COMPTABLES DES CESSIONS D'IMMOBILISATIONS","811":"IMMOBILISATIONS INCORPORELLES","812":"IMMOBILISATIONS CORPORELLES","816":"IMMOBILISATIONS FINANCIERES",
  "82":"PRODUITS DES CESSIONS D'IMMOBILISATIONS","821":"IMMOBILISATIONS INCORPORELLES","822":"IMMOBILISATIONS CORPORELLES","826":"IMMOBILISATIONS FINANCIERES",
  "83":"CHARGES HORS ACTIVITES ORDINAIRES","831":"CHARGES H.A.O. CONSTATEES","833":"CHARGES LIEES AUX OPERATIONS DE RESTRUCTURATION","834":"PERTES SUR CREANCES H.A.O.","835":"DONS ET LIBERALITES ACCORDES","836":"ABANDONS DE CREANCES CONSENTIS","837":"CHARGES LIEES AUX OPERATIONS DE LIQUIDATION",
  "84":"PRODUITS HORS ACTIVITES ORDINAIRES","841":"PRODUITS H.A.O CONSTATES","843":"PRODUITS LIES AUX OPERATIONS DE RESTRUCTURATION","845":"DONS ET LIBERALITES OBTENUS","846":"ABANDONS DE CREANCES OBTENUS","848":"TRANSFERTS DE CHARGES H.A.O","849":"REPRISES DE CHARGES POUR DEPRECIATIONS ET PROVISIONS H.A.O.",
  "85":"DOTATIONS HORS ACTIVITES ORDINAIRES","851":"DOTATIONS AUX PROVISIONS REGLEMENTEES","852":"DOTATIONS AUX AMORTISSEMENTS H.A.O.","853":"DOTATIONS AUX DEPRECIATIONS H.A.O.","854":"DOTATIONS AUX PROVISIONS POUR RISQUES ET CHARGES H.A.O.","858":"AUTRES DOTATIONS H.A.O.",
  "86":"REPRISES DE CHARGES, PROVISIONS ET DEPRECIATIONS HAO","861":"REPRISES DE PROVISIONS REGLEMENTEES","862":"REPRISES D'AMORTISSEMENTS H.A.O","863":"REPRISES DE DEPRECIATIONS H.A.O.","864":"REPRISES DE PROVISIONS POUR RISQUES ET CHARGES H.A.O.","868":"AUTRES REPRISES H.A.O.",
  "87":"PARTICIPATION DES TRAVAILLEURS","871":"PARTICIPATION LEGALE AUX BENEFICES","874":"PARTICIPATION CONTRACTUELLE AUX BENEFICES",
  "89":"IMPOTS SUR LE RESULTAT","891":"IMPOTS SUR LES BENEFICES DE L'EXERCICE","8911":"Activités exercées dans l'Etat","8912":"Activités exercées dans les autres Etats de la Région","892":"RAPPEL D'IMPOTS SUR RESULTATS ANTERIEURS","895":"IMPOT MINIMUM FORFAITAIRE (I.M.F.)","899":"DEGREVEMENTS ET ANNULATIONS D'IMPOTS SUR RESULTATS ANTERIEURS",
  "90":"ENGAGEMENTS OBTENUS ET ENGAGEMENTS ACCORDES","901":"ENGAGEMENTS DE FINANCEMENT OBTENUS","902":"ENGAGEMENTS DE GARANTIE OBTENUS","903":"ENGAGEMENTS RECIPROQUES","904":"AUTRES ENGAGEMENTS OBTENUS","905":"ENGAGEMENTS DE FINANCEMENT ACCORDES","906":"ENGAGEMENTS DE GARANTIE ACCORDES","907":"ENGAGEMENTS RECIPROQUES","908":"AUTRES ENGAGEMENTS ACCORDES"
};

const CLASS_NAMES = { '1':'Capitaux','2':'Immobilisations','3':'Stocks','4':'Tiers','5':'Trésorerie','6':'Charges','7':'Produits','8':'Spéciaux' };
const NATURE_MAP  = { '1':'Passif','2':'Actif','3':'Actif','4':'Mixte','5':'Actif','6':'Charge','7':'Produit','8':'Spécial' };
const JOURNAL_NAMES = { 'AC':'Achats','VE':'Ventes','BQ':'Banque','CA':'Caisse','OD':'Opérations Diverses','IN':'Inventaire','AN':'À Nouveau' };
const JOURNAL_ICONS = { 'AC':'🛒','VE':'💰','BQ':'🏦','CA':'💵','OD':'📋','IN':'📦','AN':'📂' };

// ══════════════════════════════════════════
// TRI DÉBIT AVANT CRÉDIT — NORME SYSCOHADA
// ══════════════════════════════════════════
function sortLignesDebitAvantCredit(lignes) {
  return [...lignes].sort((a, b) => {
    const aIsDebit = (parseFloat(a.debit) || 0) > 0;
    const bIsDebit = (parseFloat(b.debit) || 0) > 0;
    if (aIsDebit && !bIsDebit) return -1;
    if (!aIsDebit && bIsDebit) return 1;
    return 0;
  });
}

function getStepLabel(ecr) {
  const jnl = ecr.journal;
  if (jnl === 'IN') return 'Mouvement de stock';
  if (jnl === 'AC') return 'Constatation facture achat';
  if (jnl === 'VE') return 'Constatation facture vente';
  if (jnl === 'BQ') return 'Règlement banque';
  if (jnl === 'CA') return 'Règlement caisse';
  if (jnl === 'OD') return 'Opération diverse';
  if (jnl === 'AN') return 'À nouveau';
  return ecr.libelle || 'Écriture';
}

// ── État global ──
let ecritures = [], lignes = [], pieceCounter = 1, currentProfile = null, isAILoading = false;
let exportFormat = 'pdf';
let ecrQueue = [], ecrQueueIdx = 0;
let currentGroupId = null;
let conversationHistory = [];

// ══════════════════════════════════════════
// MOBILE SIDEBAR
// ══════════════════════════════════════════
function toggleMobileSidebar() {
  document.getElementById('mainSidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}
function closeMobileSidebar() {
  document.getElementById('mainSidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ══════════════════════════════════════════
// SYSTEM PROMPT — RAISONNEMENT STRUCTURÉ
// ══════════════════════════════════════════
function buildSystemPrompt(ctx) {
  const { nbEcritures, companyName, exercice, totalDebit, totalCredit, comptesSoldes, allDates, ecrituresResume } = ctx;
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return `Tu es COMEO AI — Expert-Comptable Diplômé et Commissaire aux Comptes agréé en Côte d'Ivoire, membre de l'ONECCA-CI. Tu maîtrises parfaitement le SYSCOHADA Révisé 2017 et le droit fiscal ivoirien.

════════════════════════════════════════════
🧠 MÉTHODE DE RAISONNEMENT OBLIGATOIRE
════════════════════════════════════════════

Avant de produire TOUTE écriture, tu DOIS raisonner en silence selon ces étapes :

ÉTAPE 1 — IDENTIFIER L'OPÉRATION
  → Quelle est la nature exacte de l'opération ? (achat, vente, salaire, immobilisation, emprunt...)
  → L'opération est-elle HT ou TTC ? Si TTC : HT = TTC ÷ 1,18 | TVA = TTC × 18/118
  → Qui paie / qui reçoit ? Quelle est la contrepartie financière ?

ÉTAPE 2 — COMPTER LES ÉCRITURES NÉCESSAIRES
  → Combien d'écritures cette opération requiert-elle ? (1, 2 ou 3 ?)
  → Ne JAMAIS générer moins d'écritures que nécessaire
  → Vérifier : y a-t-il un mouvement de stock ? Un règlement ? Une constatation de dette ?

ÉTAPE 3 — CHOISIR LES COMPTES EXACTS
  → Classe 6 pour charges, Classe 7 pour produits, Classe 2 pour immobilisations
  → JAMAIS 601 pour un véhicule/ordinateur/mobilier → utiliser 2451/2442/2444
  → JAMAIS 511/512/513 pour un règlement par chèque → utiliser 521
  → TVA : 4452 achats courants | 4451 immobilisations | 4453 transports | 4454 services

ÉTAPE 4 — VÉRIFIER L'ÉQUILIBRE
  → Σ DÉBITS = Σ CRÉDITS dans chaque écriture (tolérance : 0 FCFA)
  → Les lignes débitrices TOUJOURS en premier (norme SYSCOHADA)

ÉTAPE 5 — FORMATER EN JSON
  → Utiliser EXACTEMENT le format ###ECRITURE### décrit ci-dessous

════════════════════════════════════════════
📋 SCHÉMAS OBLIGATOIRES PAR TYPE D'OPÉRATION
════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 ACHAT MARCHANDISES À CRÉDIT (3 écritures)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉCRITURE 1 [AC] — Constatation facture :
  DÉBIT  601   Achats de marchandises                    [HT]
  DÉBIT  4452  TVA récupérable sur achats 18%            [TVA]
  CRÉDIT 401   Fournisseurs                              [TTC]

ÉCRITURE 2 [IN] — Entrée en stock :
  DÉBIT  311   Marchandises A                            [HT]
  CRÉDIT 6031  Variation des stocks de marchandises      [HT]

ÉCRITURE 3 [BQ ou CA] — Règlement :
  DÉBIT  401   Fournisseurs                              [TTC]
  CRÉDIT 521   Banques locales                           [TTC]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 VENTE MARCHANDISES (3 écritures)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉCRITURE 1 [VE] — Facturation client :
  DÉBIT  411   Clients                                   [TTC]
  CRÉDIT 701   Ventes de marchandises                    [HT]
  CRÉDIT 4431  TVA facturée sur ventes 18%               [TVA]

ÉCRITURE 2 [IN] — Sortie de stock au coût d'achat :
  DÉBIT  6031  Variation des stocks de marchandises      [coût HT]
  CRÉDIT 311   Marchandises A                            [coût HT]

ÉCRITURE 3 [BQ/CA] — Encaissement :
  DÉBIT  521   Banques locales (ou 571 Caisse)           [TTC]
  CRÉDIT 411   Clients                                   [TTC]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 PAIEMENT SALAIRES (2 écritures minimum)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉCRITURE 1 [OD] :
  DÉBIT  661   Rémunérations directes personnel national [brut]
  CRÉDIT 422   Personnel, rémunérations dues             [net à payer]
  CRÉDIT 431   Sécurité sociale — CNPS salarial 7,7%    [retenue CNPS]
  CRÉDIT 447   Impôts retenus à la source                [retenue fiscale]

ÉCRITURE 2 [BQ] :
  DÉBIT  422   Personnel, rémunérations dues             [net à payer]
  CRÉDIT 521   Banques locales                           [net à payer]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 ACHAT IMMOBILISATION (2 écritures)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Véhicule → 2451 | Informatique → 2442 | Mobilier → 2444 | Matériel → 2441

ÉCRITURE 1 [AC] :
  DÉBIT  24xx  Immobilisation                            [HT]
  DÉBIT  4451  TVA récupérable sur immobilisations 18%   [TVA]
  CRÉDIT 401   Fournisseurs                              [TTC]

ÉCRITURE 2 [BQ] :
  DÉBIT  401   Fournisseurs                              [TTC]
  CRÉDIT 521   Banques locales                           [TTC]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 EMPRUNT BANCAIRE (2 écritures)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉCRITURE 1 [BQ] :
  DÉBIT  521   Banques locales                           [montant emprunté]
  CRÉDIT 162   Emprunts auprès établissements de crédit  [montant emprunté]

ÉCRITURE 2 [BQ] — Remboursement :
  DÉBIT  162   Emprunts                                  [capital]
  DÉBIT  671   Intérêts des emprunts                     [intérêts]
  CRÉDIT 521   Banques locales                           [mensualité]

════════════════════════════════════════════
🔢 CALCULS FISCAUX — CÔTE D'IVOIRE
════════════════════════════════════════════
TVA standard       : 18%
HT connu           : TVA = HT × 0,18 | TTC = HT × 1,18
TTC connu          : HT = ARRONDI(TTC ÷ 1,18) | TVA = TTC - HT
CNPS salarial      : 7,7% | CNPS patronal : 16% | TPA : 0,4% | CN : 1,5%/1,6%
IS                 : 25% | IMF : 0,5% CA HT (min 3 000 000 FCFA/an)
RÈGLE : Toujours arrondir à l'entier — JAMAIS de centimes en FCFA.

════════════════════════════════════════════
✅ COMPTES CORRECTS — RÉFÉRENCE
════════════════════════════════════════════
Chèque/virement → 521 (JAMAIS 511/512/513) | Espèces → 571 | Mobile Money → 552
TVA achats → 4452 | TVA immob → 4451 | TVA transport → 4453 | TVA services → 4454
TVA ventes → 4431 | TVA services vendus → 4432
Véhicule → 2451 | Informatique → 2442 | Mobilier → 2444 | Matériel → 2441
Amort véhicule → 2845 | Amort mobilier → 2844 | Amort industriel → 2841
Salaires dus → 422 | Avances salaires → 4211
Dette fournisseur → 401 | Créance client → 411

════════════════════════════════════════════
🔴 RÈGLES ABSOLUES
════════════════════════════════════════════
1. Chaque écriture DOIT être parfaitement équilibrée : Σ DÉBITS = Σ CRÉDITS
2. Lignes DÉBITRICES toujours EN PREMIER (norme SYSCOHADA)
3. JAMAIS de décimales — FCFA entiers uniquement
4. TOUJOURS générer TOUTES les écritures nécessaires
5. Explication textuelle AVANT les blocs ###ECRITURE###

════════════════════════════════════════════
📂 CONTEXTE ENTREPRISE EN TEMPS RÉEL
════════════════════════════════════════════
Entreprise    : ${companyName}
Exercice      : ${exercice}
Date du jour  : ${today}
Nb écritures  : ${nbEcritures}
Total Débit   : ${totalDebit} FCFA
Total Crédit  : ${totalCredit} FCFA
${comptesSoldes ? `Soldes comptes principaux : ${comptesSoldes}` : ''}
${ecrituresResume ? `Dernières opérations : ${ecrituresResume}` : ''}
${allDates ? `Période couverte : ${allDates}` : ''}

════════════════════════════════════════════
📝 FORMAT JSON — STRICT
════════════════════════════════════════════
###ECRITURE###{"journal":"XX","libelle":"Libellé précis","lignes":[
{"compte":"XXXX","libelle":"Libellé du compte","debit":MONTANT,"credit":0},
{"compte":"XXXX","libelle":"Libellé du compte","debit":0,"credit":MONTANT}
]}

Journaux : AC | VE | BQ | CA | OD | IN | AN

════════════════════════════════════════════
🔍 FILTRES ET NAVIGATION
════════════════════════════════════════════
Journal   : ###FILTRE###{"type":"journal","dateDebut":"YYYY-MM-DD","dateFin":"YYYY-MM-DD","journal":"","compte":""}
Balance   : ###FILTRE###{"type":"balance","dateDebut":"","dateFin":"","journal":"","compte":""}
Grand livre : ###FILTRE###{"type":"grandlivre","dateDebut":"","dateFin":"","journal":"","compte":"XXX"}
Bilan     : ###FILTRE###{"type":"bilan","dateDebut":"","dateFin":"YYYY-MM-DD","journal":"","compte":""}`;
}

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════
function switchTab(t) {
  document.getElementById('tab-login').classList.toggle('active', t === 'login');
  document.getElementById('tab-register').classList.toggle('active', t === 'register');
  document.getElementById('form-login').style.display = t === 'login' ? 'flex' : 'none';
  document.getElementById('form-register').style.display = t === 'register' ? 'flex' : 'none';
}

async function doRegister() {
  const company = document.getElementById('r-company').value.trim();
  const compte701 = document.getElementById('r-compte701').value.trim() || '701';
  const exercice = document.getElementById('r-exercice').value.trim() || '2024';
  const pass = document.getElementById('r-pass').value;
  const err = document.getElementById('r-err');
  err.classList.remove('show');
  if (!company) { err.textContent = "Nom d'entreprise requis"; err.classList.add('show'); return; }
  if (pass.length < 4) { err.textContent = 'Mot de passe trop court (4 caractères min.)'; err.classList.add('show'); return; }
  const profileId = company.toLowerCase().replace(/[^a-z0-9]/g, '_');
  try {
    await waitForFirebase();
    const docRef = window._fbDoc(window._db, 'profiles', profileId);
    const snap = await window._fbGetDoc(docRef);
    if (snap.exists()) { err.textContent = "Ce nom d'entreprise existe déjà."; err.classList.add('show'); return; }
    await window._fbSetDoc(docRef, { company, compte701, exercice, password: btoa(pass), createdAt: new Date().toISOString() });
    toast('Profil créé avec succès ! Connectez-vous.', 'success');
    switchTab('login');
    document.getElementById('l-company').value = company;
  } catch (e) { err.textContent = 'Erreur : ' + e.message; err.classList.add('show'); }
}

async function doLogin() {
  const company = document.getElementById('l-company').value.trim();
  const pass = document.getElementById('l-pass').value;
  const err = document.getElementById('l-err');
  err.classList.remove('show');
  if (!company || !pass) { err.textContent = 'Remplissez tous les champs'; err.classList.add('show'); return; }
  const profileId = company.toLowerCase().replace(/[^a-z0-9]/g, '_');
  try {
    await waitForFirebase();
    const docRef = window._fbDoc(window._db, 'profiles', profileId);
    const snap = await window._fbGetDoc(docRef);
    if (!snap.exists()) { err.textContent = 'Entreprise introuvable.'; err.classList.add('show'); return; }
    const profile = snap.data();
    if (atob(profile.password) !== pass) { err.textContent = 'Mot de passe incorrect'; err.classList.add('show'); return; }
    currentProfile = { ...profile, id: profileId };
    localStorage.setItem('syscohada_session', JSON.stringify({ profileId, company }));
    conversationHistory = [];
    await loadApp();
  } catch (e) { err.textContent = 'Erreur : ' + e.message; err.classList.add('show'); }
}

function doLogout() {
  if (!confirm('Se déconnecter ?')) return;
  localStorage.removeItem('syscohada_session');
  currentProfile = null; ecritures = []; conversationHistory = [];
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('authOverlay').style.display = 'flex';
}

function waitForFirebase() {
  return new Promise(r => {
    if (window._fbReady) { r(); return; }
    document.addEventListener('firebase-ready', r, { once: true });
  });
}

async function loadApp() {
  document.getElementById('authOverlay').style.display = 'none';
  document.getElementById('appShell').style.display = 'grid';
  document.getElementById('topCompanyName').textContent = currentProfile.company;
  document.getElementById('exerciceYear').value = currentProfile.exercice || '2024';
  // Charger la config serveur (clés API) si pas encore fait
  if (!serverConfigLoaded) await loadServerConfig();
  await loadEcrituresFromFirestore();
  updateStats(); renderPlanComptable(); initSaisie();
}

// ══════════════════════════════════════════
// FIRESTORE
// ══════════════════════════════════════════
async function loadEcrituresFromFirestore() {
  try {
    const col = window._fbCollection(window._db, 'profiles', currentProfile.id, 'ecritures');
    const q = window._fbQuery(col, window._fbOrderBy('date', 'asc'));
    const snap = await window._fbGetDocs(q);
    ecritures = [];
    snap.forEach(d => ecritures.push({ ...d.data(), _docId: d.id }));
    pieceCounter = ecritures.length + 1;
  } catch (e) { toast('Erreur chargement : ' + e.message, 'error'); }
}

async function saveEcritureToFirestore(ecriture) {
  try {
    const col = window._fbCollection(window._db, 'profiles', currentProfile.id, 'ecritures');
    const docRef = await window._fbAddDoc(col, ecriture);
    ecriture._docId = docRef.id;
    return docRef.id;
  } catch (e) { toast('Erreur sauvegarde : ' + e.message, 'error'); return null; }
}

async function deleteEcritureFromFirestore(docId) {
  try {
    await window._fbDeleteDoc(window._fbDoc(window._db, 'profiles', currentProfile.id, 'ecritures', docId));
  } catch (e) { toast('Erreur suppression : ' + e.message, 'error'); }
}

// ══════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════
const VIEW_KEYS = {
  dashboard: 'tableau', saisie: 'saisie', journal: 'journal',
  grandlivre: 'grand', balance: 'balance', bilan: 'bilan',
  resultat: 'résultat', tresorerie: 'trésor', plancomptable: 'plan'
};
const RENDERERS = {
  journal: renderJournal, grandlivre: renderGrandLivre, balance: renderBalance,
  bilan: renderBilan, resultat: renderResultat, tresorerie: renderTresorerie,
  plancomptable: renderPlanComptable, saisie: initSaisie
};

function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  const key = VIEW_KEYS[view] || view;
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.textContent.toLowerCase().includes(key)) n.classList.add('active');
  });
  if (RENDERERS[view]) RENDERERS[view]();
}

// ══════════════════════════════════════════
// STATS
// ══════════════════════════════════════════
function updateStats() {
  let tD = 0, tC = 0;
  ecritures.forEach(e => e.lignes.forEach(l => { tD += l.debit || 0; tC += l.credit || 0; }));
  const all = ecritures.flatMap(e => e.lignes);
  const prod = all.filter(l => l.compte?.[0] === '7').reduce((s, l) => s + (l.credit || 0), 0);
  const chg = all.filter(l => l.compte?.[0] === '6').reduce((s, l) => s + (l.debit || 0), 0);
  const res = prod - chg;
  const eq = Math.abs(tD - tC) < 0.01;
  document.getElementById('s-ecritures').textContent = ecritures.length;
  document.getElementById('s-debit').textContent = fn(tD);
  document.getElementById('s-credit').textContent = fn(tC);
  const eqEl = document.getElementById('s-equil');
  eqEl.textContent = eq ? '✓ Équilibré' : '✗ Déséquilibré';
  eqEl.className = 'val ' + (eq ? 'g' : 'r');
  document.getElementById('dash-nb').textContent = ecritures.length;
  document.getElementById('dash-debit').textContent = fs(tD);
  document.getElementById('dash-credit').textContent = fs(tC);
  const re = document.getElementById('dash-res');
  re.textContent = fs(res);
  re.style.color = res >= 0 ? 'var(--green)' : 'var(--red)';
  const yr = document.getElementById('exerciceYear').value;
  const bd = document.getElementById('bilanDate');
  const ry = document.getElementById('resultatYear');
  if (bd) bd.textContent = '31/12/' + yr;
  if (ry) ry.textContent = yr;
}

function fn(n) { return Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }); }
function fs(n) {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1) + ' Md FCFA';
  if (a >= 1e6) return (n / 1e6).toFixed(1) + ' M FCFA';
  if (a >= 1e3) return (n / 1e3).toFixed(0) + ' K FCFA';
  return (n || 0).toFixed(0) + ' FCFA';
}

// ══════════════════════════════════════════
// SAISIE
// ══════════════════════════════════════════
function initSaisie() {
  document.getElementById('ecr-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('ecr-piece').placeholder = 'N°' + String(pieceCounter).padStart(5, '0');
  if (lignes.length === 0) { addLigne(); addLigne(); }
  renderLignes(); updateQueueBar();
}

function addLigne(compte = '', libelle = '', debit = '', credit = '') {
  lignes.push({ compte, libelle, debit, credit }); renderLignes();
}
function removeLigne(i) { lignes.splice(i, 1); renderLignes(); }

// ══════════════════════════════════════════
// AUTO SAVE
// ══════════════════════════════════════════
async function autoSaveAllEcritures() {
  if (ecrQueue.length === 0) { toast("Aucune écriture en file d'attente", 'error'); return; }
  const total = ecrQueue.length;
  const bar = document.getElementById('autoSaveBar');
  const msg = document.getElementById('autoSaveMsg');
  const prog = document.getElementById('autoSaveProgress');
  bar.classList.add('show');
  const date = document.getElementById('ecr-date').value || new Date().toISOString().split('T')[0];
  const groupId = 'grp_' + Date.now();
  const groupLib = ecrQueue[0]?.libelle || 'Opération ' + new Date().toLocaleDateString('fr-FR');
  let saved = 0;
  const errors = [];

  for (let i = 0; i < ecrQueue.length; i++) {
    const ecr = ecrQueue[i];
    msg.innerHTML = `<strong>Enregistrement ${i + 1}/${total}</strong> — [${ecr.journal}] ${ecr.libelle || 'Écriture ' + (i + 1)}`;
    prog.style.width = ((i / total) * 100) + '%';
    const valid = (ecr.lignes || []).filter(l => l.compte && (l.debit || l.credit));
    if (valid.length < 2) { errors.push(`Écriture ${i + 1} : moins de 2 lignes valides`); continue; }
    let d = 0, c = 0;
    valid.forEach(l => { d += Math.round(parseFloat(l.debit) || 0); c += Math.round(parseFloat(l.credit) || 0); });
    if (Math.abs(d - c) > 2) { errors.push(`Écriture ${i + 1} [${ecr.journal}] : non équilibrée (Δ ${Math.abs(d - c)} FCFA)`); continue; }
    const piece = 'N°' + String(pieceCounter).padStart(5, '0');
    const lignesSorted = sortLignesDebitAvantCredit(valid);
    const ecriture = {
      id: Date.now() + i, date, journal: ecr.journal || 'OD', piece,
      libelle: ecr.libelle || 'Écriture IA',
      groupId, groupLibelle: groupLib, groupSize: total, groupIdx: i,
      createdAt: new Date().toISOString(),
      lignes: lignesSorted.map(l => ({
        compte: String(l.compte),
        libelle: l.libelle || PC[String(l.compte)] || '',
        debit: Math.round(parseFloat(l.debit) || 0),
        credit: Math.round(parseFloat(l.credit) || 0)
      }))
    };
    const docId = await saveEcritureToFirestore(ecriture);
    if (docId) { ecritures.push(ecriture); pieceCounter++; saved++; }
    await new Promise(r => setTimeout(r, 150));
  }

  prog.style.width = '100%';
  await new Promise(r => setTimeout(r, 400));
  bar.classList.remove('show');
  ecrQueue = []; ecrQueueIdx = 0; lignes = [];
  updateQueueBar(); hideMultiEcrBanner(); hideSaisieNotif(); dismissFillBanner();
  updateStats();
  if (errors.length > 0) {
    toast(`⚠️ ${saved}/${total} écritures enregistrées — ${errors.length} erreur(s)`, 'error');
  } else {
    toast(`✅ ${saved} écriture${saved > 1 ? 's' : ''} enregistrée${saved > 1 ? 's' : ''} !`, 'success');
  }
  setTimeout(() => { navigate('journal'); renderJournal(); }, 500);
  initSaisie();
}

async function autoSaveAllFromNotif() { hideSaisieNotif(); await autoSaveAllEcritures(); }

function setEcritureQueue(ecritures_ai) {
  ecrQueue = ecritures_ai; ecrQueueIdx = 0;
  if (ecrQueue.length > 0) { loadEcritureFromQueue(0); updateQueueBar(); }
}

function loadEcritureFromQueue(idx) {
  if (idx >= ecrQueue.length) return;
  const ecr = ecrQueue[idx];
  const lignesSorted = sortLignesDebitAvantCredit(ecr.lignes || []);
  lignes = lignesSorted.map(l => ({
    compte: String(l.compte || ''),
    libelle: l.libelle || PC[String(l.compte)] || '',
    debit: Math.round(parseFloat(l.debit) || 0),
    credit: Math.round(parseFloat(l.credit) || 0)
  }));
  const jSelect = document.getElementById('ecr-journal');
  if (jSelect && ecr.journal) jSelect.value = ecr.journal;
  const libInput = document.getElementById('ecr-libelle');
  if (libInput && ecr.libelle) libInput.value = ecr.libelle;
  const dateInput = document.getElementById('ecr-date');
  if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];
  renderLignes();
  const banner = document.getElementById('aiFillBanner');
  const desc = document.getElementById('aiFillDesc');
  const num = document.getElementById('aiFillNum');
  if (banner && desc) {
    desc.textContent = ecr.libelle || 'Écriture préparée par COMEO AI';
    if (num) num.textContent = ecrQueue.length > 1 ? `(${idx + 1}/${ecrQueue.length})` : '';
    banner.classList.add('show');
  }
}

function updateQueueBar() {
  const bar = document.getElementById('saisieQueueBar');
  if (!bar) return;
  const counter = document.getElementById('sqbCounter');
  const remaining = ecrQueue.length - ecrQueueIdx;
  if (remaining > 0) {
    bar.classList.add('show');
    if (counter) counter.textContent = remaining + ' écriture' + (remaining > 1 ? 's' : '');
    const btnAll = document.getElementById('btnValidateAll');
    if (btnAll) btnAll.style.display = remaining > 1 ? 'inline-flex' : 'none';
  } else { bar.classList.remove('show'); }
}

function skipToNextEcriture() {
  ecrQueueIdx++;
  if (ecrQueueIdx < ecrQueue.length) {
    loadEcritureFromQueue(ecrQueueIdx); updateQueueBar();
    toast('Écriture ' + (ecrQueueIdx + 1) + '/' + ecrQueue.length + ' chargée', 'info');
  } else {
    ecrQueue = []; ecrQueueIdx = 0; lignes = []; addLigne(); addLigne(); renderLignes();
    updateQueueBar(); dismissFillBanner();
  }
}

function dismissFillBanner() { const b = document.getElementById('aiFillBanner'); if (b) b.classList.remove('show'); }

function showMultiEcrBanner(ecritures_ai) {
  const banner = document.getElementById('multiEcrBanner');
  const list = document.getElementById('mebList');
  const title = document.getElementById('mebTitle');
  if (!banner) return;
  title.textContent = `COMEO AI a préparé ${ecritures_ai.length} écriture${ecritures_ai.length > 1 ? 's' : ''} liées`;
  list.innerHTML = ecritures_ai.map((e, i) =>
    `<li><span class="meb-n">${i + 1}</span><span class="meb-jnl">${e.journal || 'OD'}</span><span>${e.libelle || 'Écriture ' + (i + 1)}</span></li>`
  ).join('');
  banner.classList.add('show');
  setTimeout(() => banner.classList.remove('show'), 60000);
}
function hideMultiEcrBanner() { const b = document.getElementById('multiEcrBanner'); if (b) b.classList.remove('show'); }

function showSaisieNotif(libelle, count) {
  const notif = document.getElementById('saisieNotif');
  const body = document.getElementById('saisieNotifBody');
  if (!notif) return;
  body.textContent = count > 1
    ? `${count} écritures liées préparées. Cliquez "Tout enregistrer" pour les grouper.`
    : `"${libelle || 'Écriture'}" — Vérifiez et enregistrez.`;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 15000);
}
function hideSaisieNotif() { const n = document.getElementById('saisieNotif'); if (n) n.classList.remove('show'); }

function goToSaisie() {
  hideSaisieNotif(); navigate('saisie');
  setTimeout(() => {
    const card = document.querySelector('#view-saisie .card:last-of-type');
    if (card) card.scrollIntoView({ behavior: 'smooth' });
  }, 200);
}

// ══════════════════════════════════════════
// RENDER LIGNES
// ══════════════════════════════════════════
function renderLignes() {
  const tbody = document.getElementById('lignesBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const cardContainer = document.getElementById('lignesCardContainer');
  if (cardContainer) cardContainer.innerHTML = '';

  lignes.forEach((l, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="asw">
        <input type="text" value="${l.compte}" placeholder="Compte…" style="width:100%;font-family:var(--font-mono)"
          oninput="lignes[${i}].compte=this.value;updateAccountSuggest(${i},this,'table')"
          onblur="hideDropdown('t-${i}')">
        <div class="adrop" id="drop-t-${i}"></div>
      </div></td>
      <td><input type="text" value="${l.libelle || ''}" placeholder="Libellé…" style="width:100%" oninput="lignes[${i}].libelle=this.value"></td>
      <td><input type="text" value="${l.debit || ''}" placeholder="0" style="text-align:right;width:100%;font-family:var(--font-mono)"
        oninput="lignes[${i}].debit=parseFloat(this.value.replace(/[^0-9.]/g,''))||0;updateBalance()"></td>
      <td><input type="text" value="${l.credit || ''}" placeholder="0" style="text-align:right;width:100%;font-family:var(--font-mono)"
        oninput="lignes[${i}].credit=parseFloat(this.value.replace(/[^0-9.]/g,''))||0;updateBalance()"></td>
      <td><button class="del-line" onclick="removeLigne(${i})">✕</button></td>`;
    tbody.appendChild(tr);

    if (cardContainer) {
      const card = document.createElement('div');
      card.className = 'ligne-card';
      card.innerHTML = `
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
            <input class="ligne-card-input" type="text" value="${l.libelle || ''}" placeholder="Libellé…" oninput="lignes[${i}].libelle=this.value">
          </div>
        </div>
        <div class="ligne-card-row">
          <div class="ligne-card-field">
            <div class="ligne-card-label" style="color:var(--blue)">Débit (FCFA)</div>
            <input class="ligne-card-input" type="number" value="${l.debit || ''}" placeholder="0" style="font-family:var(--font-mono)"
              oninput="lignes[${i}].debit=parseFloat(this.value)||0;updateBalance()">
          </div>
          <div class="ligne-card-field">
            <div class="ligne-card-label" style="color:var(--green)">Crédit (FCFA)</div>
            <input class="ligne-card-input" type="number" value="${l.credit || ''}" placeholder="0" style="font-family:var(--font-mono)"
              oninput="lignes[${i}].credit=parseFloat(this.value)||0;updateBalance()">
          </div>
        </div>
        <div class="ligne-card-actions">
          <button class="del-line" style="opacity:.6" onclick="removeLigne(${i})">✕ Supprimer</button>
        </div>`;
      cardContainer.appendChild(card);
    }
  });
  updateBalance();
}

function updateAccountSuggest(idx, input, mode) {
  const q = input.value.toLowerCase().trim();
  const dropId = mode === 'card' ? 'c-' + idx : 't-' + idx;
  const drop = document.getElementById('drop-' + dropId);
  if (!drop) return;
  if (!q || q.length < 2) { drop.classList.remove('open'); return; }
  const matches = Object.entries(PC)
    .filter(([code, lib]) => code.startsWith(q) || lib.toLowerCase().includes(q))
    .slice(0, 12);
  if (!matches.length) { drop.classList.remove('open'); return; }
  drop.innerHTML = matches.map(([code, lib]) =>
    `<div class="aoption" onmousedown="selectAccount(${idx},'${code}','${lib.replace(/'/g, "\\'")}')">
      <span class="code">${code}</span><span class="name">${lib.substring(0, 46)}</span>
    </div>`).join('');
  drop.classList.add('open');
}

function selectAccount(idx, code, lib) {
  lignes[idx].compte = code;
  if (!lignes[idx].libelle) lignes[idx].libelle = lib.substring(0, 54);
  renderLignes();
}
function hideDropdown(id) {
  setTimeout(() => { const d = document.getElementById('drop-' + id); if (d) d.classList.remove('open'); }, 200);
}

function updateBalance() {
  let d = 0, c = 0;
  lignes.forEach(l => { d += parseFloat(l.debit) || 0; c += parseFloat(l.credit) || 0; });
  const s = d - c;
  const tdd = document.getElementById('totalDebitDisplay');
  const tcd = document.getElementById('totalCreditDisplay');
  const el = document.getElementById('soldeDisplay');
  if (tdd) tdd.textContent = fn(d);
  if (tcd) tcd.textContent = fn(c);
  if (el) { el.textContent = fn(Math.abs(s)); el.className = 'val ' + (Math.abs(s) < 0.01 ? 'bok' : 'bbad'); }
}

// ══════════════════════════════════════════
// VALIDATION MANUELLE
// ══════════════════════════════════════════
async function saveEcriture() {
  const date = document.getElementById('ecr-date').value;
  const journal = document.getElementById('ecr-journal').value;
  const piece = document.getElementById('ecr-piece').value || 'N°' + String(pieceCounter).padStart(5, '0');
  const libelle = document.getElementById('ecr-libelle').value;
  if (!date) { toast('Veuillez saisir une date', 'error'); return; }
  const valid = lignes.filter(l => l.compte && (l.debit || l.credit));
  if (valid.length < 2) { toast('Au moins 2 lignes requises', 'error'); return; }
  let d = 0, c = 0;
  valid.forEach(l => { d += parseFloat(l.debit) || 0; c += parseFloat(l.credit) || 0; });
  if (Math.abs(d - c) > 0.01) {
    toast(`Écriture non équilibrée — Débit: ${fn(d)} / Crédit: ${fn(c)} — Différence: ${fn(Math.abs(d - c))} FCFA`, 'error');
    return;
  }
  let groupInfo = {};
  if (ecrQueue.length > 0 && currentGroupId) {
    groupInfo = { groupId: currentGroupId, groupLibelle: ecrQueue[0]?.libelle || libelle, groupSize: ecrQueue.length, groupIdx: ecrQueueIdx };
  }
  const lignesSorted = sortLignesDebitAvantCredit(valid);
  const ecriture = {
    id: Date.now(), date, journal, piece, libelle, ...groupInfo,
    createdAt: new Date().toISOString(),
    lignes: lignesSorted.map(l => ({
      compte: String(l.compte),
      libelle: l.libelle || PC[String(l.compte)] || '',
      debit: Math.round(parseFloat(l.debit) || 0),
      credit: Math.round(parseFloat(l.credit) || 0)
    }))
  };
  const docId = await saveEcritureToFirestore(ecriture);
  if (!docId) return;
  ecritures.push(ecriture); pieceCounter++; updateStats(); dismissFillBanner();
  toast(`✓ Écriture [${JOURNAL_NAMES[journal] || journal}] enregistrée — Pièce ${piece}`, 'success');
  ecrQueueIdx++;
  if (ecrQueueIdx < ecrQueue.length) {
    loadEcritureFromQueue(ecrQueueIdx); updateQueueBar();
    toast(`→ Écriture ${ecrQueueIdx + 1}/${ecrQueue.length} prête à valider`, 'info');
  } else {
    ecrQueue = []; ecrQueueIdx = 0; currentGroupId = null; lignes = []; updateQueueBar();
    document.getElementById('ecr-libelle').value = '';
    document.getElementById('ecr-piece').value = '';
    hideSaisieNotif(); initSaisie();
  }
}

// ══════════════════════════════════════════
// FILTRAGE COMMUN
// ══════════════════════════════════════════
function getEcrituresFiltrees(opts = {}) {
  const { dateDebut, dateFin, journal, compte } = opts;
  return ecritures.filter(e => {
    if (dateDebut && e.date < dateDebut) return false;
    if (dateFin && e.date > dateFin) return false;
    if (journal && e.journal !== journal) return false;
    if (compte) return e.lignes.some(l => l.compte && l.compte.startsWith(compte));
    return true;
  });
}

// ══════════════════════════════════════════
// JOURNAL
// ══════════════════════════════════════════
function resetJournalFiltre() {
  document.getElementById('jnl-date-debut').value = '';
  document.getElementById('jnl-date-fin').value = '';
  document.getElementById('journalFilter').value = '';
  document.getElementById('journalSearch').value = '';
  const a = document.getElementById('journal-analyse');
  if (a) a.style.display = 'none';
  renderJournal();
}

function formatDateFR(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const mois = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return `${parseInt(d)} ${mois[parseInt(m)]} ${y}`;
}

function renderJournal() {
  const search = (document.getElementById('journalSearch')?.value || '').toLowerCase();
  const filter = document.getElementById('journalFilter')?.value || '';
  const dateDebut = document.getElementById('jnl-date-debut')?.value || '';
  const dateFin = document.getElementById('jnl-date-fin')?.value || '';
  const content = document.getElementById('journalContent');
  const footer = document.getElementById('journal-totaux-footer');
  if (!content) return;

  const ecFiltrees = getEcrituresFiltrees({ dateDebut, dateFin, journal: filter });
  const ecFiltered = ecFiltrees.filter(e => {
    if (!search) return true;
    if ((e.libelle || '').toLowerCase().includes(search)) return true;
    if ((e.groupLibelle || '').toLowerCase().includes(search)) return true;
    if ((e.piece || '').toLowerCase().includes(search)) return true;
    return e.lignes.some(l =>
      (l.compte || '').includes(search) ||
      (l.libelle || '').toLowerCase().includes(search) ||
      (PC[l.compte] || '').toLowerCase().includes(search)
    );
  });

  if (!ecFiltered.length) {
    content.innerHTML = `<div class="empty-state"><div class="icon">≡</div><p>Aucune écriture pour cette sélection</p></div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  const groupMap = {};
  const soloList = [];
  ecFiltered.forEach(e => {
    if (e.groupId) {
      if (!groupMap[e.groupId]) groupMap[e.groupId] = [];
      groupMap[e.groupId].push(e);
    } else { soloList.push(e); }
  });

  const groups = [];
  Object.values(groupMap).forEach(ecrs => {
    const sorted = [...ecrs].sort((a, b) => (a.groupIdx || 0) - (b.groupIdx || 0));
    groups.push({ type: 'groupe', date: sorted[0].date, ecritures: sorted, libelle: sorted[0].groupLibelle || sorted[0].libelle || 'Opération', isGroupe: true });
  });
  soloList.forEach(e => {
    groups.push({ type: 'solo', date: e.date, ecritures: [e], libelle: e.libelle || 'Écriture', isGroupe: false });
  });
  groups.sort((a, b) => a.date.localeCompare(b.date) || (a.ecritures[0].createdAt || '').localeCompare(b.ecritures[0].createdAt || ''));

  const byDate = {};
  groups.forEach(g => { if (!byDate[g.date]) byDate[g.date] = []; byDate[g.date].push(g); });

  let totalD = 0, totalC = 0, totalLignes = 0, totalEcritures = 0;
  let html = '';

  Object.keys(byDate).sort().forEach(date => {
    html += `<div class="jnl-date-sep">
      <div class="jnl-date-sep-line"></div>
      <div class="jnl-date-sep-label">📅 ${formatDateFR(date)}</div>
      <div class="jnl-date-sep-line"></div>
    </div>`;

    byDate[date].forEach(group => {
      let groupD = 0, groupC = 0;
      group.ecritures.forEach(e => {
        e.lignes.forEach(l => { groupD += l.debit || 0; groupC += l.credit || 0; });
        totalLignes += e.lignes.length; totalEcritures++;
      });
      totalD += groupD; totalC += groupC;
      const mainJournal = group.ecritures[0]?.journal || 'OD';
      const icon = JOURNAL_ICONS[mainJournal] || '📋';
      const docIds = group.ecritures.map(e => `'${e._docId}'`).join(',');
      const ecrIds = group.ecritures.map(e => e.id).join(',');

      if (group.isGroupe) {
        html += `<div class="jnl-groupe">
          <div class="jnl-groupe-header">
            <div class="jnl-groupe-icon">${icon}</div>
            <div class="jnl-groupe-info">
              <div class="jnl-groupe-libelle" title="${(group.libelle || '').replace(/"/g, '&quot;')}">${group.libelle}</div>
              <div class="jnl-groupe-meta">${date} · ${group.ecritures.length} écritures liées · ${group.ecritures.map(e => e.piece || '—').join(' · ')}</div>
            </div>
            <div class="jnl-groupe-total">
              <div class="jnl-groupe-total-label">Montant total</div>
              <div class="jnl-groupe-total-val">${fn(groupD)} FCFA</div>
            </div>
            <span class="jnl-groupe-badge-count">${group.ecritures.length} écriture${group.ecritures.length > 1 ? 's' : ''}</span>
            <button class="jnl-groupe-del" onclick="deleteGroupe([${docIds}],[${ecrIds}])" title="Supprimer tout le groupe">✕ Tout supprimer</button>
          </div>
          <div class="jnl-groupe-body">
            ${group.ecritures.map((e, eIdx) => renderEcritureInGroupe(e, eIdx, group.ecritures.length)).join('')}
          </div>
        </div>`;
      } else {
        const e = group.ecritures[0];
        let eD = 0, eC = 0;
        e.lignes.forEach(l => { eD += l.debit || 0; eC += l.credit || 0; });
        const equil = Math.abs(eD - eC) < 1;
        const jnlCls = e.journal || 'OD';
        html += `<div class="jnl-groupe">
          <div class="jnl-groupe-header">
            <div class="jnl-groupe-icon">${JOURNAL_ICONS[jnlCls] || '📋'}</div>
            <div class="jnl-groupe-info">
              <div class="jnl-groupe-libelle">${e.libelle || '<em style="opacity:.4">Sans libellé</em>'}</div>
              <div class="jnl-groupe-meta">${date} · ${e.piece || '—'} · ${JOURNAL_NAMES[jnlCls] || jnlCls}</div>
            </div>
            <div class="jnl-groupe-total">
              <div class="jnl-groupe-total-label">Débit / Crédit</div>
              <div class="jnl-groupe-total-val" style="font-size:11px">
                <span style="color:#60a5fa">${fn(eD)}</span> / <span style="color:#4ade80">${fn(eC)}</span>
              </div>
            </div>
            <span class="jnl-step-equil ${equil ? 'ok' : 'nok'}">${equil ? '✓ EQ' : '✗ NEQ'}</span>
            <button class="jnl-groupe-del" onclick="deleteEcriture('${e._docId}',${e.id})" title="Supprimer">✕</button>
          </div>
          <div class="jnl-groupe-body">${renderEcritureInGroupe(e, 0, 1)}</div>
        </div>`;
      }
    });
  });

  content.innerHTML = html;
  if (footer) {
    footer.style.display = 'block';
    document.getElementById('jnl-nb-groupes').textContent = groups.length;
    document.getElementById('jnl-nb-ecr').textContent = totalEcritures;
    document.getElementById('jnl-nb-lignes').textContent = totalLignes;
    document.getElementById('jnl-total-debit').textContent = fn(totalD) + ' FCFA';
    document.getElementById('jnl-total-credit').textContent = fn(totalC) + ' FCFA';
    const eqEl = document.getElementById('jnl-equil-label');
    if (eqEl) {
      const balanced = Math.abs(totalD - totalC) < 1;
      eqEl.textContent = balanced ? '✓ Équilibré' : '✗ Déséquilibré';
      eqEl.className = 'jnl-footer-val ' + (balanced ? 'eq' : 'neq');
    }
  }
}

function renderEcritureInGroupe(e, eIdx, totalInGroupe) {
  let eD = 0, eC = 0;
  e.lignes.forEach(l => { eD += l.debit || 0; eC += l.credit || 0; });
  const equil = Math.abs(eD - eC) < 1;
  const jnlCls = e.journal || 'OD';
  const stepLabel = getStepLabel(e);
  const lignesAffichage = sortLignesDebitAvantCredit(e.lignes);
  return `<div class="jnl-ecriture type-${jnlCls}">
    <div class="jnl-ecriture-subheader">
      ${totalInGroupe > 1 ? `<span class="jnl-step-badge">${eIdx + 1}</span>` : ''}
      <span class="jnl-step-jnl-badge ${jnlCls}">${jnlCls}</span>
      <span class="jnl-step-label">${stepLabel}</span>
      <span class="jnl-step-piece">${e.piece || '—'} · ${JOURNAL_NAMES[jnlCls] || jnlCls}</span>
      <span class="jnl-step-totaux" style="margin-left:auto">
        <span style="color:#60a5fa">${fn(eD)}</span> / <span style="color:#4ade80">${fn(eC)}</span>
      </span>
      <span class="jnl-step-equil ${equil ? 'ok' : 'nok'}">${equil ? '✓' : '✗'}</span>
      <button class="jnl-step-del" onclick="deleteEcriture('${e._docId}',${e.id})" title="Supprimer cette écriture">✕</button>
    </div>
    <div class="jnl-ecriture-body">
      <table class="jnl-lignes-table">
        <thead><tr>
          <th style="width:200px">Compte</th>
          <th>Libellé</th>
          <th class="right" style="width:140px">Débit (FCFA)</th>
          <th class="right" style="width:140px">Crédit (FCFA)</th>
        </tr></thead>
        <tbody>
          ${lignesAffichage.map(l => `
            <tr>
              <td><div class="jnl-compte-badge">
                <span class="jnl-compte-code">${l.compte}</span>
                <span class="jnl-compte-name" title="${PC[l.compte] || ''}">${(PC[l.compte] || '').substring(0, 22)}</span>
              </div></td>
              <td><span class="jnl-libelle-ligne">${l.libelle || e.libelle || '—'}</span></td>
              <td class="jnl-debit-cell">${l.debit ? fn(l.debit) : '<span style="color:var(--line2)">—</span>'}</td>
              <td class="jnl-credit-cell">${l.credit ? fn(l.credit) : '<span style="color:var(--line2)">—</span>'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function deleteGroupe(docIds, ids) {
  if (!confirm(`Supprimer ce groupe de ${docIds.length} écriture${docIds.length > 1 ? 's' : ''} ?`)) return;
  for (const docId of docIds) await deleteEcritureFromFirestore(docId);
  ids.forEach(id => { ecritures = ecritures.filter(e => e.id !== id); });
  updateStats(); renderJournal();
  toast(`${docIds.length} écriture${docIds.length > 1 ? 's' : ''} supprimée${docIds.length > 1 ? 's' : ''}`, 'info');
}

async function deleteEcriture(docId, id) {
  if (!confirm('Supprimer cette écriture ?')) return;
  await deleteEcritureFromFirestore(docId);
  ecritures = ecritures.filter(e => e.id !== id);
  updateStats(); renderJournal(); toast('Écriture supprimée', 'info');
}

// ══════════════════════════════════════════
// GRAND LIVRE
// ══════════════════════════════════════════
function getMap(opts = {}) {
  const ecFiltrees = opts.filtrer ? getEcrituresFiltrees(opts) : ecritures;
  const map = {};
  ecFiltrees.forEach(e => e.lignes.forEach(l => {
    if (!l.compte) return;
    if (!map[l.compte]) map[l.compte] = { debit: 0, credit: 0, mvts: [] };
    map[l.compte].debit += l.debit || 0;
    map[l.compte].credit += l.credit || 0;
    map[l.compte].mvts.push({
      date: e.date, piece: e.piece || '', journal: e.journal,
      libelle: l.libelle || e.libelle || '',
      debit: l.debit || 0, credit: l.credit || 0
    });
  }));
  return map;
}

function resetGLFiltre() {
  document.getElementById('gl-date-debut').value = '';
  document.getElementById('gl-date-fin').value = '';
  document.getElementById('glSearch').value = '';
  renderGrandLivre();
}

function renderGrandLivre() {
  const search = document.getElementById('glSearch')?.value?.toLowerCase() || '';
  const dateDebut = document.getElementById('gl-date-debut')?.value || '';
  const dateFin = document.getElementById('gl-date-fin')?.value || '';
  const opts = (dateDebut || dateFin) ? { filtrer: true, dateDebut, dateFin } : {};
  const map = getMap(opts);
  const content = document.getElementById('grandLivreContent');
  if (!content) return;
  const comptes = Object.keys(map).sort();
  if (!comptes.length) { content.innerHTML = '<div class="empty-state"><div class="icon">⊞</div><p>Aucun mouvement</p></div>'; return; }
  const filtered = comptes.filter(c => !search || c.includes(search) || (PC[c] || '').toLowerCase().includes(search));
  content.innerHTML = filtered.map(code => {
    const acc = map[code], s = acc.debit - acc.credit, lib = PC[code] || 'Compte ' + code, isD = s >= 0;
    return `<div class="gl-account">
      <div class="gl-account-header" onclick="toggleGL('gl-${code}')">
        <span class="gl-code">${code}</span>
        <span class="gl-name">${lib.substring(0, 46)}</span>
        <span style="color:rgba(255,255,255,.3);font-size:10px;font-family:var(--font-mono);margin-right:6px">${acc.mvts.length} mvt${acc.mvts.length > 1 ? 's' : ''}</span>
        <span class="gl-balance ${isD ? 'debit' : 'credit'}">${isD ? 'Sd' : 'Sc'} ${fn(Math.abs(s))} FCFA</span>
      </div>
      <div id="gl-${code}" style="display:none">
        <div style="overflow-x:auto">
        <table class="dt">
          <thead><tr><th>Date</th><th>Jnl</th><th>Pièce</th><th>Libellé</th>
            <th style="text-align:right">Débit</th><th style="text-align:right">Crédit</th>
            <th style="text-align:right">Solde progressif</th></tr></thead>
          <tbody>${acc.mvts.map((m, i) => {
            const rD = acc.mvts.slice(0, i + 1).reduce((s, x) => s + x.debit, 0);
            const rC = acc.mvts.slice(0, i + 1).reduce((s, x) => s + x.credit, 0);
            const rs = rD - rC;
            return `<tr>
              <td style="font-family:var(--font-mono);font-size:10px">${m.date}</td>
              <td><span class="ct">${m.journal}</span></td>
              <td style="font-family:var(--font-mono);font-size:9.5px;color:var(--muted)">${m.piece}</td>
              <td>${m.libelle}</td>
              <td class="debit">${m.debit ? fn(m.debit) : ''}</td>
              <td class="credit">${m.credit ? fn(m.credit) : ''}</td>
              <td style="text-align:right;font-family:var(--font-mono);font-size:11px;color:${rs >= 0 ? '#60a5fa' : '#4ade80'}">
                ${rs >= 0 ? 'Sd ' : 'Sc '}${fn(Math.abs(rs))}</td>
            </tr>`;
          }).join('')}
          <tr class="total-row">
            <td colspan="4" style="text-align:right;font-weight:700">TOTAUX</td>
            <td class="debit">${fn(acc.debit)}</td>
            <td class="credit">${fn(acc.credit)}</td>
            <td style="text-align:right;font-family:var(--font-mono);color:${isD ? '#60a5fa' : '#4ade80'}">
              ${isD ? 'Sd ' : 'Sc '}${fn(Math.abs(s))}</td>
          </tr></tbody>
        </table></div>
      </div>
    </div>`;
  }).join('');
}
function toggleGL(id) { const el = document.getElementById(id); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; }

// ══════════════════════════════════════════
// BALANCE
// ══════════════════════════════════════════
function resetBalanceFiltre() {
  document.getElementById('bal-date-debut').value = '';
  document.getElementById('bal-date-fin').value = '';
  document.getElementById('bal-journal').value = '';
  document.getElementById('bal-classe').value = '';
  const a = document.getElementById('balance-analyse');
  if (a) a.style.display = 'none';
  renderBalance();
}

function renderBalance() {
  const dateDebut = document.getElementById('bal-date-debut')?.value || '';
  const dateFin = document.getElementById('bal-date-fin')?.value || '';
  const journal = document.getElementById('bal-journal')?.value || '';
  const classe = document.getElementById('bal-classe')?.value || '';
  const opts = (dateDebut || dateFin || journal) ? { filtrer: true, dateDebut, dateFin, journal } : {};
  const map = getMap(opts);
  const tbody = document.getElementById('balanceBody');
  if (!tbody) return;
  let comptes = Object.keys(map).sort();
  if (classe) comptes = comptes.filter(c => c.startsWith(classe));
  if (!comptes.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Aucune donnée pour cette sélection</p></div></td></tr>';
    return;
  }
  let tD = 0, tC = 0, tSD = 0, tSC = 0;
  const rows = comptes.map(code => {
    const acc = map[code], s = acc.debit - acc.credit, sd = s > 0 ? s : 0, sc = s < 0 ? -s : 0;
    tD += acc.debit; tC += acc.credit; tSD += sd; tSC += sc;
    return `<tr>
      <td><span class="ct">${code}</span></td>
      <td style="font-size:11px">${(PC[code] || '').substring(0, 42)}</td>
      <td class="debit">${fn(acc.debit)}</td>
      <td class="credit">${fn(acc.credit)}</td>
      <td style="text-align:right;font-family:var(--font-mono);color:#2563eb">${sd ? fn(sd) : ''}</td>
      <td style="text-align:right;font-family:var(--font-mono);color:#16a34a">${sc ? fn(sc) : ''}</td>
    </tr>`;
  });
  rows.push(`<tr class="total-row"><td colspan="2">TOTAUX GÉNÉRAUX</td>
    <td class="debit">${fn(tD)}</td><td class="credit">${fn(tC)}</td>
    <td style="text-align:right;font-family:var(--font-mono)">${fn(tSD)}</td>
    <td style="text-align:right;font-family:var(--font-mono)">${fn(tSC)}</td>
  </tr>`);
  tbody.innerHTML = rows.join('');
}

// ══════════════════════════════════════════
// BILAN
// ══════════════════════════════════════════
function renderBilan() {
  const dateArrete = document.getElementById('bilan-date-arrete')?.value;
  const opts = dateArrete ? { filtrer: true, dateFin: dateArrete } : {};
  const map = getMap(opts);
  const content = document.getElementById('bilanContent');
  if (!content) return;
  if (!Object.keys(map).length) {
    content.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="icon">⊠</div><p>Saisissez des écritures pour générer le bilan</p></div>';
    return;
  }
  const actif = {
    immob: { title: 'ACTIF IMMOBILISÉ', comptes: [] },
    stocks: { title: 'STOCKS ET EN-COURS', comptes: [] },
    creances: { title: 'CRÉANCES ET EMPLOIS ASSIMILÉS', comptes: [] },
    treso: { title: 'TRÉSORERIE-ACTIF', comptes: [] }
  };
  const passif = {
    cap: { title: 'CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES', comptes: [] },
    df: { title: 'DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES', comptes: [] },
    dct: { title: 'PASSIF CIRCULANT', comptes: [] },
    tp: { title: 'TRÉSORERIE-PASSIF', comptes: [] }
  };
  Object.entries(map).forEach(([code, acc]) => {
    const s = acc.debit - acc.credit;
    const cl = code[0];
    const e = { code, lib: (PC[code] || code).substring(0, 40), solde: Math.abs(s) };
    if (cl === '2') { if (s > 0) actif.immob.comptes.push(e); }
    else if (cl === '3') { if (s > 0) actif.stocks.comptes.push(e); }
    else if (cl === '4') { if (s > 0) actif.creances.comptes.push(e); else if (s < 0) passif.dct.comptes.push({ ...e, solde: Math.abs(s) }); }
    else if (cl === '5') { if (s > 0) actif.treso.comptes.push(e); else passif.tp.comptes.push({ ...e, solde: Math.abs(s) }); }
    else if (cl === '1') { const n = parseInt(code); (n <= 160 ? passif.cap : passif.df).comptes.push({ code, lib: (PC[code] || code).substring(0, 40), solde: Math.abs(s) }); }
  });
  const rc = sections => sections.map(s => {
    if (!s.comptes.length) return '';
    const total = s.comptes.reduce((sum, c) => sum + c.solde, 0);
    return `<div class="bilan-section">
      <div class="bilan-section-title">${s.title}</div>
      ${s.comptes.map(c => `<div class="bilan-line"><span class="acc-code">${c.code}</span><span class="acc-name">${c.lib}</span><span class="acc-amount">${fn(c.solde)}</span></div>`).join('')}
      <div class="bilan-line" style="font-weight:700;border-bottom:none;margin-top:3px">
        <span class="acc-code"></span><span class="acc-name" style="color:var(--ink)">Sous-total</span><span class="acc-amount">${fn(total)}</span>
      </div>
    </div>`;
  }).join('');
  const tA = [...actif.immob.comptes, ...actif.stocks.comptes, ...actif.creances.comptes, ...actif.treso.comptes].reduce((s, c) => s + c.solde, 0);
  const tP = [...passif.cap.comptes, ...passif.df.comptes, ...passif.dct.comptes, ...passif.tp.comptes].reduce((s, c) => s + c.solde, 0);
  const label = dateArrete ? `Arrêté au ${dateArrete}` : `Exercice ${document.getElementById('exerciceYear').value}`;
  content.innerHTML = `
    <div class="bilan-col"><div class="bilan-col-header actif">ACTIF — ${label}</div>${rc(Object.values(actif))}<div class="bilan-total"><span>TOTAL ACTIF</span><span>${fn(tA)} FCFA</span></div></div>
    <div class="bilan-col"><div class="bilan-col-header passif">PASSIF — ${label}</div>${rc(Object.values(passif))}<div class="bilan-total"><span>TOTAL PASSIF</span><span>${fn(tP)} FCFA</span></div></div>`;
}

// ══════════════════════════════════════════
// RÉSULTAT
// ══════════════════════════════════════════
function renderResultat() {
  const map = getMap();
  const content = document.getElementById('resultatContent');
  if (!content) return;
  if (!Object.keys(map).length) { content.innerHTML = '<div class="empty-state"><div class="icon">↗</div><p>Aucune donnée</p></div>'; return; }
  const gt = pfx => Object.entries(map).filter(([c]) => pfx.some(p => c.startsWith(p))).reduce((s, [, a]) => s + (a.debit - a.credit), 0);
  const ventes = Math.abs(gt(['701', '702', '703', '704', '705']));
  const prodsAcc = Math.abs(gt(['707']));
  const autrProd = Math.abs(gt(['75', '718', '711']));
  const transports = gt(['612', '614']);
  const servExt = gt(['621', '622', '624', '625', '626', '627', '628', '631', '632', '634', '635', '638']);
  const impTaxes = gt(['641', '645']);
  const autresChg = gt(['651', '654', '658']);
  const personnel = gt(['661', '662', '663', '664']);
  const dap = gt(['681', '691', '697']);
  const revFin = Math.abs(gt(['771', '772', '773', '774', '776', '777']));
  const chgFin = gt(['671', '673', '674', '676']);
  const haoP = Math.abs(gt(['821', '822', '841']));
  const haoC = gt(['811', '812', '831', '834', '839', '851', '852', '854']);
  const imp = gt(['891', '895']);
  const mc = ventes - Math.abs(gt(['601'])) - gt(['6031']);
  const ca = ventes + prodsAcc;
  const va = ca + autrProd - Math.abs(gt(['601', '602', '604', '605', '608'])) - gt(['6031', '6032']) - transports - servExt - impTaxes - autresChg;
  const ebe = va - personnel;
  const re = ebe - dap;
  const rf = revFin - chgFin;
  const rao = re + rf;
  const rhao = haoP - haoC;
  const res = rao + rhao - imp;
  const rr = (lbl, val, cls = '') => `<div class="rrow ${cls}"><span>${lbl}</span><span class="amount ${val >= 0 ? 'pos' : 'neg'}">${fn(Math.abs(val))} FCFA${val < 0 ? ' (−)' : ''}</span></div>`;
  content.innerHTML = `<div class="rlist">
    <div class="rrow header"><span>COMPTE DE RÉSULTAT — SYSCOHADA Révisé 2017</span><span></span></div>
    ${rr('Ventes de marchandises (701)', ventes, 'sub')}
    ${rr('Achats + Var. stocks (601+6031)', -(Math.abs(gt(['601'])) + gt(['6031'])), 'sub')}
    ${rr('→ Marge commerciale (XA)', mc, 'total')}
    ${rr('Produits accessoires (707+75)', prodsAcc + autrProd, 'sub')}
    ${rr('→ CA net et autres produits (XB)', ca, 'total')}
    ${rr('Transports + Services extérieurs', -(transports + servExt), 'sub')}
    ${rr('Impôts et taxes (641+645)', -(impTaxes + autresChg), 'sub')}
    ${rr('→ Valeur ajoutée brute (XC)', va, 'total')}
    ${rr('Charges de personnel (661–664)', -personnel, 'sub')}
    ${rr("→ E.B.E. — Excédent Brut d'Exploitation (XD)", ebe, 'total')}
    ${rr('Dotations amort. et prov. (681+691)', -dap, 'sub')}
    ${rr("→ Résultat d'exploitation (RE — XE)", re, 'total')}
    <div class="divider"></div>
    <div class="rrow header"><span>RÉSULTAT FINANCIER</span><span></span></div>
    ${rr('Revenus financiers (77)', revFin, 'sub')}
    ${rr('Charges financières (67)', -chgFin, 'sub')}
    ${rr('→ Résultat financier (RF — XF)', rf, 'total')}
    ${rr('→ Résultat des Activités Ordinaires (RAO — XG)', rao, 'total')}
    <div class="divider"></div>
    <div class="rrow header"><span>RÉSULTAT H.A.O.</span><span></span></div>
    ${rr('Produits HAO', haoP, 'sub')}
    ${rr('Charges HAO', -haoC, 'sub')}
    ${rr('→ RHAO (XH)', rhao, 'total')}
    <div class="divider"></div>
    ${rr('IS / IBP — Impôt sur les Bénéfices (891) — Taux CI : 25%', -imp, 'sub')}
    <div class="rrow result">
      <span>${res >= 0 ? "✓ RÉSULTAT NET DE L'EXERCICE — BÉNÉFICE" : "✗ RÉSULTAT NET DE L'EXERCICE — PERTE"}</span>
      <span class="amount ${res >= 0 ? 'pos' : 'neg'}">${fn(Math.abs(res))} FCFA</span>
    </div>
  </div>`;
}

// ══════════════════════════════════════════
// TRÉSORERIE
// ══════════════════════════════════════════
function renderTresorerie() {
  const map = getMap();
  const content = document.getElementById('tresorerieContent');
  if (!content) return;
  const tc = Object.entries(map).filter(([c]) => c.startsWith('5'));
  if (!tc.length) { content.innerHTML = '<div class="empty-state"><div class="icon">◎</div><p>Aucun mouvement de trésorerie</p></div>'; return; }
  const total = tc.reduce((s, [, a]) => s + (a.debit - a.credit), 0);
  content.innerHTML = `<div class="rlist">
    <div class="rrow header"><span>COMPTES DE TRÉSORERIE — CLASSE 5 — SYSCOHADA</span><span></span></div>
    <div class="rrow header" style="font-size:10px;opacity:.5"><span>Mobile Money (Orange Money, MTN MoMo, Wave, Moov) → Compte 552</span><span></span></div>
    ${tc.map(([code, acc]) => {
      const s = acc.debit - acc.credit;
      return `<div class="rrow sub"><span><span class="ct">${code}</span><span style="margin-left:6px">${(PC[code] || '').substring(0, 34)}</span></span><span class="amount ${s >= 0 ? 'pos' : 'neg'}">${fn(Math.abs(s))} FCFA${s < 0 ? ' (Créditeur)' : ''}</span></div>`;
    }).join('')}
    <div class="rrow result"><span>Trésorerie nette totale</span><span class="amount ${total >= 0 ? 'pos' : 'neg'}">${fn(Math.abs(total))} FCFA</span></div>
  </div>`;
}

// ══════════════════════════════════════════
// PLAN COMPTABLE
// ══════════════════════════════════════════
function renderPlanComptable() {
  const search = document.getElementById('pcSearch')?.value?.toLowerCase() || '';
  const cls = document.getElementById('pcClass')?.value || '';
  const tbody = document.getElementById('pcBody');
  if (!tbody) return;
  const entries = Object.entries(PC).filter(([code, lib]) => {
    if (cls && !code.startsWith(cls)) return false;
    if (search && !code.includes(search) && !lib.toLowerCase().includes(search)) return false;
    return true;
  }).slice(0, 300);
  if (!entries.length) { tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><p>Aucun compte trouvé</p></div></td></tr>'; return; }
  tbody.innerHTML = entries.map(([code, lib]) => {
    const cl = code[0], isH = lib === lib.toUpperCase() && lib.length > 3, pad = (code.length - 1) * 10;
    return `<tr>
      <td><span class="ct">${code}</span></td>
      <td style="padding-left:${Math.min(pad, 30)}px;font-weight:${isH ? '600' : '400'};color:${isH ? 'var(--ink)' : 'var(--slate)'}">${lib.substring(0, 70)}</td>
      <td style="color:var(--muted);font-size:11px">${CLASS_NAMES[cl] || ''}</td>
      <td><span style="font-size:10px;padding:2px 7px;border-radius:3px;background:var(--surface3);color:var(--muted)">${NATURE_MAP[cl] || ''}</span></td>
    </tr>`;
  }).join('');
}

// ══════════════════════════════════════════
// EXPORT PDF / WORD
// ══════════════════════════════════════════
function openExportModal() { const m = document.getElementById('exportModal'); if (m) m.style.display = 'flex'; selectExport('pdf'); }
function closeExportModal() { const m = document.getElementById('exportModal'); if (m) m.style.display = 'none'; }
function selectExport(fmt) {
  exportFormat = fmt;
  document.getElementById('opt-pdf')?.classList.toggle('selected', fmt === 'pdf');
  document.getElementById('opt-word')?.classList.toggle('selected', fmt === 'word');
}
function doExport() { closeExportModal(); if (exportFormat === 'pdf') exportPDF(); else exportWord(); }

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const yr = document.getElementById('exerciceYear').value;
  const company = currentProfile?.company || 'Entreprise';
  const pageW = 210;
  const now = new Date().toLocaleDateString('fr-FR');
  doc.setFillColor(10, 11, 16); doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(212, 168, 83); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('SYSCOHADA Pro v4 — Révisé 2017', 14, 10);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('COMEO AI — Expert-Comptable Ivoirien | ONECCA-CI', 14, 16);
  doc.setTextColor(255, 255, 255); doc.setFontSize(8);
  doc.text(company, pageW - 14, 10, { align: 'right' });
  doc.text('Exercice ' + yr + ' | Monnaie : FCFA (XOF)', pageW - 14, 16, { align: 'right' });
  doc.setTextColor(10, 11, 16); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('JOURNAL GÉNÉRAL', 14, 34);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 128, 112);
  doc.text('Édité le ' + now, 14, 40);
  doc.setDrawColor(212, 168, 83); doc.setLineWidth(0.5); doc.line(14, 43, pageW - 14, 43);
  const tableData = [];
  let totalD = 0, totalC = 0;
  ecritures.forEach(e => {
    const lignesSorted = sortLignesDebitAvantCredit(e.lignes);
    lignesSorted.forEach(l => {
      tableData.push([e.date, e.journal, e.piece || '', l.compte, (PC[l.compte] || '').substring(0, 28), l.libelle || e.libelle || '', l.debit ? fn(l.debit) : '', l.credit ? fn(l.credit) : '']);
      totalD += l.debit || 0; totalC += l.credit || 0;
    });
  });
  doc.autoTable({
    startY: 48,
    head: [['Date', 'Jnl', 'N° Pièce', 'Compte', 'Libellé compte', 'Libellé opération', 'Débit FCFA', 'Crédit FCFA']],
    body: tableData,
    foot: [['', '', '', '', '', 'TOTAUX', fn(totalD), fn(totalC)]],
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [10, 11, 16], textColor: [212, 168, 83], fontStyle: 'bold', fontSize: 7 },
    footStyles: { fillColor: [30, 34, 54], textColor: [212, 168, 83], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    columnStyles: {
      0: { cellWidth: 18 }, 1: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 18 },
      3: { cellWidth: 16, fontStyle: 'bold' }, 4: { cellWidth: 28 }, 5: { cellWidth: 36 },
      6: { cellWidth: 22, halign: 'right' }, 7: { cellWidth: 22, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });
  doc.save(`SYSCOHADA_v4_${company.replace(/\s+/g, '_')}_${yr}.pdf`);
  toast('✓ PDF exporté avec succès', 'success');
}

function exportWord() {
  const yr = document.getElementById('exerciceYear').value;
  const company = currentProfile?.company || 'Entreprise';
  const now = new Date().toLocaleDateString('fr-FR');
  let jRows = '', totalD = 0, totalC = 0;
  ecritures.forEach(e => {
    const lignesSorted = sortLignesDebitAvantCredit(e.lignes);
    lignesSorted.forEach(l => {
      jRows += `<tr><td>${e.date}</td><td>${e.journal}</td><td>${e.piece || ''}</td><td>${l.compte}</td><td>${(PC[l.compte] || '').substring(0, 28)}</td><td>${l.libelle || e.libelle || ''}</td><td style="text-align:right">${l.debit ? fn(l.debit) : ''}</td><td style="text-align:right">${l.credit ? fn(l.credit) : ''}</td></tr>`;
      totalD += l.debit || 0; totalC += l.credit || 0;
    });
  });
  const th = 'background:#0a0b10;color:#d4a853;padding:6px 10px;text-align:left;font-size:9pt;text-transform:uppercase';
  const td = 'border-bottom:1px solid #e0dbd0;padding:5px 10px';
  const html = `<html><head><meta charset="utf-8"><style>body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt}table{width:100%;border-collapse:collapse;margin-bottom:20pt}th{${th}}td{${td}}tr:nth-child(even) td{background:#faf8f4}</style></head>
  <body>
  <h1 style="font-family:Georgia,serif;font-size:16pt;color:#0a0b10">SYSCOHADA Pro v4 — ${company} — Exercice ${yr}</h1>
  <p>Édité le ${now} | COMEO AI — Expert-Comptable Ivoirien | Monnaie : FCFA (XOF)</p>
  <h2>Journal Général</h2>
  <table><thead><tr><th>Date</th><th>Jnl</th><th>Pièce</th><th>Compte</th><th>Libellé compte</th><th>Libellé</th><th>Débit</th><th>Crédit</th></tr></thead>
  <tbody>${jRows}</tbody>
  <tfoot><tr><td colspan="6" style="font-weight:bold;text-align:right">TOTAUX</td><td style="font-weight:bold;text-align:right">${fn(totalD)}</td><td style="font-weight:bold;text-align:right">${fn(totalC)}</td></tr></tfoot></table>
  </body></html>`;
  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `SYSCOHADA_v4_${company.replace(/\s+/g, '_')}_${yr}.doc`;
  a.click(); URL.revokeObjectURL(url);
  toast('✓ Document Word exporté', 'success');
}

// ══════════════════════════════════════════
// CORRECTEUR AUTOMATIQUE DE COMPTES
// ══════════════════════════════════════════
const MOTS_IMMOBILISATIONS = ['véhicule','camion','voiture','moto','transport','automobile','ordinateur','informatique','bureau','mobilier','matériel','machine','équipement','installation','bâtiment','terrain'];
const COMPTES_IMMOB = { 'véhicule':'2451','camion':'2451','voiture':'2451','moto':'2451','automobile':'2451','transport':'2451','ordinateur':'2442','informatique':'2442','bureau':'2441','mobilier':'2444','matériel':'2441','machine':'2411','équipement':'2411' };

function corrigerComptesErreurs(lignes) {
  return lignes.map(l => {
    const code = String(l.compte || '');
    const lib = (l.libelle || '').toLowerCase();
    let newCode = code;
    if ((code === '607' || code === '6058' || code === '601') && l.debit > 0) {
      const motTrouve = MOTS_IMMOBILISATIONS.find(m => lib.includes(m));
      if (motTrouve && !lib.includes('marchandis')) { newCode = COMPTES_IMMOB[motTrouve] || '2411'; }
    }
    if (['221','222','223','224'].includes(code) && l.credit > 0) newCode = '2845';
    if (['511','512','513','514'].includes(code)) newCode = '521';
    if (code === '4452' && l.debit > 0) {
      const libEcr = lib.toLowerCase();
      if (['véhicule','camion','ordinateur','mobilier','matériel','machine','équipement'].some(m => libEcr.includes(m))) {
        newCode = '4451';
      }
    }
    return { ...l, compte: newCode, libelle: l.libelle || PC[newCode] || l.libelle };
  });
}

// ══════════════════════════════════════════
// COMEO AI — Clés chargées depuis Firestore
// ══════════════════════════════════════════
function handleAiKey(e, ctx) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToAI(ctx); } }

function quickAI(text) {
  const input = document.getElementById('aiInput');
  if (input) input.value = text;
  navigate('dashboard');
  sendToAI('dashboard');
}

function buildAIContext() {
  let tD = 0, tC = 0;
  ecritures.forEach(e => e.lignes.forEach(l => { tD += l.debit || 0; tC += l.credit || 0; }));
  const map = getMap();
  const comptesSoldes = Object.entries(map).slice(0, 12).map(([c, a]) => {
    const s = a.debit - a.credit;
    return `${c}:${s >= 0 ? 'Sd' : 'Sc'}${fn(Math.abs(s))}FCFA`;
  }).join(' | ');
  const dernieres = ecritures.slice(-5).map(e => `${e.date}[${e.journal}]${e.libelle || '—'}`).join('; ');
  const allDates = [...new Set(ecritures.map(e => e.date))].sort().join(', ');
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
  if (isAILoading) return;

  // ── Vérification clés disponibles ──
  if (GROQ_API_KEYS.length === 0) {
    appendMsg(context, 'ai',
      '⚠️ <strong>COMEO AI non configuré.</strong><br>Aucune clé API Groq n\'est enregistrée. ' +
      'Rendez-vous sur <strong>server.html</strong> (interface administrateur) pour ajouter vos clés API Groq.'
    );
    return;
  }

  const inputId = context === 'dashboard' ? 'aiInput' : `aiInput-${context}`;
  const input = document.getElementById(inputId);
  const msg = input?.value?.trim();
  if (!msg) return;
  isAILoading = true; input.value = '';
  const sendBtnId = context === 'dashboard' ? 'aiSendBtn' : null;
  if (sendBtnId) { const btn = document.getElementById(sendBtnId); if (btn) btn.disabled = true; }
  appendMsg(context, 'user', msg);
  const tid = appendTyping(context);
  const ctxData = buildAIContext();
  const systemPrompt = buildSystemPrompt(ctxData);

  conversationHistory.push({ role: 'user', content: msg });
  if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

  try {
    let response, lastError;

    // Rotation clés × rotation modèles
    const totalAttempts = GROQ_API_KEYS.length * GROQ_MODELS.length;
    for (let attempt = 0; attempt < Math.min(totalAttempts, 6); attempt++) {
      const keyToUse   = GROQ_API_KEYS[(groqKeyIdx + attempt) % GROQ_API_KEYS.length];
      const modelToUse = GROQ_MODELS[(groqModelIdx + Math.floor(attempt / GROQ_API_KEYS.length)) % GROQ_MODELS.length];
      try {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keyToUse}` },
          body: JSON.stringify({
            model: modelToUse,
            max_tokens: 6000,
            temperature: 0.02,
            top_p: 0.95,
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory
            ]
          })
        });
        if (response.ok) {
          groqKeyIdx   = (groqKeyIdx + attempt) % GROQ_API_KEYS.length;
          groqModelIdx = (groqModelIdx + Math.floor(attempt / GROQ_API_KEYS.length)) % GROQ_MODELS.length;
          break;
        }
        const errData = await response.json().catch(() => ({}));
        lastError = errData.error?.message || 'Erreur ' + response.status;
        if (lastError.includes('decommissioned') || lastError.includes('deprecated') || response.status === 404) {
          toast(`⚠️ Modèle/clé ${attempt + 1} indisponible → bascule...`, 'info');
          continue;
        }
        break;
      } catch (e) { lastError = e.message; }
    }

    removeTyping(context, tid);
    if (!response || !response.ok) throw new Error(lastError || 'Toutes les clés/modèles sont indisponibles');

    const data = await response.json();
    const fullText = data.choices?.[0]?.message?.content || 'Pas de réponse.';

    conversationHistory.push({ role: 'assistant', content: fullText });

    // Traitement FILTRE
    const filtreMarker = fullText.indexOf('###FILTRE###');
    if (filtreMarker !== -1) {
      const displayText = fullText.substring(0, filtreMarker).trim();
      const jsonStr = fullText.substring(filtreMarker + 12).trim();
      if (displayText) appendMsg(context, 'ai', displayText);
      try {
        const clean = jsonStr.replace(/```json|```/g, '').trim();
        const jsonMatch = clean.match(/(\{[\s\S]*?\})/);
        if (jsonMatch) { const filtre = JSON.parse(jsonMatch[1]); applyFiltreAndNavigate(filtre, context); }
      } catch (pe) { console.warn('Filtre parse error:', pe); }

    // Traitement ÉCRITURE
    } else if (fullText.includes('###ECRITURE###')) {
      const parts = fullText.split('###ECRITURE###');
      const textBeforeFirst = parts[0].trim();
      const ecrituresAI = [];
      for (let i = 1; i < parts.length; i++) {
        const segment = parts[i].trim();
        const jsonMatch = segment.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          try {
            const cleanJson = jsonMatch[1].replace(/```json|```/g, '').trim();
            const ecr = JSON.parse(cleanJson);
            if (ecr.lignes && ecr.lignes.length >= 2) {
              let d = 0, c = 0;
              ecr.lignes.forEach(l => { d += Math.round(parseFloat(l.debit) || 0); c += Math.round(parseFloat(l.credit) || 0); });
              ecr.lignes = sortLignesDebitAvantCredit(
                ecr.lignes.map(l => ({ ...l, debit: Math.round(parseFloat(l.debit) || 0), credit: Math.round(parseFloat(l.credit) || 0) }))
              );
              ecr.lignes = corrigerComptesErreurs(ecr.lignes);
              if (Math.abs(d - c) <= 5) ecrituresAI.push(ecr);
              else console.warn(`Écriture ${i} rejetée — Déséquilibre : ${Math.abs(d - c)} FCFA`);
            }
          } catch (pe) { console.warn('JSON parse error écriture', i, ':', pe.message); }
        }
      }
      if (textBeforeFirst) appendMsg(context, 'ai', textBeforeFirst);
      if (ecrituresAI.length === 0) {
        appendMsg(context, 'ai', '⚠️ Aucune écriture équilibrée extraite. Veuillez reformuler votre demande ou préciser les montants.');
      } else {
        currentGroupId = 'grp_' + Date.now();
        const confirmMsg = `✅ <strong>${ecrituresAI.length} écriture${ecrituresAI.length > 1 ? 's' : ''} liées</strong> préparées et groupées :<br>` +
          ecrituresAI.map((e, i) => `<br><strong>${i + 1}. [${e.journal}]</strong> ${e.libelle}`).join('') +
          `<br><br>⚡ Cliquez <strong>"Tout enregistrer"</strong> pour valider toutes les écritures en un clic.`;
        appendMsg(context, 'ai', confirmMsg);
        setEcritureQueue(ecrituresAI);
        if (context === 'saisie') {
          toast(`✨ ${ecrituresAI.length} écriture${ecrituresAI.length > 1 ? 's' : ''} préparée${ecrituresAI.length > 1 ? 's' : ''}`, 'info');
        } else {
          showMultiEcrBanner(ecrituresAI);
          showSaisieNotif(ecrituresAI[0]?.libelle || msg.substring(0, 40), ecrituresAI.length);
        }
      }
    } else {
      appendMsg(context, 'ai', fullText);
    }
  } catch (err) {
    removeTyping(context, tid);
    conversationHistory.pop();
    appendMsg(context, 'ai', `⚠️ Incident technique : ${err.message} — Veuillez réessayer.`);
  }
  isAILoading = false;
  if (sendBtnId) { const btn = document.getElementById(sendBtnId); if (btn) btn.disabled = false; }
}

function applyFiltreAndNavigate(filtre, context) {
  const { type, dateDebut, dateFin, journal, compte } = filtre;
  if (type === 'journal') {
    navigate('journal');
    if (dateDebut) document.getElementById('jnl-date-debut').value = dateDebut;
    if (dateFin) document.getElementById('jnl-date-fin').value = dateFin;
    if (journal) document.getElementById('journalFilter').value = journal;
    renderJournal();
    const analyseEl = document.getElementById('journal-analyse');
    if (analyseEl) {
      analyseEl.style.display = 'block';
      const label = dateDebut === dateFin ? formatDateFR(dateDebut) : `${formatDateFR(dateDebut)} au ${formatDateFR(dateFin)}`;
      analyseEl.innerHTML = `<div class="analyse-title">📋 Journal — ${label || 'Exercice complet'}</div>Affichage des écritures pour la période demandée.`;
    }
  } else if (type === 'balance') {
    navigate('balance');
    if (dateDebut) document.getElementById('bal-date-debut').value = dateDebut;
    if (dateFin) document.getElementById('bal-date-fin').value = dateFin;
    if (journal) document.getElementById('bal-journal').value = journal;
    renderBalance();
  } else if (type === 'grandlivre') {
    navigate('grandlivre');
    if (dateDebut) document.getElementById('gl-date-debut').value = dateDebut;
    if (dateFin) document.getElementById('gl-date-fin').value = dateFin;
    if (compte) document.getElementById('glSearch').value = compte;
    renderGrandLivre();
    if (compte) setTimeout(() => { const el = document.getElementById('gl-' + compte); if (el) el.style.display = 'block'; }, 200);
  } else if (type === 'bilan') {
    navigate('bilan');
    if (dateFin) document.getElementById('bilan-date-arrete').value = dateFin;
    renderBilan();
  }
}

// ── Affichage messages ──
function appendMsg(context, role, text) {
  const msgId = context === 'dashboard' ? 'aiMessages' : `aiMessages-${context}`;
  const c = document.getElementById(msgId);
  if (!c) return;
  const d = document.createElement('div');
  d.className = 'msg ' + role;
  d.innerHTML = `<div class="msg-av">${role === 'ai' ? 'CA' : 'U'}</div><div class="msg-body">${fmt(text)}</div>`;
  c.appendChild(d); c.scrollTop = c.scrollHeight;
}
function appendTyping(context) {
  const id = 't' + Date.now();
  const msgId = context === 'dashboard' ? 'aiMessages' : `aiMessages-${context}`;
  const c = document.getElementById(msgId);
  if (!c) return id;
  const d = document.createElement('div');
  d.className = 'msg ai'; d.id = id;
  d.innerHTML = `<div class="msg-av">CA</div><div class="msg-body"><div class="typing"><span></span><span></span><span></span></div></div>`;
  c.appendChild(d); c.scrollTop = c.scrollHeight;
  return id;
}
function removeTyping(context, id) { const el = document.getElementById(id); if (el) el.remove(); }

function fmt(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')
    .replace(/&lt;table&gt;/gi, '<table>').replace(/&lt;\/table&gt;/gi, '</table>')
    .replace(/&lt;thead&gt;/gi, '<thead>').replace(/&lt;\/thead&gt;/gi, '</thead>')
    .replace(/&lt;tbody&gt;/gi, '<tbody>').replace(/&lt;\/tbody&gt;/gi, '</tbody>')
    .replace(/&lt;tfoot&gt;/gi, '<tfoot>').replace(/&lt;\/tfoot&gt;/gi, '</tfoot>')
    .replace(/&lt;tr&gt;/gi, '<tr>').replace(/&lt;\/tr&gt;/gi, '</tr>')
    .replace(/&lt;th(&gt;|(\s[^&]*)&gt;)/gi, (_, m) => '<th' + m.replace(/&gt;/g, '>').replace(/&lt;/g, '<'))
    .replace(/&lt;\/th&gt;/gi, '</th>')
    .replace(/&lt;td(&gt;|(\s[^&]*)&gt;)/gi, (_, m) => '<td' + m.replace(/&gt;/g, '>').replace(/&lt;/g, '<'))
    .replace(/&lt;\/td&gt;/gi, '</td>')
    .replace(/&lt;strong&gt;/gi, '<strong>').replace(/&lt;\/strong&gt;/gi, '</strong>')
    .replace(/&lt;em&gt;/gi, '<em>').replace(/&lt;\/em&gt;/gi, '</em>')
    .replace(/&lt;br&gt;/gi, '<br>').replace(/&lt;br\/&gt;/gi, '<br>');
}

// ══════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════
function toast(message, type = 'info') {
  const c = document.getElementById('toastContainer') || document.getElementById('toast');
  if (!c) return;
  const d = document.createElement('div');
  d.className = 'toast ' + type;
  const icons = { success: '✓', error: '✕', info: 'i' };
  const colors = { success: '#4ade80', error: '#f87171', info: '#d4a853' };
  d.innerHTML = `<span style="font-weight:700;color:${colors[type] || colors.info}">${icons[type] || 'i'}</span><span>${message}</span>`;
  c.appendChild(d);
  setTimeout(() => d.style.opacity = '0', 3500);
  setTimeout(() => d.remove(), 4100);
}

// ══════════════════════════════════════════
// INIT SESSION
// ══════════════════════════════════════════
document.addEventListener('firebase-ready', async () => {
  // Charger la config serveur dès le démarrage (avant même le login)
  await loadServerConfig();
  const session = localStorage.getItem('syscohada_session');
  if (session) {
    try {
      const { profileId } = JSON.parse(session);
      const docRef = window._fbDoc(window._db, 'profiles', profileId);
      const snap = await window._fbGetDoc(docRef);
      if (snap.exists()) {
        currentProfile = { ...snap.data(), id: profileId };
        conversationHistory = [];
        await loadApp();
      }
    } catch (e) { localStorage.removeItem('syscohada_session'); }
  }
});

// ══════════════════════════════════════════
// EXPOSITION GLOBALE
// ══════════════════════════════════════════
window.sendToAI             = sendToAI;
window.handleAiKey          = handleAiKey;
window.quickAI              = quickAI;
window.doLogin              = doLogin;
window.doRegister           = doRegister;
window.doLogout             = doLogout;
window.switchTab            = switchTab;
window.navigate             = navigate;
window.addLigne             = addLigne;
window.removeLigne          = removeLigne;
window.saveEcriture         = saveEcriture;
window.updateAccountSuggest = updateAccountSuggest;
window.selectAccount        = selectAccount;
window.hideDropdown         = hideDropdown;
window.updateBalance        = updateBalance;
window.autoSaveAllEcritures = autoSaveAllEcritures;
window.autoSaveAllFromNotif = autoSaveAllFromNotif;
window.skipToNextEcriture   = skipToNextEcriture;
window.dismissFillBanner    = dismissFillBanner;
window.hideMultiEcrBanner   = hideMultiEcrBanner;
window.hideSaisieNotif      = hideSaisieNotif;
window.goToSaisie           = goToSaisie;
window.toggleGL             = toggleGL;
window.deleteEcriture       = deleteEcriture;
window.deleteGroupe         = deleteGroupe;
window.openExportModal      = openExportModal;
window.closeExportModal     = closeExportModal;
window.selectExport         = selectExport;
window.doExport             = doExport;
window.renderJournal        = renderJournal;
window.renderGrandLivre     = renderGrandLivre;
window.renderBalance        = renderBalance;
window.renderBilan          = renderBilan;
window.renderResultat       = renderResultat;
window.renderTresorerie     = renderTresorerie;
window.renderPlanComptable  = renderPlanComptable;
window.resetJournalFiltre   = resetJournalFiltre;
window.resetGLFiltre        = resetGLFiltre;
window.resetBalanceFiltre   = resetBalanceFiltre;
window.updateStats          = updateStats;
window.toggleMobileSidebar  = toggleMobileSidebar;
window.closeMobileSidebar   = closeMobileSidebar;
