"""
Extract Arabic text from Quran PDF line by line
Outputs a JSON file with the extracted text
"""

import fitz  # PyMuPDF
import json
import re
from pathlib import Path

def extract_pdf_text(pdf_path: str) -> dict:
    """Extract text from PDF and return structured data"""
    doc = fitz.open(pdf_path)
    
    all_lines = []
    total_pages = len(doc)
    
    for page_num in range(total_pages):
        page = doc[page_num]
        text = page.get_text("text")
        
        # Split by lines and filter empty
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        for line in lines:
            all_lines.append({
                "page": page_num + 1,
                "text": line
            })
    
    doc.close()
    
    return {
        "total_pages": total_pages,
        "total_lines": len(all_lines),
        "lines": all_lines
    }

def main():
    pdf_path = Path(__file__).parent / "EntireQuranonOnePage.pdf"
    output_path = Path(__file__).parent / "quran_arabic.json"
    
    print(f"Extracting text from: {pdf_path}")
    
    data = extract_pdf_text(str(pdf_path))
    
    print(f"Extracted {data['total_lines']} lines from {data['total_pages']} pages")
    
    # Save to JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved to: {output_path}")
    
    # Print first 10 lines as sample
    print("\n--- Sample (first 10 lines) ---")
    for line in data['lines'][:10]:
        print(f"Page {line['page']}: {line['text'][:80]}...")

if __name__ == "__main__":
    main()
