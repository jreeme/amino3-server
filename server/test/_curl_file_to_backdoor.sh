#!/usr/bin/env bash
curl -vX POST -d @full-stack.json --header "Content-Type: application/json" 'http://localhost:3000/amino-api/Backdoors/create-backdoor'
