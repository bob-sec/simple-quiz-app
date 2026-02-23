"""
Quiz App – FastAPI Backend
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

import redis.asyncio as aioredis
from fastapi import (
    Depends,
    FastAPI,
    Header,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─────────────────────────────────────────────────────────────
#  Config
# ─────────────────────────────────────────────────────────────

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
QUIZ_DATA_PATH = os.getenv("QUIZ_DATA_PATH", "/quiz-content/quiz_data.json")

# Load quiz data at startup
with open(QUIZ_DATA_PATH, encoding="utf-8") as f:
    QUIZ_DATA: dict[str, Any] = json.load(f)

QUESTIONS: list[dict] = QUIZ_DATA["questions"]
TOTAL_QUESTIONS = len(QUESTIONS)

# ─────────────────────────────────────────────────────────────
#  App
# ─────────────────────────────────────────────────────────────

app = FastAPI(title="Quiz App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
#  Redis
# ─────────────────────────────────────────────────────────────

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.Redis(
            host=REDIS_HOST, port=REDIS_PORT, decode_responses=True
        )
    return _redis


# ─────────────────────────────────────────────────────────────
#  WebSocket Manager
# ─────────────────────────────────────────────────────────────


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self._connections.discard(ws) if hasattr(self._connections, "discard") else None
        if ws in self._connections:
            self._connections.remove(ws)

    async def broadcast(self, message: dict) -> None:
        payload = json.dumps(message, ensure_ascii=False)
        dead: list[WebSocket] = []
        for ws in list(self._connections):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


# ─────────────────────────────────────────────────────────────
#  Models
# ─────────────────────────────────────────────────────────────


class RegisterRequest(BaseModel):
    user_id: str
    name: str


class AnswerRequest(BaseModel):
    user_id: str
    question_id: int
    choice_id: str


class AdminLoginRequest(BaseModel):
    password: str


# ─────────────────────────────────────────────────────────────
#  Admin Auth Helper
# ─────────────────────────────────────────────────────────────


async def require_admin(
    x_admin_token: str | None = Header(default=None),
    redis: aioredis.Redis = Depends(get_redis),
) -> str:
    if not x_admin_token:
        raise HTTPException(status_code=401, detail="認証トークンが必要です")
    valid = await redis.get(f"admin:session:{x_admin_token}")
    if not valid:
        raise HTTPException(status_code=401, detail="無効なトークンです")
    return x_admin_token


# ─────────────────────────────────────────────────────────────
#  Quiz State Helpers
# ─────────────────────────────────────────────────────────────


async def _get_quiz_state(redis: aioredis.Redis) -> dict:
    status = await redis.get("quiz:status") or "waiting"
    current_q_raw = await redis.get("quiz:current_question")
    current_q = int(current_q_raw) if current_q_raw is not None else None
    return {"status": status, "current_question": current_q}


async def _broadcast_state(redis: aioredis.Redis) -> None:
    state = await _get_quiz_state(redis)
    await manager.broadcast({"type": "quiz_state", **state})


# ─────────────────────────────────────────────────────────────
#  Public Endpoints
# ─────────────────────────────────────────────────────────────


@app.get("/api/quiz/info")
async def quiz_info():
    return {
        "title": QUIZ_DATA.get("quiz_title", "Quiz"),
        "theme_color": QUIZ_DATA.get("theme_color", "#6366F1"),
        "total_questions": TOTAL_QUESTIONS,
        "welcome_image": QUIZ_DATA.get("welcome_image") or None,
        "finished_image": QUIZ_DATA.get("finished_image") or None,
    }


@app.get("/api/quiz/status")
async def quiz_status(redis: aioredis.Redis = Depends(get_redis)):
    return await _get_quiz_state(redis)


@app.post("/api/quiz/register")
async def register_user(
    req: RegisterRequest, redis: aioredis.Redis = Depends(get_redis)
):
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="名前を入力してください")
    await redis.set(f"user:{req.user_id}:name", name)
    await redis.sadd("users", req.user_id)
    return {"success": True}


@app.get("/api/quiz/question/{question_id}")
async def get_question(question_id: int, redis: aioredis.Redis = Depends(get_redis)):
    state = await _get_quiz_state(redis)

    if state["status"] not in ("active", "paused"):
        return {"available": False, "status": state["status"]}

    if state["current_question"] != question_id:
        return {
            "available": False,
            "status": state["status"],
            "current_question": state["current_question"],
        }

    if question_id < 0 or question_id >= TOTAL_QUESTIONS:
        raise HTTPException(status_code=404, detail="問題が見つかりません")

    q = QUESTIONS[question_id]
    accepting = state["status"] == "active"

    return {
        "available": True,
        "accepting_answers": accepting,
        "id": question_id,
        "question_number": question_id + 1,
        "total_questions": TOTAL_QUESTIONS,
        "title": q.get("title", ""),
        "body": q.get("body", ""),
        "choices": [
            {"id": c["id"], "image": c.get("image"), "label": c.get("label", c["id"])}
            for c in q["choices"]
        ],
    }


@app.post("/api/quiz/answer")
async def submit_answer(
    req: AnswerRequest, redis: aioredis.Redis = Depends(get_redis)
):
    state = await _get_quiz_state(redis)

    if state["status"] != "active":
        raise HTTPException(status_code=400, detail="現在回答を受け付けていません")

    if state["current_question"] != req.question_id:
        raise HTTPException(status_code=400, detail="この問題は現在回答できません")

    if req.question_id < 0 or req.question_id >= TOTAL_QUESTIONS:
        raise HTTPException(status_code=404, detail="問題が見つかりません")

    # Check duplicate
    existing = await redis.hget(
        f"user:{req.user_id}:answers", str(req.question_id)
    )
    if existing:
        raise HTTPException(status_code=409, detail="すでに回答済みです")

    q = QUESTIONS[req.question_id]
    is_correct = q.get("correct_answer") == req.choice_id

    answer_data = json.dumps(
        {
            "choice_id": req.choice_id,
            "is_correct": is_correct,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        ensure_ascii=False,
    )
    await redis.hset(
        f"user:{req.user_id}:answers", str(req.question_id), answer_data
    )

    # Broadcast updated answer count (for admin live view)
    await manager.broadcast(
        {
            "type": "answer_update",
            "question_id": req.question_id,
        }
    )

    return {"success": True, "is_correct": is_correct}


@app.get("/api/quiz/my-results")
async def my_results(user_id: str, redis: aioredis.Redis = Depends(get_redis)):
    answers_raw = await redis.hgetall(f"user:{user_id}:answers")
    answers: dict[str, dict] = {}
    correct_count = 0
    for q_id_str, ans_json in answers_raw.items():
        ans = json.loads(ans_json)
        q_id = int(q_id_str)
        q = QUESTIONS[q_id] if q_id < TOTAL_QUESTIONS else {}
        answers[q_id_str] = {
            **ans,
            "correct_answer": q.get("correct_answer"),
            "question_title": q.get("title", ""),
        }
        if ans["is_correct"]:
            correct_count += 1
    return {
        "correct_count": correct_count,
        "total_questions": TOTAL_QUESTIONS,
        "answers": answers,
        "questions": [
            {"id": i, "title": q.get("title", f"Q{i + 1}")}
            for i, q in enumerate(QUESTIONS)
        ],
    }


# ─────────────────────────────────────────────────────────────
#  Admin Endpoints
# ─────────────────────────────────────────────────────────────


@app.post("/api/admin/login")
async def admin_login(
    req: AdminLoginRequest, redis: aioredis.Redis = Depends(get_redis)
):
    if req.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="パスワードが正しくありません")
    token = str(uuid.uuid4())
    await redis.setex(f"admin:session:{token}", 86400, "1")  # 24 hour TTL
    return {"success": True, "token": token}


@app.post("/api/admin/quiz/start")
async def admin_start_quiz(
    _: str = Depends(require_admin), redis: aioredis.Redis = Depends(get_redis)
):
    await redis.set("quiz:status", "active")
    await redis.set("quiz:current_question", "0")
    await _broadcast_state(redis)
    return {"success": True}


@app.post("/api/admin/quiz/pause")
async def admin_pause_quiz(
    _: str = Depends(require_admin), redis: aioredis.Redis = Depends(get_redis)
):
    await redis.set("quiz:status", "paused")
    await _broadcast_state(redis)
    return {"success": True}


@app.post("/api/admin/quiz/resume")
async def admin_resume_quiz(
    _: str = Depends(require_admin), redis: aioredis.Redis = Depends(get_redis)
):
    await redis.set("quiz:status", "active")
    await _broadcast_state(redis)
    return {"success": True}


@app.post("/api/admin/quiz/next")
async def admin_next_question(
    _: str = Depends(require_admin), redis: aioredis.Redis = Depends(get_redis)
):
    current_raw = await redis.get("quiz:current_question")
    current = int(current_raw) if current_raw is not None else 0

    if current + 1 >= TOTAL_QUESTIONS:
        await redis.set("quiz:status", "finished")
        await redis.delete("quiz:current_question")
    else:
        await redis.set("quiz:status", "active")
        await redis.set("quiz:current_question", str(current + 1))

    await _broadcast_state(redis)
    return {"success": True}


@app.post("/api/admin/quiz/prev")
async def admin_prev_question(
    _: str = Depends(require_admin), redis: aioredis.Redis = Depends(get_redis)
):
    current_raw = await redis.get("quiz:current_question")
    current = int(current_raw) if current_raw is not None else 0

    if current > 0:
        await redis.set("quiz:status", "active")
        await redis.set("quiz:current_question", str(current - 1))
        await _broadcast_state(redis)
    return {"success": True}


@app.post("/api/admin/quiz/goto/{question_id}")
async def admin_goto_question(
    question_id: int,
    _: str = Depends(require_admin),
    redis: aioredis.Redis = Depends(get_redis),
):
    if question_id < 0 or question_id >= TOTAL_QUESTIONS:
        raise HTTPException(status_code=400, detail="無効な問題番号です")
    await redis.set("quiz:status", "active")
    await redis.set("quiz:current_question", str(question_id))
    await _broadcast_state(redis)
    return {"success": True}


@app.post("/api/admin/quiz/reset")
async def admin_reset_quiz(
    _: str = Depends(require_admin), redis: aioredis.Redis = Depends(get_redis)
):
    await redis.set("quiz:status", "waiting")
    await redis.delete("quiz:current_question")

    # Clear all user data (answers + names + user set)
    users = await redis.smembers("users")
    for user_id in users:
        await redis.delete(f"user:{user_id}:answers")
        await redis.delete(f"user:{user_id}:name")
    await redis.delete("users")

    # Broadcast a dedicated reset event so clients can clear local state
    await manager.broadcast(
        {"type": "quiz_reset", "status": "waiting", "current_question": None}
    )
    return {"success": True}


@app.get("/api/admin/results")
async def admin_results(
    _: str = Depends(require_admin), redis: aioredis.Redis = Depends(get_redis)
):
    users = await redis.smembers("users")
    results: list[dict] = []

    for user_id in users:
        name = await redis.get(f"user:{user_id}:name") or "Unknown"
        answers_raw = await redis.hgetall(f"user:{user_id}:answers")

        answers: dict[str, dict] = {}
        correct_count = 0
        for q_id_str, ans_json in answers_raw.items():
            ans = json.loads(ans_json)
            answers[q_id_str] = ans
            if ans["is_correct"]:
                correct_count += 1

        results.append(
            {
                "user_id": user_id,
                "name": name,
                "correct_count": correct_count,
                "total_answered": len(answers),
                "answers": answers,
            }
        )

    results.sort(key=lambda x: (-x["correct_count"], -x["total_answered"]))
    return {
        "participants": results,
        "total_questions": TOTAL_QUESTIONS,
        "questions": [
            {"id": i, "title": q.get("title", f"Q{i+1}")}
            for i, q in enumerate(QUESTIONS)
        ],
    }


# ─────────────────────────────────────────────────────────────
#  WebSocket
# ─────────────────────────────────────────────────────────────


@app.websocket("/ws")
async def websocket_endpoint(
    ws: WebSocket, redis: aioredis.Redis = Depends(get_redis)
):
    await manager.connect(ws)
    # Send current state immediately on connect
    state = await _get_quiz_state(redis)
    await ws.send_text(json.dumps({"type": "quiz_state", **state}))

    try:
        while True:
            # Keep connection alive; ignore incoming messages from clients
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:
        manager.disconnect(ws)
