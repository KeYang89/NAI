import os
import json
import redis.asyncio as redis
from uuid import UUID, uuid4
from typing import List, Optional
from .models import SweepSpec, StoredSweep

REDIS_URL = "redis://localhost:6379/0"
r = redis.from_url(REDIS_URL, decode_responses=True)

KEY_PREFIX = "sweep:"
RECENT_LIST_KEY = "sweeps:recent"


async def save_spec(spec: SweepSpec) -> UUID:
    id_ = uuid4()
    stored = StoredSweep(id=id_, **spec.dict())

    key = f"{KEY_PREFIX}{id_}"
    # Save the config
    await r.set(key, stored.json())

    # Push to recent list (left push = newest first)
    await r.lpush(RECENT_LIST_KEY, str(id_))
    # Keep only the last 100 items (trim list)
    await r.ltrim(RECENT_LIST_KEY, 0, 99)

    return id_


async def get_spec(id_: UUID) -> Optional[StoredSweep]:
    key = f"{KEY_PREFIX}{id_}"
    data = await r.get(key)
    if not data:
        return None
    return StoredSweep.parse_raw(data)


async def list_ids() -> List[UUID]:
    keys = await r.keys(f"{KEY_PREFIX}*")
    return [UUID(k.replace(KEY_PREFIX, "")) for k in keys]


async def list_recent_ids(limit: int = 10) -> List[UUID]:
    # Get most recent N IDs from Redis list
    ids = await r.lrange(RECENT_LIST_KEY, 0, limit - 1)
    return [UUID(i) for i in ids]
