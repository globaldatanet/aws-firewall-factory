#!/bin/bash

# Array to hold selected options
choices=()

# Options array
options=("PreRequisiteStack" "WAFStack" "ShieldAdvancedStack")

# Calculate the height (number of options + 5)
height=$(( ${#options[@]} + 5 ))

# Function to display menu and capture selections using fzf
display_menu() {
  npx cfonts "AWS FIREWALL FACTORY" \
  --font block \
  --align center \
  --colors "#00ecbd" \
  --background "transparent" \
  --letter-spacing 0 \
  --line-height 0 \
  --space true \
  --max-length 13 \
  --env "node" \
  --width "80%"
  echo "© by globaldatanet"
  selections=$(printf "%s\n" "${options[@]}" | fzf --multi --prompt="Select which stack you want to deploy: " --height=${height} --bind 'space:toggle' --no-info)

  # Add selections to choices array
  for choice in $selections; do
    choices+=("$choice")
  done
}

# Function to process selections
process_choices() {
  echo "You selected:"
  for choice in "${choices[@]}"; do
    echo "- $choice"
    export "STACK_NAME=$choice"
    echo "Environment variable STACK_NAME set to $STACK_NAME"
  done
}

# Main script
display_menu
process_choices
