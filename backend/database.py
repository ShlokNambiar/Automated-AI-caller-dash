import sqlite3
import datetime

DB_NAME = "voca.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Leads Table
    c.execute('''CREATE TABLE IF NOT EXISTS leads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    phone TEXT,
                    status TEXT DEFAULT 'Pending',
                    call_id TEXT,
                    summary TEXT,
                    sentiment TEXT,
                    duration TEXT,
                    recording_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')

    # Wallet Table (for Credits)
    c.execute('''CREATE TABLE IF NOT EXISTS wallet (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    balance REAL DEFAULT 10000.00
                )''')
    
    # Initialize wallet if empty
    c.execute("INSERT OR IGNORE INTO wallet (id, balance) VALUES (1, 10000.00)")
    
    conn.commit()
    conn.close()

def add_leads(leads_list):
    """
    leads_list: list of dicts [{'name': '...', 'phone': '...'}]
    """
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    count = 0
    for lead in leads_list:
        # Prevent duplicates by phone? For now let's allow all for flexibility
        c.execute("INSERT INTO leads (name, phone, status) VALUES (?, ?, 'Pending')", 
                  (lead.get('Name'), lead.get('Phone')))
        count += 1
    conn.commit()
    conn.close()
    return count

def get_dashboard_stats():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT COUNT(*) FROM leads")
    total = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM leads WHERE status='Completed'")
    completed = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM leads WHERE status IN ('Pending', 'Ready', 'Calling')")
    pending = c.fetchone()[0]
    
    # Recent calls
    c.execute("SELECT * FROM leads ORDER BY id DESC LIMIT 10")
    recent_rows = c.fetchall()
    recent = [dict(row) for row in recent_rows]
    
    # Sentiment stats
    c.execute("SELECT sentiment, COUNT(*) as count FROM leads WHERE status='Completed' GROUP BY sentiment")
    sentiment_rows = c.fetchall()
    sentiments = [dict(row) for row in sentiment_rows]
    
    # Get Wallet Balance
    c.execute("SELECT balance FROM wallet WHERE id=1")
    balance_row = c.fetchone()
    balance = balance_row[0] if balance_row else 0.0
    
    conn.close()
    
    return {
        "metrics": {
            "total_leads": total,
            "completed_calls": completed,
            "pending_calls": pending,
            "call_time": f"{completed * 2} min", # Approx 2 min per call
            "credits": balance # Real INR Balance
        },
        "recent_calls": recent,
        "sentiment_counts": sentiments
    }

def get_ready_leads():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM leads WHERE status='Ready'")
    rows = c.fetchall()
    leads = [dict(row) for row in rows]
    conn.close()
    return leads

def update_lead_status(lead_id, status, call_id=None):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    if call_id:
        c.execute("UPDATE leads SET status=?, call_id=? WHERE id=?", (status, call_id, lead_id))
    else:
        c.execute("UPDATE leads SET status=? WHERE id=?", (status, lead_id))
    conn.commit()
    conn.close()

from math import ceil

def update_call_result(call_id, summary, sentiment, recording_url="", duration_seconds=60):
    PER_MINUTE_RATE = 5.0 # Low cost: ₹5/min
    
    # Calculate duration in minutes (rounded up)
    duration_mins = ceil(duration_seconds / 60)
    if duration_mins < 1: duration_mins = 1
    
    cost = duration_mins * PER_MINUTE_RATE
    
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Update lead status
    duration_str = f"{duration_mins} min"
    c.execute("UPDATE leads SET status='Completed', summary=?, sentiment=?, recording_url=?, duration=? WHERE call_id=?", 
              (summary, sentiment, recording_url, duration_str, call_id))
    
    # Deduct credits
    c.execute("UPDATE wallet SET balance = balance - ? WHERE id = 1", (cost,))
    
    conn.commit()
    conn.close()

def start_campaign():
    """Marks all 'Pending' leads as 'Ready' to be picked up by Observer"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("UPDATE leads SET status='Ready' WHERE status='Pending'")
    changes = c.rowcount
    conn.commit()
    conn.close()
    return changes

def get_wallet_balance():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT balance FROM wallet WHERE id=1")
    row = c.fetchone()
    conn.close()
    return row[0] if row else 0.0
