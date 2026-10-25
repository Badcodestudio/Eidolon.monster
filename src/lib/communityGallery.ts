import { Artwork, ARTWORK_GALLERY } from '@/data/artworks';

const STORAGE_KEY = 'eidolon_community_creations';

export function getCommunityArtworks(): Artwork[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Seed default community epic scenes if storage is initially fresh
      const defaultCommunityScenes: Artwork[] = [
        {
          id: 'community-epic-dragon-citadel',
          title: 'Volcanic Peak of the Colossal Wyrm',
          category: 'fantasy',
          pantheon: 'Draconic',
          imageUrl: 'https://cdn.wegic.ai/assets/onepage/agent/images/1792935238399_0.png?imageMogr2/format/webp',
          prompt: 'Epic fantasy scene wide cinematic masterwork: towering ancient dragon perched atop obsidian monolith mountain peak amidst a fiery volcanic lightning tempest, colossal fantasy citadel ruins in background, volumetric lighting, god rays, atmospheric fog, 8k wallpaper grade fantasy landscape',
          aspectRatio: 'aspect-[16/9]',
          author: 'AetherTitan',
          likes: 3120,
        },
        {
          id: 'community-epic-celestial-nexus',
          title: 'The Great Astral Gateway Ring',
          category: 'scifi',
          pantheon: 'Celestial',
          imageUrl: 'https://cdn.wegic.ai/assets/onepage/agent/images/1792935325074_0.png?imageMogr2/format/webp',
          prompt: 'Epic cosmic sci-fi space opera fantasy landscape: colossal ancient celestial gateway ring floating in deep space nebula, star cruiser approaching gargantuan crystalline alien megastructure, glowing stellar dust, ray-traced reflections, hyper-detailed panoramic vista, 8k render',
          aspectRatio: 'aspect-[16/9]',
          author: 'VoidNavigator',
          likes: 2750,
        },
        {
          id: 'community-epic-titan-fortress',
          title: 'Colossal Titan Bastion at Blood Moon',
          category: 'gothic',
          pantheon: 'Dark Fantasy',
          imageUrl: 'https://cdn.wegic.ai/assets/onepage/agent/images/1792935413853_0.png?imageMogr2/format/webp',
          prompt: 'Epic gothic fantasy battlefield scene: towering colossal titan skull fortress jutting out of misty blood-red sea, dark knights army standing before towering gothic cathedral gates under stormy blood moon eclipse, volumetric fog, dramatic cinematic chiaroscuro lighting, 8k wallpaper render',
          aspectRatio: 'aspect-[16/9]',
          author: 'GothicVoid',
          likes: 2980,
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCommunityScenes));
      return defaultCommunityScenes;
    }
    return JSON.parse(saved) as Artwork[];
  } catch (err) {
    console.error('Failed to load community artworks from localStorage', err);
    return [];
  }
}

export function saveArtworkToCommunity(artwork: Omit<Artwork, 'id' | 'likes' | 'author'> & { author?: string }): Artwork {
  const existing = getCommunityArtworks();
  const newArtwork: Artwork = {
    ...artwork,
    id: `community-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    likes: 1,
    author: artwork.author || 'Anonymous Creator',
  };

  const updated = [newArtwork, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch a custom event so any open page or gallery updates instantly without reload
    window.dispatchEvent(new Event('eidolon_gallery_updated'));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }

  return newArtwork;
}

export function getAllGalleryArtworks(): Artwork[] {
  const community = getCommunityArtworks();
  return [...community, ...ARTWORK_GALLERY];
}
