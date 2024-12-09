from Core import PDFIterator
from backend.WorkersAnalyzer.Extractors.PoliclinicoExtractor import PoliclinicoExtractor

file = "C:\\Users\\Rosario\\Downloads\\2013 PARZ.pdf"

pages = list(PDFIterator(file))

PoliclinicoExtractor( pages[0] ).read()