from google import genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Error: GEMINI_API_KEY not found in .env file")
else:
    try:
        client = genai.Client(api_key=api_key)

        print("🔍 Listing available models...\n")

        # Just print the model names directly
        for model in client.models.list():
            print(f"👉 {model.name}")

    except Exception as e:
        print(f"❌ Error: {e}")