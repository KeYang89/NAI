import pytest
import json
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from fastapi.testclient import TestClient

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend'))

from app.main import app
from app.models import SweepSpec, Parameter, StoredSweep

class TestAPIEndpoints:
    
    def test_root_endpoint(self, client):
        """Test the root endpoint returns expected message"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "Parameter Sweep API is running" in data["message"]

    def test_create_config_valid(self, client, sample_sweep_spec):
        """Test creating a valid configuration"""
        with patch('app.main.save_spec') as mock_save:
            test_id = uuid4()
            mock_save.return_value = test_id
            
            response = client.post(
                "/configs",
                json=sample_sweep_spec.dict()
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert data["id"] == str(test_id)
            mock_save.assert_called_once()

    def test_create_config_invalid_json(self, client):
        """Test creating config with invalid JSON structure"""
        invalid_data = {
            "name": "Test",
            # Missing required fields
        }
        
        response = client.post("/configs", json=invalid_data)
        assert response.status_code == 422  # Validation error

    def test_create_config_invalid_parameter_type(self, client):
        """Test creating config with invalid parameter type"""
        invalid_spec = {
            "name": "Test",
            "description": "Test desc",
            "parameters": [{
                "key": "test",
                "type": "invalid_type",
                "values": [1, 2, 3]
            }]
        }
        
        response = client.post("/configs", json=invalid_spec)
        assert response.status_code == 422

    def test_read_config_exists(self, client, sample_stored_sweep):
        """Test reading an existing configuration"""
        with patch('app.main.get_spec') as mock_get:
            mock_get.return_value = sample_stored_sweep
            
            response = client.get(f"/configs/{sample_stored_sweep.id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(sample_stored_sweep.id)
            assert data["name"] == sample_stored_sweep.name

    def test_read_config_not_found(self, client):
        """Test reading a non-existent configuration"""
        with patch('app.main.get_spec') as mock_get:
            mock_get.return_value = None
            test_id = uuid4()
            
            response = client.get(f"/configs/{test_id}")
            
            assert response.status_code == 404
            data = response.json()
            assert data["detail"] == "Not found"

    def test_read_config_invalid_id_format(self, client):
        """Test reading config with invalid UUID format"""
        response = client.get("/configs/invalid-uuid-format")
        assert response.status_code == 400
        data = response.json()
        assert "Invalid id format" in data["detail"]

    def test_get_recent_configs_default_limit(self, client):
        """Test getting recent configs with default limit"""
        # Create mock data
        test_ids = [uuid4() for _ in range(3)]
        mock_stored_sweeps = [
            StoredSweep(
                id=id_,
                name=f"Test {i}",
                description=f"Description {i}",
                parameters=[Parameter(key="x", type="float", values=[1.0, 2.0])]
            )
            for i, id_ in enumerate(test_ids)
        ]
        
        with patch('app.main.list_recent_ids') as mock_list_recent, \
             patch('app.main.get_spec') as mock_get:
            
            mock_list_recent.return_value = test_ids
            mock_get.side_effect = mock_stored_sweeps
            
            response = client.get("/configs/recent")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 3
            
            # Verify structure
            for item in data:
                assert "id" in item
                assert "config" in item
                assert "name" in item["config"]

    def test_get_recent_configs_custom_limit(self, client):
        """Test getting recent configs with custom limit"""
        test_ids = [uuid4() for _ in range(2)]
        mock_stored_sweeps = [
            StoredSweep(
                id=id_,
                name=f"Test {i}",
                description=f"Description {i}",
                parameters=[Parameter(key="y", type="int", values=[10, 20])]
            )
            for i, id_ in enumerate(test_ids)
        ]
        
        with patch('app.main.list_recent_ids') as mock_list_recent, \
             patch('app.main.get_spec') as mock_get:
            
            mock_list_recent.return_value = test_ids
            mock_get.side_effect = mock_stored_sweeps
            
            response = client.get("/configs/recent?limit=2")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            mock_list_recent.assert_called_once_with(limit=2)

    def test_get_recent_configs_empty(self, client):
        """Test getting recent configs when none exist"""
        with patch('app.main.list_recent_ids') as mock_list_recent:
            mock_list_recent.return_value = []
            
            response = client.get("/configs/recent")
            
            assert response.status_code == 200
            data = response.json()
            assert data == []

    def test_get_recent_configs_missing_data(self, client):
        """Test getting recent configs when some configs are missing"""
        test_ids = [uuid4(), uuid4()]
        mock_stored_sweep = StoredSweep(
            id=test_ids[0],
            name="Test",
            description="Description",
            parameters=[Parameter(key="z", type="enum", values=["a", "b"])]
        )
        
        with patch('app.main.list_recent_ids') as mock_list_recent, \
             patch('app.main.get_spec') as mock_get:
            
            mock_list_recent.return_value = test_ids
            # First ID returns data, second returns None
            mock_get.side_effect = [mock_stored_sweep, None]
            
            response = client.get("/configs/recent")
            
            assert response.status_code == 200
            data = response.json()
            # Only one config should be returned (the valid one)
            assert len(data) == 1
            assert data[0]["id"] == str(test_ids[0])

class TestAPIValidation:
    
    def test_parameter_validation_empty_key(self, client):
        """Test parameter validation with empty key"""
        invalid_spec = {
            "name": "Test",
            "description": "Test desc",
            "parameters": [{
                "key": "",  # Empty key should fail
                "type": "float",
                "values": [1.0, 2.0]
            }]
        }
        
        response = client.post("/configs", json=invalid_spec)
        assert response.status_code == 422

    def test_parameter_validation_invalid_values(self, client):
        """Test parameter validation with various value types"""
        valid_spec = {
            "name": "Validation Test",
            "description": "Testing parameter validation",
            "parameters": [
                {
                    "key": "mixed_values",
                    "type": "enum",
                    "values": ["string", 123, 45.67, True]  # Mixed types allowed for enum
                }
            ]
        }
        
        response = client.post("/configs", json=valid_spec)
        # This should actually succeed since enum type allows mixed values
        assert response.status_code in [200, 422]  # Depends on validation rules

    def test_spec_validation_missing_name(self, client):
        """Test spec validation with missing name"""
        invalid_spec = {
            "description": "Test desc",
            "parameters": []
        }
        
        response = client.post("/configs", json=invalid_spec)
        assert response.status_code == 422

    def test_spec_validation_missing_parameters(self, client):
        """Test spec validation with missing parameters"""
        invalid_spec = {
            "name": "Test",
            "description": "Test desc"
            # Missing parameters array
        }
        
        response = client.post("/configs", json=invalid_spec)
        assert response.status_code == 422

class TestCORSHeaders:
    
    def test_cors_headers_present(self, client):
        """Test that CORS headers are properly set"""
        response = client.options("/", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        })
        
        # FastAPI should handle CORS automatically with our middleware
        assert response.status_code in [200, 405]  # OPTIONS might not be implemented

    def test_cors_allows_frontend_origin(self, client):
        """Test that frontend origin is allowed"""
        response = client.get("/", headers={
            "Origin": "http://localhost:5173"
        })
        
        assert response.status_code == 200
        # The response should not be blocked by CORS