from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZIP_DEFLATED, ZipFile


REPORT_DIR = Path(__file__).resolve().parents[1] / "report to submit"
REPLACEMENTS = (
    ("Tk 35 impulse beverage", "Tk 20 impulse beverage"),
    ("Enables the Low-Sugar Green Tea line", "Enables the planned Year 2 Low-Sugar Green Tea line"),
    ("Low-sugar Green Tea line", "planned Year 2 Low-sugar Green Tea line"),
    ("stand-up bulk pouches, ", ""),
    ("stand-up bulk pouches", ""),
)


def update_docx(path: Path) -> bool:
    with ZipFile(path) as source:
        xml = source.read("word/document.xml").decode("utf-8")
        updated = xml
        for old, new in REPLACEMENTS:
            updated = updated.replace(old, new)
        if updated == xml:
            return False

        with NamedTemporaryFile(dir=path.parent, suffix=".docx", delete=False) as handle:
            temp_path = Path(handle.name)
        try:
            with ZipFile(temp_path, "w", ZIP_DEFLATED) as target:
                for item in source.infolist():
                    payload = updated.encode("utf-8") if item.filename == "word/document.xml" else source.read(item.filename)
                    target.writestr(item, payload)
            temp_path.replace(path)
        finally:
            temp_path.unlink(missing_ok=True)
    return True


for document in sorted(REPORT_DIR.glob("*.docx")):
    print(f"{'updated' if update_docx(document) else 'unchanged'}: {document.name}")
