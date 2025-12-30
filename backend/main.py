import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from sqlmodel import Field, Session, SQLModel, create_engine, select
from pydantic import BaseModel
import resend

# SECURITY TOOLS
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from secure import Secure

load_dotenv()

# --- CONFIGURATION ---
resend.api_key = os.getenv("RESEND_API_KEY")

# --- DATABASE SETUP ---
# 1. Search History
class SearchLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    query: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    results_summary: str 

# 2. Email Leads
class UserLead(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    query: str
    results_summary: str
    opt_in: bool = Field(default=False)
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

# 3. Click Tracker
class ClickLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_title: str
    query: str
    link_clicked: str
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
    return {"status": "online", "system": "Ventiko Product Finder"}

# --- SEARCH ENDPOINT ---
@app.get("/search")
@limiter.limit("30/minute") 
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

    # SAVE TO ARCHIVE
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

# --- CLICK TRACKING ENDPOINT ---
class ClickRequest(BaseModel):
    product_title: str
    query: str
    link: str

@app.post("/track-click")
def track_click(data: ClickRequest, session: Session = Depends(get_session)):
    new_click = ClickLog(
        product_title=data.product_title, 
        query=data.query,
        link_clicked=data.link
    )
    session.add(new_click)
    session.commit()
    print(f" -> CLICK TRACKED: {data.product_title}")
    return {"status": "logged"}

# --- EMAIL CAPTURE & SEND ENDPOINT ---
class ProductItem(BaseModel):
    title: str
    # We default to a fallback ONLY if the data is missing (prevents 422 error),
    # but the frontend will send the real link if it exists.
    link: str = "https://ventiko.app" 

class EmailRequest(BaseModel):
    email: str
    query: str
    results: List[ProductItem]
    opt_in: bool

@app.post("/capture-email")
@limiter.limit("5/minute")
def capture_email(request: Request, data: EmailRequest, session: Session = Depends(get_session)):
    
    if not data.opt_in:
        raise HTTPException(status_code=400, detail="User must opt-in.")

    # Save Lead (Summary only)
    summary_list = [item.title for item in data.results]
    summary_str = " | ".join(summary_list)
    
    new_lead = UserLead(
        email=data.email,
        query=data.query,
        results_summary=summary_str,
        opt_in=data.opt_in
    )
    session.add(new_lead)
    session.commit()
    print(f" -> LEAD CAPTURED: {data.email}")

    # BUILD THE EMAIL (HTML with LINKS)
    product_list_html = ""
    for item in data.results:
        # Each item is a clickable affiliate link
        product_list_html += f"""
        <li style='margin-bottom: 15px;'>
            <a href="{item.link}" style='color: #23F0C7; text-decoration: none; font-weight: bold; font-size: 16px; border-bottom: 1px dotted #23F0C7;'>
                {item.title} &#8594;
            </a>
        </li>
        """

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #2c3e50; text-transform: lowercase; letter-spacing: -1px; margin-top: 0;">Ventiko Finder</h2>
        <p style="color: #64748b; font-size: 16px;">We found these products for: <strong style="color: #2c3e50;">"{data.query}"</strong></p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <ul style="list-style-type: none; padding: 0;">
            {product_list_html}
        </ul>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Ventiko | London, UK <br>
            <a href="https://ventiko.app" style="color: #94a3b8; text-decoration: none;">ventiko.app</a>
        </p>
    </div>
    """

    try:
        resend.Emails.send({
            "from": "noreply@results.ventiko.app",
            "to": data.email,
            "subject": f"Ventiko Search Results 🔎",
            "html": html_content
        })
        return {"status": "success", "message": "Sent."}
    except Exception as e:
        print(f"!!! EMAIL ERROR: {e}")
        return {"status": "partial_success", "message": "Saved, but email failed."}