import os
import csv
import re
import time
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

# 1. Load Environment
load_dotenv()

# 2. Setup Database & AI
api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=api_key)
index = pc.Index("ventiko-index")
model = SentenceTransformer('all-MiniLM-L6-v2')

# 3. Define the Input File (The Big One)
csv_file = "data/awin_large_export.csv"

def clean_html(raw_html):
    """Removes HTML tags to help the AI read better."""
    if not raw_html: return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, ' ', raw_html) # Replace tags with space
    return cleantext.strip()

vectors_to_upload = []
BATCH_SIZE = 100 # Upload in chunks to prevent crashing

print(f"--- STARTING INGESTION: {csv_file} ---")

with open(csv_file, mode='r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    rows = list(reader)
    total_rows = len(rows)
    print(f"Found {total_rows} products. Processing...")

    for i, row in enumerate(rows):
        
        # --- MAPPING AWIN COLUMNS TO VENTIKO ---
        try:
            # 1. Unique ID
            p_id = f"{row['merchant_name']}-{row['aw_product_id']}".replace(" ", "_")
            
            # 2. Title & Description
            title = row['product_name']
            desc_clean = clean_html(row['description'])
            
            # 3. Category & Price
            category = row['merchant_category']
            price = row['search_price']
            currency = row['currency']
            
            # 4. Link
            link = row['aw_deep_link']

            # --- AI PROCESSING ---
            # We combine fields so the AI understands the "Whole Picture"
            combined_text = f"{title}. {desc_clean}. Category: {category}."
            
            # Generate Vector
            vector = model.encode(combined_text).tolist()

            # Prepare Metadata (What shows on the frontend)
            metadata = {
                "title": title,
                "description": desc_clean[:200] + "...", # Truncate for UI
                "price": price,
                "currency": currency,
                "category": category,
                "link": link,
                "merchant": row['merchant_name']
            }

            vectors_to_upload.append((p_id, vector, metadata))

        except Exception as e:
            print(f"Skipping row {i}: {e}")
            continue

        # --- BATCH UPLOAD ---
        # Every 100 items, we send to Pinecone
        if len(vectors_to_upload) >= BATCH_SIZE:
            index.upsert(vectors=vectors_to_upload)
            vectors_to_upload = [] # Clear list
            print(f" -> Uploaded batch... ({i+1}/{total_rows})")

    # Upload remaining
    if vectors_to_upload:
        index.upsert(vectors=vectors_to_upload)
        print(f" -> Uploaded final batch.")

print("--- INGESTION COMPLETE ---")
stats = index.describe_index_stats()
print(f"Total Vectors in Database: {stats['total_vector_count']}")