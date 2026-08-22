"""Minimal dependency-free .xlsx reader.

An xlsx is a zip of XML. We need exactly two things: the shared-string table and the
cell values of one sheet, in row/column order. No styles, no formulas, no dates --
every value comes back as the string the file stores, which is what a composition
source must be quoted as anyway.
"""
import re
import zipfile
from xml.etree import ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def sheet_names(path):
    """[(name, sheet_xml_path)] in workbook order."""
    z = zipfile.ZipFile(path)
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid2tgt = {r.get("Id"): r.get("Target") for r in rels}
    out = []
    for sh in wb.iter(NS + "sheet"):
        tgt = rid2tgt.get(sh.get(RNS + "id"), "")
        tgt = tgt if tgt.startswith("xl/") else "xl/" + tgt.lstrip("/")
        out.append((sh.get("name"), tgt))
    return out


def _shared(z):
    try:
        raw = z.read("xl/sharedStrings.xml")
    except KeyError:
        return []
    root = ET.fromstring(raw)
    vals = []
    for si in root.iter(NS + "si"):
        vals.append("".join(t.text or "" for t in si.iter(NS + "t")))
    return vals


def _col(ref):
    """'BC12' -> 54 (0-based column index)."""
    letters = re.match(r"([A-Z]+)", ref).group(1)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def rows(path, sheet_name, limit=None):
    """Yield each row as a list of strings, blank-padded to the widest cell seen."""
    z = zipfile.ZipFile(path)
    tgt = dict(sheet_names(path))[sheet_name]
    shared = _shared(z)
    out = []
    for _, el in ET.iterparse(z.open(tgt), events=("end",)):
        if el.tag != NS + "row":
            continue
        cells = {}
        for c in el.iter(NS + "c"):
            ref, typ = c.get("r"), c.get("t")
            v = c.find(NS + "v")
            if typ == "s" and v is not None:
                txt = shared[int(v.text)]
            elif typ == "inlineStr":
                txt = "".join(t.text or "" for t in c.iter(NS + "t"))
            else:
                txt = v.text if v is not None else ""
            cells[_col(ref)] = txt or ""
        width = (max(cells) + 1) if cells else 0
        out.append([cells.get(i, "") for i in range(width)])
        el.clear()
        if limit and len(out) >= limit:
            break
    return out
