import { Track } from '../types';

// Standard public testing Jamendo Client ID
const DEFAULT_JAMENDO_CLIENT_ID = '56d30c95';

const getJamendoClientId = () => {
  // Use user-provided env variable if available, otherwise fallback to the public test key
  return (import.meta as any).env.VITE_JAMENDO_CLIENT_ID || DEFAULT_JAMENDO_CLIENT_ID;
};

// Curated high-quality, ultra-stable backup Creative Commons tracks
export const CURATED_FALLBACK_TRACKS: Track[] = [
  {
    id: 'fallback-1',
    title: 'Springish',
    artistName: 'Gillicuddy',
    albumName: 'The Winter Of My First Year',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    audioUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/Gillicuddy/The_Winter_of_My_First_Year/Gillicuddy_-_05_-_Springish.mp3',
    durationSeconds: 154,
    licenseUrl: 'https://creativecommons.org/licenses/by-nc/3.0/',
    source: 'archive',
    genre: 'acoustic',
  },
  {
    id: 'fallback-2',
    title: 'Warm Vacuum Tube',
    artistName: 'Meydän',
    albumName: 'Ambient i',
    coverUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80',
    audioUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/Meydan_-_02_-_Warm_Vacuum_Tube.mp3',
    durationSeconds: 261,
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'archive',
    genre: 'ambient',
  },
  {
    id: 'fallback-3',
    title: 'Melancholy',
    artistName: 'Lobo Loco',
    albumName: 'Around the Corner',
    coverUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80',
    audioUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Lobo_Loco/Around_the_Corner/Lobo_Loco_-_01_-_Melancholy_ID_282.mp3',
    durationSeconds: 198,
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    source: 'archive',
    genre: 'lofi',
  },
  {
    id: 'fallback-4',
    title: 'Ethereal Space',
    artistName: 'Stellardrone',
    albumName: 'Light Years',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
    audioUrl: 'https://archive.org/download/stellardrone-light-years/04-stellardrone-light-years.mp3',
    durationSeconds: 310,
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    source: 'archive',
    genre: 'ambient',
  },
  {
    id: 'fallback-5',
    title: 'Acoustic Guitar Meditation',
    artistName: 'Jason Shaw',
    albumName: 'Audionautix',
    coverUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80',
    audioUrl: 'https://freemusicarchive.org/music/music/no_curator/Jason_Shaw/Audionautix_Acoustic/AS_-_AcousticMeditation2.mp3',
    durationSeconds: 202,
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/us/',
    source: 'archive',
    genre: 'acoustic',
  }
];

export async function fetchJamendoTracks(params: {
  limit?: number;
  search?: string;
  genre?: string;
  order?: string;
}): Promise<Track[]> {
  const clientId = getJamendoClientId();
  const limit = params.limit || 30;
  const search = params.search ? encodeURIComponent(params.search) : '';
  const genre = params.genre ? encodeURIComponent(params.genre) : '';
  const order = params.order || (params.search ? 'relevance' : 'popularity_month');

  // Construct URL
  let url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=${limit}&order=${order}&include=musicinfo`;

  if (search) {
    url += `&search=${search}`;
  }
  if (genre) {
    url += `&tags=${genre}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Jamendo API responded with status ${res.status}`);
    }
    const data = await res.json();
    
    if (data.headers?.status === 'failed') {
      throw new Error(data.headers.error_message || 'Jamendo API request failed');
    }

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Map Jamendo results to internal Track model
    return data.results.map((item: any) => ({
      id: item.id,
      title: item.name,
      artistName: item.artist_name,
      albumName: item.album_name || 'Single',
      coverUrl: item.album_image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
      audioUrl: item.audio,
      durationSeconds: parseInt(item.duration, 10) || 180,
      licenseUrl: item.license_ccurl || 'https://creativecommons.org/licenses/by/4.0/',
      source: 'jamendo',
      genre: item.musicinfo?.tags?.genres?.[0] || 'Unknown',
    }));
  } catch (error) {
    console.warn('Jamendo API call failed, falling back to curated tracks:', error);
    // Filter backup tracks if there was a specific genre search
    if (genre) {
      const filtered = CURATED_FALLBACK_TRACKS.filter(t => t.genre?.toLowerCase() === params.genre?.toLowerCase());
      return filtered.length > 0 ? filtered : CURATED_FALLBACK_TRACKS;
    }
    if (search) {
      const query = params.search?.toLowerCase() || '';
      return CURATED_FALLBACK_TRACKS.filter(
        t => t.title.toLowerCase().includes(query) || t.artistName.toLowerCase().includes(query)
      );
    }
    return CURATED_FALLBACK_TRACKS;
  }
}

export const CURATED_REGIONAL_TRACKS: Track[] = [
  // --- TELUGU ---
  {
    id: 'telugu-buttabomma',
    title: 'Butta Bomma',
    artistName: 'Armaan Malik, Thaman S',
    albumName: 'Ala Vaikunthapurramuloo',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
    audioUrl: 'https://archive.org/download/butta-bomma/ButtaBomma.mp3',
    durationSeconds: 227,
    source: 'archive',
    genre: 'Telugu',
    searchTags: ['butta bomma', 'buttabomma', 'armaan malik', 'thaman', 'ala vaikunthapurramuloo', 'padi padi leche', 'telugu song']
  },
  {
    id: 'telugu-samajavaragamana',
    title: 'Samajavaragamana',
    artistName: 'Sid Sriram, Thaman S',
    albumName: 'Ala Vaikunthapurramuloo',
    coverUrl: 'https://images.unsplash.com/photo-1513829096999-4978602297a7?w=400&q=80',
    audioUrl: 'https://archive.org/download/samajavaragamana/samajavaragamana.mp3',
    durationSeconds: 221,
    source: 'archive',
    genre: 'Telugu',
    searchTags: ['samajavaragamana', 'sid sriram', 'thaman', 'ala vaikunthapurramuloo', 'mallepuvvu', 'telugu song']
  },
  {
    id: 'telugu-ramuloo',
    title: 'Ramuloo Ramulaa',
    artistName: 'Anurag Kulkarni, Mangli, Thaman S',
    albumName: 'Ala Vaikunthapurramuloo',
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80',
    audioUrl: 'https://archive.org/download/ramu-ramulaa/Ramu-Ramulaa.mp3',
    durationSeconds: 282,
    source: 'archive',
    genre: 'Telugu',
    searchTags: ['ramuloo ramulaa', 'ramulo ramula', 'anurag kulkarni', 'mangli', 'thaman', 'ala vaikunthapurramuloo', 'telugu song']
  },
  
  // --- HINDI ---
  {
    id: 'hindi-tumhinho',
    title: 'Tum Hi Ho',
    artistName: 'Arijit Singh, Mithoon',
    albumName: 'Aashiqui 2',
    coverUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&q=80',
    audioUrl: 'https://archive.org/download/arijit-singh-tum-hi-ho-myfreemp-3.vip/Arijit%20Singh%20-%20Tum%20Hi%20Ho%20myfreemp3.vip%20.mp3',
    durationSeconds: 262,
    source: 'archive',
    genre: 'Hindi',
    searchTags: ['tum hi ho', 'arijit singh', 'mithoon', 'aashiqui 2', 'hum tere bin', 'kyunki tum hi ho', 'hindi song']
  },
  {
    id: 'hindi-chahunmain',
    title: 'Chahun Main Ya Naa',
    artistName: 'Arijit Singh, Palak Muchhal',
    albumName: 'Aashiqui 2',
    coverUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80',
    audioUrl: 'https://archive.org/download/CHAHUNMAINYANAAREMIXDJKHUSHI/CHAHUN-MAIN-YA-NAA-REMIX-DJ-KHUSHI.mp3',
    durationSeconds: 304,
    source: 'archive',
    genre: 'Hindi',
    searchTags: ['chahun main ya naa', 'chahun main ya na', 'arijit singh', 'palak muchhal', 'aashiqui 2', 'tu hi ye mujhko', 'hindi song']
  },
  {
    id: 'hindi-kabira',
    title: 'Kabira',
    artistName: 'Tochi Raina, Rekha Bhardwaj, Pritam',
    albumName: 'Yeh Jawaani Hai Deewani',
    coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80',
    audioUrl: 'https://archive.org/download/kabirafullsongyehjawaanihaideewaniranbirkapoordeepikapadukone/_Kabira_Full_Song_Yeh_Jawaani_Hai_Deewani___Ranbir_Kapoor_Deepika_Padukone.mp3',
    durationSeconds: 223,
    source: 'archive',
    genre: 'Hindi',
    searchTags: ['kabira', 'tochi raina', 'rekha bhardwaj', 'pritam', 'yeh jawaani hai deewani', 'yjhd', 're kabira maan ja', 'hindi song']
  },
 
  // --- TAMIL ---
  {
    id: 'tamil-rowdybaby',
    title: 'Rowdy Baby',
    artistName: 'Dhanush, Dhee, Yuvan Shankar Raja',
    albumName: 'Maari 2',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    audioUrl: 'https://archive.org/download/rowdy-baby-yuvan-shankar-raja-tamil/Rowdy%20Baby%20-%20Yuvan%20Shankar%20Raja%20!%20Tamil.mp3',
    durationSeconds: 284,
    source: 'archive',
    genre: 'Tamil',
    searchTags: ['rowdy baby', 'dhanush', 'dhee', 'yuvan', 'maari 2', 'tamil song']
  },
  {
    id: 'tamil-arabickuthu',
    title: 'Arabic Kuthu',
    artistName: 'Anirudh Ravichander, Jonita Gandhi',
    albumName: 'Beast',
    coverUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80',
    audioUrl: 'https://archive.org/download/arabic-kuthu/Arabic%20Kuthu.mp3',
    durationSeconds: 280,
    source: 'archive',
    genre: 'Tamil',
    searchTags: ['arabic kuthu', 'halamithi habibo', 'anirudh', 'jonita gandhi', 'beast', 'vijay', 'tamil song']
  },
 
  // --- MALAYALAM ---
  {
    id: 'malayalam-malare',
    title: 'Malare',
    artistName: 'Vijay Yesudas, Rajesh Murugesan',
    albumName: 'Premam',
    coverUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80',
    audioUrl: 'https://archive.org/download/01PremamSceneContraMaango.me/07%20-%20Premam%20-%20Malare%20%5BMaango.me%5D.mp3',
    durationSeconds: 316,
    source: 'archive',
    genre: 'Malayalam',
    searchTags: ['malare', 'vijay yesudas', 'rajesh murugesan', 'premam', 'sai pallavi', 'nivin pauly', 'malayalam song']
  },
  {
    id: 'malayalam-aluva',
    title: 'Aluva Puzha',
    artistName: 'Vineeth Sreenivasan, Rajesh Murugesan',
    albumName: 'Premam',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
    audioUrl: 'https://archive.org/download/01PremamSceneContraMaango.me/04%20-%20Premam%20-%20Aluva%20Puzha%20%5BMaango.me%5D.mp3',
    durationSeconds: 232,
    source: 'archive',
    genre: 'Malayalam',
    searchTags: ['aluva puzha', 'aluva', 'vineeth sreenivasan', 'rajesh murugesan', 'premam', 'malayalam song']
  }
];

export function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

export function searchCuratedTracks(queryStr: string): Track[] {
  const query = queryStr.toLowerCase().trim();
  if (!query) return [];

  const queryWords = query.split(/\s+/).filter(w => w.length > 0);
  if (queryWords.length === 0) return [];

  const localPool = [...CURATED_REGIONAL_TRACKS, ...CURATED_FALLBACK_TRACKS];
  const resultsWithScores = localPool.map(track => {
    let maxScore = 0;
    
    const title = track.title.toLowerCase();
    const artist = track.artistName.toLowerCase();
    const album = track.albumName.toLowerCase();
    const genre = (track.genre || '').toLowerCase();
    
    // 1. Exact full substring matches (highest priority)
    if (title.includes(query)) {
      maxScore = Math.max(maxScore, 100);
    } else if (artist.includes(query)) {
      maxScore = Math.max(maxScore, 90);
    } else if (album.includes(query)) {
      maxScore = Math.max(maxScore, 80);
    } else if (genre.includes(query)) {
      maxScore = Math.max(maxScore, 70);
    }
    
    // 2. Stripped matching (handles spaces removal/addition like "buttabomma" or "rowdybaby")
    const cleanTitle = title.replace(/\s+/g, '');
    const cleanQuery = query.replace(/\s+/g, '');
    if (cleanTitle.includes(cleanQuery) || cleanQuery.includes(cleanTitle)) {
      maxScore = Math.max(maxScore, 95);
    } else {
      const fullDistance = getLevenshteinDistance(cleanQuery, cleanTitle);
      if (cleanQuery.length >= 4 && fullDistance <= 2) {
        maxScore = Math.max(maxScore, 85);
      }
    }
    
    // 3. Word-by-word token matching (handles words in different orders and minor typos)
    const trackWords = `${title} ${artist} ${album} ${genre}`.split(/\s+/).filter(w => w.length > 0);
    let matchedWordsCount = 0;
    
    for (const qWord of queryWords) {
      let bestWordScore = 0;
      for (const tWord of trackWords) {
        // Exact word match
        if (tWord === qWord) {
          bestWordScore = Math.max(bestWordScore, 50);
        }
        // Substring word match
        else if (tWord.includes(qWord) || qWord.includes(tWord)) {
          bestWordScore = Math.max(bestWordScore, 30);
        }
        // Fuzzy Levenshtein match (typo tolerance)
        else {
          const distance = getLevenshteinDistance(qWord, tWord);
          const maxLength = Math.max(qWord.length, tWord.length);
          const allowedTypos = qWord.length > 4 ? 2 : 1;
          
          if (qWord.length >= 3 && distance <= allowedTypos) {
            const similarity = 1 - distance / maxLength;
            bestWordScore = Math.max(bestWordScore, Math.floor(similarity * 40));
          }
        }
      }
      if (bestWordScore > 0) {
        matchedWordsCount++;
      }
    }
    
    // Calculate total token score
    if (matchedWordsCount > 0) {
      const tokenScore = Math.floor((matchedWordsCount / queryWords.length) * 60);
      maxScore = Math.max(maxScore, tokenScore);
    }
    
    return { track, score: maxScore };
  });

  // Filter out tracks that did not match (score 0) and sort by score descending
  return resultsWithScores
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.track);
}

function isFileMatch(file: any, queryWords: string[], queryStr: string): boolean {
  const name = file.name.toLowerCase();
  const title = (file.title || '').toLowerCase();
  
  // 1. Direct substring check
  if (name.includes(queryStr) || title.includes(queryStr)) return true;
  
  // 2. Remove all spaces and check
  const cleanName = name.replace(/[^a-z0-9]/g, '');
  const cleanQuery = queryStr.replace(/[^a-z0-9]/g, '');
  if (cleanQuery.length >= 3 && (cleanName.includes(cleanQuery) || cleanQuery.includes(cleanName))) return true;
  
  // 3. Word-by-word match (skip very short words)
  for (const word of queryWords) {
    if (word.length < 3) continue;
    if (name.includes(word) || title.includes(word)) return true;
  }
  
  // 4. Fuzzy Levenshtein match for minor typos in song name
  if (queryStr.length >= 5) {
    const fileWords = `${name} ${title}`.split(/[^a-z0-9]+/i).filter(w => w.length >= 4);
    for (const fWord of fileWords) {
      if (Math.abs(fWord.length - queryStr.length) <= 2) {
        if (getLevenshteinDistance(queryStr, fWord) <= 2) {
          return true;
        }
      }
    }
  }
  
  return false;
}

export async function fetchInternetArchiveTracks(queryStr: string): Promise<Track[]> {
  try {
    const lowerQuery = queryStr.toLowerCase();
    
    // Check for matching curated regional tracks first
    let curatedList: Track[] = [];
    if (lowerQuery.includes('telugu')) {
      curatedList = CURATED_REGIONAL_TRACKS.filter(t => t.genre === 'Telugu');
    } else if (lowerQuery.includes('hindi') || lowerQuery.includes('bollywood')) {
      curatedList = CURATED_REGIONAL_TRACKS.filter(t => t.genre === 'Hindi');
    } else if (lowerQuery.includes('tamil')) {
      curatedList = CURATED_REGIONAL_TRACKS.filter(t => t.genre === 'Tamil');
    } else if (lowerQuery.includes('malayalam')) {
      curatedList = CURATED_REGIONAL_TRACKS.filter(t => t.genre === 'Malayalam');
    }

    // Clean and optimize query for search
    const cleanQuery = queryStr.replace(/[^\w\s\-\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF\u0D00-\u0D7F]/gi, ' ');
    let targetSearch = cleanQuery;
    
    // Guide the archive search queries to fetch albums with movie tracks
    if (lowerQuery === 'telugu') {
      targetSearch = 'telugu movie mp3 songs';
    } else if (lowerQuery === 'hindi' || lowerQuery === 'bollywood') {
      targetSearch = 'bollywood hindi movie mp3';
    } else if (lowerQuery === 'tamil') {
      targetSearch = 'tamil movie mp3 songs';
    } else if (lowerQuery === 'malayalam') {
      targetSearch = 'malayalam movie mp3 songs';
    } else if (lowerQuery === 'kannada') {
      targetSearch = 'kannada movie mp3';
    } else if (lowerQuery === 'punjabi') {
      targetSearch = 'punjabi mp3';
    }

    const query = encodeURIComponent(`mediatype:(audio) AND (${targetSearch})`);
    // Optimize: query 15 rows instead of 30, and sort by downloads desc to get high-quality sources first
    const url = `https://archive.org/advancedsearch.php?q=${query}&fl[]=identifier,title,creator,album,downloads&sort[]=downloads+desc&rows=15&output=json`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Internet Archive search failed with status ${res.status}`);
    }
    const data = await res.json();
    const docs = data.response?.docs || [];

    // Map Archive.org tracks: fetch metadata for all documents, then return all MP3 files as individual tracks!
    const trackPromises = docs.map(async (doc: any) => {
      if (!doc.identifier || !doc.title) return [];

      try {
        // Fetch metadata to find the actual MP3 filename
        const metaUrl = `https://archive.org/metadata/${doc.identifier}`;
        const metaRes = await fetch(metaUrl);
        if (!metaRes.ok) throw new Error('Meta fetch failed');
        const metaData = await metaRes.json();
        
        const lowerTitle = (doc.title || '').toLowerCase();
        const lowerId = (doc.identifier || '').toLowerCase();
        const lowerCreator = (doc.creator || '').toLowerCase();
        const lowerAlbum = (doc.album || '').toLowerCase();
        
        // Categories/Genres: treat them as global matches to allow browsing
        const CATEGORIES = ['telugu', 'hindi', 'tamil', 'malayalam', 'kannada', 'punjabi', 'lofi', 'ambient', 'electronic', 'acoustic', 'soundtrack', 'bollywood', 'indian', 'classical', 'instrumental', 'devotional', 'carnatic', 'hindustani'];
        const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 0);
        
        const isCategoryQuery = queryWords.some(w => CATEGORIES.includes(w));
        const isAlbumMatch = 
          isCategoryQuery ||
          lowerQuery.length < 4 ||
          lowerTitle.includes(lowerQuery) || 
          lowerId.includes(lowerQuery) || 
          lowerAlbum.includes(lowerQuery) ||
          lowerCreator.includes(lowerQuery);

        let filteredFiles = metaData.files?.filter((f: any) => 
          f.name && 
          f.name.toLowerCase().endsWith('.mp3') && 
          !f.name.toLowerCase().includes('_thumb') &&
          !f.name.toLowerCase().includes('_meta')
        ) || [];

        // If not an album/category match, filter files that match the song query words
        if (!isAlbumMatch && queryWords.length > 0) {
          filteredFiles = filteredFiles.filter((file: any) => isFileMatch(file, queryWords, lowerQuery));
        }

        // Limit to top 15 tracks per collection to avoid performance issues
        const mp3Files = filteredFiles.slice(0, 15);

        if (mp3Files.length === 0) return [];

        return mp3Files.map((file: any) => {
          // Format direct audio URL - split and encode path segments to avoid encoding folder slashes
          const audioUrl = `https://archive.org/download/${doc.identifier}/${file.name.split('/').map(encodeURIComponent).join('/')}`;
          
          // Determine duration from metadata if present
          let duration = 240; // Default fallback
          if (file.length) {
            const parts = file.length.split(':');
            if (parts.length === 3) {
              duration = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
            } else if (parts.length === 2) {
              duration = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            } else {
              const parsed = parseFloat(file.length);
              if (!isNaN(parsed)) duration = Math.round(parsed);
            }
          } else if (file.duration) {
            const parsed = parseFloat(file.duration);
            if (!isNaN(parsed)) duration = Math.round(parsed);
          }

          // Clean title: use the file title if available, otherwise format the filename
          const rawTitle = file.title || file.name.split('/').pop()?.replace(/\.mp3$/i, '').replace(/_/g, ' ') || 'Unknown Track';
          const cleanTitle = rawTitle.replace(/^\d+[\s\-_]*/, '').trim();

          return {
            id: `${doc.identifier}-${file.name}`,
            title: cleanTitle,
            artistName: doc.creator || file.creator || 'Indian Cinema',
            albumName: doc.album || doc.title || 'Archive Collection',
            coverUrl: `https://archive.org/services/img/${doc.identifier}` || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
            audioUrl: audioUrl,
            durationSeconds: duration,
            source: 'archive' as const,
            genre: 'Regional Hits',
          };
        });
      } catch (err) {
        // Fallback to direct stream guessing if metadata call fails, to ensure we still output a result
        const fallbackStream = `https://archive.org/download/${doc.identifier}/${doc.identifier}_vbr.mp3`;
        return [{
          id: doc.identifier,
          title: doc.title,
          artistName: doc.creator || 'Indian Cinema',
          albumName: doc.album || doc.title || 'Archive Collection',
          coverUrl: `https://archive.org/services/img/${doc.identifier}` || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
          audioUrl: fallbackStream,
          durationSeconds: 240,
          source: 'archive' as const,
          genre: 'Regional Hits',
        }];
      }
    });

    const resolvedArrays = await Promise.all(trackPromises);
    const validFetchedTracks = resolvedArrays.flat();

    // Merge curated hits with fetched tracks to provide an ultra-rich experience
    // Remove duplicates from the fetched list that are already in curated
    const curatedIds = new Set(curatedList.map(t => t.id));
    const uniqueFetched = validFetchedTracks.filter(t => !curatedIds.has(t.id));

    return [...curatedList, ...uniqueFetched];
  } catch (error) {
    console.warn('Internet Archive fetch failed:', error);
    // On failure, still return whatever curated tracks we have matching the query
    const lowerQuery = queryStr.toLowerCase();
    if (lowerQuery.includes('telugu')) {
      return CURATED_REGIONAL_TRACKS.filter(t => t.genre === 'Telugu');
    } else if (lowerQuery.includes('hindi') || lowerQuery.includes('bollywood')) {
      return CURATED_REGIONAL_TRACKS.filter(t => t.genre === 'Hindi');
    } else if (lowerQuery.includes('tamil')) {
      return CURATED_REGIONAL_TRACKS.filter(t => t.genre === 'Tamil');
    } else if (lowerQuery.includes('malayalam')) {
      return CURATED_REGIONAL_TRACKS.filter(t => t.genre === 'Malayalam');
    }
    return [];
  }
}
