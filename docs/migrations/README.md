# Migrations Documentation

This directory contains documentation for standalone database migrations that are not part of CRUD module generation.

## 📋 Migration Types

### 1. **CRUD Module Migrations**

Migrations created as part of CRUD generation are documented in their respective module READMEs:

- Location: `docs/modules/{domain-name}-README.md`
- Section: "Migration History"

### 2. **Standalone Migrations**

Independent schema changes, performance improvements, or maintenance migrations:

- Location: `docs/migrations/migration-{number}-{description}.md`
- Purpose: Structural changes, indexes, performance optimizations

## 🗃️ Current Migrations

### Core Schema (Existing)

- **Migration 0000-0006**: Initial project setup and auth system
- Location: `src/external/drizzle/migrations/`

### Standalone Migrations

_When standalone migrations are created, their documentation will appear here._

## 📝 When to Create Migration Documentation

Create migration documentation when:

- ✅ **Standalone Migration**: Not part of CRUD module generation
- ✅ **Schema Restructure**: Major changes to existing tables
- ✅ **Performance Migration**: Adding indexes, constraints for optimization
- ✅ **Maintenance Migration**: Cleanup, data migration, or fixes
- ✅ **Breaking Changes**: Changes that affect existing functionality

Don't create separate migration docs when:

- ❌ **CRUD Module Creation**: Handled by module README
- ❌ **Minor Column Addition**: Within module's evolution
- ❌ **Simple Index**: Part of module's normal development

## 🔄 Documentation Process

### For AI-Generated Migrations

1. **Check Migration Type**: Determine if standalone or part of CRUD
2. **Create Documentation**: Use template from AI-SPEC-MIGRATE.md
3. **Include Testing**: Document validation and rollback plans
4. **Link References**: Connect to related code changes

### Template Location

See `docs/ai-specs/ai-spec-migrate.md` for the complete migration documentation template.

## 📚 Migration History Tracking

### Project Migration Timeline

- **Phase 1**: Initial setup (Migrations 0000-0002)
- **Phase 2**: Authentication system (Migrations 0003-0006)
- **Phase 3**: Posts management (Part of posts module)
- **Phase 4+**: Future modules and optimizations

### File Organization

```text
docs/migrations/
├── README.md                                    # This file
├── migration-{number}-{description}.md          # Standalone migration docs
└── [future migration documentation]
```

### Related Files

```text
src/external/drizzle/migrations/
├── {number}_{description}.sql                   # Actual migration files
├── meta/
│   ├── _journal.json                           # Migration journal
│   └── {number}_snapshot.json                  # Schema snapshots
```

## 🎯 Benefits

Migration documentation provides:

- **Change History**: Complete record of database evolution
- **Rollback Plans**: How to undo changes if needed
- **Impact Assessment**: Understanding of change scope
- **Testing Records**: Validation that migrations work correctly
- **Maintenance Guide**: Context for future developers

## 🚀 Getting Started

1. **Review Existing**: Check `src/external/drizzle/migrations/` for applied migrations
2. **Plan Changes**: Use AI-SPEC-MIGRATE.md for guidance
3. **Generate Migration**: Use `bun run db:generate`
4. **Document Changes**: Create migration documentation if standalone
5. **Apply Migration**: Use `bun run db:migrate`
6. **Validate Results**: Test and document outcomes

---

**Directory Purpose**: Standalone migration documentation  
**Auto-Generated**: Via AI-SPEC-MIGRATE when needed  
**Last Updated**: [Current Date]
