"""
Simple test script for the Speech Emotion Recognition API
Run this after starting the API server to test the endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8080/api"


def pretty_print_speaking_style(predictions):
    """Print the speaking_style summary if present."""
    speaking_style = predictions.get("speaking_style")
    if not speaking_style:
        print("speaking_style: (not present in response)")
        return

    label = speaking_style.get("label")
    score = speaking_style.get("score")
    features = speaking_style.get("features", {})

    print("\n=== Speaking Style Analysis ===")
    print(f"Label       : {label}")
    print(f"Score       : {score:.3f}" if isinstance(score, (int, float)) else f"Score       : {score}")
    print("Features:")
    for k, v in features.items():
        if isinstance(v, (int, float)):
            print(f"  - {k}: {v:.5f}")
        else:
            print(f"  - {k}: {v}")
    print("================================\n")


def test_health_check():
    """Test health check endpoint"""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception:
        print("Response body is not valid JSON.")
        print(response.text)
    print()


def test_predict(test_file="record_out.wav"):
    """Test prediction endpoint"""
    print(f"Testing prediction with {test_file}...")
    try:
        with open(test_file, "rb") as f:
            files = {"file": (test_file, f, "audio/wav")}
            data = {
                "model_type": "mfccs",
                "emotions_3": "true",
                "emotions_6": "true",
                "emotions_7": "false",
                "gender": "true"
            }
            response = requests.post(f"{BASE_URL}/predict", files=files, data=data)
            print(f"Status: {response.status_code}")

            # If server returned non-JSON or error
            try:
                resp_json = response.json()
            except Exception:
                print("Response body is not valid JSON.")
                print(response.text)
                print()
                return

            print(f"Full JSON response:\n{json.dumps(resp_json, indent=2)}\n")

            # Extract and pretty print speaking_style if present
            preds = resp_json.get("predictions", {})
            pretty_print_speaking_style(preds)

    except FileNotFoundError:
        print(f"Error: {test_file} not found. Skipping test.")
    except Exception as e:
        print(f"Error: {e}")
    print()


if __name__ == "__main__":
    print("=" * 50)
    print("Speech Emotion Recognition API Test")
    print("=" * 50)
    print()

    # Test health check
    try:
        test_health_check()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to API. Make sure the server is running on http://localhost:8080")
        print("Start the server with: python main.py")
        exit(1)

    # Test prediction (with speaking_style)
    test_predict()

    print("=" * 50)
    print("Tests completed!")
    print("=" * 50)
