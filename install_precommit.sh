#!/bin/bash

cd .git/hooks
if [ ! -f pre-commit ]; then
cat << 'EOF' > pre-commit.sh
#!/bin/sh

if git grep --cached -q 'TODO'; then
    echo 'Your commit contains TODO comments. Resolve them before committing.'
    exit 1
fi

#!/bin/sh

# Fail on error
set -e

echo "🔎 Scanning staged files for secrets..."

# Get staged files (added, copied, modified)
FILES=$(git diff --cached --name-only --diff-filter=ACM)

[ -z "$FILES" ] && exit 0

EXIT_CODE=0

# Patterns to detect
SECRET_PATTERNS='
BEGIN RSA PRIVATE KEY
BEGIN PRIVATE KEY
BEGIN OPENSSH PRIVATE KEY
BEGIN EC PRIVATE KEY
aws_secret_access_key
aws_access_key_id
AKIA[0-9A-Z]{16}
secret[[:space:]]*=
password[[:space:]]*=
token[[:space:]]*=
api[_-]?key
client[_-]?secret
'

for file in $FILES; do
  # Skip deleted files or binary files
  if ! git show ":$file" | grep -Iq .; then
    continue
  fi

  CONTENT=$(git show ":$file")

  # Check structured secret patterns
  echo "$CONTENT" | grep -E -n -i "$SECRET_PATTERNS" >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "❌ Potential secret detected in $file"
    echo "$CONTENT" | grep -E -n -i "$SECRET_PATTERNS"
    EXIT_CODE=1
  fi

  # Detect long base64-like strings (high entropy indicator)
  echo "$CONTENT" | grep -E -n '[A-Za-z0-9+/=]{40,}' >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "⚠️  Suspicious long base64 string found in $file"
    echo "$CONTENT" | grep -E -n '[A-Za-z0-9+/=]{40,}'
    EXIT_CODE=1
  fi
done

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "🚨 Commit blocked. Remove secrets before committing."
  echo "If this is a false positive, review carefully before bypassing."
  exit 1
fi

echo "✅ No obvious secrets detected."
exit 0

EOF
chmod +x pre-commit.sh
fi