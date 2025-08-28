from typing import List, Literal, Union
from pydantic import BaseModel, Field
from uuid import UUID


ParamType = Literal['float', 'int', 'enum', 'string']


class Parameter(BaseModel):
	key: str = Field(..., min_length=1)
	type: ParamType
	values: List[Union[float, int, str]]


class SweepSpec(BaseModel):
	name: str
	description: str = ""
	parameters: List[Parameter]


class StoredSweep(SweepSpec):
	id: UUID