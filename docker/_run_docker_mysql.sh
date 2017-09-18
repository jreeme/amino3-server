#!/bin/bash
docker run -dt --name mysql -h mysql -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 mysql:5.7
