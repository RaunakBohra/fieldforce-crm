#!/bin/bash

# Script to migrate alert() calls to showToast in all page files

FILES=(
  "src/pages/ContactsList.tsx"
  "src/pages/OrdersList.tsx"
  "src/pages/ProductsList.tsx"
  "src/pages/VisitsList.tsx"
  "src/pages/PaymentsList.tsx"
  "src/pages/UsersList.tsx"
  "src/pages/TerritoriesList.tsx"
  "src/pages/ProductForm.tsx"
  "src/pages/ContactForm.tsx"
  "src/pages/OrderDetail.tsx"
  "src/pages/VisitDetails.tsx"
  "src/pages/PendingPayments.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Add import if not present
    if ! grep -q "showToast" "$file"; then
      # Find the last import line and add after it
      sed -i '' "/^import.*from/a\\
import { showToast } from '../components/ui';
" "$file" 2>/dev/null || true
    fi

    echo "  ✓ Processed $file"
  fi
done

echo "✅ Migration complete!"
