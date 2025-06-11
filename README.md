# Meu App React Native com ChatGPT

Este é um aplicativo React Native que se integra com a API do ChatGPT, permitindo criar topicos de estudo com questões baseado no assunto que te interessar estudar, esses tópicos serão feitos pelo ChatGpt, após o usuário preencher algumas informações.

---

## Pré-requisitos

Antes de instalar e rodar o aplicativo, certifique-se de ter os seguintes pré-requisitos instalados em sua máquina:

* **Node.js e npm:** Você pode baixá-los em [nodejs.org](https://nodejs.org/).
* **React Native CLI:** Se você planeja rodar o app sem o Expo, pode ser útil ter o React Native CLI instalado globalmente:
    ```bash
    npm install -g react-native-cli
    ```
* **Expo CLI (Opcional):** Se você prefere usar o Expo para desenvolvimento e testes, instale-o globalmente:
    ```bash
    npm install -g expo-cli
    ```
* **Chave da API do ChatGPT:** É necessário uma chave da API para utilizá-la na função `callOpenAI`.
---

## Instalação

Siga os passos abaixo para configurar e rodar o aplicativo em sua máquina.

1.  **Clone o Repositório:**
    Comece clonando o repositório do projeto para sua máquina local:
    ```bash
    git clone [https://github.com/CaioPimentelP/trabalhodm.git](https://github.com/CaioPimentelP/trabalhodm.git)
    ```

2.  **Navegue até o Diretório do Projeto:**
    Entre no diretório do projeto clonado:
    ```bash
    cd trabalhodm
    ```

3.  **Instale as Dependências:**
    Instale todas as dependências do projeto usando npm:
    ```bash
    npm install
    ```

---

## Como Rodar o Aplicativo

Você tem duas opções principais para rodar o aplicativo: usando Expo ou usando o React Native CLI diretamente.

### Opção 1: Usando Expo (Recomendado para início rápido)

Se você tem o **Expo CLI** instalado, esta é a maneira mais fácil de começar:

```bash
npm expo start

Após rodar este comando, você poderá escanear um QR code com o aplicativo Expo Go no seu celular (iOS ou Android) ou rodar o app em um emulador/simulador.

### Opção 2: Usando React Native CLI (Para desenvolvimento nativo)

Se você não tem o Expo ou prefere uma experiência de desenvolvimento mais nativa, siga as instruções para Android ou iOS.

#### Android

Para rodar o aplicativo em um emulador Android ou em um dispositivo físico conectado (com depuração USB ativada):

```bash
npx react-native run-android
```

#### iOS (Apenas em Mac)

Para rodar o aplicativo em um simulador iOS ou em um dispositivo físico conectado (você precisará de um Mac para isso):

```bash
npx react-native run-ios
```

