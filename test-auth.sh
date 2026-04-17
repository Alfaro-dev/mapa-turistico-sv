#!/bin/bash

# Using Firebase API key to import places
PROJECT_ID="mapsv-1776175535"
API_KEY="AIzaSyB01qLkC_RLRSeJfUf_5SGZFAm8WlA8YNE"

# Read places from JSON file
PLACES_FILE="/home/carlos/Documents/proyects/mapa-turistico-sv/places.json"

# Check if credentials are available
if [ -f ~/.config/gcloud/application_default_credentials.json ]; then
  echo "Using gcloud credentials..."
  TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null)
elif [ -f /home/carlos/.config/gcloud/application_default_credentials.json ]; then
  echo "Using gcloud credentials..."
  TOKEN=$(gcloud --credentials_file=/home/carlos/.config/gcloud/application_default_credentials.json auth application-default print-access-token 2>/dev/null)
else
  echo "No gcloud credentials found"
  exit 1
fi

if [ -z "$TOKEN" ]; then
  echo "Could not get token"
  exit 1
fi

echo "Token obtained successfully"