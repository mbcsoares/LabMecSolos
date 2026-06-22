# LabMecSolos

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Ionic](https://img.shields.io/badge/Ionic-8.0-blue)](https://ionicframework.com)
[![React](https://img.shields.io/badge/React-18.0-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![MVP 1.0](https://img.shields.io/badge/version-1.0.0-orange)](#)

> 📱 Aplicativo mobile para gestão completa de laboratórios de mecânica dos solos.

**LabMecSolos** é uma solução mobile desenvolvida para auxiliar universidades na operação de seus laboratórios de solos. Do agendamento de ensaios ao mapa geotécnico consolidado, o aplicativo oferece um ecossistema integrado que garante rastreabilidade, conformidade normativa e eficiência operacional — tudo a partir da palma da mão.

---

## 📸 Tela Inicial

<p align="center">
  <img src="docs/screenshots/splash.png" alt="Tela Inicial do LabMecSolos" width="300"/>
  <br/>
  <em>Splash Screen do aplicativo — desenvolvimento em andamento.</em>
</p>

*Observação: Substitua pela imagem real da tela inicial quando disponível.*

---

## 🧩 Módulos do Sistema

| Módulo | Descrição |
|:------:|-----------|
| **1. Autenticação** | Cadastro, login, recuperação de senha e gerenciamento de perfil com validação por e-mail institucional. |
| **2. Administração** | Gestão de usuários, permissões e transferência de papéis administrativos. |
| **3. Inventário** | Controle de materiais, utensílios e equipamentos com QR Code, estoque e histórico de manutenção. |
| **4. Ciclo de Ensaios** | Do plano de amostragem ao relatório final: coleta, preparação, execução e cálculos automáticos. |
| **5. Agendamento** | Calendário mensal, solicitação de reservas e controle de comparecimento no laboratório. |
| **6. Painel Gerencial** | Indicadores, gráficos e relatórios para tomada de decisão pela chefia do laboratório. |
| **7. Mapa Geotécnico** | Visualização geoespacial unificada dos resultados de todas as pesquisas realizadas. |

---

## 🛠️ Tecnologias

### Stack Principal

- **Framework Mobile:** Ionic Capacitor
- **Interface:** React
- **Linguagem:** TypeScript
- **Banco de Dados Local:** SQLite
- **Banco Remoto (fase 2):** Firebase

### Bibliotecas e Serviços

- **Mapas:** Leaflet + OpenStreetMap
- **Gráficos:** Chart.js + react-chartjs-2
- **Relatórios PDF:** jsPDF / pdfmake
- **QR Code:** capacitor-mlkit/barcode-scanning
- **Autenticação:** Firebase Auth (planejado para sincronização remota)

---

## 👥 Equipe

| Integrante | Papel | Contato |
|------------|-------|---------|
| **Micael Bruno Cassiano Soares** | Autor e desenvolvedor principal | [micaelbruno2011@gmail.com](mailto:micaelbruno2011@gmail.com) |

*Colaboradores são bem-vindos! Consulte a seção [Como Contribuir](#-como-contribuir).*

---

## 🚀 Instruções Básicas de Execução

### Pré-requisitos

- Node.js (v18 ou superior)
- npm (v9+) ou Yarn
- Ionic CLI (`npm install -g @ionic/cli`)
- Capacitor (`npm install -g @capacitor/cli`)
- Android Studio (para build e emulação)

### Configuração do Ambiente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/labmecsolos.git
   cd labmecsolos
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute no navegador (desenvolvimento):**
   ```bash
   ionic serve
   ```

4. **Execute em dispositivo Android:**
   ```bash
   ionic capacitor build android
   ionic capacitor run android
   ```

### Primeiro Acesso (MVP 1.0)

O MVP 1.0 opera em modo offline com dados de teste. Para acessar:

- Utilize as credenciais de teste fornecidas.
- O banco SQLite local será inicializado automaticamente no primeiro acesso.

---

## 🤝 Como Contribuir

Contribuições são bem-vindas! Para propor melhorias:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas alterações (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

Para bugs ou sugestões, utilize a [seção de Issues](https://github.com/seu-usuario/labmecsolos/issues).

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  <strong>LabMecSolos</strong> — Transformando a gestão de laboratórios de solos.<br/>
  Desenvolvido com ❤️ por Micael Bruno Cassiano Soares.
</p>

---
