import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4, UUID

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend'))

from app.storage import save_spec, get_spec, list_ids, list_recent_ids
from app.models import SweepSpec, Parameter, StoredSweep

class TestStorage:
    
    @pytest.mark.asyncio
    async def test_save_spec(self, sample_sweep_spec, mock_redis):
        """Test saving a sweep specification"""
        # Mock Redis operations
        with patch('app.storage.r', mock_redis):
            result_id = await save_spec(sample_sweep_spec)
            
            # Verify UUID was returned
            assert isinstance(result_id, UUID)
            
            # Verify Redis operations were called
            mock_redis.set.assert_called_once()
            mock_redis.lpush.assert_called_once_with("sweeps:recent", str(result_id))
            mock_redis.ltrim.assert_called_once_with("sweeps:recent", 0, 99)
            
            # Verify the stored data structure
            call_args = mock_redis.set.call_args
            stored_key = call_args[0][0]
            assert stored_key.startswith("sweep:")
            assert str(result_id) in stored_key

    @pytest.mark.asyncio
    async def test_get_spec_exists(self, sample_stored_sweep, mock_redis):
        """Test retrieving an existing specification"""
        # Setup mock to return JSON data
        mock_redis.get.return_value = sample_stored_sweep.json()
        
        with patch('app.storage.r', mock_redis):
            result = await get_spec(sample_stored_sweep.id)
            
            # Verify result
            assert result is not None
            assert result.id == sample_stored_sweep.id
            assert result.name == sample_stored_sweep.name
            assert len(result.parameters) == len(sample_stored_sweep.parameters)
            
            # Verify Redis was called correctly
            expected_key = f"sweep:{sample_stored_sweep.id}"
            mock_redis.get.assert_called_once_with(expected_key)

    @pytest.mark.asyncio
    async def test_get_spec_not_exists(self, mock_redis):
        """Test retrieving a non-existent specification"""
        # Setup mock to return None
        mock_redis.get.return_value = None
        test_id = uuid4()
        
        with patch('app.storage.r', mock_redis):
            result = await get_spec(test_id)
            
            # Verify result is None
            assert result is None
            
            # Verify Redis was called
            expected_key = f"sweep:{test_id}"
            mock_redis.get.assert_called_once_with(expected_key)

    @pytest.mark.asyncio
    async def test_list_ids(self, mock_redis):
        """Test listing all specification IDs"""
        # Setup mock data
        test_ids = [str(uuid4()), str(uuid4()), str(uuid4())]
        mock_keys = [f"sweep:{id_}" for id_ in test_ids]
        mock_redis.keys.return_value = mock_keys
        
        with patch('app.storage.r', mock_redis):
            result = await list_ids()
            
            # Verify results
            assert len(result) == 3
            assert all(isinstance(id_, UUID) for id_ in result)
            
            # Convert back to strings for comparison
            result_strs = [str(id_) for id_ in result]
            assert set(result_strs) == set(test_ids)
            
            # Verify Redis was called
            mock_redis.keys.assert_called_once_with("sweep:*")

    @pytest.mark.asyncio
    async def test_list_recent_ids_default_limit(self, mock_redis):
        """Test listing recent IDs with default limit"""
        # Setup mock data
        test_ids = [str(uuid4()) for _ in range(5)]
        mock_redis.lrange.return_value = test_ids
        
        with patch('app.storage.r', mock_redis):
            result = await list_recent_ids()
            
            # Verify results
            assert len(result) == 5
            assert all(isinstance(id_, UUID) for id_ in result)
            
            # Verify Redis was called with default limit
            mock_redis.lrange.assert_called_once_with("sweeps:recent", 0, 9)  # limit-1

    @pytest.mark.asyncio
    async def test_list_recent_ids_custom_limit(self, mock_redis):
        """Test listing recent IDs with custom limit"""
        # Setup mock data
        test_ids = [str(uuid4()) for _ in range(3)]
        mock_redis.lrange.return_value = test_ids
        
        with patch('app.storage.r', mock_redis):
            result = await list_recent_ids(limit=3)
            
            # Verify results
            assert len(result) == 3
            
            # Verify Redis was called with custom limit
            mock_redis.lrange.assert_called_once_with("sweeps:recent", 0, 2)  # limit-1

    @pytest.mark.asyncio
    async def test_list_recent_ids_empty(self, mock_redis):
        """Test listing recent IDs when list is empty"""
        mock_redis.lrange.return_value = []
        
        with patch('app.storage.r', mock_redis):
            result = await list_recent_ids()
            
            # Verify empty result
            assert len(result) == 0
            assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_save_and_retrieve_integration(self, sample_sweep_spec, mock_redis):
        """Test integration of save and retrieve operations"""
        stored_data = None
        
        # Mock Redis set to capture stored data
        def capture_set(key, value):
            nonlocal stored_data
            stored_data = value
            return AsyncMock()
        
        mock_redis.set.side_effect = capture_set
        
        with patch('app.storage.r', mock_redis):
            # Save the spec
            saved_id = await save_spec(sample_sweep_spec)
            
            # Setup mock get to return the captured data
            mock_redis.get.return_value = stored_data
            
            # Retrieve the spec
            retrieved = await get_spec(saved_id)
            
            # Verify data integrity
            assert retrieved is not None
            assert retrieved.id == saved_id
            assert retrieved.name == sample_sweep_spec.name
            assert retrieved.description == sample_sweep_spec.description
            assert len(retrieved.parameters) == len(sample_sweep_spec.parameters)

class TestStorageEdgeCases:
    
    @pytest.mark.asyncio
    async def test_get_spec_invalid_json(self, mock_redis):
        """Test handling of corrupted JSON data"""
        mock_redis.get.return_value = "invalid json data"
        test_id = uuid4()
        
        with patch('app.storage.r', mock_redis):
            with pytest.raises(Exception):  # Should raise JSON parsing error
                await get_spec(test_id)

    @pytest.mark.asyncio
    async def test_save_spec_complex_parameters(self, mock_redis):
        """Test saving spec with complex parameter combinations"""
        complex_spec = SweepSpec(
            name="Complex Test",
            description="Testing complex parameters",
            parameters=[
                Parameter(key="floats", type="float", values=[1.1, 2.2, 3.3, 4.4, 5.5]),
                Parameter(key="ints", type="int", values=list(range(10))),
                Parameter(key="enums", type="enum", values=["alpha", "beta", "gamma", "delta"])
            ]
        )
        
        with patch('app.storage.r', mock_redis):
            result_id = await save_spec(complex_spec)
            assert isinstance(result_id, UUID)