FROM node:18-slim

# Install Ghostscript + pdf2svg (EPS → PDF → SVG pipeline)
RUN apt-get update && apt-get install -y ghostscript pdf2svg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json .
RUN npm install --production
COPY server.js .

EXPOSE 3000
CMD ["node", "server.js"]
