# backend/config.py
import os
from dotenv import load_dotenv
load_dotenv()

# LLM
LLM_API_BASE_URL = os.getenv("LLM_API_BASE_URL", "http://YOUR_SERVER_IP:11434/v1")
LLM_API_KEY      = os.getenv("LLM_API_KEY", "ollama")
LLM_MODEL_NAME   = os.getenv("LLM_MODEL_NAME", "llama3")
LLM_MAX_TOKENS   = int(os.getenv("LLM_MAX_TOKENS", "2048"))
LLM_TEMPERATURE  = float(os.getenv("LLM_TEMPERATURE", "0.7"))
LLM_TIMEOUT      = int(os.getenv("LLM_TIMEOUT", "120"))

# Embedding / ChromaDB
EMBEDDING_MODEL  = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHROMA_DIR       = os.getenv("CHROMA_DIR", "./chroma")

# MSSQL
DB_SERVER   = os.getenv("DB_SERVER",   "localhost")
DB_NAME     = os.getenv("DB_NAME",     "YourDB")
DB_USER     = os.getenv("DB_USER",     "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "yourpassword")
DB_DRIVER   = os.getenv("DB_DRIVER",   "ODBC Driver 17 for SQL Server")
DB_TRUSTED  = os.getenv("DB_TRUSTED",  "false").lower() == "true"
