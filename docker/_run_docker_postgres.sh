#!/bin/bash
docker run --name postgres -e POSTGRES_PASSWORD=password -d postgres -p 5432:5432
