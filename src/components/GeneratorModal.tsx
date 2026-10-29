import { supabase } from '@/lib/supabase';
import { UsageBadge } from '@/components/UsageBadge';
import { loadUsage, notifyUsageChanged, useUsage } from '@/lib/usage';
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Wand2,
  Compass,
  Sun,
  Shield,
  Layers,
  User,
  BookmarkPlus,
  Check,
  Download,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Shirt,
  ChevronDown,
  Box,
} from 'lucide-react';
import { ARTWORK_GALLERY } from '@/data/artworks';
import { saveArtworkToCommunity, getAllGalleryArtworks } from '@/lib/communityGallery';
import { saveToGenerationHistory } from '@/lib/generationHistory';
import { EXTRA_MALE_ENTITIES, MALE_CLOTHING_PRESETS, MALE_LOOKS } from '@/data/genderOptions';

interface GeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

// 1. Art Styles
const ART_STYLES = [
  'Anthropological',
  'Anime',
  'Gaming',
  'Cartoon',
  'Gothic/Alt',
  'Steampunk',
  'No Style',
  'Custom Style',
] as const;

// 1.5 Gender / Form (After Art Style)
const GENDER_OPTIONS = ['Female', 'Male', 'Any'] as const;

// 2. Archetype Mode
type ArchetypeMode = 'Hybrid' | 'Cosplay';

// 3. Cosplay Classes (9 alignments: Lawful Good to Chaotic Evil)
const ALIGNMENT_CLASSES = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
] as const;

// 4. Hybrid: Animals
const HYBRID_ANIMALS = [
  // Dark Familiars & Beasts
  'Wolf/Fenrir',
  'Raven / Crow',
  'Black Wolf',
  'Bat',
  'Black Cat',
  'Serpent / Viper',
  'Spider',
  'Owl',
  'Fox (9 Tails / Kitsune)',
  'Rat',
  'Moth',
  // Predators & Mounts
  'Panther / Black Leopard',
  'Tiger (White / Black Bengal)',
  'Lion',
  'Dire Wolf',
  'Bear',
  'Dragon Whelp / Wyrm',
  'Wyvern',
  'Griffin',
  'Manticore',
  'Cerberus',
  // Myth & Gothic Beasts
  'Phoenix',
  'Kitsune Spirit Fox',
  'Kelpie (Water Steed)',
  'Basilisk',
  'Chimera',
  'Hellhound',
  'Shadow Cat',
  'Bone Elk',
  'Blood Deer',
  'Night Mare (Abyssal Horse)',
  // Ethereal & Small Companions
  'Sprite',
  'Wisp',
  'Fairy Dragon',
  'Crow with 3 Eyes',
  'Scorpion',
  'Cobra',
  'Void Jellyfish',
  'Skull Moth',
  'Bone Bird',
  'Bull/Minotaur',
  'Eagle/Falcon',
  'Stag/Elk',
] as const;

// Dedicated Companion & Familiar Presets (Dark Familiars, Predators, Myth, Ethereal)
export interface CompanionCategory {
  category: string;
  items: string[];
}

export const COMPANION_COLLECTIONS: CompanionCategory[] = [
  {
    category: 'Dark Creature Combos',
    items: [
      'None',
      'Black wolf with glowing sigil collar',
      'Raven with 3 eyes perched on shoulder',
      'Swirling bat swarm forming dark halo',
      'Venomous serpent coiled around thigh',
      'Antlered bone elk steed mount',
      'Chain-bound hellhound on iron leash',
      'Cluster of skull moths forming a living veil',
      'Flock of skeletal bone birds circling head',
    ],
  },
  {
    category: 'Dark Familiars (Money Makers)',
    items: [
      'None',
      'Raven / Crow',
      'Black Wolf',
      'Vampire Bat',
      'Black Cat (Familiar)',
      'Shadow Serpent',
      'Weaver Spider',
      'Barn Owl of Omen',
      'Fox (9 Tails)',
      'Plague Rat',
      'Lunar Moth',
    ],
  },
  {
    category: 'Predators / Mounts',
    items: [
      'None',
      'Shadow Panther',
      'Tiger (White/Black)',
      'Apex Lion',
      'Dire Wolf Alpha',
      'Grizzly Bear',
      'Dragon Whelp',
      'Draconic Wyvern',
      'Royal Griffin',
      'Spike-Tailed Manticore',
      'Cerberus Underworld Beast',
    ],
  },
  {
    category: 'Myth / Gothic',
    items: [
      'None',
      'Solar Phoenix',
      'Nine-Tailed Kitsune',
      'Aquatic Kelpie',
      'Venomous Basilisk',
      'Tri-Headed Chimera',
      'Abyssal Hellhound',
      'Midnight Shadow Cat',
      'Antlered Bone Elk',
      'Crimson Blood Deer',
      'Night Mare (Hellfire Horse)',
    ],
  },
  {
    category: 'Ethereal / Small Companions',
    items: [
      'None',
      'Luminous Sprite',
      'Will-o\'-the-Wisp',
      'Fairy Dragon (Gossamer Wings)',
      'Crow with 3 Eyes',
      'Obsidian Scorpion',
      'Hooded Cobra',
      'Crow Familiar',
      'Bioluminescent Void Jellyfish',
      'Death Skull Moth',
      'Skeletal Bone Bird',
    ],
  },
];

// Hybrid & Underworld Traits Options
const HYBRID_TRAIT_OPTIONS = [
  { id: 'horns', label: 'Thorn Horns / Ram Horns', desc: 'Twisted, thorny, bleeding demon horns piercing through halo' },
  { id: 'wings', label: 'Torn Bat Wings', desc: 'Tattered demonic bat wings & skeletal ribbing' },
  { id: 'ears', label: 'Pointed Beast Ears', desc: 'Pointed animal ears / predatory beast tufts' },
  { id: 'eyes', label: 'Red Eyes / Black Sclera', desc: 'All black sclera, glowing red irises, predatory slit pupils' },
  { id: 'skin', label: 'Graveyard Skin / Scales', desc: 'Corpse-pale graveyard skin, stitched seams, or fine obsidian scales' },
  { id: 'arms', label: 'Clawed Hands / Talons', desc: 'Razor sharp black claws & beast gauntleted hands' },
  { id: 'legs', label: 'Digitigrade Paws / Hooves', desc: 'Digitigrade beast legs, cloven hooves or predatory paws' },
  { id: 'tail', label: 'Spiked Tail', desc: 'Animated sinewy demon tail with barb or fur' },
  { id: 'fangs', label: 'Vampire Fangs & Blood Veil', desc: 'Elongated fangs with subtle crimson drip & lace blood veil' },
  { id: 'stitched', label: 'Stitched Doll Lips', desc: 'Stitched skin doll, porcelain cracks, thread-bound mouth' },
  { id: 'bone_crown', label: 'Bone Crown', desc: 'Crown forged of human vertebrae, ribcages and horn spikes' },
] as const;

// 4. Detailed Pantheons with Gods, Goddesses & Mythic Creations
export interface PantheonEntity {
  name: string;
  type: 'God' | 'Goddess' | 'Creation';
  title: string;
}

export interface PantheonData {
  name: string;
  entities: PantheonEntity[];
}

const PANTHEONS: PantheonData[] = [
  {
    name: 'Infernal & Demon Court (#1 Eidolon)',
    entities: [
      { name: 'Lilith', type: 'Goddess', title: 'First Queen of Night, Mother of Monsters & Succubi' },
      { name: 'Asmodeus Bride / Consort', type: 'Goddess', title: 'Archdemon Consort of Passion, Wrath & Seduction' },
      { name: 'Succubus Court Empress', type: 'Goddess', title: 'Obsidian-Winged Sovereign with Twisted Bleeding Horns' },
      { name: 'Hell\'s Librarian / Grimoire Keeper', type: 'Creation', title: 'Keeper of Forbidden Tomes & Blood Runes' },
      { name: 'Asmodeus', type: 'God', title: 'Archdemon Sovereign of the Nine Hells' },
      { name: 'Lucifer', type: 'God', title: 'The Morning Star, Fallen Lightbearer & Emperor of Abyss' },
      { name: 'Baphomet', type: 'God', title: 'Horned Sabbatic Beast of Primal Alchemy' },
      { name: 'Hellfire Pit Fiend', type: 'Creation', title: 'Wreathed in Brimstone, Heavy Spiked Mace & Ram Horns' },
    ],
  },
  {
    name: 'Rot Court & Swamp Witches',
    entities: [
      { name: 'Mushroom Witch of Spores', type: 'Goddess', title: 'Crown of Bioluminescent Fungi, Spore Mist & Lichen Skin' },
      { name: 'Swamp Siren of the Mire', type: 'Goddess', title: 'Sharp Teeth, Murky Waters, Water Hyacinth & Drowned Allure' },
      { name: 'Bog Mummy Sovereign', type: 'Creation', title: 'Peat Moss Shroud, Preserved Leathery Skin & Bronze Torc' },
      { name: 'Necromantic Grave Priestess', type: 'Goddess', title: 'Bone Crown, Shroud of Dust & Graveyard Soil' },
    ],
  },
  {
    name: 'Fae Courts (Unseelie & Seelie)',
    entities: [
      { name: 'Unseelie Fae (Teeth Too Sharp)', type: 'Goddess', title: 'Predatory Grin, Needle Teeth, Obsidian Antlers & Dark Glamour' },
      { name: 'Unseelie Queen of Winter & Gloom', type: 'Goddess', title: 'Obsidian Antlers, Chilled Mist & Frost Thorns' },
      { name: 'Eyes All Black Fae Monarch', type: 'God', title: 'Sclera Swallowed in Void, Chilled Mist & Frost Thorns' },
      { name: 'Unseelie Shadow Lord', type: 'God', title: 'Raven-Feathered Cloak, Midnight Armor & Night Magic' },
      { name: 'Unseelie Changeling Shifter', type: 'Creation', title: 'Hollow Bones, Twig Fingers & Stolen Visage' },
      { name: 'Seelie High Empress of Spring & Sun', type: 'Goddess', title: 'Gold Gossamer Gown, Starlight Scepter & Floral Crown' },
      { name: 'Seelie Summer Champion', type: 'God', title: 'Sun-forged Rapier, Butterfly Wings & Radiant Aura' },
      { name: 'Bramble Fey Courtier', type: 'Creation', title: 'Antler Crown, Thorn Velvet & Autumn Leaves' },
      { name: 'Dark Pixie / Shadow Sprite', type: 'Creation', title: 'Dragonfly Wings, Twilight Glitter & Hex Dust' },
    ],
  },
  {
    name: 'Void & Lovespawn (Eldritch Gods)',
    entities: [
      { name: 'Eldritch Nun of the Abyss', type: 'Goddess', title: 'Blindfolded with Sigils, Rosary of Teeth & Cosmic Void Tentacles' },
      { name: 'Star-Eater Cosmic Entity', type: 'God', title: 'Devourer of Nebulae, Gravity Rifts & Obsidian Armor' },
      { name: 'Womb of Eyes Mother', type: 'Goddess', title: 'Surrounded by Orbiting Ocular Spheres & Chitin Plates' },
      { name: 'Cthulhu Sovereign', type: 'God', title: 'Cosmic Slumbering Titan of Sunken R\'lyeh' },
      { name: 'Nyarlathotep (Crawling Chaos)', type: 'God', title: 'Black Pharaoh Shifter of a Thousand Faces' },
      { name: 'Shub-Niggurath (Black Goat)', type: 'Goddess', title: 'Primordial Mother of the Ten Thousand Young' },
      { name: 'Azathoth Prime', type: 'God', title: 'Blind Idiot Sultan Pulsing at the Universe Center' },
      { name: 'Yog-Sothoth (Key & Gate)', type: 'God', title: 'All-in-One Space-Time Spheres of Iridescence' },
      { name: 'Dagon Sea Lord', type: 'Creation', title: 'Gargantuan Abyssal Deep One Monarch' },
      { name: 'Eldritch Void Spawn', type: 'Creation', title: 'Tentacled Bioluminescent Chitin Creature' },
    ],
  },
  {
    name: 'Greek',
    entities: [
      { name: 'Zeus', type: 'God', title: 'King of Olympus & God of the Sky' },
      { name: 'Hades', type: 'God', title: 'Lord of the Underworld & Dead Souls' },
      { name: 'Nyx', type: 'Goddess', title: 'Primordial Goddess of Night, Shadow & Veil' },
      { name: 'Poseidon', type: 'God', title: 'God of the Tempestuous Seas & Earthquakes' },
      { name: 'Ares', type: 'God', title: 'God of Savage Warfare & Bloodshed' },
      { name: 'Athena', type: 'Goddess', title: 'Goddess of Wisdom & Tactical Strategy' },
      { name: 'Aphrodite', type: 'Goddess', title: 'Goddess of Passion & Unearthly Beauty' },
      { name: 'Hecate', type: 'Goddess', title: 'Titaness of Sorcery, Torches & Spectral Crossroads' },
      { name: 'Cerberus', type: 'Creation', title: 'Three-Headed Underworld Sentinel Hound' },
      { name: 'Medusa / Gorgon', type: 'Creation', title: 'Serpentine Petrifying Sovereign' },
    ],
  },
  {
    name: 'Norse',
    entities: [
      { name: 'Odin', type: 'God', title: 'Allfather of Wisdom, War & Runic Sorcery' },
      { name: 'Freyja', type: 'Goddess', title: 'Queen of the Valkyries, Love & Seidr Magic' },
      { name: 'Hel', type: 'Goddess', title: 'Half-Living Ruler of Niflheim & the Dead' },
      { name: 'Thor', type: 'God', title: 'God of Thunder, Lightning & Mjolnir' },
      { name: 'Loki', type: 'God', title: 'Shape-Shifting Trickster God of Wild Fire' },
      { name: 'Fenrir', type: 'Creation', title: 'Monstrous Bound Wolf of Ragnarok' },
      { name: 'Jormungandr', type: 'Creation', title: 'World-Encircling Ouroboros Wyrm' },
      { name: 'Valkyrie Sovereign', type: 'Creation', title: 'Winged Chooser of the Slain in Silver Mail' },
    ],
  },
  {
    name: 'Egyptian',
    entities: [
      { name: 'Anubis', type: 'God', title: 'Jackal Embalmer & Guardian of the Scales' },
      { name: 'Bastet', type: 'Goddess', title: 'Cat Goddess of Secrets, Protection & Sensuality' },
      { name: 'Sekhmet', type: 'Goddess', title: 'Solar Lioness of Fierce Vengeance & Bloodfire' },
      { name: 'Osiris', type: 'God', title: 'Lord of Eternity, Tomb & Green Rebirth' },
      { name: 'Isis', type: 'Goddess', title: 'Supreme Mistress of High Magic & Healing' },
      { name: 'Ra / Amun-Ra', type: 'God', title: 'Solar Falcon Supreme Sovereign of Dawn' },
      { name: 'Seth', type: 'God', title: 'Lord of Chaos, Crimson Storms & Deserts' },
      { name: 'Ammit', type: 'Creation', title: 'Soul-Devouring Beast of crocodile, Lion & Hippo' },
      { name: 'Apep / Apophis', type: 'Creation', title: 'Primordial Serpent of Consuming Void' },
    ],
  },
  {
    name: 'Celtic',
    entities: [
      { name: 'Morrigan', type: 'Goddess', title: 'Phantom Crow Queen of Battle, Sovereignty & Fate' },
      { name: 'Cernunnos', type: 'God', title: 'Antlered Horned Lord of Beasts & Primordial Forest' },
      { name: 'Lugh', type: 'God', title: 'Radiant Master of All Arts & Spearmanship' },
      { name: 'Brigid', type: 'Goddess', title: 'Triple Goddess of Hearth, Forge & Poetic Flame' },
      { name: 'Cu Sith', type: 'Creation', title: 'Spectral Green Faerie Hound of the Highlands' },
      { name: 'Banshee / Bean Nighe', type: 'Creation', title: 'Wailing Death Harbinger with Flowing Shroud' },
    ],
  },
  {
    name: 'Slavic',
    entities: [
      { name: 'Baba Yaga', type: 'Goddess', title: 'Crone Sorceress of the Mortar & Chicken-Legged Hut' },
      { name: 'Chernobog', type: 'God', title: 'Black God of Cold Gloom, Misfortune & Abyssal Shadow' },
      { name: 'Belobog', type: 'God', title: 'White God of Radiant Dawn & Light' },
      { name: 'Marzanna / Morena', type: 'Goddess', title: 'Frost Maiden of Winter, Death & Frozen Waters' },
      { name: 'Perun', type: 'God', title: 'Sovereign of Thunder, Lightning & Oak Groves' },
      { name: 'Veles', type: 'God', title: 'Horned Lord of Waters, Underworld & Dragon Shifter' },
      { name: 'Rusalka / Water Nymph', type: 'Creation', title: 'Drowned Siren with Emerald Hair & Enchanting Gaze' },
      { name: 'Zmey Gorynych', type: 'Creation', title: 'Three-Headed Fire-Breathing Slavic Dragon' },
    ],
  },
  {
    name: 'Japanese (Shinto & Kitsune)',
    entities: [
      { name: 'Amaterasu', type: 'Goddess', title: 'Radiant Sun Goddess of Heaven & Sacred Mirror' },
      { name: 'Izanami', type: 'Goddess', title: 'Empress of Yomi the Shadow Underworld' },
      { name: 'Kitsune Pantheon (Kyubi)', type: 'Goddess', title: 'Nine-Tailed Celestial Fox Spirit of Illusions & Foxfire' },
      { name: 'Susanoo', type: 'God', title: 'Tempestuous Storm God of the Raging Sea' },
      { name: 'Tsukuyomi', type: 'God', title: 'God of the Pale Silver Moon & Night' },
      { name: 'Inari Okami', type: 'Goddess', title: 'Protector of Foxes, Rice & Sacred Swords' },
      { name: 'Oni Warlord', type: 'Creation', title: 'Horned Demon of Iron Clubs & Crimson Skin' },
      { name: 'Tengu Crow Warrior', type: 'Creation', title: 'Winged Martial Master of Wind & Mountain Blades' },
    ],
  },
  {
    name: 'Chinese & Dragon Court',
    entities: [
      { name: 'Xiwangmu (Queen Mother of the West)', type: 'Goddess', title: 'Mistress of Peaches of Immortality & Celestial Tiger Teeth' },
      { name: 'Dragon Court Sovereign (Longwang)', type: 'God', title: 'Jade & Azure Dragon King of Oceans and Clouds' },
      { name: 'Nuwa', type: 'Goddess', title: 'Serpentine Mother of Humanity & Restorer of Heavens' },
      { name: 'Sun Wukong (Monkey King)', type: 'God', title: 'Immortal Victorious Fighting Buddha' },
      { name: 'Nezha', type: 'God', title: 'Lotus-Born Marshal on Wind-Fire Wheels' },
      { name: 'Chang\'e', type: 'Goddess', title: 'Immortal Moon Sovereign with Jade Rabbit Familiar' },
      { name: 'White Tiger Baihu', type: 'Creation', title: 'Metal Guardian Beast of the Western Heavens' },
      { name: 'Nine-Tailed Huli Jing', type: 'Creation', title: 'Enchanting Fox Shifter of Spectral Allure' },
    ],
  },
  {
    name: 'Hindu',
    entities: [
      { name: 'Kali', type: 'Goddess', title: 'Fierce Dark Mother of Time, Destruction & Liberation' },
      { name: 'Durga', type: 'Goddess', title: 'Invincible Ten-Armed Warrior Riding Apex Lion' },
      { name: 'Shiva', type: 'God', title: 'The Destroyer, Lord of Cosmic Dance & Crescent Moon' },
      { name: 'Bhairava', type: 'God', title: 'Fierce Manifestation of Shiva Guarded by Black Dog' },
      { name: 'Saraswati', type: 'Goddess', title: 'Goddess of Arts, Sacred Streams & Eloquence' },
      { name: 'Garuda', type: 'Creation', title: 'Golden Celestial Sun-Eagle Mount & Serpent Slayer' },
      { name: 'Naga Sovereign', type: 'Creation', title: 'Multi-Headed Serpentine Monarch of Hidden Jewels' },
    ],
  },
  {
    name: 'Sumerian & Babylonian',
    entities: [
      { name: 'Ishtar / Inanna', type: 'Goddess', title: 'Queen of Heaven, War, Sensual Splendor & Lions' },
      { name: 'Lilith (Ancient Mesopotamian)', type: 'Goddess', title: 'Winged Owl-Clawed Maiden of Desolate Winds' },
      { name: 'Enki / Ea', type: 'God', title: 'God of Wisdom, Deep Freshwater Abzu & Magic' },
      { name: 'Marduk', type: 'God', title: 'Storm Champion Slayer of Chaos & Dragon Tamer' },
      { name: 'Tiamat', type: 'Creation', title: 'Primordial Salt Sea Dragon Mother of All Horrors' },
      { name: 'Pazuzu', type: 'Creation', title: 'Four-Winged Demon King of Scorching Storm Winds' },
    ],
  },
  {
    name: 'Aztec & Mayan',
    entities: [
      { name: 'Coatlicue', type: 'Goddess', title: 'Mother of Gods in Skirt of Snakes & Human Hearts' },
      { name: 'Xochiquetzal', type: 'Goddess', title: 'Goddess of Flowers, Sensual Beauty & Artisans' },
      { name: 'Quetzalcoatl', type: 'God', title: 'Feathered Emerald Serpent of Wind & Wisdom' },
      { name: 'Tezcatlipoca', type: 'God', title: 'Lord of the Smoking Obsidian Mirror & Night Jaguar' },
      { name: 'Huitzilopochtli', type: 'God', title: 'Solar Hummingbird God of Unyielding War' },
      { name: 'Camazotz', type: 'Creation', title: 'Death-Bat Deity of Xibalba the Underworld' },
      { name: 'Jaguar Warrior King', type: 'Creation', title: 'Pelt-Clad Priest with Obsidian Macuahuitl' },
    ],
  },
  {
    name: 'Fantasy & RPG Classes',
    entities: [
      { name: 'Archmage / Sorceress', type: 'God', title: 'Master of Arcane Rifts & Cosmic Runes' },
      { name: 'Shadowblade Rogue / Assassin', type: 'Creation', title: 'Dual-Dagger Phantom of the Dark' },
      { name: 'Paladin of the Sacred Oath', type: 'God', title: 'Radiant Plate-Armored Holy Champion' },
      { name: 'Blood Hunter / Dark Knight', type: 'Creation', title: 'Cursed Blade & Crimson Vitality' },
      { name: 'High Elf Ranger / Huntress', type: 'Goddess', title: 'Sharpshooter of Ancient Silver Woods' },
      { name: 'Abyssal Warlock / Necromancer', type: 'Creation', title: 'Pact-Binder of Forgotten Entities' },
      { name: 'Demonic Tiefling Inquisitor', type: 'Goddess', title: 'Horned Hellfire Arbiter' },
      { name: 'Dragonborn Berserker', type: 'God', title: 'Scaled Titan of Draconic Fury' },
    ],
  },
  {
    name: 'Dark Fantasy & Vampiric',
    entities: [
      { name: 'Vampire Lord / Countess', type: 'Goddess', title: 'Immortal Sanguine Aristocrat' },
      { name: 'Gothic Lich King', type: 'God', title: 'Undead Sovereign of Frost & Tombs' },
      { name: 'Cursed Lycanthrope Alpha', type: 'Creation', title: 'Beast-Moon Frenzy Warrior' },
      { name: 'Fallen Seraph / Fallen Angel', type: 'Creation', title: 'Black-Feathered Broken Halo' },
      { name: 'Sorrow Siren / Void Maiden', type: 'Goddess', title: 'Spectral Mistress of Haunting Depths' },
    ],
  },
  {
    name: 'Sci-Fi & Cyber RPG',
    entities: [
      { name: 'Cyberpunk Netrunner / Hacker', type: 'Creation', title: 'Neural Interface & Hologram Specialist' },
      { name: 'Chrome Cyber-Samurai', type: 'God', title: 'Mono-Molecular Katana & Reflex Boost' },
      { name: 'Android Sovereign / AI Deity', type: 'Goddess', title: 'Sentient Transhuman Architect' },
      { name: 'Void Bounty Hunter', type: 'Creation', title: 'Ion Blaster & Stealth Camouflage Exo-Armor' },
    ],
  },
];

// 5. Locations (curated atmospheric settings & epic world scenes)
const LOCATIONS = [
  'Throne of bones, church on fire & flooded crypt',
  'Storm sunset sea cliff, lightning tempest & ruined lighthouse of the dead',
  'Underworld market & demon bazaar with blood bar',
  'Abandoned gothic cathedral with shattered stained glass',
  'Obsidian Throne Room of Fallen Kings',
  'Volcanic Peak of the Colossal Wyrm',
  'The Great Astral Gateway Ring Nebula',
  'Colossal Titan Bastion at Blood Moon',
  'Ancient Stone Temple Ruins in Mist',
  'Cyberpunk Megacity Neon Underbelly',
  'Bioluminescent Mystic Forest of the Fae',
  'Stormy Tempest Sea Cliffs with Lightning Flash',
  'Forgotten Sunken Citadel of the Leviathans',
  'Abyssal Blood-Moon Altar of the Ancients',
  'Custom Location',
] as const;

// Clothing / Attire Options (Featuring Gothic Alt Fashion, Dark Fantasy Couture & Subversive Aesthetics)
const CLOTHING_PRESETS = [
  // Pack A - Same silhouette, different texture
  'Void Velvet: Black velvet corset with bone filigree, sheer spiderweb sleeves, frill skirt & thigh-high boots',
  'Runic Leather: Lilith armor corset in black leather with gold runic stitching, chain harness & torn bat wing cape',
  'Graveyard Lace: All-white lace corset with black thorn embroidery, black lace-up front & fishnet bodysuit',
  'Harness of Bones: Bone plate corset + fishnet bodysuit underneath, bone charms on claw gloves',

  // Pack B - Keep fishnet, change top/bottom
  'Fishnet Armor: Full fishnet bodysuit base with ornate black plate over chest, shoulders & armored thighs',
  'Spiderweb Mourning Dress: Long sheer black dress with spiderweb pattern, corset laced over & thigh-high slits',
  'Torn Veil Skirt: Short torn veil layered skirt with choker collar & extended sharp claw gloves',
  'Bandage + Lace: Wrapped bandage top with delicate lace overlay, high-waisted lace shorts & thigh-highs',

  // Pack C - Subversive Accessories & Remixes
  'Claw Boots & Lilith Knee Armor: Lace-up platform boots with claw toes, ornate gold filigree knee armor & corset',
  'Thorn Gloves Couture: Long gloves morphing into twisted thorny briar vines at fingers with sheer bodice',
  'Choker + Summoning Chains: Sigil pendant choker connected with iron chains to waist corset & summoning rings',
  'Armored Tail Harness: Hybrid tail fitted with runic steel armored rings, spiked bracers & leather gear',

  // Classic Underworld & Signature Outfits
  'Corset + fishnet bodysuit + thigh-high lace & platform boots',
  'Latex nun habit, latex halo & chain harness',
  'Latex demon regalia, PVC succubus corset & choker collar with sigil',
  'Torn lace cemetery dress, mourning veil & veil of thorns',
  'Corpse paint, black lip, smudged mascara & white contacts regalia',
  'Sheer black spider-silk mourning gown with cascading train & thorn choker',
  'Blood-red velvet Victorian ballgown with black lace underbust corset',
  'Ornate Ceremonial Plate Armor with Runic Gold Filigree',
  'Abyssal Obsidian Battle Armor with Glowing Crimson Sigil Inlays',
  'Eldritch Priestess Vestments with Shrouded Eye Cowl & Vertebrae Rosary',
  'Unseelie Frost-Woven Gossamer Tunic with Antler Brooches & Bramble Mantle',
  'Cyberpunk Techwear Trenchcoat with Holographic Runes & Cargo Straps',
  'Custom Attire',
] as const;

// 6. Mood Lighting (10 curated choices)
const MOOD_LIGHTINGS = [
  'Cinematic Chiaroscuro',
  'Volumetric Rim Light',
  'Neon Cyber Glow',
  'Golden Hour Sunlight',
  'Eerie Bioluminescence',
  'Moody Moonlight Shadows',
  'Fiery Ember Backlight',
  'Studio Softbox Key Light',
  'Thunderstorm Flash Illumination',
  'Deep Abyssal Ambient Glow',
] as const;

// Output Framing
const FRAMING_OPTIONS = [
  { id: 'full body', label: 'Full Body', desc: 'Complete character head-to-toe with stance & footwear' },
  { id: 'half body', label: 'Half Body', desc: 'Waist-up focus highlighting armor, garment & weaponry' },
  { id: 'close up portrait', label: 'Close Up (Portrait)', desc: 'Intimate facial focus, expressions, eyes & headpiece' },
  { id: 'epic', label: 'Epic', desc: 'Grand scale wide perspective with environment & atmospheric power' },
] as const;

// Output Quality
const QUALITY_OPTIONS = [
  { id: 'wallpaper', label: 'Wallpaper (8K Max)', desc: 'Maximized 8K masterwork, ultra-sharp depth & wallpaper grade' },
  { id: 'high', label: 'High (4K Crisp)', desc: 'Enhanced 4K fidelity, rich micro-textures' },
  { id: 'standard', label: 'Standard', desc: 'Fast rendering, clean details' },
] as const;

// Expanded Aspect Ratios
const RATIOS = [
  { id: '4:5', label: '4:5 Social', falSize: 'portrait_4_3' },
  { id: '1:1', label: '1:1 Square', falSize: 'square_hd' },
  { id: '3:4', label: '3:4 Portrait', falSize: 'portrait_4_3' },
  { id: '9:16', label: '9:16 Story / Mobile', falSize: 'portrait_16_9' },
  { id: '16:9', label: '16:9 Cinema / Desktop', falSize: 'landscape_16_9' },
  { id: '21:9', label: '21:9 Ultrawide Wallpaper', falSize: 'landscape_16_9' },
] as const;

// Crops the top-centre square (share `frac` of the width) of an image URL and returns it as a JPEG blob.
async function cropUrlToJpeg(src: string, frac: number): Promise<Blob> {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('load'));
    img.src = src;
  });
  const eff = Math.min(frac, img.naturalHeight / img.naturalWidth);
  const side = Math.round(img.naturalWidth * eff);
  const sx = Math.round((img.naturalWidth - side) / 2);
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  canvas.getContext('2d')!.drawImage(img, sx, 0, side, side, 0, 0, side, side);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('blob');
  return blob;
}

export const GeneratorModal: React.FC<GeneratorModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
}) => {
  // Step 1: Art Styles with LocalStorage Persistence
  const [selectedStyle, setSelectedStyle] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_style') || 'Gothic/Alt';
  });

  // Step 1.5: Gender / Form (Female, Male, Any)
  const [selectedGender, setSelectedGender] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_gender') || 'Female';
  });

  // Free-text art style (used when 'Custom Style' is chosen)
  const [customStyleText, setCustomStyleText] = useState<string>('');

  // Male build / look chips (used when Male or Any is selected)
  const [selectedLooks, setSelectedLooks] = useState<string[]>([]);

  // Step 2: Hybrid or Cosplay
  const [archetypeMode, setArchetypeMode] = useState<ArchetypeMode>(() => {
    return (localStorage.getItem('eidolon_gen_archetype') as ArchetypeMode) || 'Cosplay';
  });

  // Step 3: Cosplay Alignment Class
  const [selectedAlignment, setSelectedAlignment] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_alignment') || 'Chaotic Neutral';
  });

  // Step 4: Under Hybrid -> Animals & Traits Wanted
  const [selectedAnimal, setSelectedAnimal] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_animal') || 'Raven / Crow';
  });
  const [selectedTraits, setSelectedTraits] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('eidolon_gen_traits');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback to default traits
    }
    return ['ears', 'eyes', 'skin'];
  });

  // Dark Familiars, Predators/Mounts, Myth/Gothic, Ethereal Companions
  const [selectedCompanionCategory, setSelectedCompanionCategory] = useState<string>(() => {
    const saved = localStorage.getItem('eidolon_gen_comp_cat');
    // An older version used a different category name; fall back gracefully.
    if (saved === '18+ Creature Combos (Freaky Underworld)') return 'Dark Creature Combos';
    return saved || 'Dark Familiars (Money Makers)';
  });
  const [selectedCompanion, setSelectedCompanion] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_comp') || 'None';
  });

  // Step 4: Under Cosplay -> Pantheon, Filter & Specific Entity (God, Goddess, Creation)
  const [selectedPantheonName, setSelectedPantheonName] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_pantheon') || 'Infernal & Demon Court (#1 Eidolon)';
  });
  const [selectedEntityName, setSelectedEntityName] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_entity') || 'Lilith';
  });

  // Step 5: Locations (with custom input)
  const [selectedLocation, setSelectedLocation] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_location') || 'Obsidian Throne Room';
  });
  const [customLocationText, setCustomLocationText] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_custom_loc') || '';
  });

  // Step 5.5: Clothing / Attire (with custom input)
  const [selectedClothing, setSelectedClothing] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_clothing') || 'Ornate Ceremonial Armor with Runic Gold Filigree';
  });
  const [customClothingText, setCustomClothingText] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_custom_clothing') || '';
  });

  // Step 6: Mood Lighting (10 options)
  const [selectedLighting, setSelectedLighting] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_lighting') || 'Cinematic Chiaroscuro';
  });

  // Step 6.5: Output Framing & Output Quality
  const [selectedFraming, setSelectedFraming] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_framing') || 'full body';
  });
  const [selectedQuality, setSelectedQuality] = useState<string>(() => {
    return localStorage.getItem('eidolon_gen_quality') || 'wallpaper';
  });

  // Image engine tier the person pays for: Standard (fast, cheaper) or High (better detail and backgrounds).
  const [engineTier, setEngineTier] = useState<'standard' | 'high'>(() => {
    return localStorage.getItem('eidolon_engine_tier') === 'high' ? 'high' : 'standard';
  });
  useEffect(() => {
    localStorage.setItem('eidolon_engine_tier', engineTier);
  }, [engineTier]);
  const { usage: tierUsage } = useUsage();

  // Generated Result persistence across navigation
  const [generatedResult, setGeneratedResult] = useState<string | null>(() => {
    return localStorage.getItem('eidolon_gen_result') || null;
  });

  // Image models ignore crop instructions, so Close Up / Half Body results are cropped after generation.
  // resultCrop = share of the image width kept (a square window anchored at the top centre), or null for no crop.
  const [resultCrop, setResultCrop] = useState<number | null>(() => {
    const v = parseFloat(localStorage.getItem('eidolon_gen_result_crop') || '');
    return v > 0 && v < 1 ? v : null;
  });
  const [naturalAspect, setNaturalAspect] = useState(1); // width / height of the generated image
  useEffect(() => {
    try {
      if (resultCrop) localStorage.setItem('eidolon_gen_result_crop', String(resultCrop));
      else localStorage.removeItem('eidolon_gen_result_crop');
    } catch {
      // storage unavailable
    }
  }, [resultCrop]);
  // Effective crop: never taller than the image itself (landscape images are cropped less).
  const effCrop = resultCrop ? Math.min(resultCrop, 1 / naturalAspect) : null;

  // Download the result, cropped the same way as the preview when a crop is active.
  const handleDownload = async (e: React.MouseEvent) => {
    if (!generatedResult || !effCrop) return; // normal link download
    e.preventDefault();
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('load'));
        img.src = generatedResult;
      });
      const side = Math.round(img.naturalWidth * effCrop);
      const sx = Math.round((img.naturalWidth - side) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      canvas.getContext('2d')!.drawImage(img, sx, 0, side, side, 0, 0, side, side);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'eidolon-character.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      window.open(generatedResult, '_blank');
    }
  };

  // Save changes to localStorage so navigating away never loses progress
  useEffect(() => {
    localStorage.setItem('eidolon_gen_style', selectedStyle);
    localStorage.setItem('eidolon_gen_gender', selectedGender);
    localStorage.setItem('eidolon_gen_archetype', archetypeMode);
    localStorage.setItem('eidolon_gen_alignment', selectedAlignment);
    localStorage.setItem('eidolon_gen_animal', selectedAnimal);
    localStorage.setItem('eidolon_gen_traits', JSON.stringify(selectedTraits));
    localStorage.setItem('eidolon_gen_comp_cat', selectedCompanionCategory);
    localStorage.setItem('eidolon_gen_comp', selectedCompanion);
    localStorage.setItem('eidolon_gen_pantheon', selectedPantheonName);
    localStorage.setItem('eidolon_gen_entity', selectedEntityName);
    localStorage.setItem('eidolon_gen_location', selectedLocation);
    localStorage.setItem('eidolon_gen_custom_loc', customLocationText);
    localStorage.setItem('eidolon_gen_clothing', selectedClothing);
    localStorage.setItem('eidolon_gen_custom_clothing', customClothingText);
    localStorage.setItem('eidolon_gen_lighting', selectedLighting);
    localStorage.setItem('eidolon_gen_framing', selectedFraming);
    localStorage.setItem('eidolon_gen_quality', selectedQuality);
  }, [
    selectedStyle,
    selectedGender,
    archetypeMode,
    selectedAlignment,
    selectedAnimal,
    selectedTraits,
    selectedCompanionCategory,
    selectedCompanion,
    selectedPantheonName,
    selectedEntityName,
    selectedLocation,
    customLocationText,
    selectedClothing,
    customClothingText,
    selectedLighting,
    selectedFraming,
    selectedQuality,
  ]);

  useEffect(() => {
    if (generatedResult) {
      localStorage.setItem('eidolon_gen_result', generatedResult);
    }
  }, [generatedResult]);

  // Reference Image: Upload or Pick from Gallery
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [referenceName, setReferenceName] = useState<string>('');
  const [showGalleryPicker, setShowGalleryPicker] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setReferenceImageUrl(dataUrl);
      setReferenceName(file.name);
      setShowGalleryPicker(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectGalleryReference = (art: { title: string; imageUrl: string }) => {
    setReferenceImageUrl(art.imageUrl);
    setReferenceName(art.title);
    setShowGalleryPicker(false);
  };

  const toggleTrait = (traitId: string) => {
    setSelectedTraits((prev) =>
      prev.includes(traitId) ? prev.filter((t) => t !== traitId) : [...prev, traitId]
    );
  };

  const handleClearReference = () => {
    setReferenceImageUrl(null);
    setReferenceName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step 7: Prompt tweaking & expanded aspect ratio (auto-assembled dynamically from each click)
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('4:5');

  // Track manual prompt editing
  const [isPromptCustomized, setIsPromptCustomized] = useState(false);

  // Engine & UI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSavedToGallery, setIsSavedToGallery] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initialPrompt if provided
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      setIsPromptCustomized(true);
    }
  }, [initialPrompt, isOpen]);

  // When pantheon name changes, set default entity to first of that pantheon
  const currentPantheon = PANTHEONS.find((p) => p.name === selectedPantheonName) || PANTHEONS[0];

  const handleSelectPantheon = (name: string) => {
    setSelectedPantheonName(name);
    const target = PANTHEONS.find((p) => p.name === name) || PANTHEONS[0];
    setSelectedEntityName(target.entities[0].name);
  };

  // Characters for the chosen gender: Male = gods + creations (plus extra male characters), Female = goddesses + creations, Any = all.
  const allEntities: PantheonEntity[] = [...currentPantheon.entities, ...(EXTRA_MALE_ENTITIES[currentPantheon.name] ?? [])];
  const visibleEntities = allEntities.filter((e) =>
    selectedGender === 'Male' ? e.type !== 'Goddess' : selectedGender === 'Female' ? e.type !== 'God' : true
  );
  const entityChoices = visibleEntities.length > 0 ? visibleEntities : allEntities;
  const visibleClothing: string[] =
    selectedGender === 'Male'
      ? MALE_CLOTHING_PRESETS
      : selectedGender === 'Any'
      ? Array.from(new Set([...MALE_CLOTHING_PRESETS.filter((c) => c !== 'Custom Attire'), ...CLOTHING_PRESETS]))
      : [...CLOTHING_PRESETS];

  const selectedEntity = entityChoices.find((e) => e.name === selectedEntityName) || entityChoices[0];

  // Switching gender can leave a character or outfit that is no longer offered: move to the first valid one.
  useEffect(() => {
    if (!entityChoices.some((e) => e.name === selectedEntityName)) setSelectedEntityName(entityChoices[0].name);
    if (!visibleClothing.includes(selectedClothing)) setSelectedClothing(visibleClothing[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGender, selectedPantheonName]);

  // Function to compile prompt based on current selections
  const compilePromptFromSelections = (
    style: string,
    gender: string,
    mode: ArchetypeMode,
    alignment: string,
    animal: string,
    traits: string[],
    pantheonName: string,
    entity: PantheonEntity,
    companion: string,
    clothing: string,
    customClothing: string,
    location: string,
    customLocation: string,
    lighting: string,
    framing: string,
    quality: string,
    refUrl: string | null,
    refTitle: string
  ) => {
    // Tight framings must not mention body parts that are out of frame (the model would draw them).
    const closeUp = framing === 'close up portrait';
    const halfBody = framing === 'half body';
    // The word "figure" pulls models toward full-length shots, so tight framings say woman/man/character instead.
    const genderTerm =
      closeUp || halfBody
        ? gender === 'Female' ? 'woman' : gender === 'Male' ? 'man' : 'character'
        : gender === 'Any' ? 'character figure' : `${gender.toLowerCase()} figure`;
    const styleDesc =
      style === 'No Style' ? '' : style === 'Custom Style' ? customStyleText.trim() : `${style} art style`;
    const looksDesc = gender !== 'Female' && selectedLooks.length > 0 ? selectedLooks.join(', ') : '';
    const visibleTraits = traits.filter((t) =>
      closeUp ? !['legs', 'tail', 'arms'].includes(t) : halfBody ? !['legs'].includes(t) : true
    );
    const traitsDesc =
      visibleTraits.length > 0
        ? `distinct animal features (${visibleTraits.map(t => {
            const match = HYBRID_TRAIT_OPTIONS.find(opt => opt.id === t);
            return match ? match.label.toLowerCase() : t;
          }).join(', ')})`
        : '';

    const archetypeDesc =
      mode === 'Cosplay'
        ? `Cosplay representation of ${pantheonName} mythos: ${entity.name} (${entity.type} - ${entity.title}), ${alignment} alignment`
        : `Hybrid chimera fusion with ${animal} primal traits${traitsDesc ? ` featuring ${traitsDesc}` : ''}`;

    // Accurate spatial positioning: small creatures on shoulder/hovering, mounts underneath, medium/large familiars standing proudly beside the main character
    let companionPositioning = '';
    if (companion && companion !== 'None') {
      const lower = companion.toLowerCase();
      if (lower.includes('mount') || lower.includes('elk') || lower.includes('horse') || lower.includes('wyvern') || lower.includes('mare') || lower.includes('griffin')) {
        companionPositioning = `main character seated atop or standing firmly beside grand mount (${companion}), grounded realistic anatomy`;
      } else if (lower.includes('shoulder') || lower.includes('bat') || lower.includes('raven') || lower.includes('crow') || lower.includes('spider') || lower.includes('moth') || lower.includes('sprite') || lower.includes('wisp') || lower.includes('jellyfish')) {
        companionPositioning = `small familiar (${companion}) perched delicately on shoulder or hovering beside head, distinct from character body`;
      } else {
        companionPositioning = `faithful creature (${companion}) standing or crouching obediently beside main character on the ground, separate distinct silhouette, never mounted on back`;
      }
    }

    const companionDesc =
      companion && companion !== 'None' && !closeUp
        ? `Accompanied by companion: ${companionPositioning}`
        : '';

    const fullClothing =
      clothing === 'Custom Attire'
        ? customClothing.trim() || 'custom signature attire'
        : clothing;
    // For close-up and half-body shots, leave out clothing pieces below the frame (boots, skirts, thigh-highs...).
    const LOWER_BODY = /boot|thigh|skirt|knee|shorts|leg|hose|stocking|heel|garter|platform|train|hoof|hooves|paw|toe|tail/i;
    const effectiveClothing = (() => {
      if (!closeUp && !halfBody) return fullClothing;
      const kept = fullClothing.split(/,\s*|\s+&\s+/).filter((seg) => !LOWER_BODY.test(seg));
      if (kept.length > 0) return kept.join(', ');
      return closeUp ? 'ornate gothic collar and neckline' : 'ornate gothic bodice';
    })();

    const rawLocation =
      location === 'Custom Location'
        ? customLocation.trim() || 'custom atmospheric setting'
        : location;
    // In a close-up the background is only a soft blur behind the head, so it can't pull the camera back.
    const effectiveLocation = closeUp ? `softly blurred background of ${rawLocation}` : rawLocation;
    // Repeated at the end of the prompt so the crop line is the last thing the model reads too.
    const cropTail = closeUp
      ? 'bust portrait crop, frame ends at the collarbone'
      : halfBody
      ? 'waist-up crop, frame ends at the belt line'
      : '';

    // Image models drift toward full-body shots, so each framing is described positively (negatives like "no legs"
    // tend to draw legs), out-of-frame clothing/traits are removed above, and the framing is placed first in the prompt.
    // The finished image is also cropped after generation (see resultCrop), so the prompt only has to get close.
    const framingDesc =
      framing === 'close up portrait'
        ? 'bust portrait, head and shoulders, chest-up, natural proportions, cropped at the collarbone, expressive face and eyes'
        : framing === 'half body'
        ? 'medium waist-up portrait, framed at the belt line, upper body and arms, prominent armor and garment details'
        : framing === 'epic'
        ? 'epic ultra-wide cinematic establishing shot, the figure small against a vast towering environment, grand scale, atmospheric depth'
        : 'full-length shot showing the entire body from head to toe including boots and feet, dramatic grounded stance';

    const qualityDesc =
      quality === 'wallpaper'
        ? 'wallpaper grade masterpiece, ultra-sharp 8k resolution, immaculate micro-textures, ray-traced reflections'
        : quality === 'high'
        ? 'high fidelity 4k render, crisp detailed highlights, photorealistic shading'
        : 'standard clean render, balanced studio dynamic range';

    const parts = [
      framingDesc,
      styleDesc,
      genderTerm,
      looksDesc,
      archetypeDesc,
      companionDesc,
      `Attire: ${effectiveClothing}`,
      `Setting: ${effectiveLocation}`,
      `Lighting: ${lighting}`,
      qualityDesc,
      cropTail,
    ];

    if (refUrl && refTitle) {
      parts.push(`Reference composition: inspired by style and anatomy of "${refTitle}"`);
    }

    return parts.filter(Boolean).join(', ');
  };

  // Automatically recompose the prompt cleanly whenever ANY option, trait, or toggle is clicked or unclicked
  useEffect(() => {
    const compiled = compilePromptFromSelections(
      selectedStyle,
      selectedGender,
      archetypeMode,
      selectedAlignment,
      selectedAnimal,
      selectedTraits,
      selectedPantheonName,
      selectedEntity,
      selectedCompanion,
      selectedClothing,
      customClothingText,
      selectedLocation,
      customLocationText,
      selectedLighting,
      selectedFraming,
      selectedQuality,
      referenceImageUrl,
      referenceName
    );

    setPrompt(compiled);
    setIsPromptCustomized(false);
  }, [
    selectedStyle,
    selectedGender,
    archetypeMode,
    selectedAlignment,
    selectedAnimal,
    selectedTraits,
    selectedPantheonName,
    selectedEntity,
    selectedCompanion,
    selectedClothing,
    customClothingText,
    selectedLocation,
    customLocationText,
    selectedLighting,
    selectedFraming,
    selectedQuality,
    referenceImageUrl,
    referenceName,
    selectedLooks,
    customStyleText,
  ]);

  if (!isOpen) return null;

  const handleSaveToCommunity = () => {
    if (!generatedResult) return;

    const title =
      archetypeMode === 'Cosplay'
        ? `${selectedEntity.name} (${selectedPantheonName})`
        : `${selectedAnimal} Hybrid`;

    // Map style to category
    const cat = selectedStyle.toLowerCase().includes('anime')
      ? 'anime'
      : selectedStyle.toLowerCase().includes('gothic')
      ? 'gothic'
      : selectedStyle.toLowerCase().includes('steampunk') || selectedStyle.toLowerCase().includes('gaming')
      ? 'scifi'
      : 'mythology';

    saveArtworkToCommunity({
      title,
      category: cat as 'mythology' | 'anime' | 'realism' | 'gothic' | 'scifi' | 'fantasy',
      pantheon: selectedPantheonName,
      imageUrl: generatedResult,
      prompt,
      aspectRatio: aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[4/5]',
    });

    setIsSavedToGallery(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedResult(null);
    setResultCrop(null);
    setIsSavedToGallery(false);

    // Use the prompt directly as visible on screen (which is assembled dynamically from all clicks and user edits)
    const fullPrompt = prompt.trim();

    // Generation runs on the server: it checks sign-in, moderation and limits,
    // then calls fal.ai with the studio's own key. No key ever reaches the browser.
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Please sign in to generate images.');
      }
      const usageNow = await loadUsage();
      if (usageNow && !usageNow.isOwner) {
        if (usageNow.imagesLimit <= 0 && usageNow.imagesHighLimit <= 0) {
          throw new Error('Free accounts can browse the gallery. Choose a plan to generate images.');
        }
        if (engineTier === 'high') {
          if (usageNow.imagesHighLimit <= 0) {
            throw new Error("High quality isn't included in your plan. Choose Standard, or upgrade your plan.");
          }
          if (usageNow.imagesHighUsed >= usageNow.imagesHighLimit) {
            throw new Error(`You've used all ${usageNow.imagesHighLimit} High-quality images this month. Try Standard.`);
          }
        } else if (usageNow.imagesUsed >= usageNow.imagesLimit) {
          throw new Error(`You've used all ${usageNow.imagesLimit} Standard images this month.`);
        }
      }

      setProgress(25);
      setStatusMessage('Sending to the Eidolon studio...');

      const targetRatio = RATIOS.find((r) => r.id === aspectRatio);
      // Tall frames invite a full body, so Close Up is always requested square (the on-screen crop does the rest).
      const imageSize = selectedFraming === 'close up portrait' ? 'square_hd' : targetRatio ? targetRatio.falSize : 'portrait_4_3';

      setProgress(55);
      setStatusMessage(`Rendering ${selectedStyle} • ${archetypeMode}...`);

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: fullPrompt, image_size: imageSize, quality: engineTier },
      });

      if (error) {
        let detail = error.message;
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx) {
            const body = await ctx.json();
            if (body?.error) detail = body.error;
          }
        } catch {
          // keep default message
        }
        throw new Error(detail);
      }

      const generatedUrl: string | undefined = data?.url;
      if (!generatedUrl) {
        throw new Error('The studio did not return an image. Please try again.');
      }

      setProgress(100);
      setGeneratedResult(generatedUrl);
      // Only Close Up and Half Body are cropped. Full Body and Epic keep crop = null and are never touched.
      const cropFrac = selectedFraming === 'close up portrait' ? 0.55 : selectedFraming === 'half body' ? 0.72 : null;
      setResultCrop(cropFrac);
      let finalUrl = generatedUrl;
      if (cropFrac) {
        // Store the cropped copy so history, community gallery and 3D all use it. Any failure keeps the original
        // image with the on-screen crop, exactly as before.
        try {
          const blob = await cropUrlToJpeg(generatedUrl, cropFrac);
          const b64 = await new Promise<string>((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result).split(',')[1] || '');
            fr.onerror = () => reject(new Error('read'));
            fr.readAsDataURL(blob);
          });
          const { data: cropData, error: cropErr } = await supabase.functions.invoke('save-crop', {
            body: { original_url: generatedUrl, image_base64: b64 },
          });
          if (!cropErr && cropData?.url) {
            finalUrl = cropData.url as string;
            setGeneratedResult(finalUrl);
            setResultCrop(null); // already cropped, so no on-screen crop needed
          }
        } catch {
          // keep the original with the on-screen crop
        }
      }

      const generatedTitle =
        archetypeMode === 'Cosplay'
          ? `${selectedEntity.name} (${selectedPantheonName})`
          : `${selectedAnimal} Hybrid`;

      saveToGenerationHistory({
        imageUrl: finalUrl,
        prompt,
        title: generatedTitle,
        style: selectedStyle,
        clothing: selectedClothing,
        pantheon: selectedPantheonName,
        aspectRatio: aspectRatio,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      notifyUsageChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#0D0F14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#0A0C10]">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Eidolon Neural Synthesis Canvas
              </h3>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Streamlined Parametric Character Studio
              </p>
            </div>
            <UsageBadge kind="image" />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Controls Column */}
          <div className="lg:col-span-7 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/10 space-y-5">
            <form onSubmit={handleGenerate} className="space-y-5">
              
              {/* ROW 1: Art Style & Character Form (Clean compact selectors) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Art Style Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-mono">1</span>
                    Art Style
                  </label>
                  <div className="relative">
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="w-full appearance-none bg-[#141720] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none cursor-pointer pr-9 transition"
                    >
                      {ART_STYLES.map((style) => (
                        <option key={style} value={style} className="bg-[#0D0F14] text-white">
                          {style}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {selectedStyle === 'Custom Style' && (
                    <input
                      type="text"
                      value={customStyleText}
                      onChange={(e) => setCustomStyleText(e.target.value)}
                      placeholder="Describe the style (e.g. oil painting, ink wash, 80s dark fantasy cover art)..."
                      className="w-full bg-[#10131A] border border-emerald-500/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition animate-fade-in"
                    />
                  )}
                </div>

                {/* 1.5 Gender / Form Pills */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Form / Gender
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 h-[38px]">
                    {GENDER_OPTIONS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGender(g)}
                        className={`rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center ${
                          selectedGender === g
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-[#141720] text-gray-400 border border-white/5 hover:text-white'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Male build / look chips */}
              {selectedGender !== 'Female' && (
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Build & Look
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MALE_LOOKS.map((look) => {
                      const on = selectedLooks.includes(look);
                      return (
                        <button
                          key={look}
                          type="button"
                          onClick={() =>
                            setSelectedLooks((prev) => (on ? prev.filter((l) => l !== look) : [...prev, look]))
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                            on
                              ? 'bg-white text-black shadow-sm'
                              : 'bg-[#141720] text-gray-400 border border-white/5 hover:text-white'
                          }`}
                        >
                          {look}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ROW 2: Archetype Mode Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-mono">2</span>
                    Archetype Mode
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">{archetypeMode}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['Cosplay', 'Hybrid'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setArchetypeMode(mode)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                        archetypeMode === mode
                          ? 'bg-white text-black shadow-sm'
                          : 'bg-[#141720] text-gray-400 border border-white/5 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* COSPLAY PATH: Alignment Dropdown + Pantheon & Entity Dropdown */}
              {archetypeMode === 'Cosplay' && (
                <div className="space-y-3 bg-[#10131A] p-3.5 rounded-xl border border-white/5 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Alignment Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-mono">3</span>
                        Cosplay Class (Alignment)
                      </label>
                      <div className="relative">
                        <select
                          value={selectedAlignment}
                          onChange={(e) => setSelectedAlignment(e.target.value)}
                          className="w-full appearance-none bg-[#171B24] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none cursor-pointer pr-9 transition"
                        >
                          {ALIGNMENT_CLASSES.map((align) => (
                            <option key={align} value={align} className="bg-[#0D0F14] text-white">
                              {align}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Pantheon / Category Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-mono">4</span>
                        Pantheon / Roleplaying World
                      </label>
                      <div className="relative">
                        <select
                          value={selectedPantheonName}
                          onChange={(e) => handleSelectPantheon(e.target.value)}
                          className="w-full appearance-none bg-[#171B24] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none cursor-pointer pr-9 transition"
                        >
                          {PANTHEONS.map((p) => (
                            <option key={p.name} value={p.name} className="bg-[#0D0F14] text-white">
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Character Entity Dropdown (Gods, Goddesses, Fantasy & RPG Classes) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] uppercase tracking-wider text-gray-300 font-semibold">
                        Roleplay Character / Entity Archetype
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {selectedEntity.type} • {selectedEntity.title}
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        value={selectedEntityName}
                        onChange={(e) => setSelectedEntityName(e.target.value)}
                        className="w-full appearance-none bg-[#171B24] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none cursor-pointer pr-9 transition"
                      >
                        {entityChoices.map((entity) => (
                          <option key={entity.name} value={entity.name} className="bg-[#0D0F14] text-white">
                            [{entity.type}] {entity.name} — {entity.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* HYBRID PATH: Animal Dropdown + Traits Wanted Chips */}
              {archetypeMode === 'Hybrid' && (
                <div className="space-y-3 bg-[#10131A] p-3.5 rounded-xl border border-white/5 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-mono">3</span>
                      Hybrid Animal Fusion
                    </label>
                    <div className="relative">
                      <select
                        value={selectedAnimal}
                        onChange={(e) => setSelectedAnimal(e.target.value)}
                        className="w-full appearance-none bg-[#171B24] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none cursor-pointer pr-9 transition"
                      >
                        {HYBRID_ANIMALS.map((animal) => (
                          <option key={animal} value={animal} className="bg-[#0D0F14] text-white">
                            {animal}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Traits Wanted */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
                        Traits Wanted
                      </label>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {selectedTraits.length} selected
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {HYBRID_TRAIT_OPTIONS.map((trait) => {
                        const isActive = selectedTraits.includes(trait.id);
                        return (
                          <button
                            key={trait.id}
                            type="button"
                            onClick={() => toggleTrait(trait.id)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition text-center truncate flex items-center justify-center gap-1.5 ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 font-semibold'
                                : 'bg-[#171B24] text-gray-400 border border-white/5 hover:text-white'
                            }`}
                            title={trait.desc}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                            <span>{trait.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* FAMILIARS, COMPANIONS & MOUNTS SECTION */}
              <div className="space-y-2.5 bg-[#10131A] p-3.5 rounded-xl border border-white/5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Familiars, Predators, Mounts & Ethereal Companions
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {selectedCompanion !== 'None' ? selectedCompanion : 'No Companion'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-gray-400">
                      Companion Realm
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCompanionCategory}
                        onChange={(e) => {
                          setSelectedCompanionCategory(e.target.value);
                          const cat = COMPANION_COLLECTIONS.find(c => c.category === e.target.value);
                          if (cat && cat.items.length > 1) {
                            setSelectedCompanion(cat.items[1]);
                          } else {
                            setSelectedCompanion('None');
                          }
                        }}
                        className="w-full appearance-none bg-[#171B24] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none cursor-pointer pr-8 transition font-mono"
                      >
                        {COMPANION_COLLECTIONS.map((c) => (
                          <option key={c.category} value={c.category} className="bg-[#0D0F14] text-white">
                            {c.category}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Specific Companion Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-gray-400">
                      Chosen Creature / Mount
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCompanion}
                        onChange={(e) => setSelectedCompanion(e.target.value)}
                        className="w-full appearance-none bg-[#171B24] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none cursor-pointer pr-8 transition font-mono"
                      >
                        {COMPANION_COLLECTIONS.find(c => c.category === selectedCompanionCategory)?.items.map((item) => (
                          <option key={item} value={item} className="bg-[#0D0F14] text-white">
                            {item}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 3: Clothing Choices & Custom Attire */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 text-emerald-400" />
                    Clothing & Attire
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Customizable</span>
                </div>
                <div className="relative">
                  <select
                    value={selectedClothing}
                    onChange={(e) => {
                      const newClothing = e.target.value;
                      setSelectedClothing(newClothing);
                      setIsPromptCustomized(false);
                      const updated = compilePromptFromSelections(
                        selectedStyle,
                        selectedGender,
                        archetypeMode,
                        selectedAlignment,
                        selectedAnimal,
                        selectedTraits,
                        selectedPantheonName,
                        selectedEntity,
                        selectedCompanion,
                        newClothing,
                        customClothingText,
                        selectedLocation,
                        customLocationText,
                        selectedLighting,
                        selectedFraming,
                        selectedQuality,
                        referenceImageUrl,
                        referenceName
                      );
                      setPrompt(updated);
                    }}
                    className="w-full appearance-none bg-[#141720] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none cursor-pointer pr-9 transition"
                  >
                    {visibleClothing.map((attire) => (
                      <option key={attire} value={attire} className="bg-[#0D0F14] text-white">
                        {attire}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {/* Custom Attire Text Input if Custom selected */}
                {selectedClothing === 'Custom Attire' && (
                  <input
                    type="text"
                    value={customClothingText}
                    onChange={(e) => {
                      const newCustom = e.target.value;
                      setCustomClothingText(newCustom);
                      setIsPromptCustomized(false);
                      const updated = compilePromptFromSelections(
                        selectedStyle,
                        selectedGender,
                        archetypeMode,
                        selectedAlignment,
                        selectedAnimal,
                        selectedTraits,
                        selectedPantheonName,
                        selectedEntity,
                        selectedCompanion,
                        selectedClothing,
                        newCustom,
                        selectedLocation,
                        customLocationText,
                        selectedLighting,
                        selectedFraming,
                        selectedQuality,
                        referenceImageUrl,
                        referenceName
                      );
                      setPrompt(updated);
                    }}
                    placeholder="Describe custom attire (e.g. obsidian dragon-scale mail, ripped cyber kimono)..."
                    className="w-full bg-[#10131A] border border-emerald-500/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition animate-fade-in"
                  />
                )}
              </div>

              {/* ROW 4: Location Backdrop with Custom Location */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    Location Backdrop
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Customizable</span>
                </div>
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => {
                      const newLoc = e.target.value;
                      setSelectedLocation(newLoc);
                      setIsPromptCustomized(false);
                      const updated = compilePromptFromSelections(
                        selectedStyle,
                        selectedGender,
                        archetypeMode,
                        selectedAlignment,
                        selectedAnimal,
                        selectedTraits,
                        selectedPantheonName,
                        selectedEntity,
                        selectedCompanion,
                        selectedClothing,
                        customClothingText,
                        newLoc,
                        customLocationText,
                        selectedLighting,
                        selectedFraming,
                        selectedQuality,
                        referenceImageUrl,
                        referenceName
                      );
                      setPrompt(updated);
                    }}
                    className="w-full appearance-none bg-[#141720] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none cursor-pointer pr-9 transition"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc} className="bg-[#0D0F14] text-white">
                        {loc}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {/* Custom Location Text Input if Custom selected */}
                {selectedLocation === 'Custom Location' && (
                  <input
                    type="text"
                    value={customLocationText}
                    onChange={(e) => {
                      const newCustomLoc = e.target.value;
                      setCustomLocationText(newCustomLoc);
                      setIsPromptCustomized(false);
                      const updated = compilePromptFromSelections(
                        selectedStyle,
                        selectedGender,
                        archetypeMode,
                        selectedAlignment,
                        selectedAnimal,
                        selectedTraits,
                        selectedPantheonName,
                        selectedEntity,
                        selectedCompanion,
                        selectedClothing,
                        customClothingText,
                        selectedLocation,
                        newCustomLoc,
                        selectedLighting,
                        selectedFraming,
                        selectedQuality,
                        referenceImageUrl,
                        referenceName
                      );
                      setPrompt(updated);
                    }}
                    placeholder="Describe custom setting (e.g. shattered moon base, ruined crystal sanctuary)..."
                    className="w-full bg-[#10131A] border border-emerald-500/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition animate-fade-in"
                  />
                )}
              </div>

              {/* ROW 5: Mood Lighting Dropdown + Output Framing & Quality in Compact Grids */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-white/5">
                {/* Mood Lighting Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-emerald-400" />
                    Mood Lighting
                  </label>
                  <div className="relative">
                    <select
                      value={selectedLighting}
                      onChange={(e) => setSelectedLighting(e.target.value)}
                      className="w-full appearance-none bg-[#141720] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none cursor-pointer pr-8 transition truncate"
                    >
                      {MOOD_LIGHTINGS.map((light) => (
                        <option key={light} value={light} className="bg-[#0D0F14] text-white">
                          {light}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Output Framing Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                    Framing
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFraming}
                      onChange={(e) => setSelectedFraming(e.target.value)}
                      className="w-full appearance-none bg-[#141720] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none cursor-pointer pr-8 transition capitalize truncate"
                    >
                      {FRAMING_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#0D0F14] text-white">
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Output Quality Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                    Quality Tier
                  </label>
                  <div className="relative">
                    <select
                      value={selectedQuality}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                      className="w-full appearance-none bg-[#141720] border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none cursor-pointer pr-8 transition truncate"
                    >
                      {QUALITY_OPTIONS.map((q) => (
                        <option key={q.id} value={q.id} className="bg-[#0D0F14] text-white">
                          {q.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* ROW 6: Aspect Ratio Pills */}
              <div className="space-y-1.5 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                    Aspect Ratio
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">{aspectRatio}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {RATIOS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAspectRatio(r.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-mono transition text-center truncate ${
                        aspectRatio === r.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 font-bold'
                          : 'bg-[#141720] text-gray-400 border border-white/5 hover:text-white'
                      }`}
                    >
                      {r.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* REFERENCE UPLOAD & GALLERY REFERENCE */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    Reference Image
                  </label>
                  <span className="text-[10px] text-gray-400">Optional Guidance</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {referenceImageUrl ? (
                  <div className="flex items-center gap-3 p-2.5 bg-[#10131A] border border-emerald-500/30 rounded-xl animate-fade-in">
                    <img
                      src={referenceImageUrl}
                      alt="Reference"
                      className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{referenceName || 'Custom Reference'}</p>
                      <p className="text-[10px] text-emerald-400 font-medium">Applied to composition & style prompt</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearReference}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
                      title="Remove reference"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-3 rounded-xl bg-[#141720] hover:bg-[#1A1F2C] border border-dashed border-white/15 text-gray-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-400" />
                      <span>Upload Reference</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowGalleryPicker(!showGalleryPicker)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                        showGalleryPicker
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-[#141720] hover:bg-[#1A1F2C] border-white/10 text-gray-300 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>Choose From Gallery</span>
                    </button>
                  </div>
                )}

                {/* Gallery Reference Picker Drawer */}
                {showGalleryPicker && !referenceImageUrl && (
                  <div className="p-3 bg-[#10131A] border border-white/10 rounded-xl space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-300">Select an artwork as reference:</span>
                      <button
                        type="button"
                        onClick={() => setShowGalleryPicker(false)}
                        className="text-[10px] text-gray-400 hover:text-white"
                      >
                        Close
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                      {getAllGalleryArtworks().slice(0, 12).map((art) => (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() => handleSelectGalleryReference(art)}
                          className="group relative rounded-lg overflow-hidden border border-white/10 hover:border-emerald-400 aspect-[4/5] transition text-left"
                        >
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-1 bg-black/80 backdrop-blur-xs text-[9px] text-gray-200 truncate">
                            {art.title}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PROMPT TWEAKING SCREEN */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-white font-bold flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                    Prompt Tweaking & Live Synthesis String
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPrompt("Gothic/Alt art style, female figure, Cosplay representation of Infernal mythos: Lilith (Goddess - Mother of Demons), Chaotic Neutral, Attire: Ornate Ceremonial Armor with Runic Gold Filigree + demon bat wings + thorn horns, full body shot, Throne of bones and skulls surrounded by obsidian columns, Cinematic Chiaroscuro, wallpaper grade masterpiece");
                        setIsPromptCustomized(true);
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono transition bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                      title="Load recommended blueprint format"
                    >
                      Use Blueprint
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const resetCompiled = compilePromptFromSelections(
                          selectedStyle,
                          selectedGender,
                          archetypeMode,
                          selectedAlignment,
                          selectedAnimal,
                          selectedTraits,
                          selectedPantheonName,
                          selectedEntity,
                          selectedCompanion,
                          selectedClothing,
                          customClothingText,
                          selectedLocation,
                          customLocationText,
                          selectedLighting,
                          selectedFraming,
                          selectedQuality,
                          referenceImageUrl,
                          referenceName
                        );
                        setPrompt(resetCompiled);
                        setIsPromptCustomized(false);
                      }}
                      className="text-[10px] text-gray-400 hover:text-emerald-400 font-mono transition underline"
                      title="Recompile clean prompt from selected options"
                    >
                      Reset to Choices
                    </button>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {isPromptCustomized ? 'Customized' : 'Live Sync'}
                    </span>
                  </div>
                </div>

                {/* Prompt Blueprint Guidance Helper Badge */}
                <div className="p-2.5 rounded-lg bg-[#0F121A] border border-emerald-500/20 text-[11px] text-gray-300 space-y-1 font-mono">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                    Formula Blueprint
                  </span>
                  <p className="text-gray-400 leading-snug">
                    <span className="text-emerald-300">Gothic/Alt</span>, female figure, Cosplay representation of <span className="text-emerald-300">[COURT]</span>: [NAME] (Goddess - [TITLE]), Chaotic Neutral, Attire: Ornate Ceremonial Armor with Runic Gold Filigree + <span className="text-emerald-300">[1 ANIMAL TRAIT]</span> + <span className="text-emerald-300">[1 SKIN/TRAIT]</span>, full body shot, <span className="text-emerald-300">[SETTING #4]</span>, Cinematic Chiaroscuro, wallpaper grade masterpiece
                  </p>
                </div>

                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setIsPromptCustomized(true);
                  }}
                  placeholder="Your prompt updates live with every selection above. Tweak freely..."
                  className="w-full bg-[#141720] border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition font-mono leading-relaxed"
                  required
                />
              </div>

              {/* Image quality tier (counted separately on your plan) */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Image quality</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['standard', 'high'] as const).map((t) => {
                    const left =
                      tierUsage && !tierUsage.isOwner
                        ? t === 'high'
                          ? Math.max(0, tierUsage.imagesHighLimit - tierUsage.imagesHighUsed)
                          : Math.max(0, tierUsage.imagesLimit - tierUsage.imagesUsed)
                        : null;
                    const off = tierUsage && !tierUsage.isOwner && (t === 'high' ? tierUsage.imagesHighLimit <= 0 : tierUsage.imagesLimit <= 0);
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={!!off}
                        onClick={() => setEngineTier(t)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold tracking-wide transition border disabled:opacity-40 disabled:cursor-not-allowed ${
                          engineTier === t
                            ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                            : 'bg-[#141720] border-white/10 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        {t === 'high' ? 'High quality' : 'Standard'}
                        {left !== null ? <span className="ml-1.5 font-mono text-[10px] opacity-70">{off ? 'not in plan' : `${left} left`}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 px-6 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-white/5"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Synthesizing Archetype...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Generate Character</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Preview Canvas Column */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-[#08090C] flex flex-col items-center justify-center relative min-h-[340px]">
            {errorMessage && (
              <div className="mb-4 w-full p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">fal.ai Generation Issue</p>
                  <p className="text-[11px] text-red-300/80 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}
            
            {isGenerating ? (
              <div className="text-center space-y-4 max-w-xs px-4">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="w-full h-full rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                  <Sparkles className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                    Rendering Neural Matrix
                  </p>
                  <p className="text-xs text-gray-300 transition-all font-mono">
                    {statusMessage || 'Initializing generation...'}
                  </p>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{progress}% Complete</span>
                </div>
              </div>
            ) : generatedResult ? (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4 animate-fade-in">
                <div
                  className={`relative rounded-xl overflow-hidden border border-white/20 shadow-2xl w-full ${effCrop ? '' : 'max-h-[420px]'}`}
                  style={effCrop ? { aspectRatio: '1 / 1' } : undefined}
                >
                  <img
                    src={generatedResult}
                    alt="Generated Character"
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      if (el.naturalWidth && el.naturalHeight) setNaturalAspect(el.naturalWidth / el.naturalHeight);
                    }}
                    className={effCrop ? 'absolute max-w-none' : 'w-full h-full object-cover'}
                    style={
                      effCrop
                        ? { width: `${100 / effCrop}%`, left: `${-((100 / effCrop - 100) / 2)}%`, top: 0 }
                        : undefined
                    }
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md p-2.5 rounded-lg text-[11px] text-gray-300 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">{selectedStyle} • {selectedGender}</span>
                      <span className="text-gray-400 font-mono text-[10px]">{aspectRatio}</span>
                    </div>
                    <p className="text-gray-300 truncate">
                      {archetypeMode === 'Cosplay' ? `${selectedPantheonName}: ${selectedEntity.name}` : `Hybrid • ${selectedAnimal}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleSaveToCommunity}
                    disabled={isSavedToGallery}
                    className={`flex-1 py-2.5 px-3 text-center text-xs font-semibold rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 ${
                      isSavedToGallery
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    }`}
                  >
                    {isSavedToGallery ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved to Community Gallery!</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Save to Community Gallery</span>
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <a
                      href={`/3d-models?imageUrl=${encodeURIComponent(generatedResult)}&prompt=${encodeURIComponent(prompt)}&title=${encodeURIComponent((archetypeMode === 'Cosplay' ? `${selectedPantheonName} - ${selectedEntity.name}` : `${selectedAnimal} Hybrid`))}`}
                      className="py-2.5 px-3 text-center text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                      title="Convert this generation directly into a 3D mesh via Tripo3D"
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>Tripo 3D</span>
                    </a>

                    <a
                      href={generatedResult}
                      download="eidolon-character.png"
                      onClick={handleDownload}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 text-center text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center gap-1"
                      title="Download full render"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSavedToGallery(false);
                        setResultCrop(null);
                        const next = ARTWORK_GALLERY[Math.floor(Math.random() * ARTWORK_GALLERY.length)];
                        setGeneratedResult(next.imageUrl);
                      }}
                      className="px-3 py-2.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                      title="Regenerate variant"
                    >
                      Variant
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
                  <Shield className="w-7 h-7 text-emerald-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-200">Synthesis Ready</h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Use the dropdowns to configure style, character, clothing, location, and mood, then generate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
