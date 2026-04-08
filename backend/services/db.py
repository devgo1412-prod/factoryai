# backend/services/db.py
import pyodbc
import pandas as pd
from config import DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD, DB_DRIVER, DB_TRUSTED

_ALLOWED_PREFIXES  = ("select", "with", "exec")
_BLOCKED_KEYWORDS  = ("drop","delete","truncate","update","insert","alter","create","grant","revoke")


def _conn_str():
    if DB_TRUSTED:
        return f"DRIVER={{{DB_DRIVER}}};SERVER={DB_SERVER};DATABASE={DB_NAME};Trusted_Connection=yes;"
    return f"DRIVER={{{DB_DRIVER}}};SERVER={DB_SERVER};DATABASE={DB_NAME};UID={DB_USER};PWD={DB_PASSWORD};"


def test_connection():
    try:
        c = pyodbc.connect(_conn_str(), timeout=5); c.close()
        return {"ok": True, "message": f"연결 성공: {DB_SERVER}/{DB_NAME}"}
    except Exception as e:
        return {"ok": False, "message": str(e)}


def run_query(sql: str, max_rows: int = 5000) -> dict:
    s = sql.strip().lower()
    if not s:
        return {"error": "SQL을 입력하세요."}
    if not any(s.startswith(p) for p in _ALLOWED_PREFIXES):
        return {"error": "SELECT / WITH / EXEC 만 허용됩니다."}
    for kw in _BLOCKED_KEYWORDS:
        if kw in s:
            return {"error": f"'{kw.upper()}' 명령은 허용되지 않습니다."}

    conn = None
    try:
        conn = pyodbc.connect(_conn_str(), timeout=10)
        df   = pd.read_sql(sql, conn)
        truncated = len(df) > max_rows
        if truncated:
            df = df.head(max_rows)

        # 컬럼 타입 분류
        numeric_cols = df.select_dtypes(include="number").columns.tolist()
        date_cols    = df.select_dtypes(include=["datetime","datetimetz"]).columns.tolist()

        return {
            "rows":         df.to_dict(orient="records"),
            "columns":      list(df.columns),
            "numeric_cols": numeric_cols,
            "date_cols":    date_cols,
            "total":        len(df),
            "truncated":    truncated,
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()
