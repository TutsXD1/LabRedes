# Dashboard de Análise de Tráfego de Rede em Tempo Real

## Sobre o Projeto

Este projeto consiste em um sistema completo de captura e visualização de tráfego de rede, desenvolvido como parte da disciplina de Redes de Computadores. A aplicação utiliza um ambiente virtualizado com Vagrant para simular uma rede local e um host de análise dedicado que captura pacotes em modo promíscuo.

[cite_start]O dashboard web exibe em tempo real o volume de dados enviados e recebidos por cada máquina na rede, agregando as informações em janelas de 5 segundos[cite: 7]. [cite_start]Além disso, implementa funcionalidades avançadas como a visualização do tráfego total, um histórico de pacotes e uma análise detalhada (*drill down*) por protocolo para cada host[cite: 8, 18].


## Funcionalidades Principais

- **Visualização em Tempo Real:** Gráfico de barras dinâmico que se atualiza a cada 5 segundos sem a necessidade de recarregar a página.
- **Análise por Host:** Exibição do volume de tráfego de entrada (`in`) e saída (`out`) para cada IP ativo na rede interna.
- [cite_start]**Drill Down por Protocolo:** Ao clicar na barra de um IP, o gráfico muda para uma visualização de pizza, detalhando o tráfego daquele host por protocolo (TCP, UDP, etc.)[cite: 18].
- **Painel de Métricas:** Mostra o volume total de dados trafegados na rede na última janela de tempo.
- **Histórico de Pacotes:** Um log com rolagem que exibe os detalhes dos últimos 100 pacotes capturados para uma análise mais detalhada.

## Arquitetura

O ambiente é totalmente gerenciado pelo **Vagrant** e **VirtualBox**, consistindo em 5 máquinas virtuais em uma rede privada (`192.168.100.0/24`):

- **1 Host de Análise (`analysis-host`):** Única VM com acesso à internet. Roda a aplicação de captura (Scapy), o servidor de API (FastAPI) e o frontend. Sua interface de rede privada opera em **modo promíscuo** para capturar todo o tráfego da rede.
- **1 Servidor-Alvo (`server`):** Roda serviços como Nginx e FTP para atuar como um ponto de interesse na rede.
- **3 Clientes (`client-xx`):** VMs simples utilizadas para gerar tráfego contra o servidor.

## Tecnologias Utilizadas

- **Infraestrutura:** Vagrant, VirtualBox
- **Backend:** Python 3, FastAPI (para a API), Scapy (para captura de pacotes)
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Visualização:** Chart.js com o plugin `chartjs-plugin-datalabels`

## Pré-requisitos

Antes de começar, garanta que você tenha os seguintes softwares instalados:
- [Vagrant](https://www.vagrantup.com/downloads)
- [VirtualBox](https://www.virtualbox.org/wiki/Downloads)

## Como Executar o Projeto

Siga os passos abaixo para configurar e rodar o ambiente completo.

**1. Clonar o Repositório**
```bash
git clone [https://github.com/TutsXD1/LabRedes.git](https://github.com/TutsXD1/LabRedes.git)
cd LabRedes
```

**2. Subir o Ambiente Virtual**
Navegue até a pasta de configuração do Vagrant e execute o comando `vagrant up`. Este processo irá baixar a imagem do sistema operacional e criar/configurar todas as 5 máquinas virtuais.
```bash
cd vagrant
vagrant up
```
*(Este passo pode demorar vários minutos na primeira vez)*

**3. Iniciar a Aplicação (Requer 2 terminais)**
A aplicação é dividida em dois processos que devem rodar simultaneamente no `analysis-host`.

- **No Terminal A - Inicie o Coletor de Dados:**
```bash
# Acesse a VM de análise
vagrant ssh analysis-host

# Navegue até a pasta da aplicação
cd ~/app

# Execute o serviço de captura em segundo plano
sudo python3 capture_service.py &
```

- **No Terminal B - Inicie o Servidor da API:**
```bash
# Acesse a VM de análise em um novo terminal
vagrant ssh analysis-host

# Navegue até a pasta da aplicação
cd ~/app

# Inicie o servidor web
uvicorn main:app --host 0.0.0.0 --port 8000
```

**4. Gerar Tráfego (Opcional, mas recomendado)**
Para ver o dashboard em ação, gere tráfego a partir de uma das máquinas clientes.

- **No Terminal C - Gere Tráfego:**
```bash
# Acesse uma das VMs de cliente
vagrant ssh client-01

# Execute um loop para fazer requisições contínuas ao servidor
while true; do clear; curl http://192.168.100.11/gato_dir.txt; sleep 2; clear; curl http://192.168.100.11/gato_esq.txt; sleep 2; done
```

**5. Visualizar o Dashboard**
Abra seu navegador de internet e acesse a seguinte URL:
[http://localhost:8080](http://localhost:8080)

O gráfico e os painéis começarão a ser populados com os dados de tráfego da sua rede virtual.

## Estrutura do Projeto

```
LabRedes/
├── app/                    # Contém todo o código da aplicação
│   ├── capture_service.py  # Script coletor de pacotes (Scapy)
│   ├── main.py             # Servidor da API (FastAPI)
│   └── static/             # Arquivos do frontend
│       ├── css/style.css
│       ├── index.html
│       └── js/app.js
└── vagrant/                # Configuração da infraestrutura
    ├── Vagrantfile         # Define todas as VMs e redes
    └── provision/          # Scripts de configuração inicial das VMs
        ├── provision-analysis-host.sh
        ├── provision-client.sh
        └── provision-server.sh
```
