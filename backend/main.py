import os
from fastapi import FastAPI
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

load_dotenv()

# Setup Database
api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=api_key)
index = pc.Index("ventiko-index")

# Setup AI Brain
model = SentenceTransformer('all-MiniLM-L6-v2')

app = FastAPI()

@app.get("/")
def health_check():
    return {"status": "online", "system": "Ventiko Engine"}

@app.get("/search")
def search(query: str):
    print(f"Received query: {query}")
    
    # 1. Convert text to numbers
    query_vector = model.encode(query).tolist()
    
    # 2. Search Pinecone
    results = index.query(
        vector=query_vector,
        top_k=3,
        include_metadata=True
    )
    
    # 3. MANUAL PACKAGING (Safe Mode)
    # We extract only the data we need to avoid library errors
    final_matches = []
    
    for match in results['matches']:
        final_matches.append({
            "id": match['id'],
            "score": match['score'],
            "metadata": match['metadata']
        })
    
    return {"matches": final_matches}