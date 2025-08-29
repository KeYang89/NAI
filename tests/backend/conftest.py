import pytest
import asyncio
import redis.asyncio as redis
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from uuid import uuid4

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend'))

from app.main import app
from app.models import SweepSpec, Parameter, StoredSweep

@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)

@pytest.fixture
def sample_parameter():
    """Sample parameter for testing"""
    return Parameter(
        key="angle_of_attack",
        type="float",
        values=[0.0, 2.5, 5.0]
    )

@pytest.fixture
def sample_sweep_spec():
    """Sample sweep specification for testing"""
    return SweepSpec(
        name="Test Sweep",
        description="Test description",
        parameters=[
            Parameter(key="angle", type="float", values=[0, 5, 10]),
            Parameter(key="speed", type="int", values=[20, 40, 60]),
            Parameter(key="model", type="enum", values=["k-epsilon", "k-omega"])
        ]
    )

@pytest.fixture
def sample_stored_sweep():
    """Sample stored sweep for testing"""
    test_id = uuid4()
    return StoredSweep(
        id=test_id,
        name="Test Sweep",
        description="Test description",
        parameters=[
            Parameter(key="angle", type="float", values=[0, 5, 10])
        ]
    )

@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    mock_redis = AsyncMock()
    mock_redis.set = AsyncMock()
    mock_redis.get = AsyncMock()
    mock_redis.keys = AsyncMock()
    mock_redis.lpush = AsyncMock()
    mock_redis.ltrim = AsyncMock()
    mock_redis.lrange = AsyncMock()
    return mock_redis

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()