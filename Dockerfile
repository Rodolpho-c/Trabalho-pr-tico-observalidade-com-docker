# 1. Usa uma imagem oficial leve do Node.js
FROM node:18-alpine

# 2. Cria o diretorio de trabalho dentro do container
WORKDIR /usr/src/app

# 3. Copia os arquivos de dependencias primeiro (otimiza o cache do Docker)
COPY package*.json ./

# 4. Instala apenas as dependencias necessarias
RUN npm install --production

# 5. Copia o restante dos arquivos do projeto (incluindo app.js e o logo.png)
COPY . .

# 6. Expoe a porta que a aplicacao usa
EXPOSE 3001

# 7. Comando para rodar a aplicacao quando o container iniciar
CMD [ "node", "app.js" ]
