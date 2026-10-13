# Start the HepatoCopilot backend and frontend dev servers in separate terminals
Write-Host "Starting HepatoCopilot backend on http://127.0.0.1:8000 (Python 3.12) ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "py -3.12 -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

Write-Host "Starting HepatoCopilot frontend on http://localhost:5173 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
