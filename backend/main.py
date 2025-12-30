import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from sqlmodel import Field, Session, SQLModel, create_engine, select

# SECURITY TOOLS
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from secure import Secure

load_dotenv()

# --- DATABASE SETUP ---
class SearchLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    query: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    results_summary: str 

sqlite_file_name = "search_history.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# --- PINECONE & AI SETUP ---
api_key = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=api_key)
index = pc.Index("ventiko-index")
model = SentenceTransformer('all-MiniLM-L6-v2')

# --- SECURITY SETUP ---
limiter = Limiter(key_func=get_remote_address)
secure_headers = Secure.with_default_headers()

app = FastAPI()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def set_secure_headers(request, call_next):
    response = await call_next(request)
    await secure_headers.set_headers_async(response)
    return response

@app.get("/")
def health_check():
    return {"status": "online", "system": "Ventiko Engine v2"}

# --- SEARCH ENDPOINT (With Deduplication) ---
@app.get("/search")
@limiter.limit("20/minute") 
def search(request: Request, query: str, session: Session = Depends(get_session)):
    print(f"Received query: {query}")
    
    # 1. Search Logic
    query_vector = model.encode(query).tolist()
    results = index.query(
        vector=query_vector,
        top_k=3,
        include_metadata=True
    )
    
    final_matches = []
    result_titles = [] 

    for match in results['matches']:
        m_data = match['metadata']
        final_matches.append({
            "id": match['id'],
            "score": match['score'],
            "metadata": m_data
        })
        result_titles.append(m_data.get('title', 'Unknown Product'))

    # 2. SMART LOGGING
    if final_matches:
        # Check the MOST RECENT log entry
        statement = select(SearchLog).order_by(SearchLog.timestamp.desc()).limit(1)
        last_log = session.exec(statement).first()

        # DEDUPLICATION LOGIC:
        # If the last search is exactly the same as this one...
        if last_log and last_log.query.lower() == query.lower():
            # ...Just update the timestamp (bump to top)
            last_log.timestamp = datetime.datetime.utcnow()
            session.add(last_log)
            session.commit()
            print(f" -> Updated timestamp for existing: {query}")
        else:
            # ...Otherwise, create a new entry
            summary_str = " | ".join(result_titles)
            new_log = SearchLog(query=query, results_summary=summary_str)
            session.add(new_log)
            session.commit()
            print(f" -> Saved new to Archive: {query}")

    return {"matches": final_matches}

# --- ARCHIVE ENDPOINT ---
@app.get("/archive")
def get_archive(session: Session = Depends(get_session)):
    statement = select(SearchLog).order_by(SearchLog.timestamp.desc())
    results = session.exec(statement).all()
    return results