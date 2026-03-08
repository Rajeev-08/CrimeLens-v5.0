# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install system dependencies required for OpenCV and OSMnx
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Create directories for caching and temp files
RUN mkdir -p cache temp_videos saved_models

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Run Uvicorn on port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]