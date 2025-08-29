# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if we're in the right directory
if [[ ! -f "backend/app/main.py" ]] || [[ ! -f "frontend/src/App.tsx" ]]; then
    print_status "❌ Error: Please run this script from the project root directory" "$RED"
    exit 1
fi

# Backend Tests
print_status "🐍 Running Backend Tests..." "$YELLOW"
cd backend

# Check if virtual environment exists, create if not
if [[ ! -d "venv" ]]; then
    print_status "Creating Python virtual environment..." "$YELLOW"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

# Install dependencies
print_status "Installing backend test dependencies..." "$YELLOW"
pip3 install -r ../tests/requirements.txt > /dev/null

# Install pyyaml to fix ROS plugin compatibility
print_status "Installing additional dependencies for test compatibility..." "$YELLOW"
pip3 install pyyaml > /dev/null

# Run backend tests with isolated plugin loading
print_status "Executing backend tests..." "$YELLOW"
if PYTHONPATH= python3 -m pytest ../tests/backend/ -v --tb=short --override-ini="addopts=" -p no:cacheprovider; then
    print_status "✅ Backend tests passed!" "$GREEN"
else
    print_status "❌ Backend tests failed!" "$RED"
    BACKEND_FAILED=1
fi

# Deactivate virtual environment
deactivate

