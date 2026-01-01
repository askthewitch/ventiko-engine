import os
import csv
import re
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

# 1. Setup
load_dotenv()
api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=api_key)
index = pc.Index("ventiko-index")
model = SentenceTransformer('all-MiniLM-L6-v2')

# 2. Config
CSV_FILE = "data/awin_dirty_export.csv" # Pointing to the dirty data
BATCH_SIZE = 50

# --- HELPER FUNCTIONS ---

def clean_html(raw_html):
    """Aggressively strips HTML tags and weird characters."""
    if not raw_html: return "No description available."
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, ' ', raw_html) # Replace tags with space
    cleantext = cleantext.replace("&pound;", "£").replace("&amp;", "&")
    return " ".join(cleantext.split()) # Remove double spaces

def normalize_price(raw_price):
    """Extracts numbers from messy strings like 'GBP 15.00' or '£15'."""
    if not raw_price: return 0.0
    # Remove everything that isn't a digit or a dot
    clean_str = re.sub(r'[^\d.]', '', str(raw_price))
    try:
        return float(clean_str)
    except ValueError:
        return 0.0

# --- MAIN LOGIC ---

print(f"--- STARTING IRON STOMACH INGESTION: {CSV_FILE} ---")

vectors_to_upload = []
ids_seen = set() # For local deduplication
stats = {"success": 0, "skipped": 0, "duplicates": 0}

try:
    with open(CSV_FILE, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for i, row in enumerate(reader):
            try:
                # 1. VALIDATION CHECKS (The Gatekeeper)
                if not row['aw_product_id'] or not row['product_name']:
                    print(f"Row {i}: SKIPPING - Missing ID or Title")
                    stats['skipped'] += 1
                    continue

                # 2. DEDUPLICATION
                p_id = f"{row['merchant_name']}-{row['aw_product_id']}".replace(" ", "_")
                if p_id in ids_seen:
                    print(f"Row {i}: SKIPPING - Duplicate ID {p_id}")
                    stats['duplicates'] += 1
                    continue
                ids_seen.add(p_id)

                # 3. CLEANING (The Wash)
                title = row['product_name'].strip()
                desc = clean_html(row['description'])
                category = row['merchant_category'] or "Uncategorized"
                
                # Fix Price
                price_val = normalize_price(row['search_price'])
                if price_val == 0.0:
                    # Optional: Skip free/broken price items? 
                    # For now, we keep them but log it.
                    pass 

                # 4. VECTORIZATION
                combined_text = f"{title}. {desc}. Category: {category}."
                vector = model.encode(combined_text).tolist()

                # 5. METADATA PREP
                metadata = {
                    "title": title,
                    "description": desc[:300], # Truncate safely
                    "price": str(price_val), # Store as clean string
                    "currency": "GBP",
                    "category": category,
                    "link": row['aw_deep_link'],
                    "merchant": row['merchant_name'] or "Unknown"
                }

                vectors_to_upload.append((p_id, vector, metadata))
                stats['success'] += 1

                # 6. BATCH UPLOAD
                if len(vectors_to_upload) >= BATCH_SIZE:
                    index.upsert(vectors=vectors_to_upload)
                    vectors_to_upload = []
                    print(f" -> Uploaded batch... (Processed {i} rows)")

            except Exception as e:
                print(f"Row {i}: FATAL ERROR - {e}")
                stats['skipped'] += 1
                continue

        # Final Batch
        if vectors_to_upload:
            index.upsert(vectors=vectors_to_upload)
            print(" -> Uploaded final batch.")

except FileNotFoundError:
    print("!!! ERROR: CSV file not found. Did you run generate_dirty_data.py?")

print("-" * 30)
print(f"INGESTION COMPLETE.")
print(f"SUCCESS: {stats['success']}")
print(f"SKIPPED (Bad Data): {stats['skipped']}")
print(f"DUPLICATES BLOCKED: {stats['duplicates']}")
print("-" * 30)