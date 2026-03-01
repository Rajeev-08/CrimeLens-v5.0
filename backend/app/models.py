# backend/app/models.py
from pydantic import BaseModel
from typing import List

class FilterPayload(BaseModel):
    areas: List[str]
    crimes: List[str]
    severities: List[str]

class HotspotPayload(FilterPayload):
    n_clusters: int