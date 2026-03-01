from sentence_transformers import SentenceTransformer
import numpy as np


class CrimeTextEncoder:

    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.cache = {}

    def encode_unique(self, texts):
        """
        Encode only unique texts and cache results.
        """
        unique_texts = list(set(texts))

        print(f"Unique crime types found: {len(unique_texts)}")

        embeddings = self.model.encode(unique_texts, show_progress_bar=True)

        # Build dictionary mapping text -> embedding
        for text, emb in zip(unique_texts, embeddings):
            self.cache[text] = emb

        # Return embeddings mapped back to original order
        return np.array([self.cache[text] for text in texts])