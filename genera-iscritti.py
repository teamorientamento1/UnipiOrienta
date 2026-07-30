#!/usr/bin/env python3
"""Genera data/data_iscritti.json (impronte SHA-256) dai codici fiscali degli iscritti.

Uso:
  python genera-iscritti.py risposte.xlsx     # export Excel di Microsoft Forms
  python genera-iscritti.py risposte.csv      # oppure CSV
  python genera-iscritti.py elenco.txt        # oppure un CF per riga
  python genera-iscritti.py                   # senza argomenti: svuota la lista

Lo script accetta qualsiasi file di testo (o .xlsx) che contenga i codici
fiscali: estrae tutto cio' che ha la forma di un CF, elimina i duplicati,
calcola l'impronta SHA-256 di ogni CF in maiuscolo e scrive l'array JSON
ordinato in data/data_iscritti.json. Nel file pubblicato non finisce nessun
CF in chiaro.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

# Forma del codice fiscale, incluse le lettere di omocodia al posto delle cifre
# e le sole lettere valide per il mese (ABCDEHLMPRST).
CF_RE = re.compile(
    r'\b[A-Za-z]{6}[0-9LMNPQRSTUVlmnpqrstuv]{2}[ABCDEHLMPRSTabcdehlmprst]'
    r'[0-9LMNPQRSTUVlmnpqrstuv]{2}[A-Za-z][0-9LMNPQRSTUVlmnpqrstuv]{3}[A-Za-z]\b'
)

OUT = Path(__file__).resolve().parent / 'data' / 'data_iscritti.json'


def leggi_testo(percorso: str) -> str:
    p = Path(percorso)
    if not p.exists():
        sys.exit(f"File non trovato: {p}")
    if p.suffix.lower() == '.xlsx':
        try:
            import openpyxl
        except ImportError:
            sys.exit("Per leggere .xlsx serve openpyxl (pip install openpyxl), "
                     "oppure salva l'export come CSV e ripassa quello.")
        wb = openpyxl.load_workbook(p, read_only=True)
        celle = []
        for ws in wb.worksheets:
            for riga in ws.iter_rows(values_only=True):
                celle.extend(str(c) for c in riga if c is not None)
        return '\n'.join(celle)
    return p.read_text(encoding='utf-8', errors='replace')


def main() -> None:
    if len(sys.argv) < 2:
        OUT.write_text('[]\n', encoding='utf-8')
        print(f"Nessun file di input: lista svuotata -> {OUT}")
        return

    testo = '\n'.join(leggi_testo(a) for a in sys.argv[1:])
    cfs = sorted({m.group(0).upper() for m in CF_RE.finditer(testo)})
    if not cfs:
        sys.exit("Nessun codice fiscale riconosciuto nell'input: lista NON aggiornata.")

    impronte = sorted(hashlib.sha256(cf.encode('ascii')).hexdigest() for cf in cfs)
    OUT.write_text(json.dumps(impronte, indent=1) + '\n', encoding='utf-8')
    print(f"{len(cfs)} codici fiscali unici -> {len(impronte)} impronte scritte in {OUT}")


if __name__ == '__main__':
    main()
