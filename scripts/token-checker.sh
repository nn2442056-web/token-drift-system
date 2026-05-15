#!/bin/bash

# Token Drift Detector - GitHub Actions Script
# Checks for hard-coded design tokens in code

VIOLATIONS=0
REPORT_FILE="token-violations-report.txt"

# Token values to check (from tokens.dtcg.json)
TOKENS=("#2563EB" "#7C3AED" "8px" "16px" "24px" "rgb(255, 255, 255)")

# Files to check (exclude node_modules, dist, etc)
EXCLUDED_DIRS="node_modules|dist|.git|token_modules|build|out"

echo "🔍 Scanning for token violations..."

# Loop through each file
while IFS= read -r file; do
  # Skip excluded directories
  if echo "$file" | grep -q "$EXCLUDED_DIRS"; then
    continue
  fi

  # Skip binary files
  if file "$file" | grep -q "binary"; then
    continue
  fi

  # Check for HEX colors
  if grep -n "#[0-9A-Fa-f]\{6\}" "$file" 2>/dev/null | grep -v "^Binary"; then
    echo "❌ HEX color found in: $file"
    ((VIOLATIONS++))
  fi

  # Check for RGB colors
  if grep -n "rgb(" "$file" 2>/dev/null | grep -v "^Binary"; then
    echo "❌ RGB color found in: $file"
    ((VIOLATIONS++))
  fi

done < <(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" \))

# Report findings
echo ""
echo "=== COMPLIANCE REPORT ===" >> "$REPORT_FILE"
echo "Violations found: $VIOLATIONS" >> "$REPORT_FILE"
echo "Time: $(date)" >> "$REPORT_FILE"

if [ $VIOLATIONS -gt 0 ]; then
  echo "⚠️  Found $VIOLATIONS violation(s)"
  exit 1
else
  echo "✅ No violations found"
  exit 0
fi