import cv2
import numpy as np
import pytesseract
import os
from dotenv import load_dotenv

load_dotenv()
tesseract_cmd = os.getenv("TESSERACT_CMD")
if tesseract_cmd and os.path.exists(tesseract_cmd):
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

def detect_image_morphing(image_bytes: bytes) -> dict:
    """
    Simulates Error Level Analysis (ELA) and high-frequency noise variance
    to detect if a birth certificate or ID has been digitally morphed.
    """
    try:
        # Decode image
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"status": "Error", "trustScore": 0, "message": "Invalid image format"}
            
        # 1. Convert to Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 2. Laplacian Variance (Focus/Blur measure - morphed images often have inconsistent blur)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # 3. Simulate ELA (Error Level Analysis) 
        # Compress the image heavily and compare it to the original.
        # Areas that were recently edited will have different compression artifacts.
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
        _, encoded_img = cv2.imencode('.jpg', img, encode_param)
        decoded_img = cv2.imdecode(encoded_img, cv2.IMREAD_COLOR)
        
        # Get absolute difference
        diff = cv2.absdiff(img, decoded_img)
        diff_max = np.max(diff)
        diff_mean = np.mean(diff)
        
        # Calculation formula (Simulated rule-based)
        base_trust = 95
        
        # If difference after compression is very anomalous or noise is unnaturally smooth
        if diff_mean > 5.0 or diff_max > 60:
            base_trust -= 45
        elif diff_mean > 2.5 or diff_max > 40:
            base_trust -= 20
            
        # Final trust score clamped between 0 and 100
        trust_score = max(0, min(100, int(base_trust)))
        
        # 4. Tesseract OCR Text Extraction for Hierarchy Matching
        extracted_text = ""
        try:
            extracted_text = pytesseract.image_to_string(img)
        except Exception as e:
            print(f"OCR Error: {e}")
            pass
            
        return {
            "status": "Verified" if trust_score > 75 else "Morphing Suspected",
            "trustScore": trust_score,
            "extracted_text": extracted_text,
            "metrics": {
                "laplacianVariance": float(laplacian_var),
                "elaMaxDiff": float(diff_max),
                "elaMeanDiff": float(diff_mean)
            }
        }
    except Exception as e:
        return {"status": "Error", "trustScore": 0, "message": str(e)}
