import os
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

# 1. Load Environment Variables
load_dotenv()

# 2. Initialize the Database Connection
api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=api_key)
index = pc.Index("ventiko-index")

# 3. Initialize the AI Model (Deterministic/Exact Mode)
model = SentenceTransformer('all-MiniLM-L6-v2')

# 4. Parse the Data File
file_path = "data/products.xml"
tree = ET.parse(file_path)
root = tree.getroot()

vectors_to_upload = []

print("Starting ingestion process...")

for product in root.findall("product"):
    # Extract Raw Data
    p_id = product.find("id").text
    title = product.find("title").text
    desc = product.find("description").text
    price = product.find("price").text
    currency = product.find("currency").text
    category = product.find("category").text

    # Create the "Context String"
    # This is what the AI actually "reads" to understand the product
    combined_text = f"{title}. {desc}. Category: {category}"

    # Generate Vector (Math)
    vector = model.encode(combined_text).tolist()

    # Prepare Metadata
    # This is the data we retrieve later to show the user
    metadata = {
        "title": title,
        "description": desc,
        "price": price,
        "currency": currency,
        "category": category,
        "raw_text": combined_text
    }

    # Add to the batch list
    vectors_to_upload.append((p_id, vector, metadata))
    print(f" -> Processed: {title}")

# 5. Upload to Pinecone
if vectors_to_upload:
    index.upsert(vectors=vectors_to_upload)
    print("\nUpload Successful.")
else:
    print("\nNo products found to upload.")

# 6. Final Verification
stats = index.describe_index_stats()
print("\nFinal Database Stats:")
print(stats)