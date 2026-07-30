@echo off
rem Avvia il sito UnipiOrienta in locale (nessuna connessione necessaria).
rem Doppio click: apre il browser su http://localhost:8090.
rem Per fermare il server: CTRL+C in questa finestra (o chiudila).
cd /d "%~dp0"
echo Sito (grafica manifesto) su http://localhost:8091 - CTRL+C per fermare.
start "" http://localhost:8091
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8091
) else (
  py -m http.server 8091
)
