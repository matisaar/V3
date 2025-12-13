from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = FastAPI()

# Initialize Supabase Client
# Use os.environ.get with a default or handle missing keys gracefully for build steps
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Only initialize if keys are present (prevents build errors if env vars are missing during build)
if url and key:
    supabase: Client = create_client(url, key)
else:
    print("Warning: Supabase credentials not found in environment variables.")

# Initialize Gemini
gemini_key = os.environ.get("GEMINI_API_KEY")
if gemini_key:
    genai.configure(api_key=gemini_key)

@app.get("/api")
def read_root():
    return {"message": "Python Backend is running on Vercel!"}

@app.get("/api/transactions")
def get_transactions():
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    
    response = supabase.table("transactions").select("*").execute()
    return response.data

@app.post("/api/analyze")
def analyze_spending(data: dict):
    return {"analysis": "This is where Python analysis results would go"}

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
