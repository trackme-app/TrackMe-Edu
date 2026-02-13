#!/bin/bash

cd .git/hooks
if [ ! -f pre-commit ]; then
cat << 'EOF' > pre-commit
#!/bin/sh

# Define color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color (reset)

EXIT_CODE=0

echo "${BLUE}🔎 Scanning staged files for TODO items...${NC}"
if git grep --cached -q 'TODO' -- ':(exclude)install_precommit.sh'; then
    echo "${RED}🚨 Your commit contains TODO comments. Resolve them or create Github issues and remove them before committing.${NC}"
   EXIT_CODE=1
fi

echo "${BLUE}🔎 Scanning staged files for console output...${NC}"
if git grep --cached -q 'console.' -- ':(exclude)install_precommit.sh'; then
    echo "${RED}🚨 Your commit contains output using a 'console.XYZ' method. Ensure all logging is handled by the logger.${NC}"
   EXIT_CODE=1
fi

echo "${BLUE}🔎 Scanning staged files for secrets...${NC}"

# Get staged files (added, copied, modified)
FILES=$(git diff --cached --name-only --diff-filter=ACM -- ":(exclude)install_precommit.sh")

[ -z "$FILES" ] && exit 0

for file in $FILES; do
  # Skip deleted files or binary files
  if ! git show ":$file" | grep -Iq .; then
    continue
  fi

  CONTENT=$(git show ":$file")

  # Check structured secret patterns
  echo "$CONTENT" | grep -E -n -i -e "BEGIN RSA PRIVATE KEY" \
-e "BEGIN PRIVATE KEY" \
-e "BEGIN OPENSSH PRIVATE KEY" \
-e "BEGIN EC PRIVATE KEY" \
-e "aws_secret_access_key" \
-e "aws_access_key_id" \
-e "AKIA[0-9A-Z]{16}" \
-e "secret[[:space:]]*=" \
-e "password[[:space:]]*=" \
-e "token[[:space:]]*=" \
-e "api[_-]?key" \
-e "client[_-]?secret" >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "${RED}🚨 Potential secret detected in $file${NC}"
    echo "$CONTENT" | grep -E -n -i -e "BEGIN RSA PRIVATE KEY" \
    -e "BEGIN PRIVATE KEY" \
    -e "BEGIN OPENSSH PRIVATE KEY" \
    -e "BEGIN EC PRIVATE KEY" \
    -e "aws_secret_access_key" \
    -e "aws_access_key_id" \
    -e "AKIA[0-9A-Z]{16}" \
    -e "secret[[:space:]]*=" \
    -e "password[[:space:]]*=" \
    -e "token[[:space:]]*=" \
    -e "api[_-]?key" \
    -e "client[_-]?secret"
    EXIT_CODE=1
  fi

  # Detect long base64-like strings (high entropy indicator)
  echo "$CONTENT" | grep -E -n '[A-Za-z0-9+/=]{40,}' >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "${RED}🚨 Suspicious long base64 string found in $file${NC}"
    echo "$CONTENT" | grep -E -n '[A-Za-z0-9+/=]{40,}'
    EXIT_CODE=1
  fi
done

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "${RED}🚨 Commit blocked. Remove secrets and TODOs before committing.${NC}"
  echo "${YELLOW}If this is a false positive, review carefully before bypassing.${NC}"
  exit 1
fi

echo "${GREEN}✅ No obvious secrets detected.${NC}"
exit 0

EOF
chmod +x pre-commit
fi