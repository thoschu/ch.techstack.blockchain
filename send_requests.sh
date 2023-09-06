#!/bin/bash

num_requests=6

endpoint_url="http://localhost:3003/v1/register-broadcast-node"

# Schleife für die Anfragen
for ((i=3; i<=$num_requests; i++)); do
  echo "Senden von Anfrage $i an $endpoint_url"
  payload_data="{\"url\": \"http://localhost:300$i\"}"
  echo "$payload_data"
  curl -X POST -H "Content-Type: application/json" -d "$payload_data" "$endpoint_url"
  echo "\n"
done
