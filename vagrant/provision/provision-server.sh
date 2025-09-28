#!/bin/bash
#Script para configurar Servidor

echo ">>> Provisionando server..."
apt-get update
apt-get install -y nginx vsftpd

