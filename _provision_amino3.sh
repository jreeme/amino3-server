#!/usr/bin/env bash
set -evx

CLUSTER_PREFIX=amino3
NUM_WORKER_HOSTS=1
POSTGRES_IMAGE=52.0.211.45:5000/postgres:9.5.10
AMINO3_IMAGE=52.0.211.45:5000/amino3:latest

DRIVER_OPTIONS="\
--driver virtualbox \
--virtualbox-cpu-count 2 \
--engine-insecure-registry 52.0.211.45:5000"

MASTER_OPTIONS="$DRIVER_OPTIONS \
--engine-label role=master"

MASTER_MACHINE_NAME=${CLUSTER_PREFIX}-master
docker-machine create $MASTER_OPTIONS $MASTER_MACHINE_NAME

MASTER_IP=$(docker-machine ip $MASTER_MACHINE_NAME)

docker-machine ssh $MASTER_MACHINE_NAME docker swarm init --advertise-addr $MASTER_IP

TOKEN=$(docker-machine ssh $MASTER_MACHINE_NAME docker swarm join-token worker -q)

WORKER_OPTIONS="$DRIVER_OPTIONS"
WORKER_MACHINE_NAME=${CLUSTER_PREFIX}-worker-

for INDEX in $(seq $NUM_WORKER_HOSTS)
do
    (
        docker-machine create $WORKER_OPTIONS $WORKER_MACHINE_NAME$INDEX
        docker-machine ssh $WORKER_MACHINE_NAME$INDEX docker swarm join --token $TOKEN $MASTER_IP:2377
    ) &
done
wait

eval $(docker-machine env $MASTER_MACHINE_NAME)

docker-machine ls

docker stack deploy -c docker-compose.yml amino3


