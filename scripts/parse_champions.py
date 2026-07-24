#!/usr/bin/env python3
"""Parse Wild Rift champion data from cached web pages."""
import re
import json
import os

cached_dir = os.path.expanduser("~/.hermes/cache/web")
champ_file = os.path.join(cached_dir, "wildriftcore.com-f3cf480edc.md")

with open(champ_file, 'r') as f:
    content = f.read()

# The format is markdown like:
# [![Aatrox](/assets/champions/icons/aatrox.jpg)
#
# Aatrox S+](/en/champions/aatrox/)
# 
# Pattern: capture icon name + tier + slug
# [![NAME](ICON_PATH)\n\nNAME TIER](/en/champions/SLUG/)
pattern = r'\[!\[([^\]]+)\]\([^\)]+\)\n*\n*([A-Za-z0-9\' éèàùỳỵọđÀÈùìòÒáíóúÁÉÍÓÚñÑ&\.\-\(\)]+?)\s+(S\+?|[A-F])\]\(/en/champions/([^/]+)/'
matches = re.findall(pattern, content)

print(f"Found {len(matches)} champions")
seen = set()
champions = []
for m in matches:
    name = m[0].strip()
    tier = m[2].strip()
    slug = m[3].strip()
    
    if name not in seen:
        seen.add(name)
        champions.append({
            "id": slug,
            "name": name,
            "slug": slug,
            "icon": f"https://cdn.communitydragon.org/latest/champion/{slug}/tile.jpg",
            "tier": tier
        })
        print(f"  {name:25s} → tier={tier:4s} slug={slug}")

print(f"\nTotal: {len(champions)} champions")

# Save raw data
os.makedirs('/Users/one/wild-rift-picker/data', exist_ok=True)
with open('/Users/one/wild-rift-picker/data/champions_raw.json', 'w') as f:
    json.dump({"patch": "7.2a", "champions": champions}, f, indent=2, ensure_ascii=False)
print("Saved to data/champions_raw.json")
