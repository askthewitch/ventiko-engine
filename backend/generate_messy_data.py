import csv
import random

# We simulate a "messy" feed from an affiliate network
# Notice the column names are NOT what our engine wants. 
# We will have to "adapt" them later.
filename = "data/awin_export_raw.csv"

products = [
    ("Optimized Magnesium", "Health", "High absorption mag-glycinate for sleep.", "19.99"),
    ("Deep Sleep Pillow Spray", "Home", "Lavender mist for better rest.", "12.50"),
    ("Blue Light Blocking Glasses", "Electronics", "Reduce eye strain and improve melatonin.", "35.00"),
    ("Organic Ashwagandha", "Supplements", "Reduces cortisol and stress levels.", "22.00"),
    ("Weighted Blanket 15lbs", "Home", "Deep pressure stimulation for anxiety.", "89.00"),
    ("Valerian Root Drops", "Health", "Natural herbal sleep aid.", "15.99"),
    ("Smart Sleep Tracker Ring", "Electronics", "Monitors REM and deep sleep cycles.", "299.00"),
    ("Tart Cherry Juice Concentrate", "Grocery", "Natural source of melatonin.", "18.50"),
    ("Silk Sleep Mask", "Accessories", "100% blackout for total darkness.", "9.99"),
    ("White Noise Machine", "Electronics", "Fan-based soothing sound.", "45.00"),
    ("L-Theanine Capsules", "Supplements", "Promotes relaxation without drowsiness.", "19.00"),
    ("Cedarwood Essential Oil", "Health", "Grounding scent for evening routines.", "8.50"),
    ("Sunrise Alarm Clock", "Electronics", "Wake up naturally with light.", "55.00"),
    ("Cooling Mattress Topper", "Home", "Regulate body temp for deep sleep.", "150.00"),
    ("Chamomile Tea Bulk", "Grocery", "Loose leaf calming tea.", "14.00"),
    ("Mouth Tape for Sleep", "Health", "Encourage nasal breathing.", "7.99"),
    ("GABA Supplement", "Supplements", "Neurotransmitter support for calm.", "21.00"),
    ("Sleep Headphones Headband", "Electronics", "Soft headband with speakers.", "25.00"),
    ("Epsom Salts 5kg", "Health", "Magnesium bath soak for muscles.", "11.00"),
    ("Meditation Cushion", "Home", "Ergonomic seat for mindfulness.", "32.00")
]

# Duplicate and vary slightly to get 50+ items
final_data = []
for i in range(3): 
    for p in products:
        # We add some "messiness" like HTML tags or extra spaces
        messy_desc = f"<span>{p[2]}</span> <br> (Batch {i+1})"
        final_data.append({
            "product_id": f"awin_{random.randint(1000, 9999)}",
            "merchant_name": "HealthStore_UK",
            "prod_name": p[0],
            "description_text": messy_desc, # MESSY COLUMN NAME
            "retail_price": p[3],           # MESSY COLUMN NAME
            "category_path": p[1],
            "deep_link_url": f"http://awin.com/click?p={random.randint(100,999)}"
        })

# Write to CSV
with open(filename, mode='w', newline='') as file:
    writer = csv.DictWriter(file, fieldnames=final_data[0].keys())
    writer.writeheader()
    writer.writerows(final_data)

print(f"GENERATED MESSY DATA: {filename} with {len(final_data)} rows.")