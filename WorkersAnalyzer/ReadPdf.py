
from Core import PDFIterator
from backend.WorkersAnalyzer.Extractors.PoliclinicoExtractor import PoliclinicoExtractor

file = "C:\\Users\\Rosario\\Downloads\\2013 PARZ.pdf"

pages = list(PDFIterator(file))

df = PoliclinicoExtractor(pages[0]).data

