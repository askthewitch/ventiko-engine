import csv
import random

# --- CONFIGURATION ---
OUTPUT_FILENAME = "data/awin_large_export.csv"
ROW_COUNT = 1200 # We will generate 1,200 products

# --- AWIN STANDARD COLUMNS ---
# Real AWIN feeds usually look like this
HEADERS = [
    "merchant_id", "merchant_name", "merchant_category", 
    "aw_product_id", "product_name", "description", 
    "search_price", "currency", "aw_deep_link", "large_image"
]

# --- DATA POOLS (Bio-Optimization Themed) ---
brands = [
    "NeuroPeak", "VitalSleep", "OptiMize Labs", "EarthGrown", "RedLight Rising", 
    "Zenith Gear", "Halo Tracker", "PureFlow", "Nordic Recovery", "BioStack"
]

categories = [
    "Supplements > Sleep", "Supplements > Focus", "Supplements > Gut Health",
    "Electronics > Wearables", "Electronics > Recovery",
    "Home > Bedroom", "Home > Lighting", "Apparel > Compression"
]

adjectives = ["Advanced", "Organic", "Clinical Strength", "Deep", "Rapid", "Premium", "Ultra", "Smart"]

# Templates to generate varied product titles
product_templates = {
    "Supplements > Sleep": [
        "Magnesium Glycinate Complex", "L-Theanine Calm Drops", "Valerian Root Extract", 
        "Tart Cherry Concentrate", "GABA Night Formula", "Deep Sleep Stack"
    ],
    "Supplements > Focus": [
        "Lion's Mane Mushroom Extract", "Caffeine + L-Theanine", "Omega-3 Fish Oil (High DHA)", 
        "Rhodiola Rosea Adaptogen", "Alpha-GPC Nootropic", "Yerba Mate Extract"
    ],
    "Supplements > Gut Health": [
        "Probiotic 50 Billion CFU", "L-Glutamine Powder", "Digestive Enzyme Complex", 
        "Prebiotic Fiber Blend", "Bone Broth Protein"
    ],
    "Electronics > Wearables": [
        "Biometric Ring Gen 3", "HRV Chest Strap", "Sleep Tracking Headband", 
        "Continuous Glucose Monitor (CGM)", "Smart Watch Pro"
    ],
    "Electronics > Recovery": [
        "Red Light Therapy Panel (Half Body)", "Percussion Massage Gun", "PEMF Mat", 
        "Infrared Sauna Blanket", "NormaTec Compression Boots"
    ],
    "Home > Bedroom": [
        "Weighted Blanket (15lbs)", "Cooling Mattress Pad", "Blackout Curtains 100%", 
        "Silk Sleep Mask", "Ergonomic Pillow"
    ],
    "Home > Lighting": [
        "Blue Light Blocking Bulbs (Amber)", "Red Night Light", "Sunrise Alarm Clock", 
        "Full Spectrum Desk Lamp"
    ],
    "Apparel > Compression": [
        "Recovery Socks", "Compression Leggings", "Post-Workout Hoodie", "Copper Infused Sleeve"
    ]
}

def generate_description(title, category):
    # Simulate "Dirty" HTML often found in feeds
    benefits = [
        "Optimizes circadian rhythm.", "Reduces cortisol levels.", "Enhances deep sleep cycles.",
        "Improves cognitive function.", "Supports metabolic flexibility.", "Accelerates muscle recovery."
    ]
    benefit = random.choice(benefits)
    return f"<strong>{title}</strong><br> {benefit} <br> <ul><li>Batch Tested</li><li>Clinical Dose</li></ul> <span>Category: {category}</span>"

# --- GENERATOR LOGIC ---
print(f"Generating {ROW_COUNT} realistic products...")

rows = []

for i in range(ROW_COUNT):
    # 1. Pick a Random Category
    cat = random.choice(categories)
    
    # 2. Pick a Brand
    brand = random.choice(brands)
    
    # 3. Construct Title
    # Use a specific item from that category + an adjective
    base_item = random.choice(product_templates[cat])
    title = f"{brand} {random.choice(adjectives)} {base_item}"
    
    # 4. Generate Price (Randomized reasonable range)
    if "Electronics" in cat:
        price = round(random.uniform(99.00, 499.00), 2)
    elif "Home" in cat:
        price = round(random.uniform(40.00, 150.00), 2)
    else:
        price = round(random.uniform(15.00, 60.00), 2)

    # 5. Build Row
    row = {
        "merchant_id": "1001",
        "merchant_name": brand,
        "merchant_category": cat,
        "aw_product_id": f"p_{random.randint(100000, 999999)}",
        "product_name": title,
        "description": generate_description(title, cat),
        "search_price": f"{price}",
        "currency": "GBP",
        "aw_deep_link": f"https://www.awin1.com/cread.php?awinmid=1001&p={random.randint(1,9999)}",
        "large_image": f"https://via.placeholder.com/300x300?text={base_item.replace(' ', '+')}"
    }
    rows.append(row)

# --- WRITE TO CSV ---
with open(OUTPUT_FILENAME, mode='w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=HEADERS)
    writer.writeheader()
    writer.writerows(rows)

print(f"SUCCESS: Created {OUTPUT_FILENAME}")