
from Core import PDFIterator
from backend.WorkersAnalyzer.Extractors.MarcheExtractor import MarcheExtractor

file = "C:\\Users\\Rosario\\Downloads\\CARTELLINO_2021_6_FCCMHL85H12H769C.pdf"

pages = list(PDFIterator(file))

extractor = MarcheExtractor(pages[0])


