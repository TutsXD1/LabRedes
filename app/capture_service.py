import time
import json
import threading
from collections import defaultdict, deque
from scapy.all import sniff, IP, TCP, UDP

# Configurações
NETWORK_PREFIX = "192.168.100."
INTERFACE = "enp0s8"
WINDOW_SECONDS = 5
AGGREGATED_OUTPUT_FILE = "/tmp/traffic_data.json"
HISTORY_OUTPUT_FILE = "/tmp/packet_history.json"

# Estruturas de Dados em memória
current_window = defaultdict(lambda: {"in": 0, "out": 0, "protocols": defaultdict(int)})
# Para guardar os últimos 100 pacotes.
packet_history = deque(maxlen=100)

def process_packet(packet):
    """Processa um único pacote, atualiza a janela atual E o histórico de pacotes."""
    if IP in packet and \
       packet[IP].src.startswith(NETWORK_PREFIX) and \
       packet[IP].dst.startswith(NETWORK_PREFIX):
        
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        size = len(packet)
        protocol = "OTHER"
        if TCP in packet:
            protocol = "TCP"
        elif UDP in packet:
            protocol = "UDP"

        # Adiciona um resumo do pacote ao histórico
        packet_info = {
            "timestamp": time.strftime('%H:%M:%S'),
            "src": src_ip,
            "dst": dst_ip,
            "proto": protocol,
            "size": size
        }
        packet_history.appendleft(packet_info) # Adiciona no início da lista

        # Atualiza a janela de agregação
        current_window[src_ip]["out"] += size
        current_window[dst_ip]["in"] += size
        current_window[src_ip]["protocols"][f"out_{protocol}"] += size
        current_window[dst_ip]["protocols"][f"in_{protocol}"] += size

def capture_and_aggregate():
    """Função principal que roda em loop, agora salvando dois arquivos."""
    global current_window
    
    sniffer_thread = threading.Thread(
        target=lambda: sniff(iface=INTERFACE, prn=process_packet, store=False),
        daemon=True
    )
    sniffer_thread.start()
    print(f"[*] Captura iniciada em {INTERFACE}...")

    while True:
        print(f"Aguardando {WINDOW_SECONDS} segundos para agregar...")
        time.sleep(WINDOW_SECONDS)
        
        data_to_write = dict(current_window)
        history_to_write = list(packet_history)
        current_window.clear()
        
        try:
            # Salva os dados agregados para o gráfico
            with open(AGGREGATED_OUTPUT_FILE, 'w') as f:
                json.dump(data_to_write, f)
            
            # Salva o histórico de pacotes para o log
            with open(HISTORY_OUTPUT_FILE, 'w') as f:
                json.dump(history_to_write, f)

            if data_to_write:
                print(f"Dados agregados e histórico salvos. IPs vistos: {list(data_to_write.keys())}")
            else:
                print("Nenhum tráfego relevante na última janela.")
        except Exception as e:
            print(f"Erro ao salvar arquivos: {e}")

if _name_ == "_main_":
    capture_and_aggregate()