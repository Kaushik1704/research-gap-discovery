import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, analysis, graph, insights

app = FastAPI(
    title="AI Research Gap Discovery Platform",
    description="Upload research papers, discover trends, gaps, and future directions using AI.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(graph.router, prefix="/api/graph", tags=["Knowledge Graph"])
app.include_router(insights.router, prefix="/api/insights", tags=["AI Insights"])

@app.get("/")
def root():
    return {"message": "Research Gap Discovery API is running."}
