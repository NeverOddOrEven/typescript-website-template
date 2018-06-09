
# Building
```
docker-compose build
```

# Running Production
```
docker stack deploy --compose-file docker-compose.yml "website"
```

# Logs
```
docker service logs website 
```