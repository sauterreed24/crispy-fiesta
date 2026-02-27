import aiosqlite
from datetime import datetime

DB_PATH = "ai_mastery.db"


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS progress (
                id INTEGER PRIMARY KEY,
                challenges_completed INTEGER DEFAULT 0,
                prompts_evaluated INTEGER DEFAULT 0,
                knowledge_queries INTEGER DEFAULT 0,
                total_xp INTEGER DEFAULT 0,
                current_streak INTEGER DEFAULT 0,
                last_active TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS prompt_library (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                prompt TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                technique TEXT DEFAULT '',
                rating INTEGER DEFAULT 0,
                tags TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS challenge_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                challenge_type TEXT,
                challenge_text TEXT,
                user_response TEXT,
                score INTEGER DEFAULT 0,
                feedback TEXT DEFAULT '',
                difficulty TEXT DEFAULT 'intermediate',
                completed_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS learning_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            INSERT OR IGNORE INTO progress
                (id, challenges_completed, prompts_evaluated, knowledge_queries, total_xp, current_streak, last_active)
            VALUES (1, 0, 0, 0, 0, 0, ?)
        """, (datetime.now().isoformat(),))
        await db.commit()


async def get_progress():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM progress WHERE id = 1") as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else {}


async def update_progress(field: str, increment: int = 1, xp_gain: int = 0):
    async with aiosqlite.connect(DB_PATH) as db:
        today = datetime.now().date().isoformat()
        async with db.execute("SELECT last_active FROM progress WHERE id = 1") as cursor:
            row = await cursor.fetchone()
            if row:
                last_active = (row[0] or "")[:10]
                streak_sql = ", current_streak = current_streak + 1" if last_active != today else ""
                await db.execute(
                    f"""UPDATE progress SET
                        {field} = {field} + ?,
                        total_xp = total_xp + ?,
                        last_active = ?
                        {streak_sql}
                    WHERE id = 1""",
                    (increment, xp_gain, datetime.now().isoformat()),
                )
        await db.commit()


async def save_prompt(title: str, prompt: str, category: str, technique: str, tags: str, notes: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO prompt_library (title, prompt, category, technique, tags, notes) VALUES (?, ?, ?, ?, ?, ?)",
            (title, prompt, category, technique, tags, notes),
        )
        await db.commit()
        return cursor.lastrowid


async def get_prompts(search: str = "", category: str = ""):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        query = "SELECT * FROM prompt_library WHERE 1=1"
        params: list = []
        if search:
            query += " AND (title LIKE ? OR prompt LIKE ? OR tags LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        if category:
            query += " AND category = ?"
            params.append(category)
        query += " ORDER BY created_at DESC"
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def delete_prompt(prompt_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM prompt_library WHERE id = ?", (prompt_id,))
        await db.commit()


async def save_challenge(
    challenge_type: str,
    challenge_text: str,
    user_response: str,
    score: int,
    feedback: str,
    difficulty: str,
):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO challenge_history (challenge_type, challenge_text, user_response, score, feedback, difficulty) VALUES (?, ?, ?, ?, ?, ?)",
            (challenge_type, challenge_text, user_response, score, feedback, difficulty),
        )
        await db.commit()
        return cursor.lastrowid


async def get_challenge_history(limit: int = 20):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM challenge_history ORDER BY completed_at DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def save_note(topic: str, content: str, category: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO learning_notes (topic, content, category) VALUES (?, ?, ?)",
            (topic, content, category),
        )
        await db.commit()
        return cursor.lastrowid


async def get_notes(category: str = ""):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        query = "SELECT * FROM learning_notes"
        params: list = []
        if category:
            query += " WHERE category = ?"
            params.append(category)
        query += " ORDER BY created_at DESC"
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]
