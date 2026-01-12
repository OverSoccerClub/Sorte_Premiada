FROM nginx:alpine

# Copiar arquivos do site para o diretório padrão do Nginx
COPY . /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
