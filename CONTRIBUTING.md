# Contributing to WhenYahType

Thank you for your interest in contributing to **WhenYahType**! We welcome bug fixes, documentation improvements, performance optimizations, and new memes.

## Development Workflow

1. Fork the repository and create your feature branch:
   ```bash
   git checkout -b feature/amazing-improvement
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Run tests and type check before submitting:
   ```bash
   npm test
   npm run build
   ```

## Anti-Cheat & Determinism Guidelines

- The typing phrase generator in `src/lib/generator.ts` and `supabase/functions/_shared/generator.ts` must maintain exact 1:1 character and seed determinism.
- Never accept client-calculated WPM or accuracy directly on server endpoints.
- If modifying database views or tables, always create a timestamped SQL migration in `supabase/migrations/`.

## Pull Request Guidelines

- Ensure all Vitest tests pass (`npm test`).
- Ensure TypeScript strict type checking passes (`npm run build`).
- Keep commit messages clear, descriptive, and focused.
