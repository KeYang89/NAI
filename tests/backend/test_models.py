import pytest
from pydantic import ValidationError
from uuid import uuid4

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend'))

from app.models import Parameter, SweepSpec, StoredSweep

class TestParameter:
    def test_parameter_creation_valid(self):
        """Test creating a valid parameter"""
        param = Parameter(
            key="test_param",
            type="float",
            values=[1.0, 2.0, 3.0]
        )
        assert param.key == "test_param"
        assert param.type == "float"
        assert param.values == [1.0, 2.0, 3.0]

    def test_parameter_float_type(self):
        """Test parameter with float type"""
        param = Parameter(
            key="angle",
            type="float",
            values=[0.0, 2.5, 5.0, 7.5, 10.0]
        )
        assert param.type == "float"
        assert len(param.values) == 5

    def test_parameter_int_type(self):
        """Test parameter with int type"""
        param = Parameter(
            key="iterations",
            type="int",
            values=[10, 20, 30]
        )
        assert param.type == "int"
        assert all(isinstance(v, int) for v in param.values)

    def test_parameter_enum_type(self):
        """Test parameter with enum type"""
        param = Parameter(
            key="solver",
            type="enum",
            values=["SIMPLE", "PISO", "COUPLED"]
        )
        assert param.type == "enum"
        assert all(isinstance(v, str) for v in param.values)

    def test_parameter_empty_key_invalid(self):
        """Test that empty key is invalid"""
        with pytest.raises(ValidationError):
            Parameter(
                key="",
                type="float",
                values=[1.0, 2.0]
            )

    def test_parameter_invalid_type(self):
        """Test that invalid type raises error"""
        with pytest.raises(ValidationError):
            Parameter(
                key="test",
                type="invalid_type",
                values=[1.0, 2.0]
            )

    def test_parameter_mixed_values(self):
        """Test parameter with mixed value types"""
        param = Parameter(
            key="mixed",
            type="enum",
            values=[1, "string", 3.14]
        )
        # Should work for enum type
        assert len(param.values) == 3

class TestSweepSpec:
    def test_sweep_spec_creation(self):
        """Test creating a valid sweep specification"""
        spec = SweepSpec(
            name="Test Sweep",
            description="A test sweep",
            parameters=[
                Parameter(key="x", type="float", values=[1.0, 2.0]),
                Parameter(key="y", type="int", values=[10, 20])
            ]
        )
        assert spec.name == "Test Sweep"
        assert spec.description == "A test sweep"
        assert len(spec.parameters) == 2

    def test_sweep_spec_empty_description(self):
        """Test sweep spec with empty description (should be allowed)"""
        spec = SweepSpec(
            name="Test",
            description="",
            parameters=[Parameter(key="x", type="float", values=[1.0])]
        )
        assert spec.description == ""

    def test_sweep_spec_no_parameters(self):
        """Test sweep spec with empty parameters list"""
        spec = SweepSpec(
            name="Test",
            description="Test",
            parameters=[]
        )
        assert len(spec.parameters) == 0

    def test_sweep_spec_serialization(self):
        """Test that sweep spec can be serialized to JSON"""
        spec = SweepSpec(
            name="Serialization Test",
            description="Testing JSON serialization",
            parameters=[
                Parameter(key="param1", type="float", values=[1.0, 2.0, 3.0])
            ]
        )
        json_str = spec.json()
        assert "Serialization Test" in json_str
        assert "param1" in json_str

class TestStoredSweep:
    def test_stored_sweep_creation(self):
        """Test creating a stored sweep with ID"""
        test_id = uuid4()
        stored = StoredSweep(
            id=test_id,
            name="Stored Test",
            description="A stored sweep",
            parameters=[Parameter(key="x", type="float", values=[1.0])]
        )
        assert stored.id == test_id
        assert stored.name == "Stored Test"

    def test_stored_sweep_from_sweep_spec(self):
        """Test creating stored sweep from regular sweep spec"""
        spec = SweepSpec(
            name="Base Sweep",
            description="Base description",
            parameters=[Parameter(key="y", type="int", values=[5, 10])]
        )
        test_id = uuid4()
        
        stored = StoredSweep(id=test_id, **spec.dict())
        assert stored.id == test_id
        assert stored.name == spec.name
        assert stored.description == spec.description
        assert len(stored.parameters) == len(spec.parameters)

    def test_stored_sweep_parse_raw(self):
        """Test parsing stored sweep from JSON string"""
        test_id = uuid4()
        stored = StoredSweep(
            id=test_id,
            name="Parse Test",
            description="Parse description",
            parameters=[Parameter(key="z", type="enum", values=["a", "b"])]
        )
        
        json_str = stored.json()
        parsed = StoredSweep.parse_raw(json_str)
        
        assert parsed.id == test_id
        assert parsed.name == "Parse Test"
        assert len(parsed.parameters) == 1
        assert parsed.parameters[0].key == "z"