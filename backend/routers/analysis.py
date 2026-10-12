from fastapi import APIRouter, HTTPException
from sentence_transformers import SentenceTransformer
from bertopic import BERTopic
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
import numpy as np
import store

router = APIRouter()

model = SentenceTransformer('all-MiniLM-L6-v2')

# ──────────────────────────────────────────────────────────────────────────────
#  Academic stop-words for cleaner topic labels
# ──────────────────────────────────────────────────────────────────────────────
LABEL_STOP_WORDS = {
    "this", "that", "with", "from", "paper", "study", "research", "results",
    "using", "based", "proposed", "model", "method", "data", "analysis",
    "show", "approach", "work", "system", "novel", "also", "their", "which",
    "these", "have", "been", "used", "each", "both", "more", "than", "such",
    "into", "then", "over", "through", "where", "while", "when", "will",
    "high", "large", "small", "different", "various", "task", "tasks",
    "performance", "evaluation", "experiment", "experiments", "result",
    "effective", "efficient", "existing", "improve", "improved", "achieve",
    "text", "corpus", "cluster", "evidence", "provide", "provides", "methods",
    "abstract", "introduction", "conclusion", "keyword", "keywords",
}


def clean_label(words: list) -> str:
    """Generate a meaningful topic label from BERTopic word list."""
    filtered = [
        w[0] for w in words
        if len(w[0]) > 3
        and w[0].lower() not in LABEL_STOP_WORDS
        and w[0].isalpha()
    ]
    top = filtered[:3] if filtered else [w[0] for w in words[:3]]
    return " / ".join(top).title()


def enforce_minimum_cluster_size(topics: list, embeddings: np.ndarray) -> list:
    """Merge singleton topics into their nearest established semantic cluster."""
    members = defaultdict(list)
    for index, topic_id in enumerate(topics):
        members[topic_id].append(index)

    established = {topic_id: indexes for topic_id, indexes in members.items() if len(indexes) >= 2}
    if not established:
        cluster_count = max(1, min(6, len(topics) // 2))
        fallback_topics = KMeans(n_clusters=cluster_count, random_state=42, n_init=10).fit_predict(embeddings).tolist()
        return enforce_minimum_cluster_size(fallback_topics, embeddings)

    centroids = {
        topic_id: embeddings[indexes].mean(axis=0)
        for topic_id, indexes in established.items()
    }
    adjusted = list(topics)
    for topic_id, indexes in members.items():
        if len(indexes) >= 2:
            continue
        index = indexes[0]
        nearest_topic = max(
            centroids,
            key=lambda candidate: float(cosine_similarity(
                embeddings[index].reshape(1, -1), centroids[candidate].reshape(1, -1)
            )[0, 0]),
        )
        adjusted[index] = nearest_topic
    return adjusted


def build_cluster_details(clusters: dict, cluster_indices: dict, texts: list, embeddings: np.ndarray) -> dict:
    """Build interpretable cluster evidence from corpus terms and semantic links."""
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=3000,
            token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z-]{2,}\b",
        )
        tfidf = vectorizer.fit_transform(texts)
        vocabulary = vectorizer.get_feature_names_out()
    except ValueError:
        tfidf = None
        vocabulary = []

    details = {}
    similarity_threshold = 0.45
    for label, papers in clusters.items():
        indexes = cluster_indices[label]
        keywords = []
        if tfidf is not None:
            term_scores = np.asarray(tfidf[indexes].mean(axis=0)).ravel()
            ranked_terms = term_scores.argsort()[::-1]
            keywords = [
                str(vocabulary[term_index])
                for term_index in ranked_terms
                if term_scores[term_index] > 0
                and not any(word in LABEL_STOP_WORDS for word in vocabulary[term_index].split())
            ][:8]

        similarities = cosine_similarity(embeddings[indexes])
        possible_pairs = len(indexes) * (len(indexes) - 1) // 2
        adjacency = {paper["id"]: set() for paper in papers}
        links = []
        pair_scores = []
        for left in range(len(indexes)):
            for right in range(left + 1, len(indexes)):
                score = float(similarities[left, right])
                pair_scores.append(score)
                if score >= similarity_threshold:
                    source = papers[left]
                    target = papers[right]
                    adjacency[source["id"]].add(target["id"])
                    adjacency[target["id"]].add(source["id"])
                    links.append({
                        "source_id": source["id"],
                        "source_title": source["title"],
                        "target_id": target["id"],
                        "target_title": target["title"],
                        "similarity": round(score, 3),
                    })

        visited = set()
        component_sizes = []
        for paper_id in adjacency:
            if paper_id in visited:
                continue
            stack = [paper_id]
            visited.add(paper_id)
            component_size = 0
            while stack:
                current = stack.pop()
                component_size += 1
                for neighbor in adjacency[current] - visited:
                    visited.add(neighbor)
                    stack.append(neighbor)
            component_sizes.append(component_size)

        strongest_pair = max(links, key=lambda link: link["similarity"], default=None)
        if strongest_pair is None and possible_pairs:
            best_pair = max(
                ((left, right) for left in range(len(indexes)) for right in range(left + 1, len(indexes))),
                key=lambda pair: similarities[pair],
            )
            strongest_pair = {
                "source_id": papers[best_pair[0]]["id"],
                "source_title": papers[best_pair[0]]["title"],
                "target_id": papers[best_pair[1]]["id"],
                "target_title": papers[best_pair[1]]["title"],
                "similarity": round(float(similarities[best_pair]), 3),
            }

        centrality = (similarities.sum(axis=1) - 1.0) / max(1, len(indexes) - 1)
        representative = papers[int(np.argmax(centrality))]
        years = [paper["year"] for paper in papers if isinstance(paper.get("year"), int)]
        year_distribution = []
        for year in sorted(set(years)):
            year_distribution.append({"year": year, "papers": years.count(year)})

        connected_pairs = len(links)
        density = connected_pairs / possible_pairs if possible_pairs else 0.0
        if len(component_sizes) == 1:
            connectivity_explanation = (
                f"All {len(papers)} papers form one connected component using the "
                f"{similarity_threshold:.2f} cosine-similarity threshold."
            )
        else:
            connectivity_explanation = (
                f"At the {similarity_threshold:.2f} cosine-similarity threshold, this cluster separates into "
                f"{len(component_sizes)} connected components. Papers in different components "
                "share the assigned topic but do not have a direct above-threshold link."
            )

        details[label] = {
            "keywords": keywords,
            "paper_count": len(papers),
            "method": "all-MiniLM-L6-v2 semantic embeddings with corpus TF-IDF terms",
            "year_range": f"{min(years)}–{max(years)}" if years else "Not available",
            "year_distribution": year_distribution,
            "representative_paper": {
                "id": representative["id"],
                "title": representative["title"],
                "mean_similarity": round(float(np.max(centrality)), 3),
            },
            "connectivity": {
                "threshold": similarity_threshold,
                "connected_pairs": connected_pairs,
                "possible_pairs": possible_pairs,
                "density": round(density, 3),
                "mean_similarity": round(float(np.mean(pair_scores)), 3) if pair_scores else 1.0,
                "components": len(component_sizes),
                "largest_component_size": max(component_sizes, default=0),
                "explanation": connectivity_explanation,
                "strongest_pair": strongest_pair,
                "strongest_links": sorted(links, key=lambda link: link["similarity"], reverse=True)[:12],
            },
        }
    return details


# ──────────────────────────────────────────────────────────────────────────────
#  Gap detection
# ──────────────────────────────────────────────────────────────────────────────

def detect_gaps(clusters: dict, total: int) -> list:
    """
    Rigorous gap detection with multiple validated criteria.
    A gap must satisfy ALL of:
    1. Absolute minimum: at least 1 paper (not phantom topic)
    2. Relative size: significantly smaller than main cluster
    3. Low corpus coverage: < 12% of total
    4. Publication trend: no papers in recent 3 years OR fewer recent than older
    5. Minimum corpus size guard: only flag gaps when we have enough data
    """
    if total < 4:
        # Not enough papers to reliably detect gaps
        return []

    gaps = []
    cluster_sizes = {label: len(papers) for label, papers in clusters.items()
                     if label != "Uncategorized"}

    if not cluster_sizes:
        return []

    max_size = max(cluster_sizes.values())
    median_size = sorted(cluster_sizes.values())[len(cluster_sizes) // 2]

    # Dynamic threshold: a cluster must be meaningfully smaller than the median
    # and the corpus must be large enough to make this meaningful
    size_threshold = max(1, min(median_size * 0.4, max_size * 0.25))
    coverage_threshold = 0.12  # 12% cap

    for label, papers_in_cluster in clusters.items():
        if label == "Uncategorized":
            continue

        cluster_size = len(papers_in_cluster)
        if cluster_size == 0:
            continue

        coverage = cluster_size / total

        # Must be small in absolute and relative terms
        if cluster_size > size_threshold or coverage >= coverage_threshold:
            continue

        # Temporal check: check for stagnation/decline
        years = [p["year"] for p in papers_in_cluster if isinstance(p.get("year"), int)]
        if not years:
            continue

        # Use the median year of all papers as a dynamic pivot
        all_years_all_papers = [
            p["year"] for cluster_papers in clusters.values()
            for p in cluster_papers if isinstance(p.get("year"), int)
        ]
        pivot_year = sorted(all_years_all_papers)[len(all_years_all_papers) // 2] if all_years_all_papers else 2020

        recent = [y for y in years if y >= pivot_year]
        old = [y for y in years if y < pivot_year]

        # Must have stagnating or declining trend
        is_stagnant = len(recent) == 0 or len(recent) <= len(old)
        if not is_stagnant:
            continue

        # Compute a gap confidence score for ordering
        confidence = (
            (1 - coverage / coverage_threshold) * 0.5 +
            (1 - cluster_size / max(size_threshold, 1)) * 0.3 +
            (1.0 if len(recent) == 0 else 0.2) * 0.2
        )

        year_range = f"{min(years)}–{max(years)}" if len(set(years)) > 1 else str(years[0])
        trend_desc = (
            "No papers published in recent years" if len(recent) == 0
            else f"Publication rate declining — {len(recent)} recent vs {len(old)} older paper(s)"
        )

        gaps.append({
            "topic": label,
            "paper_count": cluster_size,
            "coverage_percent": round(coverage * 100, 1),
            "year_range": year_range,
            "confidence": round(confidence, 2),
            "reason": (
                f"Only {cluster_size} paper(s) ({round(coverage * 100, 1)}% of corpus) vs "
                f"dominant cluster with {max_size} papers. {trend_desc}. "
                f"Publication span: {year_range}."
            )
        })

    # Sort by confidence, then by coverage ascending (smallest first)
    gaps.sort(key=lambda g: (-g["confidence"], g["coverage_percent"]))
    return gaps


# ──────────────────────────────────────────────────────────────────────────────
#  Main analysis function
# ──────────────────────────────────────────────────────────────────────────────

def run_analysis():
    if len(store.papers) < 2:
        raise HTTPException(status_code=400, detail="Upload at least 2 papers to run analysis.")

    # Use abstract if available; otherwise first 600 chars of text
    texts = []
    for p in store.papers:
        abstract = (p.get("abstract") or "").strip()
        texts.append(abstract if len(abstract) > 80 else p["text"][:600])

    embeddings = model.encode(texts, show_progress_bar=False)

    for i, p in enumerate(store.papers):
        p["embedding"] = embeddings[i].tolist()

    n_papers = len(texts)

    # ── Clustering ──
    topic_labels = {}
    topics = []

    try:
        # BERTopic works best with ≥10 documents; use KMeans for small sets
        if n_papers < 8:
            raise ValueError("Too few papers for BERTopic — using KMeans")

        # Target enough topics to reflect diversity: at least 2, at most min(8, n//3)
        n_topics = min(8, max(2, n_papers // 3))
        topic_model = BERTopic(nr_topics=n_topics, verbose=False, min_topic_size=2)
        topics, _ = topic_model.fit_transform(texts, embeddings)
        topics = [int(t) for t in topics]

        for topic_id in set(topics):
            if topic_id == -1:
                topic_labels[topic_id] = "Uncategorized"
            else:
                words = topic_model.get_topic(topic_id)
                if words:
                    topic_labels[topic_id] = clean_label(words)
                else:
                    topic_labels[topic_id] = f"Topic {topic_id + 1}"

        # If BERTopic collapsed everything to 1 real topic, fall through to KMeans
        real_topics = [t for t in set(topics) if t != -1]
        if len(real_topics) < 2:
            raise ValueError("BERTopic produced only 1 real topic — using KMeans")

    except Exception:
        # KMeans fallback — target n//2 clusters (more granular), at least 2, cap at 8
        k = min(max(2, n_papers // 2), 8)
        k = min(k, n_papers)  # can't have more clusters than papers
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        topics = km.fit_predict(embeddings).tolist()
        topic_labels = {i: f"Cluster {i + 1}" for i in range(k)}

    topics = enforce_minimum_cluster_size(topics, embeddings)

    # ── Build cluster dict ──
    clusters = defaultdict(list)
    cluster_indices = defaultdict(list)
    for i, paper in enumerate(store.papers):
        topic_id = topics[i]
        label = topic_labels.get(topic_id, f"Topic {topic_id}")
        clusters[label].append({
            "id": paper["id"],
            "title": paper["title"],
            "year": paper["year"],
            "abstract": (paper.get("abstract") or "")[:1200],
        })
        cluster_indices[label].append(i)

    cluster_details = build_cluster_details(dict(clusters), cluster_indices, texts, embeddings)
    label_mapping = {}
    used_labels = set()
    for label, detail in cluster_details.items():
        evidence_label = label
        if label.startswith("Cluster ") or label.startswith("Topic "):
            terms = detail["keywords"][:3]
            if terms:
                evidence_label = " / ".join(term.title() for term in terms)
        candidate = evidence_label
        suffix = 2
        while candidate in used_labels:
            candidate = f"{evidence_label} ({suffix})"
            suffix += 1
        used_labels.add(candidate)
        label_mapping[label] = candidate

    if any(old_label != new_label for old_label, new_label in label_mapping.items()):
        clusters = {label_mapping[label]: papers for label, papers in clusters.items()}
        cluster_indices = {label_mapping[label]: indexes for label, indexes in cluster_indices.items()}
        cluster_details = {label_mapping[label]: detail for label, detail in cluster_details.items()}
        topic_labels = {
            topic_id: label_mapping.get(label, label)
            for topic_id, label in topic_labels.items()
        }

    # ── Trend detection ──
    # Collect all topic labels across ALL papers first, then build per-year rows
    # with explicit 0 for any topic absent in that year — ensures every series
    # appears in all chart rows regardless of which year it first occurs.
    year_topic: dict = defaultdict(lambda: defaultdict(int))
    all_topic_labels_seen: set = set()
    for i, paper in enumerate(store.papers):
        topic_id = topics[i]
        label = topic_labels.get(topic_id, f"Topic {topic_id}")
        all_topic_labels_seen.add(label)
        year_topic[paper["year"]][label] += 1

    trends = []
    for year in sorted(year_topic.keys()):
        entry = {"year": year}
        for label in sorted(all_topic_labels_seen):  # stable ordering
            entry[label] = year_topic[year].get(label, 0)
        trends.append(entry)

    # ── Gap detection ──
    gaps = detect_gaps(dict(clusters), n_papers)

    # Attach the papers in each gap's cluster for the comparison view in the UI
    for gap in gaps:
        gap["cluster_papers"] = clusters.get(gap["topic"], [])

    result = {
        "clusters": dict(clusters),
        "cluster_details": cluster_details,
        "trends": trends,
        "gaps": gaps,
        "topic_labels": list(clusters.keys()),
        "total_papers": n_papers,
    }
    store.analysis_cache["result"] = result
    return result


# ──────────────────────────────────────────────────────────────────────────────
#  Routes
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/run")
def run():
    return run_analysis()


@router.get("/clusters")
def get_clusters():
    if "result" not in store.analysis_cache:
        return run_analysis()
    result = store.analysis_cache["result"]
    return {
        "clusters": result["clusters"],
        "details": result.get("cluster_details", {}),
        "total_papers": result.get("total_papers", 0),
    }


@router.get("/trends")
def get_trends():
    if "result" not in store.analysis_cache:
        run_analysis()
    return store.analysis_cache["result"]["trends"]


@router.get("/gaps")
def get_gaps():
    if "result" not in store.analysis_cache:
        run_analysis()
    return store.analysis_cache["result"]["gaps"]
