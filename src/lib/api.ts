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
  const order = params.order || 'popularity_month';

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
    audioUrl: 'https://archive.org/download/telugump3songs_201910/02%20-%20ButtaBomma%20-%20SenSongsMp3.Co.mp3',
    durationSeconds: 227,
    source: 'archive',
    genre: 'Telugu',
  },
  {
    id: 'telugu-samajavaragamana',
    title: 'Samajavaragamana',
    artistName: 'Sid Sriram, Thaman S',
    albumName: 'Ala Vaikunthapurramuloo',
    coverUrl: 'https://images.unsplash.com/photo-1513829096999-4978602297a7?w=400&q=80',
    audioUrl: 'https://archive.org/download/telugump3songs_201910/01%20-%20Samajavaragamana%20-%20SenSongsMp3.Co.mp3',
    durationSeconds: 221,
    source: 'archive',
    genre: 'Telugu',
  },
  {
    id: 'telugu-ramuloo',
    title: 'Ramuloo Ramulaa',
    artistName: 'Anurag Kulkarni, Mangli, Thaman S',
    albumName: 'Ala Vaikunthapurramuloo',
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80',
    audioUrl: 'https://archive.org/download/telugump3songs_201910/03%20-%20Ramuloo%20Ramulaa%20-%20SenSongsMp3.Co.mp3',
    durationSeconds: 282,
    source: 'archive',
    genre: 'Telugu',
  },
  
  // --- HINDI ---
  {
    id: 'hindi-tumhinho',
    title: 'Tum Hi Ho',
    artistName: 'Arijit Singh, Mithoon',
    albumName: 'Aashiqui 2',
    coverUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&q=80',
    audioUrl: 'https://archive.org/download/Aashiqui2_2013/01%20Tum%20Hi%20Ho%20-%20Aashiqui%202%20%28128%20Kbps%29.mp3',
    durationSeconds: 262,
    source: 'archive',
    genre: 'Hindi',
  },
  {
    id: 'hindi-chahunmain',
    title: 'Chahun Main Ya Naa',
    artistName: 'Arijit Singh, Palak Muchhal',
    albumName: 'Aashiqui 2',
    coverUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80',
    audioUrl: 'https://archive.org/download/Aashiqui2_2013/03%20Chahun%20Main%20Ya%20Na%20-%20Aashiqui%202%20%28128%20Kbps%29.mp3',
    durationSeconds: 304,
    source: 'archive',
    genre: 'Hindi',
  },
  {
    id: 'hindi-kabira',
    title: 'Kabira',
    artistName: 'Tochi Raina, Rekha Bhardwaj, Pritam',
    albumName: 'Yeh Jawaani Hai Deewani',
    coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80',
    audioUrl: 'https://archive.org/download/KabiraYJHD/Kabira%20-%20YJHD%20-%20128%20Kbps.mp3',
    durationSeconds: 223,
    source: 'archive',
    genre: 'Hindi',
  },

  // --- TAMIL ---
  {
    id: 'tamil-rowdybaby',
    title: 'Rowdy Baby',
    artistName: 'Dhanush, Dhee, Yuvan Shankar Raja',
    albumName: 'Maari 2',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    audioUrl: 'https://archive.org/download/RowdyBabyMaari2/Rowdy%20Baby.mp3',
    durationSeconds: 284,
    source: 'archive',
    genre: 'Tamil',
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
  },

  // --- MALAYALAM ---
  {
    id: 'malayalam-malare',
    title: 'Malare',
    artistName: 'Vijay Yesudas, Rajesh Murugesan',
    albumName: 'Premam',
    coverUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80',
    audioUrl: 'https://archive.org/download/PremamMalare/Malare.mp3',
    durationSeconds: 316,
    source: 'archive',
    genre: 'Malayalam',
  },
  {
    id: 'malayalam-darshana',
    title: 'Darshana',
    artistName: 'Hesham Abdul Wahab, Darshana Rajendran',
    albumName: 'Hridayam',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
    audioUrl: 'https://archive.org/download/hridayam-malayalam/Darshana.mp3',
    durationSeconds: 232,
    source: 'archive',
    genre: 'Malayalam',
  }
];

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
    } else if (lowerQuery === 'hindi') {
      targetSearch = 'bollywood hindi movie mp3';
    } else if (lowerQuery === 'tamil') {
      targetSearch = 'tamil movie mp3 songs';
    } else if (lowerQuery === 'malayalam') {
      targetSearch = 'malayalam movie mp3 songs';
    }

    const query = encodeURIComponent(`mediatype:(audio) AND (${targetSearch})`);
    const url = `https://archive.org/advancedsearch.php?q=${query}&fl[]=identifier,title,creator,album,downloads&rows=15&output=json`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Internet Archive search failed with status ${res.status}`);
    }
    const data = await res.json();
    const docs = data.response?.docs || [];

    // Map Archive.org tracks with real MP3 file lookup
    const trackPromises = docs.map(async (doc: any) => {
      if (!doc.identifier || !doc.title) return null;

      try {
        // Fetch metadata to find the actual MP3 filename
        const metaUrl = `https://archive.org/metadata/${doc.identifier}`;
        const metaRes = await fetch(metaUrl);
        if (!metaRes.ok) throw new Error('Meta fetch failed');
        const metaData = await metaRes.json();
        
        // Find the best MP3 file
        // Ignore files that are internal or metadata
        const mp3Files = metaData.files?.filter((f: any) => 
          f.name && 
          f.name.toLowerCase().endsWith('.mp3') && 
          !f.name.toLowerCase().includes('_thumb') &&
          !f.name.toLowerCase().includes('_meta')
        ) || [];

        if (mp3Files.length === 0) return null;

        // Try to find a VBR MP3 file or take the largest/first one
        const vbrFile = mp3Files.find((f: any) => f.format && f.format.includes('MP3'));
        const targetFile = vbrFile || mp3Files[0];

        // Format direct audio URL - split and encode path segments to avoid encoding folder slashes
        const audioUrl = `https://archive.org/download/${doc.identifier}/${targetFile.name.split('/').map(encodeURIComponent).join('/')}`;
        
        // Determine duration from metadata if present
        let duration = 240; // Default fallback
        if (targetFile.length) {
          const parts = targetFile.length.split(':');
          if (parts.length === 3) {
            duration = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
          } else if (parts.length === 2) {
            duration = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
          } else {
            const parsed = parseFloat(targetFile.length);
            if (!isNaN(parsed)) duration = Math.round(parsed);
          }
        } else if (targetFile.duration) {
          const parsed = parseFloat(targetFile.duration);
          if (!isNaN(parsed)) duration = Math.round(parsed);
        }

        // Return a fully valid Track object
        return {
          id: `${doc.identifier}-${targetFile.name}`, // Unique ID combined with filename to allow multiple tracks from same collection
          title: doc.title || targetFile.name.replace(/\.mp3$/i, '').replace(/_/g, ' '),
          artistName: doc.creator || 'Indian Archive',
          albumName: doc.album || 'Archive Collection',
          coverUrl: `https://archive.org/services/img/${doc.identifier}` || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
          audioUrl: audioUrl,
          durationSeconds: duration,
          source: 'archive',
          genre: 'Regional Hits',
        };
      } catch (err) {
        // Fallback to VBR guessing if metadata call fails, to ensure we still output a result
        const fallbackStream = `https://archive.org/download/${doc.identifier}/${doc.identifier}_vbr.mp3`;
        return {
          id: doc.identifier,
          title: doc.title,
          artistName: doc.creator || 'Indian Archive',
          albumName: doc.album || 'Archive Collection',
          coverUrl: `https://archive.org/services/img/${doc.identifier}` || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
          audioUrl: fallbackStream,
          durationSeconds: 240,
          source: 'archive',
          genre: 'Regional Hits',
        };
      }
    });

    const resolvedTracks = await Promise.all(trackPromises);
    const validFetchedTracks = resolvedTracks.filter((t): t is Track => t !== null);

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
