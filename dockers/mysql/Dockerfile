FROM mysql:5.6

# 这个是为了让mysql监听外部的机器
RUN sed -i -e "s/^bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/" /etc/mysql/my.cnf
