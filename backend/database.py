import aiosqlite
import json
from datetime import datetime

DB_PATH = "sdr_assistant.db"


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                company TEXT NOT NULL,
                title TEXT,
                notes TEXT,
                research TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prospect_name TEXT NOT NULL,
                company TEXT NOT NULL,
                call_date TEXT,
                outcome TEXT,
                notes TEXT,
                next_steps TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient_name TEXT,
                company TEXT,
                subject TEXT,
                body TEXT,
                email_type TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS style_samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sample_text TEXT NOT NULL,
                label TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()


async def save_lead(name: str, company: str, title: str, notes: str, research: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO leads (name, company, title, notes, research) VALUES (?, ?, ?, ?, ?)",
            (name, company, title, notes, research)
        )
        await db.commit()
        return cursor.lastrowid


async def get_leads(search: str = "") -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if search:
            cursor = await db.execute(
                "SELECT * FROM leads WHERE name LIKE ? OR company LIKE ? ORDER BY created_at DESC LIMIT 50",
                (f"%{search}%", f"%{search}%")
            )
        else:
            cursor = await db.execute("SELECT * FROM leads ORDER BY created_at DESC LIMIT 50")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


async def save_conversation(
    prospect_name: str, company: str, call_date: str,
    outcome: str, notes: str, next_steps: str
) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO conversations (prospect_name, company, call_date, outcome, notes, next_steps)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (prospect_name, company, call_date, outcome, notes, next_steps)
        )
        await db.commit()
        return cursor.lastrowid


async def get_conversations(search: str = "") -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if search:
            cursor = await db.execute(
                """SELECT * FROM conversations
                   WHERE prospect_name LIKE ? OR company LIKE ? OR notes LIKE ?
                   ORDER BY created_at DESC LIMIT 100""",
                (f"%{search}%", f"%{search}%", f"%{search}%")
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM conversations ORDER BY created_at DESC LIMIT 100"
            )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


async def get_prospect_history(prospect_name: str, company: str) -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """SELECT * FROM conversations
               WHERE (prospect_name LIKE ? OR company LIKE ?)
               ORDER BY created_at DESC""",
            (f"%{prospect_name}%", f"%{company}%")
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


async def save_email(recipient_name: str, company: str, subject: str, body: str, email_type: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO emails (recipient_name, company, subject, body, email_type) VALUES (?, ?, ?, ?, ?)",
            (recipient_name, company, subject, body, email_type)
        )
        await db.commit()
        return cursor.lastrowid


async def get_emails(limit: int = 20) -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM emails ORDER BY created_at DESC LIMIT ?", (limit,)
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


async def save_style_sample(sample_text: str, label: str = "") -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO style_samples (sample_text, label) VALUES (?, ?)",
            (sample_text, label)
        )
        await db.commit()
        return cursor.lastrowid


async def get_style_samples() -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM style_samples ORDER BY created_at DESC LIMIT 10"
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


async def save_knowledge_note(category: str, content: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO knowledge_notes (category, content) VALUES (?, ?)",
            (category, content)
        )
        await db.commit()
        return cursor.lastrowid


async def get_knowledge_notes(category: str = "") -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if category:
            cursor = await db.execute(
                "SELECT * FROM knowledge_notes WHERE category = ? ORDER BY created_at DESC",
                (category,)
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM knowledge_notes ORDER BY created_at DESC"
            )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


async def delete_lead(lead_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
        await db.commit()


async def delete_conversation(conv_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        await db.commit()


async def delete_style_sample(sample_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM style_samples WHERE id = ?", (sample_id,))
        await db.commit()


async def delete_knowledge_note(note_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM knowledge_notes WHERE id = ?", (note_id,))
        await db.commit()


async def get_stats() -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        leads_count = (await (await db.execute("SELECT COUNT(*) FROM leads")).fetchone())[0]
        convs_count = (await (await db.execute("SELECT COUNT(*) FROM conversations")).fetchone())[0]
        emails_count = (await (await db.execute("SELECT COUNT(*) FROM emails")).fetchone())[0]
        styles_count = (await (await db.execute("SELECT COUNT(*) FROM style_samples")).fetchone())[0]
        return {
            "leads": leads_count,
            "conversations": convs_count,
            "emails": emails_count,
            "style_samples": styles_count
        }
