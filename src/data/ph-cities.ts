// Philippine cities — comprehensive list for dropdown selection
export const PH_CITIES: string[] = [
    // NCR (Metro Manila)
    "Caloocan",
    "Las Piñas",
    "Makati",
    "Malabon",
    "Mandaluyong",
    "Manila",
    "Marikina",
    "Muntinlupa",
    "Navotas",
    "Parañaque",
    "Pasay",
    "Pasig",
    "Pateros",
    "Quezon City",
    "San Juan",
    "Taguig",
    "Valenzuela",

    // Region I (Ilocos)
    "Alaminos",
    "Batac",
    "Candon",
    "Dagupan",
    "Laoag",
    "San Carlos",
    "San Fernando",
    "Urdaneta",
    "Vigan",

    // Region II (Cagayan Valley)
    "Cauayan",
    "Ilagan",
    "Santiago",
    "Tuguegarao",

    // Region III (Central Luzon)
    "Angeles",
    "Balanga",
    "Cabanatuan",
    "Gapan",
    "Malolos",
    "Meycauayan",
    "Olongapo",
    "Palayan",
    "San Jose",
    "San Jose Del Monte",
    "Science City Of Muñoz",
    "Tarlac City",

    // Region IV-A (CALABARZON)
    "Antipolo",
    "Bacoor",
    "Batangas City",
    "Biñan",
    "Cabuyao",
    "Calamba",
    "Cavite City",
    "Dasmariñas",
    "General Trias",
    "Imus",
    "Lipa",
    "Lucena",
    "San Pablo",
    "San Pedro",
    "Santa Rosa",
    "Santo Tomas",
    "Tagaytay",
    "Tanauan",
    "Trece Martires",

    // Region IV-B (MIMAROPA)
    "Calapan",
    "Puerto Princesa",

    // Region V (Bicol)
    "Iriga",
    "Legazpi",
    "Ligao",
    "Masbate City",
    "Naga",
    "Sorsogon City",
    "Tabaco",

    // Region VI (Western Visayas)
    "Bacolod",
    "Bago",
    "Cadiz",
    "Escalante",
    "Iloilo City",
    "Kabankalan",
    "La Carlota",
    "Passi",
    "Roxas City",
    "Sagay",
    "San Carlos",
    "Silay",
    "Sipalay",
    "Talisay",
    "Victorias",

    // Region VII (Central Visayas)
    "Bais",
    "Bayawan",
    "Bogo",
    "Carcar",
    "Cebu City",
    "Danao",
    "Dumaguete",
    "Guihulngan",
    "Lapu-Lapu",
    "Mandaue",
    "Naga",
    "Talisay",
    "Toledo",

    // Region VIII (Eastern Visayas)
    "Baybay",
    "Calbayog",
    "Catbalogan",
    "Maasin",
    "Ormoc",
    "Tacloban",

    // Region IX (Zamboanga Peninsula)
    "Dapitan",
    "Dipolog",
    "Isabela City",
    "Pagadian",
    "Zamboanga City",

    // Region X (Northern Mindanao)
    "Cagayan De Oro",
    "El Salvador",
    "Gingoog",
    "Iligan",
    "Malaybalay",
    "Oroquieta",
    "Ozamiz",
    "Tangub",
    "Valencia",

    // Region XI (Davao)
    "Davao City",
    "Digos",
    "Island Garden City Of Samal",
    "Mati",
    "Panabo",
    "Tagum",

    // Region XII (SOCCSKSARGEN)
    "General Santos",
    "Kidapawan",
    "Koronadal",
    "Tacurong",

    // Region XIII (Caraga)
    "Bayugan",
    "Bislig",
    "Butuan",
    "Cabadbaran",
    "Surigao City",
    "Tandag",

    // BARMM
    "Cotabato City",
    "Lamitan",
    "Marawi",

    // CAR (Cordillera)
    "Baguio",
    "Tabuk",
];

// De-duplicated & sorted for display
export const PH_CITIES_SORTED = [...new Set(PH_CITIES)].sort((a, b) => a.localeCompare(b));
