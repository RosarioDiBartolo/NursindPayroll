from Core import PDFIterator

file = "C:\\Users\\Rosario\\Downloads\\2013 PARZ.pdf"

pages = list(PDFIterator(file))

print( pages  )