# Images Directory

This directory contains static images that are served directly by the application.

## Directory Structure

### `/logos`
Place your company logos and brand assets here:
- `logo.png` or `logo.svg` - Main application logo
- `logo-dark.png` - Dark version of the logo (for dark mode)
- `logo-icon.png` - Icon-only version (for favicons, mobile)

### `/icons`
Place custom icons and graphics here:
- App-specific icons
- Custom illustrations
- Feature graphics

## Usage

Reference these images in your code using absolute paths:

```tsx
// In React components
<img src="/images/logos/logo.png" alt="Logo" />

// In CSS
background-image: url('/images/logos/logo.png');
```

## Recommended Formats
- **Logos**: SVG (preferred) or PNG with transparency
- **Icons**: SVG for scalability
- **Photos**: JPG for photographs, PNG for graphics with transparency
- **Favicon**: ICO or PNG (place in `/public` root)

## File Naming
Use lowercase with hyphens:
- ✅ `company-logo.png`
- ✅ `user-avatar-default.svg`
- ❌ `CompanyLogo.png`
- ❌ `user_avatar_default.svg`


