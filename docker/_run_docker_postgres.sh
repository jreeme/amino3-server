#!/bin/bash
docker run -dt --name postgres -h postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:9.5-alpine
