# Speech Emotion Recognition API Service

This is a REST API service for Speech Emotion Recognition, converted from a Streamlit web application. The API provides endpoints to analyze audio files and predict emotions and gender.

## Features

- **Emotion Recognition**: Predict emotions from audio files (3, 6, or 7 emotion categories)
- **Gender Prediction**: Predict gender from audio files
- **Audio Feature Extraction**: Extract MFCCs and mel-spectrogram features
- **Visualization**: Generate polar plot visualizations of emotion predictions

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

## Installation

1. **Navigate to the API service directory:**
   ```bash
   cd "api service"
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   
   **On Windows:**
   ```bash
   venv\Scripts\activate
   ```
   
   **On Linux/Mac:**
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the API Service

1. **Make sure you're in the "api service" directory and your virtual environment is activated**

2. **Start the server:**
   ```bash
   python main.py
   ```
   
   Or using Flask directly:
   ```bash
   flask run --host 0.0.0.0 --port 8080
   ```

3. **The API will be available at:**
   - Base URL: `http://localhost:8080`
   - Health Check: `http://localhost:8080/api/health`

## API Endpoints

All endpoints are prefixed with `/api/`

### 1. Health Check
- **GET** `/api/health`
- Check if the API is running
- **Response:**
  ```json
  {
    "status": "healthy",
    "message": "Speech Emotion Recognition API is running"
  }
  ```

### 2. Main Prediction Endpoint
- **POST** `/api/predict`
- Predict emotions and/or gender from audio file
- **Parameters (form data):**
  - `file`: Audio file (wav, mp3, ogg) - required
  - `model_type`: "mfccs" or "mel-specs" (default: "mfccs")
  - `emotions_3`: "true" or "false" (default: "true") - Predict 3 emotions
  - `emotions_6`: "true" or "false" (default: "true") - Predict 6 emotions
  - `emotions_7`: "true" or "false" (default: "false") - Predict 7 emotions
  - `gender`: "true" or "false" (default: "false") - Predict gender
- **Example using curl:**
  ```bash
  curl -X POST "http://localhost:8080/api/predict" \
    -F "file=@test.wav" \
    -F "emotions_3=true" \
    -F "emotions_6=true" \
    -F "gender=true"
  ```

### 3. Emotions Only Prediction
- **POST** `/api/predict/emotions`
- Predict only emotions (3, 6, or 7)
- **Parameters (form data):**
  - `file`: Audio file - required
  - `num_emotions`: integer (3, 6, or 7) - default: 6
- **Example:**
  ```bash
  curl -X POST "http://localhost:8080/api/predict/emotions" \
    -F "file=@test.wav" \
    -F "num_emotions=6"
  ```

### 4. Gender Only Prediction
- **POST** `/api/predict/gender`
- Predict only gender
- **Parameters (form data):**
  - `file`: Audio file - required
- **Example:**
  ```bash
  curl -X POST "http://localhost:8080/api/predict/gender" \
    -F "file=@test.wav"
  ```

### 5. Audio Features Analysis
- **POST** `/api/analyze/features`
- Extract audio features (MFCCs, mel-spectrogram)
- **Parameters (form data):**
  - `file`: Audio file - required
- **Example:**
  ```bash
  curl -X POST "http://localhost:8080/api/analyze/features" \
    -F "file=@test.wav"
  ```

### 6. Polar Plot Visualization
- **POST** `/api/visualize/polar`
- Generate polar plot visualization of emotion predictions
- **Parameters (form data):**
  - `file`: Audio file - required
  - `num_emotions`: integer (3, 6, or 7) - default: 6
- **Response:** Base64 encoded PNG image
- **Example:**
  ```bash
  curl -X POST "http://localhost:8080/api/visualize/polar" \
    -F "file=@test.wav" \
    -F "num_emotions=6"
  ```

## Emotion Categories

### 3 Emotions
- positive
- neutral
- negative

### 6 Emotions
- fear
- angry
- neutral
- happy
- sad
- surprise

### 7 Emotions
- fear
- disgust
- neutral
- happy
- sad
- surprise
- angry

## Response Format

### Successful Prediction Response:
```json
{
  "success": true,
  "message": "Prediction completed successfully",
  "file_name": "test.wav",
  "predictions": {
    "emotions_6": {
      "emotion": "happy",
      "confidence": 0.85,
      "predictions": {
        "fear": 0.05,
        "angry": 0.02,
        "neutral": 0.03,
        "happy": 0.85,
        "sad": 0.03,
        "surprise": 0.02
      }
    },
    "gender": {
      "gender": "female",
      "confidence": 0.92,
      "predictions": {
        "female": 0.92,
        "male": 0.08
      }
    }
  }
}
```

## Testing the API

A test script is included to verify the API is working:

```bash
python test_api.py
```

This will test the health check and prediction endpoints.

## Using Python Requests

```python
import requests

# Predict emotions
url = "http://localhost:8080/api/predict"
files = {"file": open("test.wav", "rb")}
data = {
    "emotions_3": "true",
    "emotions_6": "true",
    "emotions_7": "false",
    "gender": "true"
}

response = requests.post(url, files=files, data=data)
result = response.json()
print(result)
```

## Using JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('emotions_6', 'true');
formData.append('gender', 'true');

fetch('http://localhost:8080/api/predict', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## File Requirements

- **Supported formats**: WAV, MP3, OGG
- **Maximum file size**: 4MB
- **Sample rate**: Automatically resampled to 44100 Hz

## Troubleshooting

### Port Already in Use
If port 8080 is already in use, you can change it:
```python
# In main.py, change the last line:
app.run(host="0.0.0.0", port=8081, debug=False)  # Use different port
```

Or set it as an environment variable:
```bash
# Windows
set FLASK_RUN_PORT=8081
python main.py

# Linux/Mac
export FLASK_RUN_PORT=8081
python main.py
```

### Model Loading Errors
Make sure all model files (`.h5` files) are in the "api service" directory:
- `model3.h5`
- `model4.h5`
- `model_mw.h5`
- `tmodel_all.h5` (optional, for mel-spectrogram)

### Audio Processing Errors
- Ensure the audio file is not corrupted
- Check that the file format is supported (wav, mp3, ogg)
- Verify the file size is under 4MB

## Notes

- The API automatically cleans up uploaded audio files after processing
- The first request may take longer as models are loaded into memory
- For production use, consider adding authentication and rate limiting
- The mel-spectrogram model (`tmodel_all.h5`) is optional and only needed for mel-spec predictions

## License

This API service is converted from the original Streamlit application.

