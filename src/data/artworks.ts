export interface Artwork {
  id: string;
  title: string;
  category: 'mythology' | 'anime' | 'realism' | 'gothic' | 'scifi' | 'fantasy' | 'fae';
  pantheon?: string;
  imageUrl: string;
  prompt: string;
  aspectRatio: string;
  author: string;
  likes: number;
}

export const SHOWCASE_CATEGORIES = [
  {
    id: 'anime',
    title: 'ANIME & STYLIZED',
    description: 'Cybernetic ronin, anthropomorphic squad commandos, hyper-stylized action silhouettes.',
    image: 'https://cdn.wegic.ai/assets/onepage/agent/reference-assets/card-anime-stylized-01M5RH296DGNXDWVKY5KTNMTPA-enhanced.png',
  },
  {
    id: 'mythology',
    title: 'MYTH & HISTORY',
    description: 'Valkyries, Mesoamerican solar deities, Olympian demigods rendered with authentic grandeur.',
    image: 'https://cdn.wegic.ai/assets/onepage/agent/reference-assets/card-myth-history-01M5RH296EFPB96YH70WA0M4P0-enhanced.png',
  },
  {
    id: 'scifi',
    title: 'SCI-FI & WORLDBUILDING',
    description: 'Colossal Dyson ring citadels, void navigators, planetary orbital monoliths.',
    image: 'https://cdn.wegic.ai/assets/onepage/agent/reference-assets/card-scifi-worldbuilding-01M5RH296FBKX48CBWN8YCM8CC-enhanced.png',
  },
];

export const ARTWORK_GALLERY: Artwork[] = [
  {
    id: 'art-unseelie-queen',
    title: 'Unseelie Fae Queen of Winter Thorns',
    category: 'fae',
    pantheon: 'Fae Courts',
    imageUrl: 'https://cdn.wegic.ai/assets/onepage/agent/images/1792953777899_0.png?imageMogr2/format/webp',
    prompt: 'Dark ethereal high fantasy portrait of an Unseelie Fae Queen, elegant predatory grace, razor needle-sharp teeth smiling subtly, pure pitch-black eyes with void sclera, crown of intertwined black thorns and obsidian deer antlers, sheer dark gossamer and spider-silk mourning gown, pale porcelain alabaster skin with faint glowing bioluminescent silver frost veins, standing in a misty haunted twilight ancient enchanted forest with floating luminescent blue spores and ghost will-o\'-wisps, dramatic ethereal volumetric rim lighting, 8k dark fantasy masterwork concept art',
    aspectRatio: 'aspect-[9/16]',
    author: 'UnseelieArch',
    likes: 3420,
  },
  {
    id: 'art-fae-twilight-realm',
    title: 'The Twilight Fae Court Borderlands',
    category: 'fae',
    pantheon: 'Fae Courts',
    imageUrl: 'https://cdn.wegic.ai/assets/onepage/agent/images/1792953886849_0.png?imageMogr2/format/webp',
    prompt: 'Widescreen panoramic cinematic fantasy landscape of the Seelie and Unseelie Fae Court borderlands, enchanted twilight fae forest with giant ancient hollow elder trees, glowing bioluminescent mushroom canopies, crystalline fairy rings, floating starlight wisps, ethereal twilight mist reflecting on still enchanted dark water ponds, grand crystalline fae palace spires towering in the background under twin moons, 8k wallpaper concept art',
    aspectRatio: 'aspect-[16/9]',
    author: 'SeelieCourtier',
    likes: 2890,
  },
  {
    id: 'art-epic-dragon-citadel',
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
    id: 'art-epic-celestial-nexus',
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
    id: 'art-epic-titan-fortress',
    title: 'Colossal Titan Bastion at Blood Moon',
    category: 'gothic',
    pantheon: 'Dark Fantasy',
    imageUrl: 'https://cdn.wegic.ai/assets/onepage/agent/images/1792935413853_0.png?imageMogr2/format/webp',
    prompt: 'Epic gothic fantasy battlefield scene: towering colossal titan skull fortress jutting out of misty blood-red sea, dark knights army standing before towering gothic cathedral gates under stormy blood moon eclipse, volumetric fog, dramatic cinematic chiaroscuro lighting, 8k wallpaper render',
    aspectRatio: 'aspect-[16/9]',
    author: 'GothicVoid',
    likes: 2980,
  },
  {
    id: 'art-tiefling-queen',
    title: 'Crimson-Winged Tiefling Sovereign',
    category: 'fantasy',
    pantheon: 'Fantasy & RPG',
    imageUrl: 'https://cdn.wegic.ai/assets/onepage/uploads/2114187206670925825/image/2026/10/25/01M5SK29ZVY6Q2NY8TD76JYABH.jpg?imageMogr2/format/webp',
    prompt: 'Gothic fantasy full body portrait of a regal tiefling sovereign, curving black ram horns, bat-like demonic wings with crimson underside veins, flowing high-collared blood-red cloak, ornate black lace corsetry, holding dark runic broadsword, cathedral hall bathed in storm flash lighting, 8k wallpaper grade render',
    aspectRatio: 'aspect-[9/16]',
    author: 'EidolonCreator',
    likes: 1890,
  },
];
