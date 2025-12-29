import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

# SECURITY TOOLS
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from secure import Secure

load_dotenv()

# Setup Database
api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=api_key)
index = pc.Index("ventiko-index")

# Setup AI Brain
model = SentenceTransformer('all-MiniLM-L6-v2')

# SETUP THE BOUNCER (Rate Limiter)
limiter = Limiter(key_func=get_remote_address)

# SETUP THE SHIELD (Security Headers) - UPDATED SYNTAX
secure_headers = Secure.with_default_headers()

app = FastAPI()

# Apply the Bouncer
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- SECURITY CLEARANCE (CORS) ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------------------

# --- APPLY THE SHIELD (Middleware) ---
@app.middleware("http")
async def set_secure_headers(request, call_next):
    response = await call_next(request)
    await secure_headers.set_headers_async(response)
    return response
# -------------------------------------

@app.get("/")
def health_check():
    return {"status": "online", "system": "Ventiko Engine"}

@app.get("/search")
@limiter.limit("10/minute")
def search(request: Request, query: str):
    print(f"Received query: {query}")
    
    # 1. Convert text to numbers
    query_vector = model.encode(query).tolist()
    
    # 2. Search Pinecone
    results = index.query(
        vector=query_vector,
        top_k=3,
        include_metadata=True
    )
    
    # 3. MANUAL PACKAGING
    final_matches = []
    
    for match in results['matches']:
        final_matches.append({
            "id": match['id'],
            "score": match['score'],
            "metadata": match['metadata']
        })
    
    return {"matches": final_matches}