#!/bin/bash

# Array to hold selected options
choices=()

# Options array
options=("Option 1" "Option 2" "Option 3")

# Calculate the height (number of options + 5)
height=$(( ${#options[@]} + 5 ))

# Function to display menu and capture selections using fzf
display_menu() {
  selections=$(printf "%s\n" "${options[@]}" | fzf --multi --prompt="Select options: " --height=${height} --bind 'space:toggle' --no-info)

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
  done
}

# Main script
display_menu
process_choices
