#!/bin/bash
# Script para configurar Host de Análise

echo ">>> Provisionando analysis-host..."
apt-get update
apt-get install -y python3-pip tcpdump

# Instalando as bibliotecas Python necessárias
pip3 install fastapi "uvicorn[standard]" scapy python-multipart