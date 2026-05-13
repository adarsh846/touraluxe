/**
 * Sovereign Geography Manifest
 * A curated local atlas of global destinations for offline validation.
 */

export const MAJOR_DESTINATIONS = [
  // --- COUNTRIES ---
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Korea", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway",
  "Oman",
  "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Samoa", "San Marino", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe",

  // --- EUROPEAN HOTSPOTS ---
  "London", "Paris", "Rome", "Barcelona", "Madrid", "Lisbon", "Porto", "Florence", "Venice", "Milan", "Amalfi Coast", "Capri", "Positano", "Sorrento", "Santorini", "Mykonos", "Crete", "Athens", "Rhodes", "Dubrovnik", "Split", "Hvar", "Prague", "Budapest", "Vienna", "Salzburg", "Hallstatt", "Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Amsterdam", "Rotterdam", "Stockholm", "Copenhagen", "Oslo", "Helsinki", "Reykjavik", "Blue Lagoon", "Strasbourg", "Nice", "Cannes", "St. Tropez", "Bordeaux", "Lyon", "Marseille", "Chamonix", "Courchevel", "Val d'Isere", "Zermatt", "Interlaken", "Lucerne", "Zurich", "Geneva", "St. Moritz", "Innsbruck", "Kitzbuhel", "Brussels", "Bruges", "Antwerp", "Luxembourg City", "Warsaw", "Krakow", "Bratislava", "Ljubljana", "Lake Bled", "Zagreb", "Sarajevo", "Belgrade", "Sofia", "Bucharest", "Athens", "Thessaloniki", "Meteora", "Edinburgh", "Glasgow", "Isle of Skye", "Dublin", "Galway", "Cork", "Belfast", "Cardiff", "Manx", "Ibiza", "Majorca", "Menorca", "Tenerife", "Lanzarote", "Gran Canaria", "Fuerteventura", "Faro", "Albufeira", "Lagos", "Madeira", "Azores",

  // --- ASIAN HOTSPOTS ---
  "Tokyo", "Kyoto", "Osaka", "Nara", "Hakone", "Sapporo", "Niseko", "Okinawa", "Fukuoka", "Hiroshima", "Seoul", "Busan", "Jeju Island", "Incheon", "Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Chengdu", "Xi'an", "Hangzhou", "Suzhou", "Guilin", "Lhasa", "Hong Kong", "Macau", "Taipei", "Kaohsiung", "Bangkok", "Chiang Mai", "Chiang Rai", "Phuket", "Krabi", "Koh Samui", "Koh Phangan", "Koh Tao", "Pattaya", "Hua Hin", "Hanoi", "Ho Chi Minh City", "Da Nang", "Hoi An", "Nha Trang", "Ha Long Bay", "Phu Quoc", "Siem Reap", "Angkor Wat", "Phnom Penh", "Luang Prabang", "Vientiane", "Kuala Lumpur", "Malacca", "Penang", "Langkawi", "Kota Kinabalu", "Singapore", "Sentosa", "Jakarta", "Bali", "Ubud", "Seminyak", "Canggu", "Uluwatu", "Nusa Penida", "Lombok", "Gili Islands", "Komodo Island", "Borobudur", "Yogyakarta", "Manila", "Boracay", "Palawan", "El Nido", "Coron", "Cebu", "Siargao", "Bohol", "Kathmandu", "Pokhara", "Everest Base Camp", "Thimphu", "Paro", "Colombo", "Kandy", "Ella", "Galle", "Mirissa", "Sigiriya", "Nuwara Eliya", "Male", "Maafushi", "Baa Atoll", "Ari Atoll",

  // --- MIDDLE EAST & AFRICA HOTSPOTS ---
  "Dubai", "Abu Dhabi", "Doha", "Muscat", "Salalah", "Riyadh", "Jeddah", "AlUla", "Petra", "Wadi Rum", "Amman", "Dead Sea", "Jerusalem", "Tel Aviv", "Beirut", "Cairo", "Luxor", "Aswan", "Sharm El Sheikh", "Hurghada", "Alexandria", "Marrakech", "Casablanca", "Fes", "Chefchaouen", "Agadir", "Essaouira", "Tunis", "Sousse", "Algiers", "Cape Town", "Johannesburg", "Kruger National Park", "Garden Route", "Durban", "Victoria Falls", "Nairobi", "Maasai Mara", "Mombasa", "Zanzibar", "Dar es Salaam", "Serengeti", "Ngorongoro", "Mount Kilimanjaro", "Addis Ababa", "Lalibela", "Antananarivo", "Nosy Be", "Mauritius", "Seychelles", "Mahe", "Praslin", "La Digue", "Reunion Island",

  // --- AMERICAS HOTSPOTS ---
  "New York City", "Los Angeles", "Chicago", "Miami", "Orlando", "San Francisco", "Las Vegas", "Washington D.C.", "Seattle", "New Orleans", "Boston", "Honolulu", "Maui", "Kauai", "Oahu", "Aspen", "Vail", "Park City", "Grand Canyon", "Yellowstone", "Yosemite", "Toronto", "Vancouver", "Montreal", "Quebec City", "Whistler", "Banff", "Jasper", "Mexico City", "Cancun", "Tulum", "Playa del Carmen", "Cozumel", "Puerto Vallarta", "Los Cabos", "Oaxaca", "Merida", "Havana", "Varadero", "Punta Cana", "Santo Domingo", "San Juan", "Nassau", "Grand Cayman", "Barbados", "Saint Lucia", "Antigua", "Costa Rica", "San Jose", "La Fortuna", "Manuel Antonio", "Panama City", "Cartagena", "Bogota", "Medellin", "Quito", "Galapagos Islands", "Lima", "Cusco", "Machu Picchu", "Santiago", "Atacama Desert", "Patagonia", "Torres del Paine", "Buenos Aires", "Iguazu Falls", "Mendoza", "Rio de Janeiro", "Sao Paulo", "Salvador", "Amazon Rainforest", "Montevideo", "Punta del Este",

  // --- OCEANIA HOTSPOTS ---
  "Sydney", "Melbourne", "Brisbane", "Gold Coast", "Cairns", "Great Barrier Reef", "Perth", "Adelaide", "Byron Bay", "Auckland", "Queenstown", "Christchurch", "Rotorua", "Milford Sound", "Fiji", "Nadi", "Bora Bora", "Tahiti", "Moorea", "Cook Islands", "Rarotonga", "Vanuatu", "Samoa",

  // --- INDIAN SUBCONTINENT HOTSPOTS ---
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Goa", "North Goa", "South Goa", "Udaipur", "Jaipur", "Jodhpur", "Jaisalmer", "Pushkar", "Rishikesh", "Haridwar", "Shimla", "Manali", "Kasol", "Spiti Valley", "Leh", "Ladakh", "Kashmir", "Srinagar", "Gulmarg", "Pahalgam", "Amritsar", "Dharamshala", "McLeod Ganj", "Varanasi", "Agra", "Taj Mahal", "Khajuraho", "Hampi", "Mysore", "Coorg", "Wayanad", "Munnar", "Alleppey", "Varkala", "Kochi", "Thekkady", "Kumarakom", "Pondicherry", "Mahabalipuram", "Madurai", "Kanyakumari", "Rameswaram", "Ooty", "Kodaikanal", "Andaman Islands", "Port Blair", "Havelock Island", "Lakshadweep", "Ayodhya", "Kedarnath", "Badrinath", "Tirupati", "Statue of Unity", "Somnath", "Dwarka", "Mount Abu", "Ranthambore", "Jim Corbett", "Rajasthan", "Kerala", "Himachal Pradesh", "Uttarakhand", "Northeast India", "Meghalaya", "Sikkim", "Arunachal Pradesh"
];

/**
 * Calculates the Jaro-Winkler similarity between two strings.
 * Returns a score between 0 and 1 (1 being identical).
 */
function getJaroWinklerSimilarity(s1: string, s2: string): number {
  let m = 0;
  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1 === s2) return 1;

  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  for (let i = 0; i < s1.length; i++) {
    const low = Math.max(0, i - range);
    const high = Math.min(i + range + 1, s2.length);
    for (let j = low; j < high; j++) {
      if (!s1Matches[i] && !s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
  }

  if (m === 0) return 0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
  }

  const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
  const p = 0.1; // Scaling factor
  let l = 0; // Length of common prefix up to 4 characters
  while (s1[l] === s2[l] && l < 4) l++;

  return jaro + l * p * (1 - jaro);
}

/**
 * Validates if a text input matches a known destination EXACTLY.
 */
export function validateLocation(input: string): string | null {
  const query = input.trim().toLowerCase();
  if (query.length < 2) return null;

  // Direct Match (Strict)
  const directMatch = MAJOR_DESTINATIONS.find(d => d.toLowerCase() === query);
  if (directMatch) return directMatch;

  // Word-boundary Match (e.g., "Paris trip" contains "Paris")
  const partialMatch = MAJOR_DESTINATIONS.find(d => {
    const dest = d.toLowerCase();
    const words = query.split(/\s+/);
    return words.includes(dest);
  });
  
  if (partialMatch) return partialMatch;

  return null;
}

/**
 * Finds the closest matching destination using a Hybrid Jaro-Winkler & Tokenized approach.
 */
export function getSuggestion(input: string): string | null {
  const query = input.trim().toLowerCase();
  if (query.length < 3) return null;

  let bestMatch: string | null = null;
  let maxScore = 0.85; // Minimum similarity threshold (0 to 1)

  // Tokenize query for multi-word matching
  const queryTokens = query.split(/\s+/);

  for (const dest of MAJOR_DESTINATIONS) {
    const d = dest.toLowerCase();
    
    // 1. Check for Prefix/Substring Boost
    if (d.startsWith(query) || query.startsWith(d)) {
      return dest; // Immediate high-confidence match
    }

    // 2. Tokenized Sub-match (e.g., "Valley Spiti" -> "Spiti Valley")
    const destTokens = d.split(/\s+/);
    const hasTokenOverlap = queryTokens.some(qt => destTokens.some(dt => dt.includes(qt) || qt.includes(dt)));
    
    // 3. Jaro-Winkler Similarity
    const score = getJaroWinklerSimilarity(query, d);
    
    // Boost score if there's token overlap
    const finalScore = hasTokenOverlap ? score + 0.05 : score;

    if (finalScore > maxScore) {
      maxScore = finalScore;
      bestMatch = dest;
    }
  }

  return bestMatch;
}
