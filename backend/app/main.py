import os
import asyncio
from uuid import UUID

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from .models import SweepSpec, StoredSweep
from .storage import save_spec, get_spec, list_ids, list_recent_ids

from collections import defaultdict
from typing import Dict, Set #Python 3.8

app = FastAPI(title="Parameter Sweep API")

# Allow CORS from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Parameter Sweep API is running! Go to /docs or /redoc for interaction!"}


@app.post("/configs")
async def create_config(spec: SweepSpec):
    """
    Create a new configuration and return its UUID.
    Pydantic validation occurs automatically.
    """
    id_ = await save_spec(spec)
    return {"id": str(id_)}


@app.get("/configs/recent")
async def get_recent_configs(limit: int = 10):
    """
    Return the most recent N configs (default = 10), sorted by recency.
    Each entry includes both the id and the config data.
    """
    ids = await list_recent_ids(limit=limit)
    recent_configs = []

    for id_ in ids:
        stored = await get_spec(id_)
        if stored:
            recent_configs.append({
                "id": str(id_),
                "config": jsonable_encoder(stored)
            })

    return JSONResponse(content=recent_configs)


@app.get("/configs/{id}")
async def read_config(id: str):
    """
    Retrieve a stored configuration by UUID.
    Raises 400 if ID format is invalid, 404 if not found.
    """
    try:
        uuid_obj = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id format")

    stored: StoredSweep = await get_spec(uuid_obj)
    if not stored:
        raise HTTPException(status_code=404, detail="Not found")

    return JSONResponse(content=jsonable_encoder(stored))


# Track active WebSocket connections per config ID
active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)

# Store the latest progress per config ID
latest_progress: Dict[str, dict] = {}

async def broadcast(config_id: str, message: dict):
    """Send message to all connected clients for a given config_id"""
    connections = active_connections[config_id]
    for ws in connections.copy():  # copy to avoid runtime changes
        try:
            await ws.send_json(message)
        except Exception:
            connections.remove(ws)

@app.websocket("/ws/configs/{config_id}")
async def ws_config_progress(websocket: WebSocket, config_id: str):
    """WebSocket for progress updates with viewer count and persistent state."""
    await websocket.accept()
    active_connections[config_id].add(websocket)

    try:
        # Send latest progress immediately to new client
        if config_id in latest_progress:
            viewers = len(active_connections[config_id])
            msg = {**latest_progress[config_id], "viewers": viewers}
            await websocket.send_json(msg)

        else:
            # Initial state
            progress = 0
            state = "QUEUED"
            viewers = len(active_connections[config_id])
            latest_progress[config_id] = {"progress": progress, "state": state}
            await broadcast(config_id, {"progress": progress, "state": state, "viewers": viewers})

        # Mock progress: 0 -> 100 in 20 steps if new job
        if latest_progress[config_id]["progress"] == 0:
            progress = 0
            state = "QUEUED"
            await asyncio.sleep(1)
            state = "RUNNING"

            for i in range(1, 21):
                progress = int(i * 5)
                progress = min(progress, 100)
                state = "RUNNING"
                latest_progress[config_id] = {"progress": progress, "state": state}
                viewers = len(active_connections[config_id])
                await broadcast(config_id, {"progress": progress, "state": state, "viewers": viewers})
                await asyncio.sleep(1)

            state = "DONE"
            progress = 100
            latest_progress[config_id] = {"progress": progress, "state": state}
            viewers = len(active_connections[config_id])
            await broadcast(config_id, {"progress": progress, "state": state, "viewers": viewers})

    except WebSocketDisconnect:
        print(f"Client disconnected from config {config_id}")
    finally:
        active_connections[config_id].remove(websocket)
        viewers = len(active_connections[config_id])
        if viewers > 0:
            # broadcast updated viewers count
            await broadcast(config_id, {"progress": latest_progress[config_id]["progress"],
                                        "state": latest_progress[config_id]["state"],
                                        "viewers": viewers})