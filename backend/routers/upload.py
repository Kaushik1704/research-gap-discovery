from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import pdfplumber
import uuid
import re
import store

router = APIRouter()

# ──────────────────────────────────────────────────────────────────────────────
#  PDF extraction
# ──────────────────────────────────────────────────────────────────────────────

def extract_metadata_and_text(file_bytes: bytes):
    import io
    text = ""
    metadata = {}
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        metadata = pdf.metadata or {}
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    return metadata, text.strip()


def extract_year(text: str, metadata: dict) -> int:
    """
    Multi-strategy year extraction with confidence scoring.
    Priority: explicit publication markers > front-page context > metadata > fallback.
    Deliberately avoids PDF CreationDate (reflects export time, not publication).
    """
    current_year_limit = 2025

    # Strategy 1: Explicit publication markers in text (highest confidence)
    # These patterns appear near the actual publication year in academic papers
    pub_patterns = [
        r'(?:©|\bCopyright\b)\s*(?:\d{4}\s*)?([A-Za-z\s&,]+)?\s*((?:19|20)\d{2})',  # © 2023 IEEE
        r'\bPublished\s+(?:in|by|on)?\s*:?\s*(?:\w+\s+){0,5}((?:19|20)\d{2})\b',    # Published: 2022
        r'\bReceived\s*:?\s*\w+\s+\d+[,\s]+((?:19|20)\d{2})\b',                      # Received: Jan 2023
        r'\bAccepted\s*:?\s*\w+\s+\d+[,\s]+((?:19|20)\d{2})\b',                      # Accepted: 2023
        r'\bProceedings\s+of\b.{0,80}((?:19|20)\d{2})\b',                            # Proceedings of ... 2022
        r'\bConference\s+on\b.{0,80}((?:19|20)\d{2})\b',                             # Conference on ... 2023
        r'\bJournal\b.{0,80}\bVol(?:ume)?\b.{0,30}((?:19|20)\d{2})\b',              # Journal Vol. ... 2021
        r'\bISSN\b.{0,50}((?:19|20)\d{2})\b',                                        # ISSN ... 2022
        r'\bDOI\b\s*:?\s*.+?((?:19|20)\d{2})\b',                                     # DOI: 10.xxx/2022.xxx
        r'\barXiv\s*:\s*(?:(?:19|20)\d{2})\.\d+\b',                                  # arXiv: 2023.12345
        r'\bSubmitted\b.{0,60}((?:19|20)\d{2})\b',                                   # Submitted ... 2022
    ]

    # Only search the first 3000 characters for publication markers
    front = text[:3000]
    candidate_years = []

    for pattern in pub_patterns:
        matches = re.findall(pattern, front, re.IGNORECASE)
        for m in matches:
            # m could be a tuple from groups or a string
            year_str = m if isinstance(m, str) else (m[-1] if m else '')
            try:
                y = int(re.search(r'((?:19|20)\d{2})', str(year_str)).group(1))
                if 1990 <= y <= current_year_limit:
                    candidate_years.append(y)
            except Exception:
                pass

    if candidate_years:
        # Take the most recent plausible year from explicit markers
        return max(candidate_years)

    # Strategy 2: arXiv ID in text or metadata (very reliable)
    arxiv_match = re.search(r'arXiv[:\s]+?((?:19|20)\d{2})\.\d{4,5}', text[:2000], re.IGNORECASE)
    if arxiv_match:
        y = int(arxiv_match.group(1))
        if 1990 <= y <= current_year_limit:
            return y

    # Strategy 3: Year prominently appearing on first page only (not from references)
    # Split off the first page content (approximated as first 2000 chars)
    first_page = text[:2000]
    all_years = re.findall(r'\b((?:19|20)\d{2})\b', first_page)
    plausible = [int(y) for y in all_years if 1990 <= int(y) <= current_year_limit]

    if plausible:
        from collections import Counter
        # Weight toward more recent years found multiple times
        counts = Counter(plausible)
        # Prefer years appearing multiple times; if tie, take highest (most likely pub year)
        top = counts.most_common(3)
        # If the top year appears >= 2 times, trust it
        if top[0][1] >= 2:
            return top[0][0]
        # Otherwise take the most recent year on front page
        return max(plausible)

    # Strategy 4: Metadata ModDate (more reliable than CreationDate for scanned docs)
    if metadata:
        for key in ['ModDate', 'xmp:ModifyDate', 'xmpMM:ModifyDate']:
            val = metadata.get(key, '')
            if val:
                m = re.search(r'((?:19|20)\d{2})', str(val))
                if m:
                    y = int(m.group(1))
                    if 1990 <= y <= current_year_limit:
                        return y

    return 2020  # final fallback


def extract_title(text: str, metadata: dict, filename: str) -> str:
    """
    Multi-strategy title extraction. Prefers text content over unreliable PDF metadata.
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    # Strategy 1: Look for a long, title-cased line near the top that isn't a header noise
    skip_patterns = re.compile(
        r'^(abstract|introduction|keywords|index terms|received|accepted|doi|issn|'
        r'vol\.|volume|issue|page|journal|conference|proceedings|copyright|©|arxiv)',
        re.IGNORECASE
    )
    for line in lines[:20]:
        if (15 < len(line) < 220
                and not skip_patterns.match(line)
                and not re.match(r'^\d', line)          # doesn't start with a number
                and not re.match(r'^[A-Z]{2,}\s*$', line)   # not all-caps acronym
                and line.count(' ') >= 2):               # at least 3 words
            return line

    # Strategy 2: PDF metadata Title (fallback — often garbage but sometimes useful)
    if metadata:
        title = str(metadata.get('Title', '')).strip()
        if 10 < len(title) < 220 and not title.lower().startswith("untitled"):
            return title

    # Strategy 3: Filename cleaned up
    return filename.replace('.pdf', '').replace('_', ' ').replace('-', ' ').title()


def extract_abstract(text: str) -> str:
    """
    Robust abstract extraction using regex boundary detection.
    """
    # Pattern 1: Explicit "Abstract" header followed by content, ending at next section
    match = re.search(
        r'(?i)\babstract\b[\s\n\-—:]{0,10}(.*?)(?=\n\s*(?:1[\.\s]|I[\.\s]|\bIntroduction\b|\bKeywords\b|\bIndex Terms\b|\bBackground\b|\bMotivation\b|\bRelated Work\b))',
        text, re.DOTALL
    )
    if match:
        chunk = match.group(1).strip()
        # Remove leading/trailing noise and validate length
        chunk = re.sub(r'\s+', ' ', chunk)
        if 80 < len(chunk) < 3500:
            return chunk

    # Pattern 2: Simpler find + boundary
    lower = text.lower()
    start = lower.find('abstract')
    if start != -1:
        content_start = start + 8
        # Skip whitespace/punctuation after "abstract"
        while content_start < len(text) and text[content_start] in ' \n\r:-—':
            content_start += 1

        # Find the next major section boundary
        boundaries = ['introduction', '1 introduction', '1. introduction', 'keywords', 'index terms']
        end = content_start + 2000
        for boundary in boundaries:
            idx = lower.find(boundary, content_start + 50)
            if idx != -1 and idx < end:
                end = idx

        chunk = text[content_start:end].strip()
        chunk = re.sub(r'\s+', ' ', chunk)
        if 80 < len(chunk) < 3500:
            return chunk

    # Fallback: first substantial block of text
    return re.sub(r'\s+', ' ', text[:1200]).strip()


# ──────────────────────────────────────────────────────────────────────────────
#  Routes
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/papers")
async def upload_papers(files: List[UploadFile] = File(...)):
    uploaded = []
    for file in files:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF.")
        contents = await file.read()
        metadata, text = extract_metadata_and_text(contents)
        if not text:
            continue
        paper = {
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "title": extract_title(text, metadata, file.filename),
            "abstract": extract_abstract(text),
            "year": extract_year(text, metadata),
            "text": text[:6000],
        }
        store.papers.append(paper)
        uploaded.append({"id": paper["id"], "title": paper["title"], "year": paper["year"]})
    store.analysis_cache.clear()
    return {"uploaded": len(uploaded), "papers": uploaded}


@router.get("/papers")
def list_papers():
    return [{"id": p["id"], "title": p["title"], "year": p["year"], "filename": p["filename"]} for p in store.papers]


@router.delete("/papers")
def clear_papers():
    store.papers.clear()
    store.analysis_cache.clear()
    return {"message": "All papers cleared."}
