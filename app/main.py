import json
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JsonResponse


app = FastAPI()

AGGREGATED_DATA_FILE = "/tmp/traffic_data.json"
HISTORIC_DATA_FILE = "/tmp/packet_history.json"


app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

@app.get("/api/traffic-data")
async def get_traffic_data():
    """Endpoint para os dados do gráfico."""
    try:
        with open(AGGREGATED_DATA_FILE, 'r') as f:
            data = json.load(f)
        return data
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

@app.get("/api/packet-history")
async def get_packet_history():
    """Novo endpoint para servir o histórico de pacotes."""
    try:
        with open(HISTORY_DATA_FILE, 'r') as f:
            data = json.load(f)
        return data
    except (FileNotFoundError, json.JSONDecodeError):
        return [] # Retorna uma lista vazia se não houver histórico