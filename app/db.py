import os
import pyodbc

# Using Driver 17 as confirmed
CONN_STR = os.getenv(
    "MSSQL_CONN_STR",
    "Driver={ODBC Driver 17 for SQL Server};"
    "Server=DESKTOP-S544D6C;"
    "Database=DeAiAssistant;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
)

def get_conn():
    return pyodbc.connect(CONN_STR)

def init_db():
    try:
        with get_conn() as cn:
            cur = cn.cursor()
            cur.execute("""
            IF OBJECT_ID('dbo.chat_messages', 'U') IS NULL
            BEGIN
              CREATE TABLE dbo.chat_messages (
                id INT IDENTITY(1,1) PRIMARY KEY,
                chat_id UNIQUEIDENTIFIER NOT NULL,
                role VARCHAR(20) NOT NULL,
                scope VARCHAR(50) NULL,
                content NVARCHAR(MAX) NOT NULL,
                created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
              );
              CREATE INDEX IX_chat_messages_chat_created
              ON dbo.chat_messages(chat_id, created_at);
            END
            """)
            cn.commit()
    except Exception as e:
        print(f"❌ DB Init Error: {e}")

def insert_message(chat_id, role, content, scope=None):
    try:
        with get_conn() as cn:
            cur = cn.cursor()
            chat_id_str = str(chat_id)
            cur.execute("""
              INSERT INTO dbo.chat_messages (chat_id, role, scope, content)
              VALUES (?, ?, ?, ?)
            """, (chat_id_str, role, scope, content))
            cn.commit()
    except Exception as e:
        print(f"❌ DB Insert Error: {e}")

def get_all_chats():
    try:
        with get_conn() as cn:
            cur = cn.cursor()
            # Get unique chat_ids
            cur.execute("""
                SELECT DISTINCT chat_id 
                FROM dbo.chat_messages
            """)
            rows = cur.fetchall()
            return [str(r[0]) for r in rows]
    except Exception as e:
        print(f"❌ DB List Error: {e}")
        return []

def get_messages(chat_id):
    try:
        with get_conn() as cn:
            cur = cn.cursor()
            chat_id_str = str(chat_id)
            cur.execute("""
              SELECT role, scope, content
              FROM dbo.chat_messages
              WHERE chat_id = ?
              ORDER BY created_at ASC
            """, (chat_id_str,))
            rows = cur.fetchall()
            return [{"role": r[0], "scope": r[1], "content": r[2]} for r in rows]
    except Exception as e:
        print(f"❌ DB Read Error: {e}")
        return []

def get_db_schema():
    try:
        with get_conn() as cn:
            cur = cn.cursor()
            # Ask SQL Server for table names and columns
            cur.execute("""
                SELECT 
                    t.name AS table_name,
                    STRING_AGG(c.name, ', ') AS columns
                FROM sys.tables t
                JOIN sys.columns c ON t.object_id = c.object_id
                GROUP BY t.name
            """)
            rows = cur.fetchall()
            
            if not rows:
                return "(No tables found in database)"
                
            schema_text = "CURRENT SQL SERVER SCHEMA:\n"
            for row in rows:
                schema_text += f"- Table '{row[0]}' columns: {row[1]}\n"
            
            return schema_text
    except Exception as e:
        print(f"❌ DB Schema Error: {e}")
        return "(Schema unavailable)"

def run_read_only_sql(query: str):
    # 1. Safety Filter: Block dangerous keywords
    forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "CREATE", "GRANT", "EXEC"]
    if any(word in query.upper() for word in forbidden):
        return {"error": "Safety Block: Only SELECT queries are allowed."}

    try:
        with get_conn() as cn:
            cur = cn.cursor()
            cur.execute(query)
            
            if cur.description:
                columns = [column[0] for column in cur.description]
                rows = cur.fetchall()
                results = []
                for row in rows:
                    results.append(dict(zip(columns, row)))
                return {"columns": columns, "rows": results}
            else:
                return {"message": "Query executed successfully (no results)."}
    except Exception as e:
        return {"error": str(e)}

# ✅ FIX 1: Missing Delete Chat Function
def delete_chat(chat_id):
    """
    Deletes all messages associated with a specific chat_id.
    """
    try:
        with get_conn() as cn:
            cur = cn.cursor()
            cur.execute("DELETE FROM dbo.chat_messages WHERE chat_id = ?", (str(chat_id),))
            cn.commit()
            return True
    except Exception as e:
        print(f"❌ DB Delete Error: {e}")
        return False

# ✅ FIX 2: Missing Delete All History Function (THIS CAUSED THE CRASH)
def delete_all_history():
    """
    Deletes ALL messages from the database (Clear History).
    """
    try:
        with get_conn() as cn:
            cur = cn.cursor()
            cur.execute("DELETE FROM dbo.chat_messages")
            cn.commit()
            return True
    except Exception as e:
        print(f"❌ DB Delete All Error: {e}")
        return False
