#!/bin/bash

# NodeBB Editor.js Plugin Development Script
# This script helps with common development tasks

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Functions
install_deps() {
    echo_info "Installing dependencies..."
    npm install
    echo_success "Dependencies installed"
}

lint() {
    echo_info "Running ESLint..."
    npm run lint
    echo_success "Linting completed"
}

lint_fix() {
    echo_info "Running ESLint with auto-fix..."
    npm run lint:fix
    echo_success "Linting with auto-fix completed"
}

test() {
    echo_info "Running tests..."
    npm test
    echo_success "Tests completed"
}

pack() {
    echo_info "Creating package (dry run)..."
    npm run test-pack
    echo_success "Package creation test completed"
}

link_to_nodebb() {
    if [ -z "$1" ]; then
        echo_error "Please provide NodeBB directory path"
        echo "Usage: $0 link /path/to/nodebb"
        exit 1
    fi
    
    NODEBB_DIR="$1"
    
    if [ ! -d "$NODEBB_DIR" ]; then
        echo_error "NodeBB directory not found: $NODEBB_DIR"
        exit 1
    fi
    
    echo_info "Linking plugin to NodeBB at $NODEBB_DIR"
    
    # Create symlink in NodeBB node_modules
    PLUGIN_LINK="$NODEBB_DIR/node_modules/nodebb-plugin-composer-editorjs"
    
    if [ -L "$PLUGIN_LINK" ]; then
        echo_warning "Removing existing symlink..."
        rm "$PLUGIN_LINK"
    elif [ -d "$PLUGIN_LINK" ]; then
        echo_warning "Removing existing directory..."
        rm -rf "$PLUGIN_LINK"
    fi
    
    ln -s "$PROJECT_DIR" "$PLUGIN_LINK"
    echo_success "Plugin linked to NodeBB"
    echo_info "Don't forget to rebuild NodeBB: cd $NODEBB_DIR && ./nodebb build"
}

watch() {
    echo_info "Starting development watcher..."
    echo_warning "This will watch for file changes and run linting"
    
    if command -v fswatch >/dev/null 2>&1; then
        fswatch -o static/ index.js plugin.json | while read f; do
            echo_info "Files changed, running lint..."
            npm run lint || true
        done
    else
        echo_error "fswatch not found. Please install it or use manual testing."
        echo "On macOS: brew install fswatch"
        echo "On Linux: apt-get install fswatch (or similar)"
    fi
}

clean() {
    echo_info "Cleaning up..."
    rm -rf node_modules package-lock.json
    echo_success "Cleanup completed"
}

reinstall() {
    clean
    install_deps
}

# Help function
show_help() {
    echo "NodeBB Editor.js Plugin Development Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  install     Install npm dependencies"
    echo "  lint        Run ESLint"
    echo "  lint-fix    Run ESLint with auto-fix"
    echo "  test        Run unit tests"
    echo "  pack        Test package creation"
    echo "  link DIR    Create symlink in NodeBB directory"
    echo "  watch       Watch for file changes and lint"
    echo "  clean       Remove node_modules and package-lock.json"
    echo "  reinstall   Clean and reinstall dependencies"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install"
    echo "  $0 link /path/to/nodebb"
    echo "  $0 lint-fix"
}

# Main script logic
case "${1:-help}" in
    install)
        install_deps
        ;;
    lint)
        lint
        ;;
    lint-fix)
        lint_fix
        ;;
    test)
        test
        ;;
    pack)
        pack
        ;;
    link)
        link_to_nodebb "$2"
        ;;
    watch)
        watch
        ;;
    clean)
        clean
        ;;
    reinstall)
        reinstall
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
