import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from sqlmodel import Field, Session, SQLModel, create_engine, select
from pydantic import BaseModel # For data validation

# SECURITY TOOLS
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from secure import Secure

load_dotenv()

# --- DATABASE SETUP ---
# Table 1: Search History (The Archive)
class SearchLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    query: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    results_summary: str 

# Table 2: User Leads (The Value Engine) <--- NEW TABLE
class UserLead(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    query: str
    results_summary: str
    opt_in: bool = Field(default=False) # Mandatory tick box
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

sqlite_file_name = "search_history.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# --- PINECONE SETUP ---
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
    return {"status": "online", "system": "Ventiko Engine (Value V1)"}

# --- SEARCH ENDPOINT ---
@app.get("/search")
@limiter.limit("20/minute") 
def search(request: Request, query: str, session: Session = Depends(get_session)):
    print(f"Received query: {query}")
    
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

    # SAVE TO LEDGER (Archive)
    if final_matches:
        statement = select(SearchLog).order_by(SearchLog.timestamp.desc()).limit(1)
        last_log = session.exec(statement).first()

        if last_log and last_log.query.lower() == query.lower():
            last_log.timestamp = datetime.datetime.utcnow()
            session.add(last_log)
            session.commit()
        else:
            summary_str = " | ".join(result_titles)
            new_log = SearchLog(query=query, results_summary=summary_str)
            session.add(new_log)
            session.commit()

    return {"matches": final_matches}

# --- ARCHIVE ENDPOINT ---
@app.get("/archive")
def get_archive(session: Session = Depends(get_session)):
    statement = select(SearchLog).order_by(SearchLog.timestamp.desc())
    results = session.exec(statement).all()
    return results

# --- NEW: CAPTURE EMAIL ENDPOINT ---
class EmailRequest(BaseModel):
    email: str
    query: str
    results: List[str] # List of product titles
    opt_in: bool

@app.post("/capture-email")
@limiter.limit("5/minute") # Prevent spamming emails
def capture_email(request: Request, data: EmailRequest, session: Session = Depends(get_session)):
    
    # Validation: Must opt-in
    if not data.opt_in:
        raise HTTPException(status_code=400, detail="User must opt-in to receive emails.")

    # 1. Save to Database (The Asset)
    summary_str = " | ".join(data.results)
    new_lead = UserLead(
        email=data.email,
        query=data.query,
        results_summary=summary_str,
        opt_in=data.opt_in
    )
    session.add(new_lead)
    session.commit()
    
    print(f" -> LEAD CAPTURED: {data.email} for '{data.query}'")

    # 2. SEND EMAIL (Placeholder - We will add the 'rerouter' logic next)
    # This is where we will hook into Resend or SMTP later.
    
    return {"status": "success", "message": "Protocol saved."}