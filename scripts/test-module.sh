#!/bin/bash

# Module Testing Script
# This script runs comprehensive tests for a specific module or all modules

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COVERAGE_DIR="$PROJECT_ROOT/coverage"
REPORTS_DIR="$PROJECT_ROOT/test-reports"

# Test configuration
DEFAULT_TIMEOUT=30000
COVERAGE_THRESHOLD=80
PERFORMANCE_THRESHOLD=200 # ms

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${PURPLE}[DEBUG]${NC} $1"
}

log_test() {
    echo -e "${CYAN}[TEST]${NC} $1"
}

# Display usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [MODULE_NAME]"
    echo
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -a, --all            Test all modules"
    echo "  -u, --unit           Run unit tests only"
    echo "  -i, --integration    Run integration tests only"
    echo "  -e, --e2e            Run end-to-end tests only"
    echo "  -p, --performance    Run performance tests"
    echo "  -c, --coverage       Generate coverage report"
    echo "  -w, --watch          Run tests in watch mode"
    echo "  -v, --verbose        Verbose output"
    echo "  --no-cache           Disable Jest cache"
    echo "  --updateSnapshot     Update Jest snapshots"
    echo
    echo "Examples:"
    echo "  $0 products                    # Test products module"
    echo "  $0 --all --coverage           # Test all modules with coverage"
    echo "  $0 --unit --watch products    # Watch unit tests for products module"
    echo "  $0 --e2e --performance        # Run E2E and performance tests for all modules"
}

# Parse command line arguments
parse_arguments() {
    MODULE_NAME=""
    TEST_TYPE="all"
    RUN_ALL=false
    RUN_COVERAGE=false
    WATCH_MODE=false
    VERBOSE=false
    NO_CACHE=false
    UPDATE_SNAPSHOTS=false
    RUN_PERFORMANCE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -a|--all)
                RUN_ALL=true
                shift
                ;;
            -u|--unit)
                TEST_TYPE="unit"
                shift
                ;;
            -i|--integration)
                TEST_TYPE="integration"
                shift
                ;;
            -e|--e2e)
                TEST_TYPE="e2e"
                shift
                ;;
            -p|--performance)
                RUN_PERFORMANCE=true
                shift
                ;;
            -c|--coverage)
                RUN_COVERAGE=true
                shift
                ;;
            -w|--watch)
                WATCH_MODE=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --no-cache)
                NO_CACHE=true
                shift
                ;;
            --updateSnapshot)
                UPDATE_SNAPSHOTS=true
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                if [[ -z "$MODULE_NAME" ]]; then
                    MODULE_NAME="$1"
                else
                    log_error "Multiple module names specified"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
}

# Validate module exists
validate_module() {
    local module_name="$1"
    
    if [[ ! -d "$PROJECT_ROOT/src/core/domain/$module_name" ]]; then
        log_error "Module '$module_name' does not exist"
        echo "Available modules:"
        find "$PROJECT_ROOT/src/core/domain" -maxdepth 1 -type d -not -path "*/domain" | sed 's|.*/||' | sort | sed 's/^/  - /'
        exit 1
    fi
}

# Setup test environment
setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Create necessary directories
    mkdir -p "$COVERAGE_DIR"
    mkdir -p "$REPORTS_DIR"
    
    # Set test environment variables
    export NODE_ENV=test
    export TEST_DATABASE_URL="${TEST_DATABASE_URL:-postgresql://localhost/test_db}"
    export LOG_LEVEL="${LOG_LEVEL:-error}"
    
    # Clear coverage from previous runs
    if [[ "$RUN_COVERAGE" == "true" ]]; then
        rm -rf "$COVERAGE_DIR"/*
    fi
    
    log_success "Test environment ready"
}

# Build Jest command based on options
build_jest_command() {
    local jest_cmd="npx jest"
    
    # Add test pattern based on module and test type
    if [[ -n "$MODULE_NAME" ]]; then
        case "$TEST_TYPE" in
            "unit")
                jest_cmd="$jest_cmd --testPathPattern=\"$MODULE_NAME.*spec\.ts$\""
                ;;
            "integration")
                jest_cmd="$jest_cmd --testPathPattern=\"$MODULE_NAME.*integration\.spec\.ts$\""
                ;;
            "e2e")
                jest_cmd="$jest_cmd --testPathPattern=\"$MODULE_NAME.*e2e\.spec\.ts$\""
                ;;
            *)
                jest_cmd="$jest_cmd --testPathPattern=\"$MODULE_NAME\""
                ;;
        esac
    else
        case "$TEST_TYPE" in
            "unit")
                jest_cmd="$jest_cmd --testPathPattern=\"spec\.ts$\" --testPathIgnorePatterns=\"integration\.spec\.ts|e2e\.spec\.ts\""
                ;;
            "integration")
                jest_cmd="$jest_cmd --testPathPattern=\"integration\.spec\.ts$\""
                ;;
            "e2e")
                jest_cmd="$jest_cmd --testPathPattern=\"e2e\.spec\.ts$\""
                ;;
        esac
    fi
    
    # Add coverage options
    if [[ "$RUN_COVERAGE" == "true" ]]; then
        jest_cmd="$jest_cmd --coverage --coverageDirectory=\"$COVERAGE_DIR\""
        jest_cmd="$jest_cmd --coverageReporters=text-summary --coverageReporters=lcov --coverageReporters=html"
        jest_cmd="$jest_cmd --coverageThreshold='{\"global\":{\"branches\":$COVERAGE_THRESHOLD,\"functions\":$COVERAGE_THRESHOLD,\"lines\":$COVERAGE_THRESHOLD,\"statements\":$COVERAGE_THRESHOLD}}'"
    fi
    
    # Add watch mode
    if [[ "$WATCH_MODE" == "true" ]]; then
        jest_cmd="$jest_cmd --watch"
    fi
    
    # Add verbose mode
    if [[ "$VERBOSE" == "true" ]]; then
        jest_cmd="$jest_cmd --verbose"
    fi
    
    # Add cache options
    if [[ "$NO_CACHE" == "true" ]]; then
        jest_cmd="$jest_cmd --no-cache"
    fi
    
    # Add snapshot updates
    if [[ "$UPDATE_SNAPSHOTS" == "true" ]]; then
        jest_cmd="$jest_cmd --updateSnapshot"
    fi
    
    # Add timeout
    jest_cmd="$jest_cmd --testTimeout=$DEFAULT_TIMEOUT"
    
    # Add other useful options
    jest_cmd="$jest_cmd --detectOpenHandles --forceExit"
    
    echo "$jest_cmd"
}

# Run unit tests
run_unit_tests() {
    local module_name="${1:-""}"
    
    log_test "Running unit tests for ${module_name:-all modules}..."
    
    local jest_cmd
    TEST_TYPE="unit" jest_cmd=$(build_jest_command)
    
    log_debug "Jest command: $jest_cmd"
    
    if eval "$jest_cmd"; then
        log_success "Unit tests passed"
        return 0
    else
        log_error "Unit tests failed"
        return 1
    fi
}

# Run integration tests  
run_integration_tests() {
    local module_name="${1:-""}"
    
    log_test "Running integration tests for ${module_name:-all modules}..."
    
    # Ensure test database is ready
    if ! check_test_database; then
        log_error "Test database is not available"
        return 1
    fi
    
    local jest_cmd
    TEST_TYPE="integration" jest_cmd=$(build_jest_command)
    
    log_debug "Jest command: $jest_cmd"
    
    if eval "$jest_cmd"; then
        log_success "Integration tests passed"
        return 0
    else
        log_error "Integration tests failed"
        return 1
    fi
}

# Run E2E tests
run_e2e_tests() {
    local module_name="${1:-""}"
    
    log_test "Running E2E tests for ${module_name:-all modules}..."
    
    # Start test server if needed
    local server_pid=""
    if ! check_test_server; then
        log_info "Starting test server..."
        npm run dev &
        server_pid=$!
        
        # Wait for server to be ready
        wait_for_server "http://localhost:7000" 30
    fi
    
    local jest_cmd
    TEST_TYPE="e2e" jest_cmd=$(build_jest_command)
    
    log_debug "Jest command: $jest_cmd"
    
    local result=0
    if eval "$jest_cmd"; then
        log_success "E2E tests passed"
    else
        log_error "E2E tests failed"
        result=1
    fi
    
    # Clean up test server
    if [[ -n "$server_pid" ]]; then
        log_info "Stopping test server..."
        kill $server_pid 2>/dev/null || true
    fi
    
    return $result
}

# Run performance tests
run_performance_tests() {
    local module_name="${1:-""}"
    
    log_test "Running performance tests for ${module_name:-all modules}..."
    
    # Start test server for performance tests
    local server_pid=""
    if ! check_test_server; then
        log_info "Starting test server for performance tests..."
        NODE_ENV=test npm run dev &
        server_pid=$!
        wait_for_server "http://localhost:7000" 30
    fi
    
    # Create performance test report directory
    local perf_report_dir="$REPORTS_DIR/performance/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$perf_report_dir"
    
    # Run performance tests with different patterns based on module
    local test_pattern=""
    if [[ -n "$module_name" ]]; then
        test_pattern="--testPathPattern=\"$module_name.*performance|$module_name.*load\""
    else
        test_pattern="--testPathPattern=\"performance|load\""
    fi
    
    local jest_cmd="npx jest $test_pattern --testTimeout=60000 --verbose --reporters=default"
    
    log_debug "Performance test command: $jest_cmd"
    
    local result=0
    if eval "$jest_cmd 2>&1 | tee '$perf_report_dir/performance-results.log'"; then
        log_success "Performance tests completed"
        analyze_performance_results "$perf_report_dir/performance-results.log"
    else
        log_error "Performance tests failed"
        result=1
    fi
    
    # Clean up
    if [[ -n "$server_pid" ]]; then
        kill $server_pid 2>/dev/null || true
    fi
    
    return $result
}

# Analyze performance results
analyze_performance_results() {
    local log_file="$1"
    
    log_info "Analyzing performance results..."
    
    # Extract response times from logs (this would need to be customized based on actual log format)
    if grep -q "response time" "$log_file"; then
        log_info "Performance metrics found:"
        grep "response time\|duration\|ms" "$log_file" | head -10
        
        # Check if any responses exceeded threshold
        local slow_responses=$(grep -o "[0-9]\+ms" "$log_file" | sed 's/ms//' | awk -v threshold="$PERFORMANCE_THRESHOLD" '$1 > threshold {print $1}' | wc -l)
        
        if [[ $slow_responses -gt 0 ]]; then
            log_warning "$slow_responses responses exceeded ${PERFORMANCE_THRESHOLD}ms threshold"
        else
            log_success "All responses within ${PERFORMANCE_THRESHOLD}ms threshold"
        fi
    else
        log_warning "No performance metrics found in log file"
    fi
}

# Generate test report
generate_test_report() {
    local module_name="${1:-all}"
    local test_results="$2"
    
    log_info "Generating test report..."
    
    local report_file="$REPORTS_DIR/test-report-$module_name-$(date +%Y%m%d_%H%M%S).md"
    
cat > "$report_file" << EOF
# Test Report: $module_name

**Generated**: $(date)
**Module**: $module_name
**Test Type**: $TEST_TYPE
**Coverage Enabled**: $RUN_COVERAGE
**Performance Tests**: $RUN_PERFORMANCE

## Test Results

$test_results

## Coverage Report

$(if [[ "$RUN_COVERAGE" == "true" && -f "$COVERAGE_DIR/lcov.info" ]]; then
    echo "Coverage data available in: $COVERAGE_DIR/"
    echo
    echo "### Coverage Summary"
    if command -v lcov >/dev/null 2>&1; then
        lcov --summary "$COVERAGE_DIR/lcov.info" 2>/dev/null || echo "Coverage summary not available"
    fi
else
    echo "No coverage data generated"
fi)

## Files Tested

$(find "$PROJECT_ROOT/src" -name "*.spec.ts" -o -name "*.test.ts" | grep -E "${module_name}" | sort || echo "No test files found")

## Performance Metrics

$(if [[ "$RUN_PERFORMANCE" == "true" ]]; then
    echo "Performance tests executed - check logs for details"
else
    echo "Performance tests not run"
fi)

## Recommendations

$(if [[ "$RUN_COVERAGE" == "true" ]]; then
    echo "- Review coverage report for areas needing more tests"
    echo "- Aim for >80% coverage on all modules"
fi)

$(if [[ "$RUN_PERFORMANCE" == "true" ]]; then
    echo "- Monitor response times and optimize slow endpoints"
    echo "- Set up continuous performance monitoring"
fi)

---
Report generated by test-module.sh
EOF
    
    log_success "Test report generated: $report_file"
}

# Check if test database is available
check_test_database() {
    if [[ -z "$TEST_DATABASE_URL" ]]; then
        log_warning "TEST_DATABASE_URL not set, using default"
        return 0
    fi
    
    # Simple check - try to connect to database
    # This would need to be adapted based on your database setup
    if command -v pg_isready >/dev/null 2>&1; then
        if pg_isready -d "$TEST_DATABASE_URL" >/dev/null 2>&1; then
            return 0
        else
            log_error "Test database is not ready"
            return 1
        fi
    fi
    
    # Assume database is available if pg_isready is not installed
    return 0
}

# Check if test server is running
check_test_server() {
    if curl -s "http://localhost:7000/health" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Wait for server to be ready
wait_for_server() {
    local url="$1"
    local timeout="${2:-30}"
    local elapsed=0
    
    log_info "Waiting for server at $url..."
    
    while [[ $elapsed -lt $timeout ]]; do
        if curl -s "$url/health" >/dev/null 2>&1; then
            log_success "Server is ready"
            return 0
        fi
        
        sleep 1
        ((elapsed++))
        
        if [[ $((elapsed % 5)) -eq 0 ]]; then
            log_info "Still waiting for server... (${elapsed}s)"
        fi
    done
    
    log_error "Server did not start within ${timeout} seconds"
    return 1
}

# Run all tests for a module
run_all_tests() {
    local module_name="$1"
    local results=""
    local overall_result=0
    
    log_info "Running comprehensive tests for ${module_name:-all modules}..."
    
    # Unit tests
    if [[ "$TEST_TYPE" == "all" || "$TEST_TYPE" == "unit" ]]; then
        if run_unit_tests "$module_name"; then
            results="$results\n✅ Unit tests: PASSED"
        else
            results="$results\n❌ Unit tests: FAILED"
            overall_result=1
        fi
    fi
    
    # Integration tests
    if [[ "$TEST_TYPE" == "all" || "$TEST_TYPE" == "integration" ]]; then
        if run_integration_tests "$module_name"; then
            results="$results\n✅ Integration tests: PASSED"
        else
            results="$results\n❌ Integration tests: FAILED"
            overall_result=1
        fi
    fi
    
    # E2E tests
    if [[ "$TEST_TYPE" == "all" || "$TEST_TYPE" == "e2e" ]]; then
        if run_e2e_tests "$module_name"; then
            results="$results\n✅ E2E tests: PASSED"
        else
            results="$results\n❌ E2E tests: FAILED"
            overall_result=1
        fi
    fi
    
    # Performance tests
    if [[ "$RUN_PERFORMANCE" == "true" ]]; then
        if run_performance_tests "$module_name"; then
            results="$results\n✅ Performance tests: PASSED"
        else
            results="$results\n⚠️  Performance tests: FAILED"
            # Don't fail overall for performance tests
        fi
    fi
    
    # Generate report
    generate_test_report "${module_name:-all}" "$results"
    
    return $overall_result
}

# Main execution
main() {
    echo "=== Module Testing Script ==="
    echo "Comprehensive testing for CRUD modules following Clean Architecture patterns."
    echo
    
    # Parse arguments
    parse_arguments "$@"
    
    # Show configuration
    log_info "Test Configuration:"
    log_info "  Module: ${MODULE_NAME:-All modules}"
    log_info "  Test Type: $TEST_TYPE"
    log_info "  Coverage: $RUN_COVERAGE"
    log_info "  Performance: $RUN_PERFORMANCE"
    log_info "  Watch Mode: $WATCH_MODE"
    log_info "  Verbose: $VERBOSE"
    echo
    
    # Validate module if specified
    if [[ -n "$MODULE_NAME" && "$RUN_ALL" != "true" ]]; then
        validate_module "$MODULE_NAME"
    fi
    
    # Setup environment
    setup_test_environment
    
    # Run tests
    local result=0
    
    if [[ "$RUN_ALL" == "true" ]]; then
        log_info "Running tests for all modules..."
        
        # Find all domain modules
        local modules=()
        while IFS= read -r -d '' dir; do
            local module_name=$(basename "$dir")
            if [[ "$module_name" != "shared" ]]; then
                modules+=("$module_name")
            fi
        done < <(find "$PROJECT_ROOT/src/core/domain" -maxdepth 1 -type d -not -path "*/domain" -print0)
        
        log_info "Found modules: ${modules[*]}"
        
        # Test each module
        local failed_modules=()
        for module in "${modules[@]}"; do
            log_info "Testing module: $module"
            if ! run_all_tests "$module"; then
                failed_modules+=("$module")
                result=1
            fi
            echo "----------------------------------------"
        done
        
        # Summary
        if [[ ${#failed_modules[@]} -eq 0 ]]; then
            log_success "All modules passed tests!"
        else
            log_error "Failed modules: ${failed_modules[*]}"
        fi
        
    else
        # Test specific module or all tests without module separation
        if ! run_all_tests "$MODULE_NAME"; then
            result=1
        fi
    fi
    
    echo
    if [[ $result -eq 0 ]]; then
        log_success "All tests completed successfully!"
        
        if [[ "$RUN_COVERAGE" == "true" ]]; then
            log_info "Coverage report: $COVERAGE_DIR/html/index.html"
        fi
        
        log_info "Test reports: $REPORTS_DIR/"
        
    else
        log_error "Some tests failed!"
        echo
        echo "Troubleshooting tips:"
        echo "- Check test logs for specific error messages"
        echo "- Ensure test database is properly configured"
        echo "- Verify all dependencies are installed"
        echo "- Run with --verbose for more detailed output"
    fi
    
    exit $result
}

# Run the script
main "$@"
