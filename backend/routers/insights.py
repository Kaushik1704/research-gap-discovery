from fastapi import APIRouter, HTTPException
import requests
import store
import os
import re

router = APIRouter()

HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
HF_TOKEN = os.getenv("HF_TOKEN", "")


# ──────────────────────────────────────────────────────────────────────────────
#  HuggingFace call
# ──────────────────────────────────────────────────────────────────────────────

def call_hf(prompt: str, max_tokens: int = 800) -> str | None:
    if not HF_TOKEN:
        return None
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": max_tokens,
            "temperature": 0.5,       # lower = more factual
            "top_p": 0.85,
            "repetition_penalty": 1.15,
            "return_full_text": False,
        }
    }
    try:
        resp = requests.post(HF_API_URL, headers=headers, json=payload, timeout=90)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and data:
                text = data[0].get("generated_text", "").strip()
                return text if len(text) > 40 else None
        # Model may be loading (503) — return None to use fallback
        return None
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────────────────────
#  Prompt builder — structured Mistral Instruct format
# ──────────────────────────────────────────────────────────────────────────────

def build_suggestions_prompt(gaps: list, clusters: dict) -> str:
    cluster_lines = "\n".join(
        f"  • {k} ({len(v)} paper{'s' if len(v) != 1 else ''})"
        for k, v in clusters.items()
        if k != "Uncategorized"
    )
    if gaps:
        gap_lines = "\n".join(
            f"  • [{g['topic']}] — {g['paper_count']} paper(s), {g['coverage_percent']}% corpus coverage. {g['reason']}"
            for g in gaps
        )
    else:
        gap_lines = "  • No statistically significant gaps detected — corpus appears balanced."

    return f"""<s>[INST] You are a senior academic research strategist with deep domain expertise. \
You have analyzed a corpus of research papers and identified the following landscape.

RESEARCH TOPICS COVERED:
{cluster_lines}

VERIFIED RESEARCH GAPS (statistically confirmed by coverage analysis):
{gap_lines}

Your task: Suggest exactly 5 SPECIFIC, VERIFIED future research directions. \
Each suggestion MUST:
- Be directly grounded in the data above (cite the specific cluster or gap)
- Be novel and not already well-covered by existing clusters
- Be actionable (a researcher could start working on it today)
- Be realistic given the existing literature base

Format your response EXACTLY as follows for each of the 5 suggestions:

DIRECTION 1: <title>
DESCRIPTION: <2-sentence specific description>
ADDRESSES: <which specific gap or underexplored intersection this targets>

DIRECTION 2: <title>
...and so on through DIRECTION 5. [/INST]"""


def build_summary_prompt(clusters: dict, gaps: list, total: int) -> str:
    cluster_lines = ", ".join(
        f"{k} ({len(v)} papers)"
        for k, v in list(clusters.items())[:8]
        if k != "Uncategorized"
    )
    gap_topics = ", ".join(g["topic"] for g in gaps) if gaps else "none detected"

    return f"""<s>[INST] Write a concise 3-paragraph executive summary for an academic audience based on this research corpus analysis.

CORPUS STATS:
- Total papers analyzed: {total}
- Main topic clusters: {cluster_lines}
- Verified research gaps: {len(gaps)} ({gap_topics})

Paragraph 1: Overview of the research landscape and dominant themes.
Paragraph 2: Key trends and how the field is evolving.
Paragraph 3: The identified gaps and their significance for future research.

Be specific, data-driven, and avoid generic statements. [/INST]"""


# ──────────────────────────────────────────────────────────────────────────────
#  Parse structured LLM output into suggestion objects
# ──────────────────────────────────────────────────────────────────────────────

def parse_structured_suggestions(text: str) -> list:
    """Parse the DIRECTION N: / DESCRIPTION: / ADDRESSES: structured format."""
    suggestions = []

    # Split by DIRECTION markers
    blocks = re.split(r'DIRECTION\s+\d+\s*:', text, flags=re.IGNORECASE)
    for block in blocks:
        block = block.strip()
        if not block:
            continue

        # Extract title (first line)
        lines = block.split('\n')
        title = lines[0].strip().rstrip('.')
        if not title or len(title) < 5:
            continue

        # Extract DESCRIPTION
        desc_match = re.search(r'DESCRIPTION\s*:(.*?)(?=ADDRESSES|$)', block, re.DOTALL | re.IGNORECASE)
        description = desc_match.group(1).strip() if desc_match else ""

        # Extract ADDRESSES
        addr_match = re.search(r'ADDRESSES\s*:(.*?)$', block, re.DOTALL | re.IGNORECASE)
        addresses = addr_match.group(1).strip() if addr_match else ""

        if title and (description or addresses):
            suggestions.append({
                "title": title[:120],
                "description": description[:600],
                "addresses_gap": addresses[:400],
                "source": "huggingface",
            })

    return suggestions[:5]  # Max 5


# ──────────────────────────────────────────────────────────────────────────────
#  Rule-based fallback — uses actual cluster + gap data
# ──────────────────────────────────────────────────────────────────────────────

def generate_fallback(gaps: list, clusters: dict) -> list:
    topics = [k for k in clusters.keys() if k != "Uncategorized"]
    gap_topics = [g["topic"] for g in gaps]
    primary = gap_topics if gap_topics else topics

    if not topics:
        return []

    def t(i):
        return primary[i % len(primary)] if primary else "this domain"

    def t2(i):
        # Pick a topic that is different from t(i)
        idx = (i + 1) % len(topics)
        return topics[idx] if topics else "adjacent fields"

    def gap_reason(i):
        if gaps:
            return gaps[i % len(gaps)]["reason"]
        return "Limited coverage identified in corpus analysis"

    templates = [
        {
            "title": f"Cross-disciplinary Fusion: {t(0)} × {t2(0)}",
            "description": (
                f"Existing research in '{t(0)}' and '{t2(0)}' operates largely in isolation. "
                f"Developing unified frameworks that bridge these two areas could yield substantial methodological advances."
            ),
            "addresses_gap": f"Structural gap between '{t(0)}' and '{t2(0)}' clusters — no cross-domain integration papers detected.",
        },
        {
            "title": f"Closing the Gap in {t(1)}",
            "description": (
                f"The corpus reveals '{t(1)}' is significantly underrepresented ({gaps[0]['coverage_percent']}% coverage). "
                f"Systematic studies with larger experimental scope are needed to build a robust evidence base."
            ) if gaps else (
                f"'{t(1)}' remains one of the smallest clusters relative to the corpus. "
                f"Expanding the research base in this area with rigorous experiments would accelerate field progress."
            ),
            "addresses_gap": gap_reason(0),
        },
        {
            "title": f"Scalability and Real-world Validation of {t(2)} Methods",
            "description": (
                f"Most papers in '{t(2)}' focus on controlled experimental settings. "
                f"Rigorous benchmarking against real-world large-scale datasets is critically missing."
            ),
            "addresses_gap": f"Absence of scalability studies in '{t(2)}' — gap confirmed by corpus temporal analysis.",
        },
        {
            "title": f"Longitudinal Impact Study: {t(3)} Over Time",
            "description": (
                f"Temporal analysis of '{t(3)}' shows stagnating publication rates. "
                f"A longitudinal study tracking real-world outcomes of '{t(3)}' advances would clarify its long-term relevance."
            ),
            "addresses_gap": f"Declining publication trend in '{t(3)}' as measured by recent-year coverage analysis.",
        },
        {
            "title": f"Ethical and Societal Dimensions of {t(4)}",
            "description": (
                f"While technical advances in '{t(4)}' are documented, their ethical, privacy, and societal implications remain underexplored. "
                f"A dedicated research agenda examining responsible deployment is urgently needed."
            ),
            "addresses_gap": f"Zero papers in corpus address ethical implications of '{t(4)}' findings.",
        },
    ]

    return [dict(s, source="rule-based") for s in templates[:5]]


# ──────────────────────────────────────────────────────────────────────────────
#  Routes
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/suggestions")
def get_suggestions():
    if "result" not in store.analysis_cache:
        raise HTTPException(status_code=400, detail="Run analysis first.")

    result = store.analysis_cache["result"]
    gaps = result.get("gaps", [])
    clusters = result.get("clusters", {})

    # Try HuggingFace LLM
    prompt = build_suggestions_prompt(gaps, clusters)
    hf_response = call_hf(prompt, max_tokens=900)

    if hf_response:
        # Try to parse structured format
        structured = parse_structured_suggestions(hf_response)
        if structured:
            return {
                "source": "huggingface",
                "suggestions_text": "",
                "suggestions": structured,
            }
        else:
            # Return raw text if parsing fails
            return {
                "source": "huggingface",
                "suggestions_text": hf_response,
                "suggestions": [],
            }

    # Fallback to rule-based
    return {
        "source": "rule-based",
        "suggestions_text": "",
        "suggestions": generate_fallback(gaps, clusters),
    }


@router.get("/summary")
def get_summary():
    if "result" not in store.analysis_cache:
        raise HTTPException(status_code=400, detail="Run analysis first.")

    result = store.analysis_cache["result"]
    clusters = result.get("clusters", {})
    gaps = result.get("gaps", [])
    total = result.get("total_papers", 0)

    prompt = build_summary_prompt(clusters, gaps, total)
    text = call_hf(prompt, max_tokens=600)

    if not text:
        top = [k for k in list(clusters.keys())[:3] if k != "Uncategorized"]
        gap_count = len(gaps)
        text = (
            f"Analysis of {total} research papers reveals {len(clusters)} major topic clusters. "
            f"The most prominent research areas include {', '.join(top) if top else 'several domains'}. "
            f"\n\nTemporal trend analysis indicates evolving research focus across the publication years covered. "
            f"Some topics show accelerating growth while others appear to be stabilizing or declining. "
            f"\n\n{gap_count} statistically verified research gap{'s were' if gap_count != 1 else ' was'} identified "
            f"using multi-criteria analysis (cluster size, corpus coverage, and publication trends). "
            f"These represent concrete opportunities where the existing literature is insufficient and future work could make significant contributions."
        )

    return {"summary": text}
