# Assets Images Directory

This directory is for images that are **imported** in your React components (processed by Vite's build system).

## Usage

Import images in your components:

```tsx
import logo from '@/assets/images/logo.png';

function Header() {
  return <img src={logo} alt="Logo" />;
}
```

## When to use `/public/images` vs `/src/assets/images`

### Use `/public/images` when:
- ✅ You need a stable URL that doesn't change
- ✅ The image is referenced in HTML meta tags
- ✅ You want to reference it in CSS
- ✅ You need the exact filename preserved

### Use `/src/assets/images` when:
- ✅ You want Vite to optimize the image
- ✅ The image is only used in React components
- ✅ You want cache-busting (filename hashing)
- ✅ You want smaller bundles (Vite may inline small images)

## Recommendation
For **logos and brand assets**, use `/public/images/logos/`  
For **component-specific images**, use `/src/assets/images/`

