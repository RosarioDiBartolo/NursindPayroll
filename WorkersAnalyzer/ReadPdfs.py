import os

from PyPDF2 import PdfReader

tests_path = "Tests/Marche/PDFS"
raw_path = "RawText/"
files = os.listdir(tests_path)

# Create the RawText directory if it doesn't exist
os.makedirs(raw_path, exist_ok=True)

for file in files:
    with open(f"{os.path.join(raw_path, file.split(".")[0])}.txt", 'w') as f:
        print(os.path.join(tests_path,  file) )
        try:
            f.write("\nPAGE\n".join([ page.extract_text() for page in  PdfReader(os.path.join(tests_path,  file)  ).pages ]) )
        except:
            pass


