from fastapi import APIRouter
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import networkx as nx
import store

router = APIRouter()

@router.get("/")
def get_knowledge_graph():
    papers = [p for p in store.papers if "embedding" in p]
    if len(papers) < 2:
        return {"nodes": [], "edges": []}

    embeddings = np.array([p["embedding"] for p in papers])
    sim_matrix = cosine_similarity(embeddings)

    G = nx.Graph()
    for p in papers:
        G.add_node(p["id"], label=p["title"][:60], year=p["year"])

    threshold = 0.5
    for i in range(len(papers)):
        for j in range(i+1, len(papers)):
            sim = float(sim_matrix[i][j])
            if sim > threshold:
                G.add_edge(papers[i]["id"], papers[j]["id"], weight=round(sim, 3))

    nodes = [{"id": n, "label": G.nodes[n]["label"], "year": G.nodes[n]["year"]} for n in G.nodes]
    edges = [{"from": u, "to": v, "weight": d["weight"]} for u, v, d in G.edges(data=True)]

    return {"nodes": nodes, "edges": edges}
