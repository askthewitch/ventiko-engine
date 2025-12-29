import os
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

# 1. Setup
load_dotenv()
api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=api_key)
index = pc.Index("ventiko-index")
model = SentenceTransformer('all-MiniLM-L6-v2')

# 2. Define the User's Query
query = "something to help me sleep"

# 3. Convert Query to Vector (Math)
query_vector = model.encode(query).tolist()

# 4. Search the Database
# We ask for the "top_k=1" (The single best match)
results = index.query(
    vector=query_vector,
    top_k=1,
    include_metadata=True
)

# 5. Print the Result
print(f"Query: {query}")
print("-" * 30)
for match in results['matches']:
    print(f"Found: {match['metadata']['title']}")
    print(f"Score: {match['score']:.4f}") # Confidence score (0 to 1)
    print(f"Price: {match['metadata']['price']} {match['metadata']['currency']}")