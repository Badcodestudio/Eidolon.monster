// Male-side options for the generator: outfits, characters for thin pantheons, and build / look chips.
// Female keeps the original lists; Male sees these (plus neutral pieces); Any sees both.

export interface ExtraEntity {
  name: string;
  type: 'God' | 'Goddess' | 'Creation';
  title: string;
}

export const EXTRA_MALE_ENTITIES: Record<string, ExtraEntity[]> = {
  'Rot Court & Swamp Witches': [
    { name: 'Bog Warlock of the Mire', type: 'God', title: 'Antlered Hexer in Peat-Stained Robes & Rotwood Staff' },
    { name: 'Plague Hermit of the Fen', type: 'God', title: 'Beaked Mask, Lantern of Marsh Fire & Cloak of Moss' },
  ],
  'Celtic': [
    { name: 'Dagda', type: 'God', title: 'Club-Wielding Father of the Tuatha, Lord of the Cauldron & Harp' },
  ],
  'Japanese (Shinto & Kitsune)': [
    { name: 'Kitsune Ronin Fox Lord', type: 'God', title: 'Nine-Tailed Wanderer with Katana & Spirit Flame' },
  ],
  'Hindu': [
    { name: 'Hanuman', type: 'God', title: 'Mighty Vanara Champion, Mace Bearer & Devoted Warrior' },
  ],
  'Sumerian & Babylonian': [
    { name: 'Gilgamesh', type: 'God', title: 'Two-Thirds Divine King of Uruk, Lion Slayer' },
  ],
  'Dark Fantasy & Vampiric': [
    { name: 'Blood Count of the Crimson Keep', type: 'God', title: 'Ancient Vampire Lord in Velvet & Iron Crown' },
    { name: 'Grave Knight Revenant', type: 'God', title: 'Cursed Plate Armor, Black Flame Greatsword' },
  ],
  'Sci-Fi & Cyber RPG': [
    { name: 'Chrome Mercenary', type: 'God', title: 'Cybernetic Arm, Neon Visor & Heavy Coilgun' },
    { name: 'Void Monk Technomancer', type: 'God', title: 'Circuit-Etched Robes, Floating Drone Halo' },
  ],
};

// Outfits that read as male. Neutral pieces (armor, coats) appear in both lists.
export const MALE_CLOTHING_PRESETS: string[] = [
  'Obsidian Warlord Armor: Spiked pauldrons, black plate cuirass with glowing crimson sigils & heavy cape',
  'Runic Knight: Chainmail hauberk under gold-filigree plate, tabard of black wolf-head sigil & gauntlets',
  'Gothic Duelist: Long black frock coat, high collar, silver buttons, ruffled shirt & leather gloves',
  'Plague Doctor Regalia: Beaked mask, waxed leather long coat, brass buckles & wide-brim hat',
  'Necromancer Robes: Hooded charcoal robes with bone clasps, vertebrae rosary & ragged sleeves',
  'Bare-Chested Berserker: Fur mantle over one shoulder, war-paint, leather harness, wrist bracers & kilt',
  'Vampire Lord Velvet: Crimson velvet coat with high collar, black waistcoat, lace cravat & signet ring',
  'Shadow Assassin: Fitted dark leathers, layered hood, face wrap, dagger bandolier & bracers',
  'Samurai Ronin: Weathered haori over lamellar armor, hakama, twin swords & straw hat',
  'Fae Court Lord: Antler crown, embroidered doublet of leaves & thorn, long gloves & flowing cape',
  'Cyber Mercenary: Armored techwear vest, glowing arm implants, utility belt & tactical coat',
  'Battle Mage: Layered scholar robes with armored shoulder & runic belt, tome chained at hip',
  'Ornate Ceremonial Plate Armor with Runic Gold Filigree',
  'Abyssal Obsidian Battle Armor with Glowing Crimson Sigil Inlays',
  'Cyberpunk Techwear Trenchcoat with Holographic Runes & Cargo Straps',
  'Custom Attire',
];

export const MALE_LOOKS: string[] = [
  'lean athletic build',
  'broad muscular build',
  'towering heavyset frame',
  'wiry gaunt frame',
  'full beard',
  'stubble and sharp jaw',
  'long flowing hair',
  'shaved head',
  'battle scars',
  'tattoos',
  'weathered rugged face',
  'sharp elegant features',
];
