# Eidolon back burner

Things noted for later (kept here so session resets don't lose them).

## Before launch
- Rotate the fal and Tripo keys (two key-named junk files were once in the public repo's history); update FAL_KEY and TRIPO_KEY in Supabase Secrets. Consider making the repo private.
- Tripo: get written permission to resell 3D to end users (their general terms restrict it). Until then keep 3D for testers only.
- Stripe: finish test mode (buy buttons, webhook endpoint, STRIPE_WEBHOOK_SECRET / STRIPE_SECRET_KEY, plan ids in Admin), then live mode and the customer portal.
- Turn Confirm email back ON in Supabase.
- Move Supabase to Pro; set low-balance alerts on fal and Tripo.
- Real contact email in src/lib/legal.ts (and use the same one in the Pricing page mailto); lawyer review of the Legal pages; consider incorporating.

## Product
- Public 3D gallery (everyone's models). Needs Tripo's permission first. Today "Your 3D Models" is private to each person.
- Gallery preview as a real turntable (short spinning clip or sprite) instead of a still picture. The Spin button covers it for now, one model at a time.
- Male clothing options for the generator (notes below).
- Dead buttons: audit every button and fix or remove the ones that go nowhere.
- Roster review: go through the character list for trademark/copyright-sensitive names.
- Community gallery and history still live in browser storage; move to the database.
- Remove the third-party Wegic script from vite.config.ts.
- Admin Overview text still says payments are not connected; update it.
- If fal's safety checker flags a lot of normal prompts, tune the prompt wording per style (e.g. no "photorealistic" with Cartoon/Anime). Flags are logged as engine_safety and add no strike.

## Male clothing notes (from the user, pasted as written; first pack's heading was cut off)

- Head: Dragon helm / Bull horns helm / Stag antler crown (never full face mask)
- Shoulders: One big spiked pauldron, one bare arm (asymmetrical = cool)
- Chest: Bare chest OR scale chest harness, not t-shirt. Gold runic chains across chest
- Arms: Wrapped cloth + clawed gauntlets / Talon bracers
- Waist: Leather war kilt / tattered loincloth over pants, heavy chain belt, bone charms
- Legs: Leather pants, leg wraps, fishnet under ripped knees if you want to match girls
- Feet: High black boots with toe claws
- Pet: Snake / Dragon at heel
- Prompt piece: Ornate Draconic Pauldrons, Scale Chest Harness with Runic Gold Filigree, Clawed Gauntlets, War Kilt with Chains

### PACK B: Nether Street Goth (for Infernal Court, Harajuku alley guys)
The bull guy, fixed: no white t-shirt.
- Top: Long black mesh shirt / fishnet long sleeve under open leather vest
- Bottom: Black cargo pants / leather pants with chains and straps hanging
- Details: Dog collar choker, bead necklaces, wrist wraps with spikes
- Shoes: Big stomp boots
- Vibe: Unimpressed yokai guy who works at a tattoo shop in hell
- Prompt piece: Black Mesh Long Sleeve, Open Leather Harness Vest, Chain Cargo Pants, Spiked Choker, Wrapped Wrists

### PACK C: Ritual Widower / Crossdresser King (Marduk in a dress, as intentional fashion, not a costume fail)
- Dress: Same long sheer black dress but cinched with a MALE corset / wide leather chest belt, not a sweetheart bra
- Shoulders: Keep the sharp armor pauldrons over the dress (armor + dress contrast)
- Legs: One leg sheer stocking / one leg armored boot (asymmetry)
- Hair: Keep the long hair, keep the horns
- Weapon: Storm spear / Thunder whip so you know it's still Marduk
- Prompt piece: Feminine Mourning Dress worn as Ritual Robe over Masculine War Armor, Sheer Spiderweb Fabric over Draconic Pauldrons, High Slit with Armored Greaves, Long Hair, Stag Horns, Thunder Spear
