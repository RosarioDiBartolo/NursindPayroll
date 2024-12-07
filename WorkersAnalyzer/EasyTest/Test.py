import os

from WorkersAnalyzer.Core import PDFIterator

def basename(filename):
    return filename.split(".")[0]


def test_on_files():
    tests_path = "../Tests/Pisa"
    files = os.listdir(tests_path)

    for file in files:
        name = basename(file)
        print("Executing:", name)

        yield PDFIterator( os.path.join(tests_path, file) ), name