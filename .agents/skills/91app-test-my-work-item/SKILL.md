```markdown
# 91app-test-my-work-item Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill outlines the development conventions and workflows for the `91app-test-my-work-item` repository, a TypeScript codebase with no detected framework. It covers file organization, code style, commit practices, and testing patterns to ensure consistency and maintainability.

## Coding Conventions

### File Naming
- Use **kebab-case** for all file names.
  - Example:  
    ```
    my-component.ts
    user-service.test.ts
    ```

### Import Style
- Use **relative imports** for referencing local modules.
  - Example:
    ```typescript
    import { fetchUser } from './user-service';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // user-service.ts
    export function fetchUser(id: string) { ... }
    ```

### Commit Messages
- Follow **Conventional Commits**.
- Use the `docs` prefix for documentation-related changes.
  - Example:
    ```
    docs: update README with usage examples
    ```

## Workflows

### Documentation Update
**Trigger:** When updating or adding documentation files.
**Command:** `/update-docs`

1. Make your documentation changes in the appropriate file(s).
2. Stage your changes:
    ```
    git add <doc-file>
    ```
3. Commit using the conventional `docs` prefix:
    ```
    git commit -m "docs: <description of change>"
    ```
4. Push your changes:
    ```
    git push
    ```

## Testing Patterns

- Test files follow the `*.test.*` naming convention.
  - Example:  
    ```
    user-service.test.ts
    ```
- Testing framework is **unknown**; check existing test files for framework-specific patterns.
- Place test files alongside the modules they test or in a dedicated test directory.

## Commands
| Command       | Purpose                                 |
|---------------|-----------------------------------------|
| /update-docs  | Standardize documentation update workflow |

```