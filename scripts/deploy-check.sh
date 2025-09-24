#!/bin/bash

# Pre-Deployment Validation Script
# This script runs comprehensive checks before deployment to ensure system readiness

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
REPORTS_DIR="$PROJECT_ROOT/deployment-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORTS_DIR/deploy-check-$TIMESTAMP.md"

# Check thresholds
COVERAGE_THRESHOLD=80
PERFORMANCE_THRESHOLD=200
MAX_VULNERABILITIES=0
MAX_OUTDATED_PACKAGES=5

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

log_check() {
    echo -e "${CYAN}[CHECK]${NC} $1"
}

log_security() {
    echo -e "${PURPLE}[SECURITY]${NC} $1"
}

# Initialize report
init_report() {
    mkdir -p "$REPORTS_DIR"
    
    cat > "$REPORT_FILE" << EOF
# Pre-Deployment Check Report

**Generated**: $(date)  
**Environment**: ${NODE_ENV:-production}  
**Branch**: $(git branch --show-current 2>/dev/null || echo "unknown")  
**Commit**: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")  

## Summary

EOF
}

# Add section to report
add_to_report() {
    local section="$1"
    local content="$2"
    local status="${3:-}"
    
    {
        echo
        echo "## $section"
        echo
        if [[ -n "$status" ]]; then
            if [[ "$status" == "PASSED" ]]; then
                echo "✅ **Status: PASSED**"
            elif [[ "$status" == "FAILED" ]]; then
                echo "❌ **Status: FAILED**"
            elif [[ "$status" == "WARNING" ]]; then
                echo "⚠️ **Status: WARNING**"
            fi
            echo
        fi
        echo "$content"
    } >> "$REPORT_FILE"
}

# Check system requirements
check_system_requirements() {
    log_check "Checking system requirements..."
    
    local issues=""
    local status="PASSED"
    
    # Check Node.js version
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version | sed 's/v//')
        local required_node="18.0.0"
        
        if [ "$(printf '%s\n' "$required_node" "$node_version" | sort -V | head -n1)" = "$required_node" ]; then
            log_success "Node.js version: $node_version ✓"
        else
            log_error "Node.js version $node_version is below required $required_node"
            issues="$issues\n- Node.js version too old: $node_version (required: >=$required_node)"
            status="FAILED"
        fi
    else
        log_error "Node.js not found"
        issues="$issues\n- Node.js not installed"
        status="FAILED"
    fi
    
    # Check Bun (if used)
    if command -v bun >/dev/null 2>&1; then
        local bun_version=$(bun --version)
        log_success "Bun version: $bun_version ✓"
    else
        log_warning "Bun not found (optional)"
    fi
    
    # Check PostgreSQL client
    if command -v psql >/dev/null 2>&1; then
        local psql_version=$(psql --version | cut -d' ' -f3)
        log_success "PostgreSQL client version: $psql_version ✓"
    else
        log_warning "PostgreSQL client not found"
        issues="$issues\n- PostgreSQL client not available for database checks"
        if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
    fi
    
    # Check memory and disk space
    local available_memory=$(free -m 2>/dev/null | awk '/^Mem:/ {print $7}' || echo "unknown")
    local disk_usage=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ "$available_memory" != "unknown" && "$available_memory" -lt 1024 ]]; then
        log_warning "Low available memory: ${available_memory}MB"
        if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
    fi
    
    if [[ "$disk_usage" -gt 80 ]]; then
        log_warning "High disk usage: ${disk_usage}%"
        if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
    fi
    
    add_to_report "System Requirements" "$(cat << EOF
### Software Versions
- Node.js: $(node --version 2>/dev/null || echo "not found")
- Bun: $(bun --version 2>/dev/null || echo "not found")
- PostgreSQL: $(psql --version 2>/dev/null | cut -d' ' -f3 || echo "not found")

### System Resources
- Available Memory: ${available_memory}MB
- Disk Usage: ${disk_usage}%

### Issues Found
$(if [[ -n "$issues" ]]; then echo -e "$issues"; else echo "No issues found"; fi)
EOF
    )" "$status"
    
    return $([ "$status" = "FAILED" ] && echo 1 || echo 0)
}

# Check dependencies
check_dependencies() {
    log_check "Checking dependencies..."
    
    local issues=""
    local status="PASSED"
    
    # Check if package manager files exist
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json not found"
        issues="$issues\n- package.json missing"
        status="FAILED"
    fi
    
    # Install dependencies if needed
    if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
        log_info "Installing dependencies..."
        if command -v bun >/dev/null 2>&1; then
            cd "$PROJECT_ROOT" && bun install
        else
            cd "$PROJECT_ROOT" && npm install
        fi
    fi
    
    # Check for security vulnerabilities
    log_security "Scanning for security vulnerabilities..."
    local audit_output=""
    local vulnerabilities=0
    
    if command -v bun >/dev/null 2>&1; then
        audit_output=$(bun audit --json 2>/dev/null || echo "")
    else
        audit_output=$(npm audit --json 2>/dev/null || echo "")
    fi
    
    if [[ -n "$audit_output" ]]; then
        vulnerabilities=$(echo "$audit_output" | grep -o '"vulnerabilities":[0-9]*' | cut -d':' -f2 || echo "0")
    fi
    
    if [[ "$vulnerabilities" -gt "$MAX_VULNERABILITIES" ]]; then
        log_error "Security vulnerabilities found: $vulnerabilities"
        issues="$issues\n- $vulnerabilities security vulnerabilities found (max allowed: $MAX_VULNERABILITIES)"
        status="FAILED"
    else
        log_success "Security audit passed: $vulnerabilities vulnerabilities"
    fi
    
    # Check for outdated packages
    log_check "Checking for outdated packages..."
    local outdated_count=0
    
    if command -v npm >/dev/null 2>&1; then
        outdated_count=$(npm outdated --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")
    fi
    
    if [[ "$outdated_count" -gt "$MAX_OUTDATED_PACKAGES" ]]; then
        log_warning "Many outdated packages: $outdated_count (max recommended: $MAX_OUTDATED_PACKAGES)"
        if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
    else
        log_success "Package versions acceptable: $outdated_count outdated"
    fi
    
    add_to_report "Dependencies" "$(cat << EOF
### Security Audit
- Vulnerabilities: $vulnerabilities (max allowed: $MAX_VULNERABILITIES)
- Status: $([ "$vulnerabilities" -le "$MAX_VULNERABILITIES" ] && echo "✅ PASS" || echo "❌ FAIL")

### Package Status
- Outdated packages: $outdated_count
- Recommendation: $([ "$outdated_count" -le "$MAX_OUTDATED_PACKAGES" ] && echo "✅ Acceptable" || echo "⚠️ Consider updating")

### Issues Found
$(if [[ -n "$issues" ]]; then echo -e "$issues"; else echo "No issues found"; fi)
EOF
    )" "$status"
    
    return $([ "$status" = "FAILED" ] && echo 1 || echo 0)
}

# Run comprehensive tests
check_tests() {
    log_check "Running comprehensive test suite..."
    
    local issues=""
    local status="PASSED"
    
    cd "$PROJECT_ROOT"
    
    # Run all tests with coverage
    log_info "Running tests with coverage..."
    local test_output
    local test_result=0
    
    if test_output=$(npm test 2>&1); then
        log_success "All tests passed"
    else
        log_error "Tests failed"
        issues="$issues\n- Test suite failed"
        status="FAILED"
        test_result=1
    fi
    
    # Check coverage
    local coverage_info=""
    local coverage_status="PASSED"
    
    if [[ -f "$PROJECT_ROOT/coverage/lcov.info" ]]; then
        if command -v lcov >/dev/null 2>&1; then
            coverage_info=$(lcov --summary "$PROJECT_ROOT/coverage/lcov.info" 2>/dev/null || echo "Coverage info not available")
        else
            coverage_info="Coverage file exists but lcov not available to read it"
        fi
        
        # Extract coverage percentage (simplified)
        local line_coverage=$(echo "$coverage_info" | grep -o 'lines......: [0-9.]*%' | grep -o '[0-9.]*' || echo "0")
        
        if [[ $(echo "$line_coverage < $COVERAGE_THRESHOLD" | bc -l 2>/dev/null || echo "1") -eq 1 ]]; then
            log_warning "Code coverage below threshold: ${line_coverage}% (required: ${COVERAGE_THRESHOLD}%)"
            issues="$issues\n- Code coverage too low: ${line_coverage}%"
            if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
        else
            log_success "Code coverage acceptable: ${line_coverage}%"
        fi
    else
        log_warning "No coverage report found"
        if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
    fi
    
    add_to_report "Test Results" "$(cat << EOF
### Test Execution
\`\`\`
$(echo "$test_output" | tail -20)
\`\`\`

### Coverage Report
$coverage_info

### Issues Found
$(if [[ -n "$issues" ]]; then echo -e "$issues"; else echo "No issues found"; fi)
EOF
    )" "$status"
    
    return $test_result
}

# Check code quality
check_code_quality() {
    log_check "Checking code quality..."
    
    local issues=""
    local status="PASSED"
    
    cd "$PROJECT_ROOT"
    
    # Run linting
    log_info "Running linter..."
    local lint_output=""
    local lint_errors=0
    
    if lint_output=$(npm run lint 2>&1); then
        log_success "Linting passed"
    else
        lint_errors=$(echo "$lint_output" | grep -c "error\|Error" || echo "0")
        if [[ "$lint_errors" -gt 0 ]]; then
            log_error "Linting failed with $lint_errors errors"
            issues="$issues\n- Linting errors: $lint_errors"
            status="FAILED"
        else
            log_warning "Linting completed with warnings"
            if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
        fi
    fi
    
    # Check TypeScript compilation
    log_info "Checking TypeScript compilation..."
    local tsc_output=""
    
    if tsc_output=$(npx tsc --noEmit 2>&1); then
        log_success "TypeScript compilation successful"
    else
        local tsc_errors=$(echo "$tsc_output" | grep -c "error TS" || echo "0")
        log_error "TypeScript compilation failed with $tsc_errors errors"
        issues="$issues\n- TypeScript errors: $tsc_errors"
        status="FAILED"
    fi
    
    # Check for potential issues in code
    log_info "Scanning for potential code issues..."
    local code_issues=""
    
    # Check for TODO/FIXME comments
    local todo_count=$(find "$PROJECT_ROOT/src" -name "*.ts" -type f -exec grep -l "TODO\|FIXME\|XXX" {} \; | wc -l)
    if [[ "$todo_count" -gt 20 ]]; then
        code_issues="$code_issues\n- High number of TODO/FIXME comments: $todo_count"
    fi
    
    # Check for console.log statements
    local console_count=$(find "$PROJECT_ROOT/src" -name "*.ts" -type f -exec grep -l "console\.log" {} \; | wc -l)
    if [[ "$console_count" -gt 0 ]]; then
        code_issues="$code_issues\n- console.log statements found in $console_count files"
        if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
    fi
    
    # Check for hardcoded secrets (basic check)
    local secret_patterns=("password.*=.*['\"][^'\"]*['\"]" "api.*key.*=.*['\"][^'\"]*['\"]" "secret.*=.*['\"][^'\"]*['\"]")
    local potential_secrets=0
    
    for pattern in "${secret_patterns[@]}"; do
        local matches=$(find "$PROJECT_ROOT/src" -name "*.ts" -type f -exec grep -l "$pattern" {} \; | wc -l)
        potential_secrets=$((potential_secrets + matches))
    done
    
    if [[ "$potential_secrets" -gt 0 ]]; then
        code_issues="$code_issues\n- Potential hardcoded secrets found: $potential_secrets matches"
        status="FAILED"
    fi
    
    add_to_report "Code Quality" "$(cat << EOF
### Linting Results
- Errors: $lint_errors
- Status: $([ "$lint_errors" -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")

### TypeScript Compilation
\`\`\`
$(echo "$tsc_output" | head -10)
\`\`\`

### Code Analysis
- TODO/FIXME comments: $todo_count
- console.log statements: $console_count files
- Potential hardcoded secrets: $potential_secrets

### Issues Found
$(if [[ -n "$issues$code_issues" ]]; then echo -e "$issues$code_issues"; else echo "No issues found"; fi)
EOF
    )" "$status"
    
    return $([ "$status" = "FAILED" ] && echo 1 || echo 0)
}

# Check environment configuration
check_environment() {
    log_check "Checking environment configuration..."
    
    local issues=""
    local status="PASSED"
    
    # Check required environment variables
    local required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "SESSION_SECRET"
        "CSRF_SECRET"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        issues="$issues\n- Missing environment variables: ${missing_vars[*]}"
        status="FAILED"
    else
        log_success "All required environment variables are set"
    fi
    
    # Check environment files
    local env_files=(".env" ".env.example" ".env.production")
    local env_file_status=""
    
    for env_file in "${env_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$env_file" ]]; then
            env_file_status="$env_file_status\n- $env_file: ✅ Found"
        else
            env_file_status="$env_file_status\n- $env_file: ❌ Missing"
            if [[ "$env_file" != ".env" ]]; then  # .env is optional in production
                if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
            fi
        fi
    done
    
    # Check secret strength (basic check)
    local weak_secrets=()
    if [[ -n "$JWT_SECRET" && ${#JWT_SECRET} -lt 32 ]]; then
        weak_secrets+=("JWT_SECRET")
    fi
    if [[ -n "$SESSION_SECRET" && ${#SESSION_SECRET} -lt 32 ]]; then
        weak_secrets+=("SESSION_SECRET")
    fi
    
    if [[ ${#weak_secrets[@]} -gt 0 ]]; then
        log_warning "Weak secrets detected: ${weak_secrets[*]}"
        issues="$issues\n- Weak secrets (< 32 characters): ${weak_secrets[*]}"
        if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
    fi
    
    add_to_report "Environment Configuration" "$(cat << EOF
### Required Variables
$(for var in "${required_vars[@]}"; do
    echo "- $var: $([ -n "${!var}" ] && echo "✅ Set" || echo "❌ Missing")"
done)

### Environment Files
$(echo -e "$env_file_status")

### Security Check
$(if [[ ${#weak_secrets[@]} -gt 0 ]]; then
    echo "⚠️ Weak secrets detected: ${weak_secrets[*]}"
else
    echo "✅ Secret strength acceptable"
fi)

### Issues Found
$(if [[ -n "$issues" ]]; then echo -e "$issues"; else echo "No issues found"; fi)
EOF
    )" "$status"
    
    return $([ "$status" = "FAILED" ] && echo 1 || echo 0)
}

# Check database connectivity
check_database() {
    log_check "Checking database connectivity..."
    
    local issues=""
    local status="PASSED"
    
    # Check if DATABASE_URL is set
    if [[ -z "$DATABASE_URL" ]]; then
        log_error "DATABASE_URL not set"
        issues="$issues\n- DATABASE_URL not configured"
        status="FAILED"
        add_to_report "Database Connectivity" "❌ DATABASE_URL not configured" "FAILED"
        return 1
    fi
    
    # Test database connection
    log_info "Testing database connection..."
    local db_test_output=""
    local db_status="PASSED"
    
    if command -v psql >/dev/null 2>&1; then
        if db_test_output=$(psql "$DATABASE_URL" -c "SELECT version();" 2>&1); then
            log_success "Database connection successful"
            local db_version=$(echo "$db_test_output" | head -n3 | tail -n1 | cut -c2-)
        else
            log_error "Database connection failed"
            issues="$issues\n- Cannot connect to database"
            db_status="FAILED"
            status="FAILED"
        fi
    else
        log_warning "PostgreSQL client not available, skipping connection test"
        db_status="WARNING"
        if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
    fi
    
    # Check for pending migrations (if migration system is in place)
    log_info "Checking migration status..."
    local migration_status=""
    
    if [[ -d "$PROJECT_ROOT/src/external/drizzle/migrations" ]]; then
        local migration_count=$(find "$PROJECT_ROOT/src/external/drizzle/migrations" -name "*.sql" | wc -l)
        migration_status="Found $migration_count migration files"
        
        # Try to run migration check (this would depend on your setup)
        if command -v bun >/dev/null 2>&1 && [[ -f "$PROJECT_ROOT/package.json" ]]; then
            if grep -q "db:check" "$PROJECT_ROOT/package.json"; then
                if bun run db:check >/dev/null 2>&1; then
                    migration_status="$migration_status - ✅ Database schema is up to date"
                else
                    migration_status="$migration_status - ⚠️ Database schema may be outdated"
                    if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
                fi
            fi
        fi
    else
        migration_status="No migration directory found"
    fi
    
    add_to_report "Database Connectivity" "$(cat << EOF
### Connection Test
$(if [[ "$db_status" == "PASSED" ]]; then
    echo "✅ Connection successful"
    echo "Database version: ${db_version:-unknown}"
elif [[ "$db_status" == "FAILED" ]]; then
    echo "❌ Connection failed"
    echo "\`\`\`"
    echo "$db_test_output"
    echo "\`\`\`"
else
    echo "⚠️ Connection test skipped (psql not available)"
fi)

### Migration Status
$migration_status

### Issues Found
$(if [[ -n "$issues" ]]; then echo -e "$issues"; else echo "No issues found"; fi)
EOF
    )" "$status"
    
    return $([ "$status" = "FAILED" ] && echo 1 || echo 0)
}

# Check build process
check_build() {
    log_check "Testing build process..."
    
    local issues=""
    local status="PASSED"
    
    cd "$PROJECT_ROOT"
    
    # Clean previous build
    if [[ -d "dist" ]]; then
        rm -rf dist
    fi
    
    # Run build
    log_info "Running production build..."
    local build_output=""
    local build_result=0
    
    if build_output=$(npm run build 2>&1); then
        log_success "Build successful"
        
        # Check if build artifacts exist
        if [[ -d "dist" ]] || [[ -f "index.js" ]]; then
            log_success "Build artifacts generated"
        else
            log_warning "Build completed but no artifacts found"
            if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
        fi
        
    else
        log_error "Build failed"
        issues="$issues\n- Production build failed"
        status="FAILED"
        build_result=1
    fi
    
    # Check bundle size (if applicable)
    local bundle_info=""
    if [[ -d "dist" ]]; then
        bundle_info="Bundle size: $(du -sh dist 2>/dev/null | cut -f1)"
        log_info "$bundle_info"
    fi
    
    add_to_report "Build Process" "$(cat << EOF
### Build Output
\`\`\`
$(echo "$build_output" | tail -20)
\`\`\`

### Build Artifacts
$(if [[ -d "dist" ]] || [[ -f "index.js" ]]; then
    echo "✅ Build artifacts generated"
    echo "$bundle_info"
else
    echo "❌ No build artifacts found"
fi)

### Issues Found
$(if [[ -n "$issues" ]]; then echo -e "$issues"; else echo "No issues found"; fi)
EOF
    )" "$status"
    
    return $build_result
}

# Performance check
check_performance() {
    log_check "Running performance checks..."
    
    local issues=""
    local status="PASSED"
    
    # This is a basic performance check
    # In a real scenario, you might start the server and run performance tests
    
    log_info "Analyzing bundle size and dependencies..."
    
    # Check for large dependencies
    local large_deps=""
    if [[ -f "$PROJECT_ROOT/package.json" ]] && command -v jq >/dev/null 2>&1; then
        # This is a simplified check
        large_deps=$(jq -r '.dependencies // {} | to_entries[] | select(.key | test("lodash|moment|webpack")) | .key' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "")
    fi
    
    if [[ -n "$large_deps" ]]; then
        log_warning "Large dependencies detected: $large_deps"
        issues="$issues\n- Consider alternatives for: $large_deps"
        if [[ "$status" != "FAILED" ]]; then status="WARNING"; fi
    fi
    
    # Check for performance-related configurations
    local perf_config=""
    if grep -q "cluster\|worker_processes" "$PROJECT_ROOT"/*.{js,ts,json} 2>/dev/null; then
        perf_config="✅ Clustering/worker configuration found"
    else
        perf_config="⚠️ No clustering configuration detected"
    fi
    
    add_to_report "Performance Analysis" "$(cat << EOF
### Bundle Analysis
$(if [[ -d "dist" ]]; then
    find dist -name "*.js" -exec ls -lh {} \; 2>/dev/null | head -10 || echo "No JS files found"
else
    echo "No build directory to analyze"
fi)

### Dependencies Review
$(if [[ -n "$large_deps" ]]; then
    echo "Large dependencies found: $large_deps"
else
    echo "✅ No problematic large dependencies detected"
fi)

### Configuration
$perf_config

### Recommendations
- Consider implementing caching strategies
- Review database query performance
- Monitor memory usage in production
- Set up performance monitoring

### Issues Found
$(if [[ -n "$issues" ]]; then echo -e "$issues"; else echo "No issues found"; fi)
EOF
    )" "$status"
    
    return $([ "$status" = "FAILED" ] && echo 1 || echo 0)
}

# Generate final report
generate_final_report() {
    local overall_status="$1"
    local failed_checks="$2"
    local warning_checks="$3"
    
    log_info "Generating final deployment readiness report..."
    
    # Update summary
    local summary_content="$(cat << EOF
### Overall Status: $(if [[ "$overall_status" == "PASSED" ]]; then echo "✅ READY FOR DEPLOYMENT"; elif [[ "$overall_status" == "WARNING" ]]; then echo "⚠️ READY WITH WARNINGS"; else echo "❌ NOT READY FOR DEPLOYMENT"; fi)

### Check Results Summary
- ✅ Passed: $((7 - $(echo "$failed_checks" | wc -w) - $(echo "$warning_checks" | wc -w))) checks
- ⚠️ Warnings: $(echo "$warning_checks" | wc -w) checks  
- ❌ Failed: $(echo "$failed_checks" | wc -w) checks

$(if [[ -n "$failed_checks" ]]; then
    echo "### Failed Checks"
    for check in $failed_checks; do
        echo "- ❌ $check"
    done
fi)

$(if [[ -n "$warning_checks" ]]; then
    echo "### Warning Checks"  
    for check in $warning_checks; do
        echo "- ⚠️ $check"
    done
fi)

### Next Steps
$(if [[ "$overall_status" == "PASSED" ]]; then
    echo "🚀 **Ready to deploy!**"
    echo "- All critical checks passed"
    echo "- Monitor the application after deployment"
    echo "- Set up production monitoring and alerting"
elif [[ "$overall_status" == "WARNING" ]]; then
    echo "⚠️ **Proceed with caution**"
    echo "- Address warning items when possible"
    echo "- Monitor closely after deployment"
    echo "- Plan to resolve warnings in next release"
else
    echo "🛑 **Do not deploy**"
    echo "- Fix all failed checks before deployment"
    echo "- Re-run this script after fixes"
    echo "- Consider staging environment testing"
fi)
EOF
    )"
    
    # Insert summary at the beginning of the report
    local temp_file=$(mktemp)
    {
        head -n 7 "$REPORT_FILE"
        echo "$summary_content"
        tail -n +8 "$REPORT_FILE"
    } > "$temp_file"
    mv "$temp_file" "$REPORT_FILE"
    
    log_success "Final report generated: $REPORT_FILE"
}

# Main execution
main() {
    echo "=== Pre-Deployment Check Script ==="
    echo "Comprehensive validation before deployment to production."
    echo
    
    # Initialize
    init_report
    
    local overall_status="PASSED"
    local failed_checks=""
    local warning_checks=""
    
    # Run all checks
    local checks=(
        "System Requirements:check_system_requirements"
        "Dependencies:check_dependencies"
        "Tests:check_tests" 
        "Code Quality:check_code_quality"
        "Environment:check_environment"
        "Database:check_database"
        "Build Process:check_build"
        "Performance:check_performance"
    )
    
    for check_info in "${checks[@]}"; do
        local check_name="${check_info%%:*}"
        local check_function="${check_info##*:}"
        
        echo "=========================================="
        log_check "Running $check_name check..."
        
        if $check_function; then
            log_success "$check_name check passed"
        else
            local exit_code=$?
            if [[ $exit_code -eq 1 ]]; then
                log_error "$check_name check failed"
                failed_checks="$failed_checks $check_name"
                overall_status="FAILED"
            else
                log_warning "$check_name check completed with warnings"
                warning_checks="$warning_checks $check_name"
                if [[ "$overall_status" != "FAILED" ]]; then
                    overall_status="WARNING"
                fi
            fi
        fi
        
        echo
    done
    
    # Generate final report
    generate_final_report "$overall_status" "$failed_checks" "$warning_checks"
    
    echo "=========================================="
    echo
    
    # Final summary
    if [[ "$overall_status" == "PASSED" ]]; then
        log_success "🚀 All checks passed! Ready for deployment."
        echo
        echo "Deployment checklist completed successfully:"
        echo "✅ System requirements met"
        echo "✅ Dependencies secure and up-to-date"
        echo "✅ All tests passing"
        echo "✅ Code quality standards met"
        echo "✅ Environment properly configured"
        echo "✅ Database connectivity verified"
        echo "✅ Build process successful"
        echo "✅ Performance analysis complete"
        echo
        log_info "Detailed report: $REPORT_FILE"
        exit 0
        
    elif [[ "$overall_status" == "WARNING" ]]; then
        log_warning "⚠️ Deployment ready with warnings."
        echo
        echo "Warning items detected:"
        for check in $warning_checks; do
            echo "  ⚠️ $check"
        done
        echo
        log_info "Review warnings and consider addressing them."
        log_info "Detailed report: $REPORT_FILE"
        exit 0
        
    else
        log_error "❌ Deployment not recommended!"
        echo
        echo "Critical issues detected:"
        for check in $failed_checks; do
            echo "  ❌ $check"
        done
        echo
        echo "Please fix all failed checks before deployment."
        log_error "Detailed report: $REPORT_FILE"
        exit 1
    fi
}

# Run the script
main "$@"
