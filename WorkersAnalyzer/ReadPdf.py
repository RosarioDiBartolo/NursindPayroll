from Core import PDFIterator

file = "Tests/Marche/PDFS/CARTELLINO_2021_6_FCCMHL85H12H769C.pdf"

pages = list(PDFIterator(file))

print( pages  )