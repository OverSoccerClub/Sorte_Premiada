FROM nginx:alpine

# Copiar arquivos do site para o diretório padrão do Nginx
# Como o build context é a raiz do repositório, precisamos copiar de apps/site/
COPY apps/site/*.html /usr/share/nginx/html/
COPY apps/site/*.css /usr/share/nginx/html/
COPY apps/site/*.js /usr/share/nginx/html/
COPY apps/site/assets /usr/share/nginx/html/assets

# Expor porta 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
