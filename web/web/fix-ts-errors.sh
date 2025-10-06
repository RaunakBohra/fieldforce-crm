#!/bin/bash

# Fix VisitsList - remove formatStatusLabel
sed -i '' 's/, formatStatusLabel//' src/pages/VisitsList.tsx

# Fix VisitForm - remove unused state
sed -i '' '/const \[uploadedPhotoKeys, setUploadedPhotoKeys\] = useState/d' src/pages/VisitForm.tsx

# Fix Navigation - remove unused imports
sed -i '' 's/LayoutDashboard, //' src/components/Navigation.tsx
sed -i '' 's/ChevronDown, //' src/components/Navigation.tsx

# Fix Dashboard - remove unused imports
sed -i '' 's/TrendingUp, //' src/pages/Dashboard.tsx
sed -i '' 's/Package, //' src/pages/Dashboard.tsx
sed -i '' 's/, StatCard//' src/pages/Dashboard.tsx

# Fix ContactsList - remove StatCard
sed -i '' 's/, StatCard//' src/pages/ContactsList.tsx

# Fix OrdersList - remove StatCard
sed -i '' 's/, StatCard//' src/pages/OrdersList.tsx

# Fix PaymentsList - remove X
sed -i '' 's/, X//' src/pages/PaymentsList.tsx

# Fix TerritoriesList - remove setCountryFilter
sed -i '' '/const \[countryFilter, setCountryFilter\] = useState/c\
  const [countryFilter] = useState('\''ALL'\'');' src/pages/TerritoriesList.tsx

