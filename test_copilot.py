import requests
import base64

# Create a dummy PDF
import fitz
doc = fitz.open()
page = doc.new_page()
page.insert_text((50, 50), "This is a machine learning paper. We use a Random Forest algorithm. We used a dataset of 500 points.")
pdf_bytes = doc.write()
doc.close()

pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')

payload = {
    "pdf_b64": pdf_b64,
    "doi": None,
    "sections": ["all"]
}

try:
    resp = requests.post("http://localhost:8000/process", json=payload)
    print(resp.status_code)
    print(resp.json())
except Exception as e:
    print(e)
