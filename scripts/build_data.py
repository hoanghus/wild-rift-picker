#!/usr/bin/env python3
"""Build all Wild Rift data files for the picker tool."""
import json
import os
import re

# ===== 1. Read CommunityDragon champion data (has roles) =====
cd_file = os.path.expanduser("~/.hermes/cache/web/raw.communitydragon.org-6cc7251f73.md")
with open(cd_file, 'r') as f:
    content = f.read()

# The file starts with JSON content (first line is JSON array)
json_start = content.index('[')
champ_list = json.loads(content[json_start:])

# Build lookup by name (normalized)
cd_by_name = {}
for c in champ_list:
    if c["id"] > 0:  # skip "-1" entry
        cd_by_name[c["name"].lower()] = c

# ===== 2. Read our champion list with tiers =====
with open('/Users/one/wild-rift-picker/data/champions_raw.json') as f:
    raw = json.load(f)

# ===== 3. Role mapping (Riot tags → Wild Rift lanes) =====
# A champion can have multiple roles; we assign the primary lane
# based on typical Wild Rift meta
ROLE_TO_LANES = {
    "mage": ["mid", "support"],
    "fighter": ["baron", "jungle"],
    "tank": ["support", "baron", "jungle"],
    "assassin": ["mid", "jungle"],
    "marksman": ["adc"],
    "support": ["support"],
}

# Manual overrides for champions that need specific lane assignment
MANUAL_LANES = {
    # Baron lane
    "aatrox": ["baron"],
    "ambessa": ["baron"],
    "camille": ["baron", "jungle"],
    "darius": ["baron"],
    "fiora": ["baron"],
    "garen": ["baron"],
    "gnar": ["baron"],
    "gwen": ["baron", "jungle"],
    "irelia": ["baron", "mid"],
    "jayce": ["baron", "mid"],
    "kayle": ["baron", "mid"],
    "kennen": ["baron"],
    "k'sante": ["baron"],
    "malphite": ["baron", "support"],
    "mordekaiser": ["baron"],
    "nasus": ["baron"],
    "olaf": ["baron", "jungle"],
    "ornn": ["baron"],
    "renekton": ["baron"],
    "riven": ["baron"],
    "sett": ["baron"],
    "shen": ["baron", "support"],
    "singed": ["baron"],
    "sion": ["baron", "support"],
    "teemo": ["baron", "mid"],
    "tryndamere": ["baron"],
    "urgot": ["baron"],
    "volibear": ["baron", "jungle"],
    "wukong": ["baron", "jungle"],
    "yunara": ["baron"],
    # Jungle
    "amumu": ["jungle", "support"],
    "diana": ["jungle", "mid"],
    "evelynn": ["jungle"],
    "fiddlesticks": ["jungle"],
    "graves": ["jungle"],
    "hecarim": ["jungle"],
    "jarvan iv": ["jungle", "baron"],
    "jax": ["jungle", "baron"],
    "kayn": ["jungle"],
    "kha'zix": ["jungle"],
    "kindred": ["jungle", "adc"],
    "lee sin": ["jungle", "baron"],
    "lillia": ["jungle", "baron"],
    "master yi": ["jungle"],
    "nidalee": ["jungle"],
    "nocturne": ["jungle", "baron"],
    "nunu & willump": ["jungle"],
    "rammus": ["jungle"],
    "rengar": ["jungle", "baron"],
    "shyvana": ["jungle", "baron"],
    "skarner": ["jungle"],
    "talon": ["jungle", "mid"],
    "vi": ["jungle"],
    "viego": ["jungle", "baron"],
    "warwick": ["jungle", "baron"],
    "xin zhao": ["jungle", "baron"],
    # Mid
    "ahri": ["mid"],
    "akali": ["mid", "baron"],
    "akshan": ["mid"],
    "annie": ["mid", "support"],
    "aurelion sol": ["mid"],
    "aurora": ["mid", "baron"],
    "brand": ["mid", "support"],
    "corki": ["mid", "adc"],
    "draven": ["adc"],
    "ekko": ["mid", "jungle"],
    "fizz": ["mid"],
    "galio": ["mid", "support"],
    "heimerdinger": ["mid", "support"],
    "kassadin": ["mid"],
    "katarina": ["mid"],
    "leblanc": ["mid"],
    "lissandra": ["mid"],
    "mel": ["mid"],
    "norra": ["mid"],
    "ori": ["mid"],
    "orianna": ["mid"],
    "pantheon": ["mid", "baron", "support"],
    "ryze": ["mid", "baron"],
    "swain": ["mid", "baron", "support"],
    "syndra": ["mid"],
    "taliyah": ["mid", "jungle"],
    "twisted fate": ["mid"],
    "veigar": ["mid"],
    "vex": ["mid"],
    "viktor": ["mid"],
    "vladimir": ["mid", "baron"],
    "yasuo": ["mid", "baron"],
    "yone": ["mid", "baron"],
    "zed": ["mid"],
    "ziggs": ["mid", "adc"],
    "zoe": ["mid"],
    # ADC
    "ashe": ["adc"],
    "caitlyn": ["adc"],
    "ezreal": ["adc"],
    "jhin": ["adc"],
    "jinx": ["adc"],
    "kai'sa": ["adc"],
    "kalista": ["adc"],
    "kog'maw": ["adc"],
    "lucian": ["adc", "mid"],
    "miss fortune": ["adc"],
    "nilah": ["adc"],
    "samira": ["adc"],
    "sivir": ["adc"],
    "smolder": ["adc", "mid"],
    "tristana": ["adc"],
    "twitch": ["adc", "jungle"],
    "varus": ["adc", "mid"],
    "vayne": ["adc", "baron"],
    "xayah": ["adc"],
    "zeri": ["adc"],
    # Support
    "alistar": ["support"],
    "bard": ["support"],
    "blitzcrank": ["support"],
    "braum": ["support"],
    "janna": ["support"],
    "karma": ["support", "mid"],
    "leona": ["support"],
    "lulu": ["support"],
    "lux": ["support", "mid"],
    "maokai": ["support", "baron"],
    "milio": ["support"],
    "morgana": ["support", "mid"],
    "nami": ["support"],
    "nautilus": ["support"],
    "poppy": ["support", "jungle", "baron"],
    "pyke": ["support"],
    "rakan": ["support"],
    "rell": ["support"],
    "seraphine": ["support", "mid"],
    "sona": ["support"],
    "soraka": ["support"],
    "thresh": ["support"],
    "yuumi": ["support"],
    "zilean": ["support", "mid"],
    "zyra": ["support", "mid"],
}

# ===== 4. Build final champion list =====
WILD_RIFT_LANES = ["baron", "jungle", "mid", "adc", "support"]
LANE_NAMES = {
    "baron": "Baron (Top)",
    "jungle": "Jungle",
    "mid": "Mid",
    "adc": "ADC (Duo)",
    "support": "Support"
}

champions = []
for c in raw["champions"]:
    name_lower = c["name"].strip().lower()
    
    # Get lanes from manual map, or infer from CD roles
    if name_lower in MANUAL_LANES:
        lanes = MANUAL_LANES[name_lower]
    else:
        # Try to find in CommunityDragon data
        cd_entry = cd_by_name.get(name_lower)
        if cd_entry:
            roles = [r.lower() for r in cd_entry.get("roles", [])]
            # Map roles to lanes
            lane_set = set()
            for r in roles:
                if r in ROLE_TO_LANES:
                    for lane in ROLE_TO_LANES[r]:
                        lane_set.add(lane)
            lanes = sorted(lane_set) if lane_set else ["mid"]
        else:
            lanes = ["mid"]
    
    # Use CommunityDragon icon
    icon = c["icon"]
    cd_entry = cd_by_name.get(name_lower) if name_lower in cd_by_name else None
    if cd_entry and name_lower in cd_by_name:
        cd = cd_by_name[name_lower]
        icon = f"https://raw.communitydragon.org/latest/game/assets/ux/champion/champion_icon_{cd['id']}.png"
    
    champions.append({
        "id": c["id"] if c.get("id") else c["slug"],
        "name": c["name"],
        "slug": c["slug"],
        "icon": icon,
        "tier": c.get("tier", "B"),
        "lanes": lanes,
        "roles": cd_by_name[name_lower].get("roles", []) if name_lower in cd_by_name else []
    })

print(f"Built {len(champions)} champions with roles")
for c in champions:
    print(f"  {c['name']:25s} lanes={c['lanes']}")

# ===== 5. Build tier list data (per-role tiers) =====
# Since we have the overall tier from the champion list page,
# we'll build per-role tiers based on known patch 7.2a meta
# This is seeded data - user can update per patch

# Patch 7.2a tier list (per role) based on wildriftcore.com
TIER_BY_ROLE = {
    "baron": {
        "S+": ["ambessa", "malphite"],
        "S": ["volibear", "wukong", "darius", "singed"],
        "A": ["garen", "jax", "gwen", "nasus", "aatrox", "irelia", "jayce", "shen", "sett", "gragas", "shyvana", "ornn", "camille", "fiora", "kennen", "mordekaiser", "poppy", "riven", "sion", "teemo"],
        "B": ["akali", "aurora", "gnar", "kayle", "olaf", "pantheon", "renekton", "tryndamere", "urgot", "vayne", "vladimir", "yasuo", "yone", "yunara"],
        "C": ["nasus", "k'sante"]
    },
    "jungle": {
        "S+": ["warwick", "vi", "rammus", "lee sin"],
        "S": ["hecarim", "amumu", "nocturne", "lillia", "jarvan iv", "nunu & willump", "xin zhao"],
        "A": ["gwen", "shyvana", "fiddlesticks", "evelynn", "diana", "kindred", "kha'zix", "mordekaiser", "skarner", "talon", "viego", "wukong", "zac", "master yi", "graves", "volibear"],
        "B": ["ambessa", "camille", "ekko", "jax", "kayn", "nidalee", "olaf", "pantheon", "rengar", "shaco", "taliyah", "twitch", "vi", "xin zhao"],
        "C": ["nasus", "tryndamere"]
    },
    "mid": {
        "S+": ["galio", "orianna"],
        "S": ["swain", "kassadin", "ahri", "brand", "taliyah", "yone", "twisted fate"],
        "A": ["akali", "akshan", "aurelion sol", "aurora", "corki", "diana", "ekko", "fizz", "heimerdinger", "irelia", "katarina", "leblanc", "lissandra", "lucian", "lux", "mel", "norra", "pantheon", "ryze", "seraphine", "syndra", "veigar", "vex", "viktor", "vladimir", "yasuo", "zed", "ziggs", "zoe", "karma"],
        "B": ["annie", "brand", "cassiopeia", "galio", "jayce", "kassadin", "kennen", "morgana", "orianna", "sion", "smolder", "talon", "teemo", "twisted fate", "varus", "vel'koz", "yone", "zilean"],
        "C": ["kayle", "nasus"]
    },
    "adc": {
        "S+": ["ezreal"],
        "S": ["jhin", "varus", "vayne", "lucian", "kai'sa", "miss fortune"],
        "A": ["caitlyn", "draven", "jinx", "kalista", "kog'maw", "nilah", "samira", "sivir", "smolder", "tristana", "twitch", "xayah", "zeri"],
        "B": ["ashe", "corki", "ziggs"],
        "C": []
    },
    "support": {
        "S+": ["thresh", "sona", "nami"],
        "S": ["zilean", "lulu", "leona", "senna", "milio", "pyke"],
        "A": ["alistar", "bard", "blitzcrank", "braum", "janna", "karma", "lux", "maokai", "nautilus", "rakan", "rell", "seraphine", "soraka", "yuumi", "zyra", "galio", "morgana", "swain", "zilean"],
        "B": ["annie", "brand", "heimerdinger", "pantheon", "poppy", "shen", "veigar", "vel'koz", "zac"],
        "C": ["kayle", "nasus"]
    }
}

# Build per-champion tier data
tier_data = {"patch": "7.2a", "champions": {}}
for c in champions:
    slug = c["slug"]
    role_tiers = {}
    for lane in c["lanes"]:
        if lane in TIER_BY_ROLE:
            for tier_rank, champ_slugs in TIER_BY_ROLE[lane].items():
                if slug in champ_slugs:
                    role_tiers[lane] = tier_rank
                    break
            if lane not in role_tiers:
                # Default tier
                role_tiers[lane] = c.get("tier", "B")
    
    tier_data["champions"][slug] = {
        "overall": c.get("tier", "B"),
        "by_role": role_tiers
    }

# ===== 6. Build counter data (seeded from wildriftcounter.com data) =====
# Counter matchups: {champion_slug: [champions it's strong against]}
# These are known matchups from the Wild Rift meta
COUNTER_MATCHUPS = {
    "zed": ["veigar", "orianna", "lux", "seraphine", "jhin", "xayah"],
    "ahri": ["veigar", "lux", "orianna", "xerath", "ziggs"],
    "yasuo": ["lux", "orianna", "veigar", "ziggs", "brand"],
    "fizz": ["lux", "orianna", "veigar", "ziggs", "xerath"],
    "akali": ["veigar", "orianna", "lux", "ziggs", "xerath"],
    "katarina": ["veigar", "orianna", "lux", "ziggs", "annie"],
    "darius": ["garen", "fiora", "kennen", "vayne", "teemo"],
    "garen": ["darius", "fiora", "kennen", "vayne"],
    "fiora": ["malphite", "poppy", "shen"],
    "malphite": ["darius", "garen", "fiora", "riven"],
    "riven": ["garen", "darius", "renekton", "poppy"],
    "renekton": ["darius", "garen", "fiora", "teemo"],
    "nasus": ["darius", "teemo", "vayne", "fiora"],
    "jax": ["malphite", "poppy", "fiora"],
    "irelia": ["fiora", "darius", "renekton", "poppy", "malphite"],
    "camille": ["darius", "fiora", "poppy", "teemo"],
    "sett": ["fiora", "darius", "vayne", "teemo"],
    "vayne": ["caitlyn", "draven", "tristana", "miss fortune"],
    "ezreal": ["draven", "tristana", "lucian", "caitlyn"],
    "jhin": ["ezreal", "draven", "tristana", "lucian"],
    "lucian": ["caitlyn", "draven", "ezreal"],
    "caitlyn": ["draven", "lucian", "jinx", "ezreal"],
    "tristana": ["caitlyn", "lucian", "draven"],
    "blitzcrank": ["alistar", "braum", "morgana", "leona"],
    "thresh": ["alistar", "braum", "morgana", "blitzcrank"],
    "leona": ["alistar", "braum", "morgana", "janna"],
    "nami": ["blitzcrank", "thresh", "leona", "pyke"],
    "lulu": ["blitzcrank", "thresh", "leona", "nami"],
    "sona": ["blitzcrank", "thresh", "leona", "pyke"],
    "pyke": ["leona", "alistar", "braum"],
    "alistar": ["morgana", "janna", "lulu"],
    "braum": ["blitzcrank", "thresh", "leona"],
    "lee sin": ["rammus", "amumu", "warwick", "vi"],
    "warwick": ["rammus", "xin zhao", "lee sin"],
    "vi": ["rammus", "lee sin", "warwick"],
    "rammus": ["master yi", "tryndamere", "xin zhao"],
    "master yi": ["rammus", "amumu", "lee sin"],
    "kayn": ["rammus", "lee sin", "vi"],
    "evelynn": ["lee sin", "warwick", "rammus", "nunu & willump"],
    "amumu": ["zac", "warwick", "vi"],
    "xinzhao": ["rammus", "warwick", "lee sin"],
    "graves": ["rammus", "warwick", "xinzhao"],
    # Counter data is stored as: champion_slug -> [slugs of champions it counters]
    # The UI shows: select enemy champ -> see who counters them
}

# Build comprehensive counter pick data
counters_data = {}
for c in champions:
    slug = c["slug"]
    counters_data[slug] = {
        "strong_against": COUNTER_MATCHUPS.get(slug, []),
        "weak_against": []
    }

# Fill weak_against by reversing strong_against
for champ_slug, data in counters_data.items():
    for strong in data["strong_against"]:
        if strong in counters_data:
            if champ_slug not in counters_data[strong]["weak_against"]:
                counters_data[strong]["weak_against"].append(champ_slug)

# ===== 7. Build synergy data (known strong duos) =====
SYNERGY_PAIRS = [
    # ADC + Support
    (["lucian", "braum"], "Lucian passive procs off Braum's stun"),
    (["jinx", "thresh"], "Thresh hooks set up Jinx's traps and passive resets"),
    (["ezreal", "karma"], "Karma shield + Ezreal poke = oppressive lane"),
    (["tristana", "leona"], "Leona's lockdown gives Tristana free jump resets"),
    (["xayah", "rakan"], "LORE BUFF + Xayah's feathers + Rakan's engage"),
    (["kai'sa", "nautilus"], "Nautilus CC enables Kai'Sa plasma stacks"),
    (["draven", "thresh"], "Thresh lantern + Draven axe resets"),
    (["vayne", "lulu"], "Lulu's peel + Vayne hypercarry scaling"),
    (["jhin", "nami"], "Nami's speed boost + Jhin's 4th shot"),
    (["ashe", "leona"], "Perma-stun chain from range"),
    (["varus", "braum"], "Varus W + Braum stun combo"),
    (["samira", "rakan"], "Samira's passive knockup + Rakan engage"),
    (["kog'maw", "lulu"], "Hypercarry + hyperpeel = teamfight win"),
    (["caitlyn", "morgana"], "Cait trap + Morgana binding = guaranteed root"),
    (["miss fortune", "nautilus"], "MF ult + Nautilus CC lockdown"),
    # Mid + Jungle
    (["ahri", "lee sin"], "High early gank pressure + Ahri charm setup"),
    (["orianna", "wukong"], "Wukong knockup + Orianna ultimate wombo"),
    (["yasuo", "malphite"], "Malphite ult into Yasuo ult = wombo combo"),
    (["zed", "vi"], "Vi point-and-click R into Zed's damage"),
    (["galio", "jarvan iv"], "Cataclysm + Hero's Entrance = AoE wombo"),
    (["katarina", "amumu"], "Amumu ult into Katarina ult = team wipe"),
    (["akali", "nunu & willump"], "Nunu snowball + Akali shroud engage"),
    (["fizz", "warwick"], "Warwick E fear sets up Fizz's playmaking"),
    (["diana", "kayn"], "Fast clear duo, both dive backline"),
    (["sylas", "xin zhao"], "Strong early 2v2 with Xin knockup"),
    (["veigar", "rammus"], "Ramus taunt lines up Veigar's cage + burst"),
    # Baron + Jungle
    (["darius", "lee sin"], "Lee Sin early ganks enable Darius snowball"),
    (["fiora", "warwick"], "Split-push pressure + Warwick objective control"),
    (["malphite", "wukong"], "Double knockup teamfight monsters"),
    (["camille", "vi"], "Point-and-click CC from both = free picks"),
    (["shen", "twisted fate"], "Global pressure from both sides"),
    (["gnar", "nunu & willump"], "Gnar mega into Nunu snowball"),
    (["jax", "master yi"], "Hypercarries, strong mid-late scaling"),
    (["renekton", "xin zhao"], "Strong early game duo, dive synergy"),
    # Teamfight combos
    (["malphite", "orianna", "yasuo"], "The classic wombo: Malphite R -> Ori R -> Yasuo R"),
    (["wukong", "katarina"], "Wukong R knockup into Katarina R"),
    (["amumu", "fiddlesticks"], "Double AoE fear + ult wombo"),
    (["zac", "lucian", "karma"], "Zac engage + Karma speed + Lucian cleanup"),
]

# Build synergy data
synergy_data = {}
for c in champions:
    synergy_data[c["slug"]] = {"synergies": []}

# Build pair and trio synergies
for pair in SYNERGY_PAIRS:
    champs = pair[0]
    desc = pair[1]
    if len(champs) == 2:
        c1, c2 = champs
        if c1 in synergy_data:
            synergy_data[c1]["synergies"].append({"with": c2, "description": desc, "type": "pair"})
        if c2 in synergy_data:
            synergy_data[c2]["synergies"].append({"with": c1, "description": desc, "type": "pair"})

# ===== 8. Write all data files =====
os.makedirs('/Users/one/wild-rift-picker/data', exist_ok=True)

# Champions data
with open('/Users/one/wild-rift-picker/data/champions.json', 'w') as f:
    json.dump(champions, f, indent=2, ensure_ascii=False)
print(f"\nSaved {len(champions)} champions to data/champions.json")

# Tier list per patch
with open('/Users/one/wild-rift-picker/data/tiers.json', 'w') as f:
    json.dump(tier_data, f, indent=2, ensure_ascii=False)
print(f"Saved tier data to data/tiers.json")

# Counters
with open('/Users/one/wild-rift-picker/data/counters.json', 'w') as f:
    json.dump(counters_data, f, indent=2, ensure_ascii=False)
print(f"Saved counter data for {len(counters_data)} champions")

# Synergies
with open('/Users/one/wild-rift-picker/data/synergies.json', 'w') as f:
    json.dump(synergy_data, f, indent=2, ensure_ascii=False)
print(f"Saved synergy data for {len(synergy_data)} champions")

print("\n✅ All data files built!")
