# Contributing to Restaurant Ordering System

First off, thanks for taking the time to contribute! 🎉

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues. When you create a bug report, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots if applicable
- Your environment (OS, browser, .NET version)

### Suggesting Features

We love feature suggestions! Please:

1. Search existing issues first
2. Use a clear, descriptive title
3. Explain the problem your feature solves
4. Include example usage if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `dotnet test` (backend) / `bun run test` (frontend)
6. Commit with [conventional commit messages](https://www.conventionalcommits.org/)
7. Push to your fork and open a Pull Request

### Code Style

- **C#**: Follow [.NET coding conventions](https://learn.microsoft.com/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- **TypeScript**: Follow the project's [oxlint](https://oxc.rs) + [oxfmt](https://oxc.rs) config
- **Formatting**: `dotnet format` (backend) / `bun run format` (frontend)

### Commit Convention

```
feat: add real-time kitchen timer
fix: resolve order cancellation race condition
docs: update API reference for payments
test: add integration tests for menu controller
chore: update dependency versions
```
