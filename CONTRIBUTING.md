# Contributing to Crab Portfolio

First off, thank you for considering contributing to Crab Portfolio! 🦀

## Code of Conduct

This project and everyone participating in it is governed by a spirit of respect and collaboration. Please be kind and courteous.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (screenshots, code snippets)
- **Describe the behavior you observed** and what you expected
- **Include your environment** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List some examples** of how it would be used

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the existing code style** (TypeScript, ESLint, Prettier)
3. **Write clear commit messages** using conventional commits format:
   - `feat: add new easter egg animation`
   - `fix: correct collision detection on Desk`
   - `docs: update README with new controls`
   - `perf: optimize Three.js rendering loop`
   - `refactor: simplify CrabController logic`
   - `test: add unit tests for useInteraction hook`
4. **Test your changes** thoroughly:
   - Run `pnpm run dev` and test in browser
   - Check console for errors/warnings
   - Verify 60 FPS performance is maintained
   - Test on multiple browsers if possible
5. **Update documentation** if you're adding/changing features
6. **Create a Pull Request** with a clear description of changes

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/crab_portfolio.git
cd crab_portfolio

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure Guidelines

### File Organization

- Place new 3D entities in `src/entities/`
- Place new UI components in `src/ui/components/`
- Place new hooks in `src/hooks/`
- Place new interactions in `src/interactions/`
- Place 3D models in `public/models/`
- Place sounds in `public/sounds/`

### Naming Conventions

- **Components**: PascalCase (`Computer.tsx`, `InfoPanel.tsx`)
- **Hooks**: camelCase with `use` prefix (`useKeyboard.ts`, `useInteraction.ts`)
- **Utilities**: camelCase (`constants.ts`, `performance.ts`)
- **Types**: PascalCase (`ProjectContent`, `CrabState`)

### Code Style

#### TypeScript

- Use strict type checking
- Avoid `any` types - use proper typing
- Document complex types with JSDoc comments
- Use interfaces for object shapes
- Use type aliases for unions/primitives

#### React Components

```typescript
import { useState, useEffect } from 'react';

interface MyComponentProps {
  title: string;
  isVisible?: boolean;
}

/**
 * MyComponent - Brief description
 *
 * Detailed description if needed
 */
export function MyComponent({ title, isVisible = true }: MyComponentProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Effect logic
  }, []);

  return (
    <div className="container">
      <h1>{title}</h1>
    </div>
  );
}
```

#### Three.js Components

```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

export function My3DObject() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}
```

### Performance Guidelines

1. **Keep polygon count under 100k total**
2. **Use MeshToonMaterial for low poly style**
3. **Implement LOD (Level of Detail) for complex models**
4. **Lazy load non-critical 3D models**
5. **Optimize textures** (use compressed formats, power-of-2 dimensions)
6. **Avoid expensive operations in useFrame**
7. **Profile with React DevTools and browser Performance tab**

### Accessibility Guidelines

1. **Add ARIA labels** to interactive elements
2. **Ensure keyboard navigation** works (Tab, Enter, Esc)
3. **Maintain focus management** in modals
4. **Provide alt text** for images
5. **Use semantic HTML** where possible
6. **Test with screen readers** (NVDA, JAWS, VoiceOver)

### Testing

- Test in **Chrome, Firefox, Safari, Edge**
- Test on **mobile devices** (virtual joystick)
- Verify **WebGL fallback** works when WebGL disabled
- Check **console for warnings/errors**
- Validate **bundle size** stays under 500KB gzipped

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```markdown
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**

```markdown
feat(crab): add sprint animation when holding Shift

fix(collision): prevent crab from clipping through desk corners

docs(readme): add mobile controls section

perf(scene): reduce draw calls by batching static meshes
```

## Questions?

Feel free to open an issue with the `question` label if you need help or clarification.

## Attribution

This Contributing Guide is adapted from open source contribution guidelines.

Thank you for contributing! 🦀✨
