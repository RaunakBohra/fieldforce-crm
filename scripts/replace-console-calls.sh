#!/bin/bash

# Script to replace console.* calls with logger calls
# This automates the tedious manual replacement process

echo "Replacing console.* calls with logger..."

# Files that need updates
FILES=(
  "src/infrastructure/queues/SQSQueueService.ts"
  "src/infrastructure/email/SESEmailService.ts"
  "src/services/visitService.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Add import if not exists
    if ! grep -q "import.*logger" "$file"; then
      # Find the appropriate path depth
      if [[ "$file" == src/infrastructure/* ]]; then
        sed -i '' '1i\
import { logger } from '"'"'../../utils/logger'"'"';
' "$file"
      elif [[ "$file" == src/services/* ]]; then
        sed -i '' '1i\
import { logger } from '"'"'../utils/logger'"'"';
' "$file"
      fi
    fi

    # Replace console.error with logger.error
    sed -i '' "s/console\.error(\([^)]*\), error)/logger.error(\1, error)/g" "$file"
    sed -i '' "s/console\.error(\([^)]*\))/logger.error(\1)/g" "$file"

    # Replace console.warn with logger.warn
    sed -i '' "s/console\.warn(\([^)]*\))/logger.warn(\1)/g" "$file"

    # Replace console.log with logger.info
    sed -i '' "s/console\.log(\([^)]*\))/logger.info(\1)/g" "$file"

    echo "✓ $file updated"
  else
    echo "✗ $file not found"
  fi
done

echo "Done! Please review the changes."
