# Shared in-memory store for uploaded papers and analysis results
papers = []        # List of { id, filename, title, abstract, year, text, embedding }
analysis_cache = {}  # Cached results: clusters, trends, gaps, suggestions
