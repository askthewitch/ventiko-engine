import os
import csv
import re
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

# 3. Define the Input File
csv_file = "data/awin_export_raw.csv"

def clean_html(raw_html):
    """Removes HTML tags like <span> or <br> from the description."""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext

vectors_to_upload = []

print(f"Reading messy data from: {csv_file}...")

with open(csv_file, mode='r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    
    for row in reader:
        # --- THE ADAPTER LAYER ---
        # Here we map the "Messy" AWIN columns to "Clean" Ventiko columns
        
        # 1. Map ID (Combine merchant + ID to be unique)
        p_id = f"{row['merchant_name']}-{row['product_id']}"
        
        # 2. Map Title
        title = row['prod_name']
        
        # 3. Map & Clean Description
        # We strip out the <span> tags using our helper function
        desc = clean_html(row['description_text'])
        
        # 4. Map Price
        price = row['retail_price']
        
        # 5. Map Category
        category = row['category_path']
        
        # 6. Map Link (We save this so the user can click it later)
        link = row['deep_link_url']

        # --- THE AI LAYER ---
        # Create the text the AI will read
        combined_text = f"{title}. {desc}. Category: {category}. Best for: Sleep, Relaxation, Recovery."
        
        # Vectorise
        vector = model.encode(combined_text).tolist()
        
        # Prepare Metadata (The clean data for the Frontend)
        metadata = {
            "title": title,
            "description": desc,
            "price": price,
            "currency": "GBP", # We assume GBP for now
            "category": category,
            "link": link,
            "raw_text": combined_text
        }
        
        vectors_to_upload.append((p_id, vector, metadata))

# 4. Upload in Batches
if vectors_to_upload:
    print(f"Uploading {len(vectors_to_upload)} products to Pinecone...")
    # Upsert to database
    index.upsert(vectors=vectors_to_upload)
    print("Upload Complete.")
else:
    print("No data found.")