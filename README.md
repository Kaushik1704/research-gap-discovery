# 🔬 ResearchLens — AI Research Gap Discovery Platform

Upload research papers. Let AI find the gaps.

For the implementation-level model pipeline, parameters, formulas, limitations, and references, see [Model and Analysis Technical Details](docs/model-and-analysis-details.md).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, HTML5, CSS3, JavaScript |
| Charts | Recharts (area + line charts) |
| Graph | vis-network (interactive knowledge graph) |
| Backend | FastAPI + Python |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Clustering | BERTopic |
| Similarity | Cosine similarity + NetworkX |
| LLM | HuggingFace Inference API (Mistral-7B) |
| PDF parsing | pdfplumber |

---

## Setup Instructions

### 1. Clone / extract the project

```
research-gap-discovery/
├── backend/
│   ├── main.py
│   ├── store.py
│   ├── requirements.txt
│   ├── .env
│   └── routers/
│       ├── upload.py
│       ├── analysis.py
│       ├── graph.py
│       └── insights.py
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── styles/global.css
        ├── utils/api.js
        ├── components/Sidebar.js
        └── pages/
            ├── Dashboard.js
            ├── Upload.js
            ├── Clusters.js
            ├── Trends.js
            ├── Gaps.js
            ├── KnowledgeGraph.js
            └── Insights.js
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Linux/Mac
venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Add HuggingFace token (optional but recommended)
# Edit .env and paste your token from https://huggingface.co/settings/tokens
# HF_TOKEN=hf_xxxxxxxxxxxxxxxx

# Start the backend
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

---

### 3. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Start dev server
npm start
```

Frontend runs at: http://localhost:3000

---

### 4. HuggingFace Token (for AI suggestions)

1. Create a free account at https://huggingface.co
2. Go to Settings → Access Tokens → New Token
3. Paste it in `backend/.env` as `HF_TOKEN=hf_...`
4. Restart the backend

Without a token, the app still works — it falls back to rule-based suggestions.

---

## How to Use

1. **Upload** — Go to "Upload Papers", drag and drop PDF research papers
2. **Analyze** — Click "Run AI Analysis" (takes 30–120 seconds depending on paper count)
3. **Explore Clusters** — See which papers group together by topic
4. **View Trends** — Check how topics evolved over years
5. **Find Gaps** — See which areas are underexplored
6. **Knowledge Graph** — Visually explore paper similarity connections
7. **AI Insights** — Get LLM-generated future research suggestions

---

## Notes

- Minimum 2 papers required to run analysis
- Recommended: 10–100 papers for best results
- The first analysis may take time to download the sentence-transformer model (~90MB)
- All processing is local except the HuggingFace API call for LLM suggestions
