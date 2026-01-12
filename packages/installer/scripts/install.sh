#!/bin/bash
set -e

# Lancer Installer
# Usage: curl -fsSL https://get.lancer.run | bash

VERSION="__VERSION__"  # Replaced at build time
REPOSITORY="lancer-systems/lancer"
DOWNLOAD_URL="https://github.com/$REPOSITORY/releases/download/$VERSION/lancer-installer.tar.gz"
INSTALL_DIR="$HOME/.lancer/installer"
MIN_NODE_VERSION=22

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_error() {
	echo -e "${RED}Error: $1${NC}" >&2
}

print_success() {
	echo -e "${GREEN}$1${NC}"
}

print_info() {
	echo -e "${CYAN}$1${NC}"
}

# Check if command exists
command_exists() {
	command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node() {
	if ! command_exists node; then
		print_error "Node.js is not installed."
		echo "Please install Node.js $MIN_NODE_VERSION or later: https://nodejs.org/"
		exit 1
	fi

	local node_version
	node_version=$(node -v | sed 's/v//' | cut -d. -f1)

	if [ "$node_version" -lt "$MIN_NODE_VERSION" ]; then
		print_error "Node.js $MIN_NODE_VERSION+ is required (found v$node_version)"
		exit 1
	fi
}

# Check for required tools
check_dependencies() {
	local missing=()

	for cmd in curl tar node npm; do
		if ! command_exists "$cmd"; then
			missing+=("$cmd")
		fi
	done

	if [ ${#missing[@]} -ne 0 ]; then
		print_error "Missing required tools: ${missing[*]}"
		exit 1
	fi
}

# Download and extract installer
download_installer() {
	print_info "Downloading Lancer installer..."

	# Create install directory
	rm -rf "$INSTALL_DIR"
	mkdir -p "$INSTALL_DIR"

	# Download and extract
	curl -fsSL "$DOWNLOAD_URL" | tar -xz -C "$INSTALL_DIR"

	print_success "Downloaded installer"
}

# Install npm dependencies
install_dependencies() {
	print_info "Installing dependencies..."

	cd "$INSTALL_DIR"

	# Use npm since end users may not have pnpm installed
	npm install --silent --no-fund --no-audit 2>/dev/null

	print_success "Dependencies installed"
}

# Run the installer
run_installer() {
	cd "$INSTALL_DIR"
	node --experimental-strip-types src/main.ts
}

# Cleanup on exit
cleanup() {
	if [ -d "$INSTALL_DIR" ]; then
		rm -rf "$INSTALL_DIR"
	fi
}

main() {
	echo ""
	print_info "╔═══════════════════════════════════════╗"
	print_info "║        🚀 Lancer Installer            ║"
	print_info "╚═══════════════════════════════════════╝"
	echo ""

	# Run checks
	check_dependencies
	check_node

	# Download and run
	download_installer
	install_dependencies

	echo ""
	run_installer

	# Cleanup
	trap cleanup EXIT
}

main "$@"
