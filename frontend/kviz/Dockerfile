FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Vite dev server standardno radi na 5173
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
