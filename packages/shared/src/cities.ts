// The cities of every country, each list stored pre-sorted (audit O7: no runtime sorting).
// Edit this file directly, and keep each city list sorted.
//
// Its own entry point, "@urconnections/shared/cities", NOT exported from index.ts: the website
// loads it with a dynamic import() only once a country is picked (Stage 12), so the ≈ 13 KB gzip
// stays out of the home page bundle. (If index.ts exported it, every page would include it.)
import { isCountry, type Country } from "./countryNames";

// `satisfies Record<Country, …>`: TypeScript checks that every country in COUNTRY_LIST has a
// city list here, and that there's no entry for a country missing from COUNTRY_LIST.
export const CITIES_BY_COUNTRY = {
  "Afghanistan": [
    "Aybak", "Baghlan", "Balkh", "Farah", "Gardez", "Ghazni", "Herat", "Jalalabad", "Kabul",
    "Kandahar", "Khost", "Kunduz", "Lashkar Gah", "Maymana", "Mazar-i-Sharif", "Pul-e-Khumri",
    "Sheberghan", "Taloqan", "Zaranj",
  ],
  "Albania": [
    "Berat", "Burrel", "Durrës", "Elbasan", "Fier", "Gjirokastër", "Kavajë", "Korçë", "Kukës",
    "Laç", "Lezhë", "Lushnjë", "Peshkopi", "Pogradec", "Përmet", "Sarandë", "Shkodër",
    "Tirana", "Vlorë",
  ],
  "Algeria": [
    "Algiers", "Annaba", "Batna", "Biskra", "Blida", "Boumerdes", "Béchar", "Béjaïa", "Chlef",
    "Constantine", "Djelfa", "El Oued", "Guelma", "Jijel", "Khenchela", "Mostaganem", "Msila",
    "Médéa", "Oran", "Ouargla", "Sidi Bel Abbès", "Skikda", "Sétif", "Tlemcen", "Tébessa",
  ],
  "Angola": [
    "Benguela", "Cabinda", "Huambo", "Kuito", "Lobito", "Luanda", "Lubango", "Luena",
    "Malanje", "Mbanza Kongo", "Menongue", "Namibe", "Ndalatando", "Saurimo", "Soyo", "Sumbe",
    "Uíge",
  ],
  "Argentina": [
    "Bahía Blanca", "Buenos Aires", "Catamarca", "Comodoro Rivadavia", "Corrientes", "Córdoba",
    "Formosa", "La Plata", "La Rioja", "Mar del Plata", "Mendoza", "Neuquén", "Paraná",
    "Posadas", "Rawson", "Resistencia", "Rosario", "Río Cuarto", "Río Gallegos", "Salta",
    "San Juan", "San Luis", "San Miguel de Tucumán", "San Salvador de Jujuy", "Santa Fe",
    "Santa Rosa", "Santiago del Estero", "Ushuaia",
  ],
  "Armenia": [
    "Abovyan", "Artashat", "Charentsavan", "Dilijan", "Gavarr", "Goris", "Gyumri", "Hrazdan",
    "Ijevan", "Kapan", "Sevan", "Sisian", "Stepanavan", "Vagharshapat", "Vanadzor",
    "Yeghegnadzor", "Yerevan",
  ],
  "Australia": [
    "Adelaide", "Albury", "Ballarat", "Bendigo", "Brisbane", "Bunbury", "Bundaberg", "Cairns",
    "Canberra", "Darwin", "Geelong", "Gladstone", "Gold Coast", "Hervey Bay", "Hobart",
    "Launceston", "Mackay", "Mandurah", "Melbourne", "Mildura", "Newcastle", "Perth",
    "Rockhampton", "Shepparton", "Sydney", "Tamworth", "Toowoomba", "Townsville",
    "Wagga Wagga", "Wollongong",
  ],
  "Austria": [
    "Baden bei Wien", "Bregenz", "Dornbirn", "Feldkirch", "Graz", "Innsbruck", "Klagenfurt",
    "Klosterneuburg", "Krems an der Donau", "Leoben", "Leonding", "Linz", "Salzburg",
    "Sankt Pölten", "Steyr", "Traun", "Vienna", "Villach", "Wels", "Wiener Neustadt",
    "Wolfsberg",
  ],
  "Azerbaijan": [
    "Aghjabadi", "Baku", "Barda", "Bilasuvar", "Ganja", "Goychay", "Khankendi", "Lankaran",
    "Mingachevir", "Nakhchivan", "Qabala", "Quba", "Shaki", "Shirvan", "Sumqayit", "Yevlakh",
    "Zagatala",
  ],
  "Bahrain": [
    "Al-Malikiyah", "Budaiya", "Hamad Town", "Isa Town", "Jidd Hafs", "Jidhafs", "Manama",
    "Muharraq", "Riffa", "Saar", "Sitrah", "Tubli",
  ],
  "Bangladesh": [
    "Barishal", "Bogra", "Chittagong", "Comilla", "Dhaka", "Dinajpur", "Feni", "Gazipur",
    "Jamalpur", "Jessore", "Khulna", "Mymensingh", "Narayanganj", "Nawabganj", "Nawabganj",
    "Noakhali", "Pabna", "Rajshahi", "Rangpur", "Saidpur", "Sirajganj", "Sylhet", "Tangail",
    "Tongi",
  ],
  "Belgium": [
    "Aalst", "Antwerp", "Arlon", "Bruges", "Brussels", "Charleroi", "Dinant", "Genk", "Ghent",
    "Hasselt", "Kortrijk", "La Louvière", "Leuven", "Liège", "Louvain-la-Neuve", "Mechelen",
    "Mons", "Mouscron", "Namur", "Ostend", "Roeselare", "Sint-Niklaas", "Tournai", "Verviers",
  ],
  "Bolivia": [
    "Camiri", "Cobija", "Cochabamba", "La Paz", "Llallagua", "Montero", "Oruro", "Potosí",
    "Riberalta", "Santa Cruz", "Sucre", "Tarija", "Trinidad", "Tupiza", "Villazón", "Warnes",
    "Yacuiba",
  ],
  "Bosnia and Herzegovina": [
    "Banja Luka", "Bihać", "Bijeljina", "Bosanska Krupa", "Brčko", "Doboj", "Foča", "Goražde",
    "Mostar", "Prijedor", "Sarajevo", "Trebinje", "Tuzla", "Zenica", "Zvornik",
  ],
  "Brazil": [
    "Ananindeua", "Aracaju", "Belo Horizonte", "Belém", "Boa Vista", "Brasília", "Campinas",
    "Campo Grande", "Contagem", "Cuiabá", "Curitiba", "Duque de Caxias", "Feira de Santana",
    "Florianópolis", "Fortaleza", "Goiânia", "Guarulhos", "Joinville", "João Pessoa",
    "Juiz de Fora", "Londrina", "Macapá", "Maceió", "Manaus", "Natal", "Niterói",
    "Nova Iguaçu", "Osasco", "Porto Alegre", "Porto Velho", "Recife", "Ribeirão Preto",
    "Rio de Janeiro", "Salvador", "Santo André", "Sorocaba", "São Bernardo do Campo",
    "São Gonçalo", "São Luís", "São Paulo", "Teresina", "Uberlândia",
  ],
  "Bulgaria": [
    "Blagoevgrad", "Burgas", "Dobrich", "Gabrovo", "Haskovo", "Kardzhali", "Lovech", "Montana",
    "Pazardzhik", "Pernik", "Pleven", "Plovdiv", "Razgrad", "Ruse", "Shumen", "Silistra",
    "Sliven", "Smolyan", "Sofia", "Stara Zagora", "Targovishte", "Varna", "Vidin", "Vratsa",
    "Yambol",
  ],
  "Cambodia": [
    "Battambang", "Kampong Cham", "Kampong Speu", "Kampot", "Kep", "Kratie", "Phnom Penh",
    "Poipet", "Preah Sihanouk", "Prey Veng", "Pursat", "Siem Reap", "Stung Treng",
    "Svay Rieng", "Takeo",
  ],
  "Cameroon": [
    "Bafia", "Bafoussam", "Bamenda", "Bertoua", "Buea", "Douala", "Dschang", "Ebolowa", "Edéa",
    "Foumban", "Garoua", "Kribi", "Kumba", "Loum", "Maroua", "Ngaoundéré", "Nkongsamba",
    "Yaoundé",
  ],
  "Canada": [
    "Abbotsford", "Barrie", "Calgary", "Charlottetown", "Edmonton", "Fredericton", "Halifax",
    "Hamilton", "Iqaluit", "Kelowna", "Kingston", "Kitchener", "London", "Moncton", "Montreal",
    "Oshawa", "Ottawa", "Québec City", "Regina", "Saguenay", "Saskatoon", "Sherbrooke",
    "St. John's", "Sudbury", "Toronto", "Trois-Rivières", "Vancouver", "Victoria",
    "Whitehorse", "Windsor", "Winnipeg", "Yellowknife",
  ],
  "Chile": [
    "Antofagasta", "Arica", "Calama", "Chillán", "Concepción", "Copiapó", "Coquimbo", "Curicó",
    "Iquique", "La Serena", "Los Ángeles", "Osorno", "Ovalle", "Puerto Montt", "Punta Arenas",
    "Rancagua", "Santiago", "Talca", "Temuco", "Valdivia", "Valparaíso",
  ],
  "China": [
    "Beijing", "Changchun", "Changsha", "Chengdu", "Chongqing", "Dalian", "Dongguan", "Foshan",
    "Fuzhou", "Guangzhou", "Guiyang", "Haikou", "Hangzhou", "Harbin", "Hefei", "Hohhot",
    "Jinan", "Kunming", "Lanzhou", "Lhasa", "Nanchang", "Nanjing", "Nanning", "Ningbo",
    "Qingdao", "Sanya", "Shanghai", "Shenyang", "Shenzhen", "Shijiazhuang", "Suzhou",
    "Taiyuan", "Tianjin", "Urumqi", "Wenzhou", "Wuhan", "Xi'an", "Xiamen", "Xining",
    "Zhengzhou",
  ],
  "Colombia": [
    "Armenia", "Barranquilla", "Bello", "Bogotá", "Bucaramanga", "Buenaventura", "Cali",
    "Cartagena", "Cúcuta", "Floridablanca", "Ibagué", "Itagüí", "Manizales", "Medellín",
    "Montería", "Neiva", "Palmira", "Pasto", "Pereira", "Popayán", "Santa Marta", "Sincelejo",
    "Valledupar", "Villavicencio",
  ],
  "Costa Rica": [
    "Alajuela", "Cartago", "Desamparados", "Filadelfia", "Guápiles", "Heredia", "Liberia",
    "Limón", "Nicoya", "Puntarenas", "Pérez Zeledón", "San Carlos", "San José", "Santa Cruz",
    "Turrialba",
  ],
  "Croatia": [
    "Bjelovar", "Dubrovnik", "Gospić", "Karlovac", "Koprivnica", "Osijek", "Petrinja", "Pula",
    "Rijeka", "Sisak", "Slavonski Brod", "Split", "Varaždin", "Vukovar", "Zadar", "Zagreb",
    "Đakovo", "Šibenik",
  ],
  "Cuba": [
    "Bayamo", "Camagüey", "Ciego de Ávila", "Cienfuegos", "Guantánamo", "Havana", "Holguín",
    "Las Tunas", "Manzanillo", "Matanzas", "Morón", "Pinar del Río", "Santa Clara",
    "Santiago de Cuba", "Trinidad",
  ],
  "Cyprus": [
    "Aradippou", "Famagusta", "Kyrenia", "Lakatamia", "Larnaca", "Limassol", "Morphou",
    "Nicosia", "Paphos", "Paralimni",
  ],
  "Czechia": [
    "Brno", "Chomutov", "Děčín", "Frýdek-Místek", "Havířov", "Hradec Králové", "Jihlava",
    "Karviná", "Kladno", "Liberec", "Most", "Olomouc", "Opava", "Ostrava", "Pardubice",
    "Plzeň", "Prague", "Teplice", "Zlín", "Ústí nad Labem", "České Budějovice",
  ],
  "Denmark": [
    "Aalborg", "Aarhus", "Copenhagen", "Esbjerg", "Frederiksberg", "Gladsaxe", "Guldborgsund",
    "Helsingør", "Herning", "Horsens", "Hvidovre", "Kolding", "Næstved", "Odense", "Randers",
    "Roskilde", "Silkeborg", "Sønderborg", "Vejle",
  ],
  "Dominican Republic": [
    "Azua", "Barahona", "Bonao", "Constanza", "Cotui", "Higüey", "La Romana", "La Vega",
    "Moca", "Puerto Plata", "San Cristóbal", "San Francisco de Macorís",
    "San Pedro de Macorís", "Santiago", "Santo Domingo",
  ],
  "Ecuador": [
    "Ambato", "Babahoyo", "Cuenca", "Durán", "Esmeraldas", "Guayaquil", "Ibarra", "Latacunga",
    "Loja", "Machala", "Manta", "Milagro", "Portoviejo", "Quevedo", "Quito", "Riobamba",
    "Salinas", "Santa Elena", "Santo Domingo", "Tulcán",
  ],
  "Egypt": [
    "Alexandria", "Aswan", "Asyut", "Banha", "Beni Suef", "Cairo", "Damietta", "Faiyum",
    "Giza", "Hurghada", "Ismailia", "Kafr el-Sheikh", "Luxor", "Mansoura", "Minya",
    "Port Said", "Qena", "Sharm el-Sheikh", "Shibin el-Kom", "Shubra El Kheima", "Sidi Ghazi",
    "Sohag", "Suez", "Tanta", "Zagazig",
  ],
  "El Salvador": [
    "Ahuachapán", "Apopa", "Chalchuapa", "Cuscatancingo", "Delgado", "Ilopango", "Mejicanos",
    "Nueva San Salvador", "San Miguel", "San Salvador", "Santa Ana", "Soyapango", "Usulután",
    "Zacatecoluca",
  ],
  "Estonia": [
    "Haapsalu", "Jõhvi", "Kohtla-Järve", "Kuressaare", "Maardu", "Narva", "Paide", "Pärnu",
    "Rakvere", "Sillamäe", "Tallinn", "Tartu", "Valga", "Viljandi", "Võru",
  ],
  "Ethiopia": [
    "Addis Ababa", "Arba Minch", "Bahir Dar", "Bishoftu", "Dessie", "Dire Dawa", "Gondar",
    "Harar", "Hawassa", "Hosaena", "Jijiga", "Jimma", "Mekelle", "Nazreth", "Shashemene",
    "Sodo",
  ],
  "Finland": [
    "Espoo", "Helsinki", "Hyvinkää", "Hämeenlinna", "Joensuu", "Jyväskylä", "Kotka", "Kouvola",
    "Kuopio", "Lahti", "Lappeenranta", "Lohja", "Mikkeli", "Oulu", "Pori", "Porvoo",
    "Rovaniemi", "Salo", "Seinäjoki", "Tampere", "Turku", "Vaasa", "Vantaa",
  ],
  "France": [
    "Aix-en-Provence", "Amiens", "Angers", "Avignon", "Besançon", "Bordeaux",
    "Boulogne-Billancourt", "Brest", "Caen", "Clermont-Ferrand", "Dijon", "Grenoble",
    "Le Havre", "Lille", "Limoges", "Lyon", "Marseille", "Metz", "Montpellier", "Mulhouse",
    "Nancy", "Nantes", "Nice", "Nîmes", "Orléans", "Paris", "Pau", "Perpignan", "Poitiers",
    "Reims", "Rennes", "Rouen", "Saint-Étienne", "Strasbourg", "Toulon", "Toulouse", "Tours",
    "Valenciennes", "Villeurbanne",
  ],
  "Georgia": [
    "Batumi", "Chiatura", "Gori", "Khashuri", "Kobuleti", "Kutaisi", "Poti", "Rustavi",
    "Samtredia", "Senaki", "Tbilisi", "Telavi", "Tsqaltubo", "Zugdidi", "Zugdidi",
  ],
  "Germany": [
    "Aachen", "Augsburg", "Berlin", "Bielefeld", "Bochum", "Bonn", "Braunschweig", "Bremen",
    "Chemnitz", "Cologne", "Dortmund", "Dresden", "Duisburg", "Düsseldorf", "Erfurt", "Essen",
    "Frankfurt", "Freiburg", "Gelsenkirchen", "Hagen", "Halle", "Hamburg", "Hamm", "Hanover",
    "Karlsruhe", "Kassel", "Kiel", "Krefeld", "Leipzig", "Ludwigshafen", "Lübeck", "Magdeburg",
    "Mainz", "Mannheim", "Munich", "Mönchengladbach", "Mülheim", "Münster", "Nuremberg",
    "Oberhausen", "Potsdam", "Rostock", "Saarbrücken", "Stuttgart", "Wiesbaden", "Wuppertal",
  ],
  "Ghana": [
    "Accra", "Ashaiman", "Berekum", "Bolgatanga", "Cape Coast", "Ho", "Koforidua", "Kumasi",
    "Madina", "Obuasi", "Sekondi-Takoradi", "Sunyani", "Tamale", "Techiman", "Tema", "Teshie",
    "Wa",
  ],
  "Greece": [
    "Agrinio", "Alexandroupoli", "Athens", "Chalcis", "Corfu", "Drama", "Heraklion",
    "Ioannina", "Kalamata", "Katerini", "Kavala", "Lamia", "Larissa", "Patras", "Piraeus",
    "Rhodes", "Serres", "Thessaloniki", "Trikala", "Veria", "Volos",
  ],
  "Guatemala": [
    "Amatitlán", "Chinautla", "Chiquimula", "Cobán", "Escuintla", "Guatemala City",
    "Huehuetenango", "Jalapa", "Mixco", "Puerto Barrios", "Quetzaltenango", "Retalhuleu",
    "San Miguel Petapa", "Santa Lucía Cotzumalguapa", "Sololá", "Villa Nueva",
  ],
  "Honduras": [
    "Choloma", "Choluteca", "Comayagua", "Danli", "El Progreso", "Juticalpa", "La Ceiba",
    "Puerto Cortés", "San Pedro Sula", "Santa Rosa de Copán", "Siguatepeque", "Tegucigalpa",
    "Villanueva",
  ],
  "Hungary": [
    "Budapest", "Debrecen", "Eger", "Győr", "Kaposvár", "Kecskemét", "Miskolc", "Nyíregyháza",
    "Pécs", "Sopron", "Szeged", "Szolnok", "Szombathely", "Székesfehérvár", "Tatabánya",
    "Veszprém", "Zalaegerszeg", "Érd",
  ],
  "India": [
    "Agra", "Ahmedabad", "Aligarh", "Allahabad", "Amritsar", "Aurangabad", "Bangalore",
    "Bareilly", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai", "Coimbatore", "Dehradun",
    "Delhi", "Dhanbad", "Faridabad", "Guwahati", "Gwalior", "Howrah", "Hyderabad", "Indore",
    "Jabalpur", "Jaipur", "Jalandhar", "Jamshedpur", "Jodhpur", "Kalyan", "Kanpur", "Kochi",
    "Kolkata", "Kota", "Kozhikode", "Lucknow", "Ludhiana", "Madurai", "Mangalore", "Meerut",
    "Moradabad", "Mumbai", "Mysore", "Nagpur", "Nash", "Navi Mumbai", "Patna",
    "Pimpri-Chinchwad", "Pune", "Raipur", "Rajkot", "Ranchi", "Saharanpur", "Solapur",
    "Srinagar", "Surat", "Thane", "Thiruvananthapuram", "Tiruchirappalli", "Vadodara",
    "Varanasi", "Vijayawada", "Visakhapatnam",
  ],
  "Indonesia": [
    "Ambon", "Balikpapan", "Bandar Lampung", "Bandung", "Banjarmasin", "Batam", "Bekasi",
    "Bogor", "Denpasar", "Depok", "Jakarta", "Jambi", "Jayapura", "Kupang", "Makassar",
    "Malang", "Manado", "Mataram", "Medan", "Padang", "Palangkaraya", "Palembang", "Pekanbaru",
    "Pontianak", "Samarinda", "Semarang", "South Tangerang", "Surabaya", "Tangerang",
    "Yogyakarta",
  ],
  "Iran": [
    "Ahvaz", "Arak", "Ardabil", "Bandar Abbas", "Birjand", "Dezful", "Gorgan", "Hamadan",
    "Isfahan", "Karaj", "Kerman", "Kermanshah", "Khorramabad", "Mashhad", "Qazvin", "Qom",
    "Rasht", "Sanandaj", "Semnan", "Shiraz", "Tabriz", "Tehran", "Urmia", "Yazd", "Zahedan",
    "Zanjan",
  ],
  "Iraq": [
    "Baghdad", "Baquba", "Basra", "Dohuk", "Erbil", "Faluja", "Hillah", "Karbala", "Kirkuk",
    "Kut", "Mosul", "Najaf", "Nasiriyah", "Ramadi", "Samarra", "Sulaymaniyah", "Tikrit",
  ],
  "Ireland": [
    "Athlone", "Balbriggan", "Bray", "Carlow", "Cork", "Drogheda", "Dublin", "Dundalk",
    "Ennis", "Galway", "Kilkenny", "Limerick", "Mullingar", "Naas", "Navan", "Newbridge",
    "Portlaoise", "Sligo", "Swords", "Tralee", "Waterford",
  ],
  "Israel": [
    "Acre", "Ashdod", "Ashkelon", "Bat Yam", "Beersheba", "Bnei Brak", "Haifa", "Herzliya",
    "Holon", "Jerusalem", "Kfar Saba", "Lod", "Modi'in", "Nazareth", "Netanya", "Petah Tikva",
    "Ramat Gan", "Rehovot", "Rishon LeZion", "Tel Aviv",
  ],
  "Italy": [
    "Ancona", "Arezzo", "Bari", "Bergamo", "Bologna", "Bolzano", "Brescia", "Cagliari",
    "Catania", "Ferrara", "Florence", "Foggia", "Genoa", "La Spezia", "Latina", "Livorno",
    "Messina", "Milan", "Modena", "Monza", "Naples", "Padua", "Palermo", "Perugia", "Prato",
    "Ravenna", "Reggio Calabria", "Reggio Emilia", "Rimini", "Rome", "Salerno", "Sassari",
    "Siracusa", "Taranto", "Trento", "Trieste", "Turin", "Udine", "Venice", "Verona",
  ],
  "Ivory Coast": [
    "Abidjan", "Abobo", "Anyama", "Bouaké", "Daloa", "Divo", "Duekoué", "Gagnoa", "Korhogo",
    "Man", "San-Pédro", "Soubré", "Yamoussoukro",
  ],
  "Jamaica": [
    "Halfwa Tree", "Kingston", "Linstead", "Mandeville", "May Pen", "Montego Bay",
    "Old Harbour", "Portmore", "Spanish Town",
  ],
  "Japan": [
    "Chiba", "Fukuoka", "Funahashi", "Hamamatsu", "Hiroshima", "Kagoshima", "Kanazawa",
    "Kawasaki", "Kitakyushu", "Kobe", "Kumamoto", "Kyoto", "Matsudo", "Matsumoto", "Matsuyama",
    "Nagano", "Nagasaki", "Nagoya", "Nara", "Niigata", "Nishinomiya", "Oita", "Okayama",
    "Osaka", "Sagamihara", "Saitama", "Sakai", "Sapporo", "Sendai", "Shizuoka", "Suita",
    "Takamatsu", "Tokyo", "Toyama", "Utsunomiya", "Yokohama",
  ],
  "Jordan": [
    "Ajloun", "Al-Quwaysmah", "Amman", "Aqaba", "Irbid", "Jerash", "Karak", "Khuraybah",
    "Ma'an", "Madaba", "Russeifa", "Sahab", "Tafilah", "Wadi Al-Seer", "Zarqa",
  ],
  "Kazakhstan": [
    "Aktau", "Aktobe", "Almaty", "Atyrau", "Ekibastuz", "Karaganda", "Kostanay", "Kyzylorda",
    "Nur-Sultan", "Pavlodar", "Petropavl", "Semey", "Shymkent", "Taldykorgan", "Taraz",
    "Temirtau", "Uralsk", "Ust-Kamenogorsk",
  ],
  "Kenya": [
    "Busia", "Eldoret", "Embu", "Garissa", "Kakamega", "Kericho", "Kisumu", "Kitale",
    "Machakos", "Malindi", "Meru", "Mombasa", "Nairobi", "Nakuru", "Nyeri", "Thika",
  ],
  "Kuwait": [
    "Ahmadi", "Fahaheel", "Farwaniya", "Fintas", "Hawalli", "Jahra", "Kuwait City", "Mangaf",
    "Rumaithiyya", "Sabah Al-Salem", "Salmiya",
  ],
  "Laos": [
    "Ban Houayxay", "Luang Prabang", "Pakse", "Phonsavan", "Savannakhet", "Thakhek",
    "Vientiane", "Xam Neua",
  ],
  "Latvia": [
    "Daugavpils", "Jelgava", "Jēkabpils", "Jūrmala", "Liepāja", "Ogre", "Riga", "Rēzekne",
    "Valmiera", "Ventspils",
  ],
  "Lebanon": [
    "Aley", "Baalbek", "Batroun", "Beirut", "Byblos", "Jounieh", "Nabatieh", "Sidon",
    "Tripoli", "Tyre", "Zahle",
  ],
  "Libya": [
    "Adjusted", "Ajdabiya", "Al Khums", "Benghazi", "Derna", "Misrata", "Murzuq", "Sabha",
    "Surt", "Tarhuna", "Tobruk", "Tripoli", "Zawiya", "Zliten",
  ],
  "Lithuania": [
    "Alytus", "Jonava", "Kaunas", "Klaipėda", "Kėdainiai", "Marijampolė", "Mažeikiai",
    "Panevėžys", "Telšiai", "Utena", "Vilnius", "Visaginas", "Šiauliai",
  ],
  "Luxembourg": [
    "Bettembourg", "Differdange", "Dudelange", "Esch-sur-Alzette", "Ettelbruck",
    "Luxembourg City", "Petange", "Sanem",
  ],
  "Malaysia": [
    "Alor Setar", "Ampang", "Butterworth", "George Town", "Ipoh", "Johor Bahru", "Kota Bharu",
    "Kota Kinabalu", "Kuala Lumpur", "Kuala Terengganu", "Kuantan", "Kuching", "Malacca",
    "Miri", "Petaling Jaya", "Sandakan", "Seremban", "Shah Alam", "Sibu", "Subang Jaya",
  ],
  "Mexico": [
    "Acapulco", "Aguascalientes", "Cancún", "Chihuahua", "Ciudad Juárez", "Culiacán",
    "Durango", "Ecatepec", "Guadalajara", "Hermosillo", "Irapuato", "León", "Matamoros",
    "Mazatlán", "Mexicali", "Mexico City", "Monterrey", "Morelia", "Mérida", "Naucalpan",
    "Oaxaca", "Puebla", "Querétaro", "Saltillo", "San Luis Potosí", "Tepic", "Tijuana",
    "Tlalnepantla", "Toluca", "Torreón", "Tuxtla Gutiérrez", "Veracruz", "Villahermosa",
    "Xalapa", "Zapopan",
  ],
  "Moldova": [
    "Bender", "Bălți", "Cahul", "Chișinău", "Dubăsari", "Orhei", "Rîbnița", "Soroca",
    "Tiraspol", "Ungheni",
  ],
  "Mongolia": [
    "Arvaikheer", "Bayankhongor", "Choibalsan", "Darkhan", "Erdenet", "Mörön", "Ulaanbaatar",
    "Uliastai", "Ölgii",
  ],
  "Morocco": [
    "Agadir", "Béni Mellal", "Casablanca", "El Jadida", "Errachidia", "Essaouira", "Fez",
    "Kenitra", "Khemisset", "Khouribga", "Ksar El Kebir", "Larache", "Marrakech", "Meknès",
    "Nador", "Oujda", "Rabat", "Safi", "Settat", "Tangier", "Taza", "Tetouan",
  ],
  "Mozambique": [
    "Beira", "Chimoio", "Lichinga", "Maputo", "Matola", "Mocuba", "Nacala", "Nampula", "Pemba",
    "Quelimane", "Tete",
  ],
  "Myanmar": [
    "Bago", "Dawei", "Hpa-an", "Lashio", "Mandalay", "Mawlamyine", "Meiktila", "Myeik",
    "Naypyidaw", "Pathein", "Pyay", "Pyinmana", "Sagaing", "Sittwe", "Yangon",
  ],
  "Nepal": [
    "Bharatpur", "Bhimsensthapur", "Biratnagar", "Birganj", "Butwal", "Dharan", "Hetauda",
    "Itahari", "Janakpur", "Kathmandu", "Lalitpur", "Pokhara", "Siddharthanagar",
  ],
  "Netherlands": [
    "'s-Hertogenbosch", "Almere", "Amersfoort", "Amsterdam", "Apeldoorn", "Arnhem", "Breda",
    "Delft", "Deventer", "Dordrecht", "Eindhoven", "Enschede", "Groningen", "Haarlem",
    "Leiden", "Maastricht", "Nijmegen", "Rotterdam", "The Hague", "Tilburg", "Utrecht",
    "Zaanstad", "Zoetermeer", "Zwolle",
  ],
  "New Zealand": [
    "Auckland", "Christchurch", "Dunedin", "Hamilton", "Hastings", "Invercargill", "Napier",
    "Nelson", "New Plymouth", "Palmerston North", "Rotorua", "Tauranga", "Wellington",
    "Whangarei",
  ],
  "Nicaragua": [
    "Chinandega", "Estelí", "Granada", "Jinotega", "Juigalpa", "León", "Managua", "Masaya",
    "Matagalpa", "Rivas",
  ],
  "Nigeria": [
    "Aba", "Abeokuta", "Abuja", "Ado Ekiti", "Akure", "Bauchi", "Benin City", "Calabar",
    "Enugu", "Gombe", "Ibadan", "Ilorin", "Jos", "Kaduna", "Kano", "Lagos", "Maiduguri",
    "Ogbomoso", "Okene", "Onitsha", "Oshogbo", "Owerri", "Oyo", "Port Harcourt", "Sokoto",
    "Uyo", "Warri", "Yola", "Zaria",
  ],
  "Norway": [
    "Bergen", "Bærum", "Drammen", "Fredrikstad", "Kristiansand", "Oslo", "Porsgrunn",
    "Sandnes", "Sarpsborg", "Skien", "Stavanger", "Tromsø", "Trondheim", "Tønsberg", "Ålesund",
  ],
  "Oman": [
    "Bahla", "Barka", "Ibra", "Ibri", "Khasab", "Muscat", "Nizwa", "Rustaq", "Salalah",
    "Sohar", "Sur",
  ],
  "Pakistan": [
    "Abbottabad", "Bahawalpur", "Chiniot", "Faisalabad", "Gujranwala", "Gujrat", "Hafizabad",
    "Hyderabad", "Islamabad", "Jhang", "Kamoke", "Karachi", "Kasur", "Lahore", "Larkana",
    "Mardan", "Mingora", "Mirpur Khas", "Multan", "Nawabshah", "Peshawar", "Quetta",
    "Rahim Yar Khan", "Rawalpindi", "Sadiqabad", "Sargodha", "Sheikhupura", "Sialkot",
    "Sukkur",
  ],
  "Palestine": [
    "Beit Lahiya", "Bethlehem", "Deir al-Balah", "Gaza", "Hebron", "Jenin", "Jericho",
    "Khan Yunis", "Nablus", "Qalqilya", "Rafah", "Ramallah", "Tulkarm",
  ],
  "Panama": [
    "Arraiján", "Chitré", "Colón", "David", "La Chorrera", "Panama City", "Penonomé",
    "San Miguelito", "Santiago", "Tocumen",
  ],
  "Paraguay": [
    "Asunción", "Ciudad del Este", "Encarnación", "Fernando de la Mora", "Lambaré", "Limpio",
    "Luque", "Mariano Roque Alonso", "Pedro Juan Caballero", "San Lorenzo", "Ñemby",
  ],
  "Peru": [
    "Arequipa", "Ayacucho", "Cajamarca", "Chiclayo", "Chimbote", "Cusco", "Huancayo", "Ica",
    "Iquitos", "Juliaca", "Lima", "Piura", "Pucallpa", "Puno", "Sullana", "Tacna", "Trujillo",
  ],
  "Philippines": [
    "Angeles City", "Antipolo", "Bacolod", "Bacoor", "Cagayan de Oro", "Caloocan", "Cebu City",
    "Dasmariñas", "Davao City", "General Santos", "Iligan", "Iloilo City", "Las Piñas",
    "Lucena", "Makati", "Malabon", "Manila", "Marikina", "Muntinlupa", "Pasig", "Quezon City",
    "Taguig", "Valenzuela", "Zamboanga City",
  ],
  "Poland": [
    "Białystok", "Bielsko-Biała", "Bydgoszcz", "Bytom", "Częstochowa", "Gdańsk", "Gdynia",
    "Gliwice", "Katowice", "Kielce", "Kraków", "Legnica", "Lublin", "Olsztyn", "Opole",
    "Poznań", "Radom", "Ruda Śląska", "Rybnik", "Rzeszów", "Sosnowiec", "Szczecin", "Toruń",
    "Tychy", "Warsaw", "Wałbrzych", "Wrocław", "Zabrze", "Zielona Góra", "Łódź",
  ],
  "Portugal": [
    "Almada", "Amadora", "Aveiro", "Barreiro", "Braga", "Cascais", "Coimbra", "Faro",
    "Funchal", "Guimarães", "Leiria", "Lisbon", "Loures", "Matosinhos", "Odivelas", "Porto",
    "Setúbal", "Sintra", "Valongo", "Viseu", "Évora",
  ],
  "Qatar": [
    "Al Daayen", "Al Khor", "Al Rayyan", "Al Shamal", "Al Wakrah", "Doha", "Lusail",
    "Mesaieed", "Umm Salal",
  ],
  "Romania": [
    "Arad", "Bacău", "Baia Mare", "Botoșani", "Brașov", "Brăila", "Bucharest", "Buzău",
    "Cluj-Napoca", "Constanța", "Craiova", "Drobeta-Turnu Severin", "Galați", "Iași", "Oradea",
    "Pitești", "Ploiești", "Râmnicu Vâlcea", "Satu Mare", "Sibiu", "Suceava", "Timișoara",
    "Târgu Mureș",
  ],
  "Russia": [
    "Astrakhan", "Barnaul", "Chelyabinsk", "Irkutsk", "Izhevsk", "Kazan", "Kemerovo",
    "Khabarovsk", "Kirov", "Krasnodar", "Krasnoyarsk", "Lipetsk", "Makhachkala", "Moscow",
    "Naberezhnye Chelny", "Nizhny Novgorod", "Novokuznetsk", "Novosibirsk", "Omsk", "Orenburg",
    "Penza", "Perm", "Rostov-on-Don", "Ryazan", "Saint Petersburg", "Samara", "Saratov",
    "Tolyatti", "Tomsk", "Tula", "Tyumen", "Ufa", "Vladivostok", "Volgograd", "Voronezh",
    "Yaroslavl", "Yekaterinburg",
  ],
  "Saudi Arabia": [
    "Abha", "Al Hufuf", "Al Qatif", "Al-Khobar", "Arar", "Buraydah", "Dammam", "Hail",
    "Jeddah", "Jizan", "Khamis Mushait", "Mecca", "Medina", "Mobarraz", "Najran", "Riyadh",
    "Sakakah", "Tabuk", "Taif", "Yanbu",
  ],
  "Senegal": [
    "Dakar", "Diourbel", "Kaolack", "Kolda", "Mbour", "Saint-Louis", "Sédhiou", "Tambacounda",
    "Thiès", "Touba", "Ziguinchor",
  ],
  "Serbia": [
    "Belgrade", "Kragujevac", "Kruševac", "Leskovac", "Niš", "Novi Pazar", "Novi Sad",
    "Pančevo", "Smederevo", "Subotica", "Valjevo", "Vranje", "Zrenjanin", "Čačak", "Šabac",
  ],
  "Singapore": [
    "Jurong East", "Punggol", "Sengkang", "Singapore", "Tampines", "Woodlands",
  ],
  "Slovakia": [
    "Banská Bystrica", "Bratislava", "Košice", "Martin", "Michalovce", "Nitra", "Poprad",
    "Považská Bystrica", "Prešov", "Prievidza", "Trenčín", "Trnava", "Zvolen", "Žilina",
  ],
  "Slovenia": [
    "Celje", "Domžale", "Koper", "Kranj", "Ljubljana", "Maribor", "Nova Gorica", "Novo Mesto",
    "Ptuj", "Velenje",
  ],
  "South Africa": [
    "Benoni", "Bloemfontein", "Boksburg", "Cape Town", "Durban", "East London", "Germiston",
    "Johannesburg", "Kimberley", "Krugersdorp", "Mahikeng", "Nelspruit", "Pietermaritzburg",
    "Polokwane", "Port Elizabeth", "Pretoria", "Soweto", "Tembisa", "Upington",
  ],
  "South Korea": [
    "Ansan", "Anyang", "Bucheon", "Busan", "Changwon", "Cheonan", "Cheongju", "Daegu",
    "Daejeon", "Gimhae", "Goyang", "Gwangju", "Hwaseong", "Incheon", "Jeonju", "Namyangju",
    "Pohang", "Seongnam", "Seoul", "Suwon", "Uijeongbu", "Ulsan", "Yongin",
  ],
  "Spain": [
    "Alicante", "Badalona", "Barcelona", "Bilbao", "Cartagena", "Coruña", "Córdoba", "Gijón",
    "Granada", "Hospitalet", "Jerez", "Las Palmas", "Madrid", "Murcia", "Málaga", "Oviedo",
    "Palma", "Sabadell", "Santa Cruz de Tenerife", "Seville", "Terrassa", "Valencia",
    "Valladolid", "Vigo", "Vitoria-Gasteiz", "Zaragoza",
  ],
  "Sri Lanka": [
    "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Hambantota", "Jaffna",
    "Kandy", "Kurunegala", "Matara", "Negombo", "Polonnaruwa", "Ratnapura", "Trincomalee",
  ],
  "Sudan": [
    "Atbara", "El Fasher", "El Geneina", "El Obeid", "Gedaref", "Kassala", "Khartoum", "Kosti",
    "Nyala", "Omdurman", "Port Sudan", "Wad Madani",
  ],
  "Sweden": [
    "Borås", "Eskilstuna", "Gothenburg", "Gävle", "Halmstad", "Helsingborg", "Jönköping",
    "Kalmar", "Karlstad", "Linköping", "Lund", "Malmö", "Norrköping", "Stockholm", "Sundsvall",
    "Södertälje", "Umeå", "Uppsala", "Västerås", "Örebro",
  ],
  "Switzerland": [
    "Basel", "Bern", "Biel/Bienne", "Chur", "Fribourg", "Geneva", "Köniz", "La Chaux-de-Fonds",
    "Lausanne", "Lucerne", "Lugano", "Neuchâtel", "Schaffhausen", "Sion", "St. Gallen", "Thun",
    "Vernier", "Winterthur", "Zürich",
  ],
  "Syria": [
    "Aleppo", "Ayn al-Arab", "Damascus", "Daraa", "Deir ez-Zor", "Douma", "Hama", "Hasakah",
    "Homs", "Latakia", "Qamishli", "Raqqa", "Tartus",
  ],
  "Taiwan": [
    "Changhua", "Hsinchu", "Hualien", "Kaohsiung", "Keelung", "New Taipei", "Pingtung",
    "Taichung", "Tainan", "Taipei", "Taitung", "Taoyuan", "Zhongli",
  ],
  "Tanzania": [
    "Arusha", "Dar es Salaam", "Dodoma", "Kahama", "Kigoma", "Lindi", "Mbeya", "Morogoro",
    "Moshi", "Musoma", "Mwanza", "Tabora", "Tanga", "Zanzibar City",
  ],
  "Thailand": [
    "Bangkok", "Chiang Mai", "Chiang Rai", "Chon Buri", "Hat Yai", "Khon Kaen", "Lampang",
    "Nakhon Ratchasima", "Nakhon Si Thammarat", "Nonthaburi", "Pak Kret", "Pattaya",
    "Phitsanulok", "Phuket", "Rayong", "Songkhla", "Surat Thani", "Ubon Ratchathani",
    "Udon Thani",
  ],
  "Tunisia": [
    "Ariana", "Ben Arous", "Bizerte", "Béja", "Ettadhamen", "Gabès", "Gafsa", "Kairouan",
    "Kasserine", "La Goulette", "Monastir", "Médenine", "Nabeul", "Sfax", "Sousse", "Tunis",
  ],
  "Turkey": [
    "Adana", "Adapazarı", "Ankara", "Antalya", "Balıkesir", "Batman", "Bursa", "Denizli",
    "Diyarbakır", "Elazığ", "Erzurum", "Eskişehir", "Gaziantep", "Gebze", "Istanbul", "Izmir",
    "Kahramanmaraş", "Kayseri", "Konya", "Malatya", "Manisa", "Mersin", "Samsun", "Siirt",
    "Sivas", "Trabzon", "Van", "Şanlıurfa",
  ],
  "Ukraine": [
    "Cherkasy", "Chernihiv", "Dnipro", "Donetsk", "Ivano-Frankivsk", "Kharkiv", "Kherson",
    "Khmelnytskyi", "Kryvyi Rih", "Kyiv", "Luhansk", "Lutsk", "Lviv", "Lviv", "Makiivka",
    "Mariupol", "Mykolaiv", "Odessa", "Poltava", "Rivne", "Simferopol", "Sumy", "Ternopil",
    "Uzhhorod", "Vinnytsia", "Zaporizhzhia", "Zhytomyr",
  ],
  "United Arab Emirates": [
    "Abu Dhabi", "Ajman", "Al Ain", "Dibba Al-Fujairah", "Dubai", "Fujairah", "Khor Fakkan",
    "Ras Al Khaimah", "Sharjah", "Umm Al Quwain",
  ],
  "United Kingdom": [
    "Aberdeen", "Belfast", "Birmingham", "Bradford", "Bristol", "Cambridge", "Cardiff",
    "Coventry", "Derby", "Dudley", "Dundee", "Edinburgh", "Glasgow", "Kingston upon Hull",
    "Leeds", "Leicester", "Liverpool", "London", "Luton", "Manchester", "Newcastle upon Tyne",
    "Northampton", "Nottingham", "Oxford", "Plymouth", "Portsmouth", "Reading", "Sheffield",
    "Southampton", "Stoke-on-Trent", "Sunderland", "Swansea", "Wolverhampton",
  ],
  "United States": [
    "Albuquerque", "Anchorage", "Atlanta", "Austin", "Baltimore", "Boston", "Charlotte",
    "Chicago", "Cincinnati", "Cleveland", "Colorado Springs", "Columbus", "Dallas", "Denver",
    "Detroit", "El Paso", "Fort Worth", "Fresno", "Honolulu", "Houston", "Indianapolis",
    "Jacksonville", "Las Vegas", "Long Beach", "Los Angeles", "Louisville", "Memphis", "Mesa",
    "Miami", "Milwaukee", "Minneapolis", "Nashville", "New Orleans", "New York",
    "Oklahoma City", "Omaha", "Orlando", "Philadelphia", "Phoenix", "Pittsburgh", "Portland",
    "Raleigh", "Riverside", "Sacramento", "San Antonio", "San Bernardino", "San Diego",
    "San Francisco", "San Jose", "Seattle", "Tampa", "Tucson", "Virginia Beach",
    "Washington D.C.",
  ],
  "Uruguay": [
    "Durazno", "Las Piedras", "Maldonado", "Melo", "Montevideo", "Paysandú", "Rivera", "Salto",
    "San José de Mayo", "Tacuarembó",
  ],
  "Uzbekistan": [
    "Andijan", "Bukhara", "Fergana", "Guliston", "Jizzakh", "Namangan", "Navoiy", "Nukus",
    "Qarshi", "Qashqadaryo", "Samarkand", "Tashkent", "Termez", "Urganch",
  ],
  "Venezuela": [
    "Barcelona", "Barinas", "Barquisimeto", "Cabimas", "Caracas", "Ciudad Guayana", "Coro",
    "Cumaná", "Los Teques", "Maracaibo", "Maracay", "Maturín", "Mérida", "Petare",
    "Punto Fijo", "San Cristóbal", "Turmero", "Valencia",
  ],
  "Vietnam": [
    "Biên Hòa", "Buôn Ma Thuột", "Cần Thơ", "Da Nang", "Hai Phong", "Hanoi",
    "Ho Chi Minh City", "Huế", "Hội An", "Long Xuyên", "Mỹ Tho", "Nam Định", "Nha Trang",
    "Quy Nhơn", "Rạch Giá", "Thủ Dầu Một", "Vũng Tàu", "Đà Lạt",
  ],
  "Yemen": [
    "Aden", "Ataq", "Dhamar", "Hajjah", "Hodeidah", "Ibb", "Mukalla", "Saada", "Sanaa", "Taiz",
    "Zinjibar",
  ],
  "Zambia": [
    "Chingola", "Chipata", "Kabwe", "Kasama", "Kitwe", "Livingstone", "Luanshya", "Lusaka",
    "Mufulira", "Ndola",
  ],
  "Zimbabwe": [
    "Bulawayo", "Chinhoyi", "Chitungwiza", "Epworth", "Gweru", "Harare", "Kadoma", "Kwekwe",
    "Marondera", "Masvingo", "Mutare", "Norton",
  ],
} as const satisfies Record<Country, readonly string[]>;

/** Cities for a country, or an empty list for unknown / empty input. */
export const getCities = (country: string | null | undefined): readonly string[] =>
  country && isCountry(country) ? CITIES_BY_COUNTRY[country] : [];
