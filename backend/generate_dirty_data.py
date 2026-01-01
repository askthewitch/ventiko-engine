import csv
import random

# --- CONFIGURATION ---
OUTPUT_FILENAME = "data/awin_dirty_export.csv"
ROW_COUNT = 500  # Smaller batch, but nastier data

# --- THE "DIRTY" POOLS ---
brands = ["NeuroPeak", "VitalSleep", "BrokenBrand", "NullCorp", ""] # Empty brand to test logic
categories = ["Sleep", "Focus", "Recovery", "Unknown", None] # None value to test handling

# HTML mess that Awin feeds often have
descriptions = [
    "<strong>Great product!</strong>",
    "Contains <span style='color:red'>Bad Tags</span> and unclosed divs...",
    "Just a normal description.",
    "", # Empty description
    "&pound;15 value! <br> Click here."
]

# Price mess (Strings, currency symbols, empty)
prices = ["15.00", "19.99", "GBP 25.00", "£30.00", "", "CALL FOR PRICE", "0.00"]

print(f"--- GENERATING CHAOS: {ROW_COUNT} ROWS ---")

headers = [
    "merchant_id", "merchant_name", "merchant_category", 
    "aw_product_id", "product_name", "description", 
    "search_price", "currency", "aw_deep_link", "large_image"
]

rows = []

for i in range(ROW_COUNT):
    # 1. Randomly decide if this row will be "Fatal" (Missing ID or Title)
    is_fatal = random.random() < 0.05 # 5% chance of fatal error
    
    row = {
        "merchant_id": "1001",
        "merchant_name": random.choice(brands),
        "merchant_category": random.choice(categories) or "Uncategorized",
        "aw_product_id": "" if is_fatal else f"p_{random.randint(10000, 99999)}", # Missing ID test
        "product_name": "" if is_fatal else f"Product {i} - {random.choice(['Pro', 'Max', 'Lite'])}", # Missing Title test
        "description": random.choice(descriptions),
        "search_price": random.choice(prices),
        "currency": "GBP",
        "aw_deep_link": f"https://awin.com/p={i}",
        "large_image": f"https://via.placeholder.com/150"
    }
    
    # 2. Add Duplicate ID test (Row 10 and 11 will have same ID)
    if i == 10:
        row['aw_product_id'] = "DUPLICATE_TEST_ID"
    if i == 11:
        row['aw_product_id'] = "DUPLICATE_TEST_ID"

    rows.append(row)

with open(OUTPUT_FILENAME, mode='w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(rows)

print(f"SUCCESS: Created {OUTPUT_FILENAME} with deliberate errors.")