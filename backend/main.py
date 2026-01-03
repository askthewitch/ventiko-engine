import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, Request, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from sqlmodel import Field, Session, SQLModel, create_engine, select, delete
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

# INTELLIGENCE SETTINGS
SCORE_THRESHOLD = 0.35 

# --- PHASE 18: THE INTENT MAP (KEYWORD EXPANDER) ---
INTENT_MAP = {
    "hyrox": "crossfit functional fitness running shoes compression gear electrolytes energy gels grip chalk",
    "marathon": "long distance running shoes hydration vest anti-chafe balm energy gels running socks recovery salts",
    "half marathon": "running shoes hydration energy gels running socks recovery",
    "5k": "running shoes lightweight trainers",
    "10k": "running shoes lightweight trainers",
    "skin routine": "face cleanser moisturizer toner serum SPF hyaluronic acid retinol",
    "skincare": "face cleanser moisturizer toner serum SPF",
    "morning routine": "face cleanser vitamin c serum moisturizer light therapy lamp",
    "night routine": "magnesium glycinate blue light blocking glasses sleep mask lavender spray night cream",
    "sleep": "magnesium glycinate blue light blocking glasses sleep mask lavender spray weighted blanket",
    "recovery": "massage gun compression boots protein powder sauna blanket ice bath epsom salts",
    "gym": "protein powder creatine pre-workout lifting straps gym bag water bottle",
    "home gym": "dumbbells kettlebell yoga mat resistance bands adjustable bench",
    "yoga": "yoga mat yoga blocks leggings meditation cushion essential oils",
    "focus": "lion's mane mushroom caffeine l-theanine noise cancelling headphones standing desk",
    "travel": "neck pillow compression socks eye mask power bank travel adapter noise cancelling headphones"
}

def expand_query_intent(user_query: str) -> str:
    query_lower = user_query.lower()
    additional_keywords = []
    for key, values in INTENT_MAP.items():
        if key in query_lower:
            additional_keywords.append(values)
    if additional_keywords:
        expansion = " ".join(additional_keywords)
        return f"{user_query} {expansion}"
    return user_query

# --- DATABASE SETUP ---
class SearchLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    query: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    results_summary: str 

class UserLead(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    query: str
    results_summary: str
    opt_in: bool = Field(default=False)
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class ClickLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_title: str
    query: str
    link_clicked: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

# --- ENGINE CREATION ---
database_url = os.getenv("DATABASE_URL")
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

if not database_url:
    print("!!! WARNING: No DATABASE_URL found. Falling back to temporary SQLite.")
    sqlite_file_name = "search_history.db"
    database_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(database_url)

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

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ventiko.vercel.app",
    "https://ventiko.app",
    "https://www.ventiko.app"
]
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
    print(f"Received Query: {query}")
    if len(query.strip()) < 3:
        return {"matches": []}

    expanded_query = expand_query_intent(query)
    if expanded_query != query:
        print(f" -> Expanded to: {expanded_query}")

    query_vector = model.encode(expanded_query).tolist()
    results = index.query(
        vector=query_vector,
        top_k=3,
        include_metadata=True
    )
    
    final_matches = []
    result_titles = [] 

    for match in results['matches']:
        if match['score'] < SCORE_THRESHOLD:
            continue
        m_data = match['metadata']
        final_matches.append({
            "id": match['id'],
            "score": match['score'],
            "metadata": m_data
        })
        result_titles.append(m_data.get('title', 'Unknown Product'))

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

# --- UNSUBSCRIBE ENDPOINT ---
@app.get("/unsubscribe")
def unsubscribe(email: str, session: Session = Depends(get_session)):
    print(f"--- UNSUBSCRIBE REQUEST: {email} ---")
    statement = select(UserLead).where(UserLead.email == email)
    results = session.exec(statement).all()
    if not results:
        return {"status": "not_found", "message": "Email not found."}
    for record in results:
        session.delete(record)
    session.commit()
    print(f" -> DELETED {len(results)} records for {email}")
    return {"status": "success", "message": f"Successfully removed {email}."}

# --- EMAIL CAPTURE ENDPOINT (BELSTAFF CLEAN STYLE) ---
class ProductItem(BaseModel):
    title: str
    link: str = "https://ventiko.app"
    image: Optional[str] = None # Added support for image passing if frontend sends it

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

    # --- HTML GENERATION (BELSTAFF STYLE) ---
    
    # 1. Split Data
    hero_item = data.results[0] if data.results else None
    secondary_items = data.results[1:3] if len(data.results) > 1 else []
    unsubscribe_link = "https://ventiko.app/?modal=unsubscribe"

    # 2. Build Secondary Rows (The Grid)
    grid_html = ""
    if secondary_items:
        grid_content = ""
        for item in secondary_items:
            grid_content += f"""
            <td width="50%" valign="top" style="padding: 10px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center" style="padding-bottom: 10px; border: 1px solid #f1f5f9; border-radius: 8px;">
                             <img src="https://via.placeholder.com/250x200?text=Product" width="100%" style="display: block; border-radius: 8px 8px 0 0; max-height: 150px; object-fit: contain;" alt="{item.title}">
                            <div style="padding: 15px;">
                                <div style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 8px; height: 40px; overflow: hidden;">{item.title}</div>
                                <a href="{item.link}" style="display: inline-block; font-family: Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; color: #2563eb; text-decoration: none; text-transform: uppercase;">View Deal &rarr;</a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            """
        grid_html = f"""
        <tr>
            <td style="padding: 20px 0;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        {grid_content}
                    </tr>
                </table>
            </td>
        </tr>
        """

    # 3. Build Hero HTML
    hero_html = ""
    if hero_item:
        hero_html = f"""
        <tr>
            <td align="center" style="padding: 0 0 20px 0;">
                <a href="{hero_item.link}" style="text-decoration: none;">
                    <img src="https://via.placeholder.com/600x400?text=Top+Match" width="600" style="display: block; width: 100%; max-width: 600px; border-radius: 8px;" alt="{hero_item.title}">
                </a>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 10px 0 20px 0;">
                <h2 style="font-family: Helvetica, Arial, sans-serif; font-size: 24px; font-weight: bold; color: #0f172a; margin: 0 0 10px 0;">{hero_item.title}</h2>
                <a href="{hero_item.link}" style="background-color: #0f172a; color: #ffffff; padding: 12px 30px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 4px; display: inline-block;">VIEW DEAL</a>
            </td>
        </tr>
        """

    # 4. Full Template Assembly
    html_content = f"""
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link href="https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap" rel="stylesheet">
        <style>
            body {{ margin: 0; padding: 0; background-color: #f8fafc; }}
            .brand-font {{ font-family: 'Major Mono Display', monospace; }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td style="padding: 20px 0 30px 0;" align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        
                        <tr>
                            <td align="center" style="padding: 30px 0 20px 0; border-bottom: 1px solid #f1f5f9;">
                                <h1 style="margin: 0; font-family: 'Courier New', monospace; font-size: 32px; color: #0f172a; letter-spacing: -1px; font-weight: bold;">
                                    ventiko
                                </h1>
                                <p style="margin: 5px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                                    AI Product Finder
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" style="padding: 30px 20px 10px 20px;">
                                <p style="font-family: Helvetica, Arial, sans-serif; font-size: 16px; color: #334155; margin: 0;">
                                    We found the best matches for:
                                </p>
                                <div style="margin-top: 10px; background-color: #ecfdf5; color: #065f46; padding: 8px 16px; border-radius: 20px; display: inline-block; font-family: Helvetica, Arial, sans-serif; font-weight: bold;">
                                    "{data.query}"
                                </div>
                            </td>
                        </tr>

                        {hero_html}

                        <tr>
                            <td style="padding: 0 20px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="border-bottom: 1px solid #f1f5f9;"></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        {grid_html}

                        <tr>
                            <td bgcolor="#0f172a" style="padding: 30px 30px 30px 30px; text-align: center;">
                                <p style="color: #23F0C7; font-family: 'Courier New', monospace; margin: 0 0 10px 0; font-size: 18px;">
                                    ventiko
                                </p>
                                <p style="color: #94a3b8; font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; margin: 0;">
                                    &copy; {datetime.datetime.now().year} Ventiko Ltd.<br/>
                                    Isle of Man, United Kingdom
                                </p>
                                <p style="margin-top: 20px;">
                                    <a href="{unsubscribe_link}" style="color: #64748b; font-family: Helvetica, Arial, sans-serif; font-size: 12px; text-decoration: underline;">Unsubscribe</a>
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    try:
        resend.Emails.send({
            "from": "Ventiko Engine <noreply@results.ventiko.app>",
            "to": data.email,
            "subject": f"Your Results: {data.query}",
            "html": html_content
        })
        return {"status": "success", "message": "Sent."}
    except Exception as e:
        print(f"!!! EMAIL ERROR: {e}")
        return {"status": "partial_success", "message": "Saved, but email failed."}

# --- ADMIN ENDPOINT ---
@app.get("/admin-data")
def get_admin_data(x_admin_secret: str = Header(None), session: Session = Depends(get_session)):
    env_secret = os.getenv("ADMIN_SECRET", "ventiko_admin_2026")
    if x_admin_secret != env_secret:
        raise HTTPException(status_code=401, detail="Unauthorized Access")

    leads = session.exec(select(UserLead).order_by(UserLead.timestamp.desc())).all()
    clicks = session.exec(select(ClickLog).order_by(ClickLog.timestamp.desc())).all()
    
    return {
        "leads": leads,
        "clicks": clicks,
        "stats": {
            "total_leads": len(leads),
            "total_clicks": len(clicks)
        }
    }