# Ip logging app

Simple demo using docker - NodeJs - Postgress - Nginx.

Nginx is used as a reverse proxy load balancer. The nodejs app receives traffic and saves ip addresses to a postgress database.

To start run

```
chmod +x load_balancer/start.sh
docker-compose up
```

And point your browser to this [url](http://localhost:8080/)
