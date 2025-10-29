# 🌳 FamilyWall - Multi-Tenant Family Tree Platform

<div align="center">

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?style=for-the-badge&logo=framer)
![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)

**A Professional Multi-Tenant Family Tree Platform with Custom Subdomains**

**Each family gets their own custom URL: `yourfamily.familywall.in`**

[🔗 Live Platform](https://familywall.in) • [📖 Setup Guide](./MULTI_TENANT_SETUP.md) • [🏗️ Architecture](./ARCHITECTURE.md)

</div>

---

## 📖 Table of Contents

- [✨ Features](#-features)
- [🎨 Themes & Design](#-themes--design)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🌐 Live Platform](#-live-platform)
- [⚙️ Configuration](#️-configuration)
- [🗄️ Database Schema](#️-database-schema)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🔒 Security](#-security)
- [📱 User Guide](#-user-guide)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 🏢 **Multi-Tenant Architecture**

- **Custom Subdomains** - Each family gets their own URL (e.g., `smith.familywall.in`)
- **Isolated Data** - Complete data separation between families using PostgreSQL RLS
- **Independent Admins** - Each family has their own admin account with full control
- **Scalable Design** - Support unlimited families on one platform
- **Auto-Generated URLs** - Subdomain automatically created from family name

### 🏠 **Multi-Route Experience**

1. **Root Domain** (`familywall.in`) - Landing page for new visitors
2. **Registration** (`familywall.in/register`) - Create new family tree
3. **Family Subdomains** (`smith.familywall.in`) - Individual family tree views
4. **Private Mode** - Show "This tree is private" for non-existent families

### 👥 **Advanced Family Management**

- **Smart Positioning Algorithm** - Intelligent family-based positioning that groups children with parents
- **Gender-Based Styling** - Visual distinction with blue (male) and pink (female)
- **Comprehensive Member Profiles** - Full names, dates of birth/death, marriage details, birth stars
- **Photo Management** - Upload and crop profile photos with live preview
- **Living Status Tracking** - Clear indicators for living/deceased family members
- **Relationship Mapping** - Visual connection lines showing parent-child relationships

### 🎨 **6 Beautiful Themes** (Admin-Only Control)

1. **Classic** - Warm amber tones (default)
2. **Ocean** - Cool blue palette
3. **Forest** - Natural green theme
4. **Royal** - Elegant purple design
5. **Sunset** - Vibrant orange and pink
6. **Slate** - Modern gray aesthetic

### 🖼️ **6 Doodle Pattern Styles**

- **Family** - Hearts, houses, and trees
- **Minimal** - Simple geometric shapes
- **Geometric** - Modern patterns
- **Floral** - Nature-inspired designs
- **Stars** - Celestial elements
- **None** - Clean solid background

### 🔐 **Security & Access Control**

- **Admin Authentication** - Secure login for family administrators
- **Public View** - Anyone can view the tree
- **Admin-Only Editing** - Only admins can modify tree structure
- **Password Protection** - bcrypt hashing for admin passwords
- **Row Level Security** - Database-level access control via Supabase RLS

### 🎯 **Additional Features**

- **Error Boundaries** - Graceful error handling with recovery
- **Form Validation** - Real-time input validation with helpful error messages
- **Success Messages** - User-friendly feedback with auto-close notifications
- **Mobile Responsive** - Full mobile support with touch interactions
- **Dark/Light Mode Ready** - Theme system supports both
- **Auto-Save Functionality** - Changes automatically saved to cloud database

---

## 🎨 Themes & Design

### Theme System

Admins can switch between 6 professionally designed color themes that affect:

- Canvas background colors
- UI component colors (modals, buttons, forms)
- Loading screen theme
- Error page styling
- All interactive elements

### Design Principles

- **Scandinavian Design** - Clean, minimalist aesthetic with soft shadows
- **Responsive Layout** - Seamless experience across desktop, tablet, and mobile
- **Warm Color Palette** - Amber, orange, and cream tones creating a heritage atmosphere
- **Google Fonts Integration** - Playfair Display for names, Inter for UI elements
- **Smooth Animations** - Framer Motion powered transitions and hover effects

### Doodle Patterns

Background patterns add visual interest without overwhelming content:

- **Opacity Control** - 18-25% opacity for subtle effect
- **Zoom Integration** - Patterns zoom with canvas
- **Theme Matching** - Colors adapt to selected theme
- **Performance Optimized** - SVG patterns for smooth rendering

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18.2.0 - Modern hooks-based architecture
- Tailwind CSS 3.3.0 - Utility-first styling
- Framer Motion 10.16.16 - Smooth animations
- Lucide React - Beautiful icon system
- React Image Crop - Image editing utilities

**Backend:**
- Supabase 2.38.4 - PostgreSQL database with authentication
- Row Level Security (RLS) - Database-level access control
- PostgreSQL Functions - Server-side business logic
- RESTful API - Supabase auto-generated API

**Deployment:**
- Vercel - Recommended for wildcard subdomain support
- Netlify / AWS Amplify - Alternative options
- SSL - Automatic HTTPS via platform providers

### Multi-Tenant System

```
Root Domain (familywall.in)
├── Landing Page (public)
├── Registration (public)
└── Family Subdomains
    ├── smith.familywall.in
    ├── johnson.familywall.in
    └── garcia.familywall.in
```

**Subdomain Routing Flow:**

1. User visits subdomain (e.g., `smith.familywall.in`)
2. Frontend detects subdomain via `window.location.hostname`
3. Database lookup finds family by subdomain
4. Tree data loaded for that family only
5. RLS policies ensure data isolation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn package manager
- Supabase account (free tier available)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/family-tree.git
cd family-tree
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Run the database migration script in `db/schema.sql`
   - Create RPC functions from `db/rpc_functions.sql`
   - Enable Row Level Security policies

   📖 **Detailed instructions**: See [db/README.md](./db/README.md)

4. **Configure environment variables**

```bash
# Create .env.local file
echo "REACT_APP_SUPABASE_URL=your_supabase_url" >> .env.local
echo "REACT_APP_SUPABASE_ANON_KEY=your_supabase_key" >> .env.local
```

5. **Configure local subdomains (for testing)**

```bash
# Edit your hosts file
sudo nano /etc/hosts

# Add test subdomains
127.0.0.1 smith.localhost
127.0.0.1 johnson.localhost
```

6. **Start development server**

```bash
npm start
```

7. **Test the platform**

- Landing page: `http://localhost:3000`
- Registration: `http://localhost:3000/register`
- After creating "Smith" family: `http://smith.localhost:3000`
- Admin login: Click lock icon on `http://smith.localhost:3000`

---

## 🌐 Live Platform

**Platform URL**: [https://familywall.in](https://familywall.in)

### How It Works

1. **Visit** `familywall.in` → Beautiful landing page
2. **Click** "Get Started" → Go to `/register`
3. **Fill** registration form (validated in real-time)
4. **Get** custom URL like `smith.familywall.in`
5. **Share** your URL with family members
6. **Login** as admin to manage your tree

### Example Families

- `smith.familywall.in` - Smith Family Tree
- `johnson.familywall.in` - Johnson Family Tree
- `garcia.familywall.in` - Garcia Family Tree

---

## ⚙️ Configuration

### Supabase Setup

**Tables Required:**

- `families` - Family metadata and settings
- `family_trees` - Tree structure data
- `admins` - Admin credentials

**RPC Functions:**

- `create_initial_admin` - Register new family
- `get_family_by_subdomain` - Fetch family data
- `verify_admin_login` - Authenticate admin
- `update_family_theme` - Change theme
- `update_family_pattern` - Change doodle pattern

### DNS Configuration

**For Production:**

1. Add A record: `@` → Your server IP
2. Add wildcard A record: `*` → Your server IP
3. Enable SSL for wildcard domain

**Vercel Example:**

```
yourfamily.com → Vercel DNS
*.yourfamily.com → Vercel DNS
```

### Environment Variables

```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🗄️ Database Schema

### families

```sql
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  surname VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  theme VARCHAR(50) DEFAULT 'classic',
  pattern VARCHAR(50) DEFAULT 'family',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### family_trees

```sql
CREATE TABLE family_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  members JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### admins

```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test App.test.js
```

### Test Coverage

- ✅ **Component Rendering** - All major components tested
- ✅ **Form Validation** - Input validation and error handling
- ✅ **Service Layer** - Database operations and API calls
- ✅ **Error Boundaries** - Crash recovery and error states

**Current Coverage:**

- **Statements**: 14.16%
- **Branches**: 4.91%
- **Functions**: 5.43%
- **Lines**: 14.16%

### Writing Tests

```javascript
import { render, screen } from '@testing-library/react';
import InitialSetup from './InitialSetup';

test('renders registration form', () => {
  render(<InitialSetup onSetupComplete={() => {}} />);
  expect(screen.getByText('Welcome!')).toBeInTheDocument();
});
```

---

## 🚢 Deployment

### **Vercel (Recommended)** ✅ Production Ready

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Deploy to Vercel**

```bash
vercel --prod
```

3. **Configure Domains in Vercel**

   - Go to Project Settings → Domains
   - Add: `familywall.in`
   - Add: `*.familywall.in` (wildcard)

4. **Configure DNS**

```
Type: A
Name: @
Value: 76.76.21.21

Type: A
Name: *
Value: 76.76.21.21
```

5. **Test**

   - Root: `https://familywall.in`
   - Subdomain: `https://smith.familywall.in`

### **Alternative Hosting**

#### Netlify

```bash
npm run build
# Upload build/ folder
# Configure wildcard domain in Netlify settings
```

#### Traditional VPS

```bash
npm run build
# Configure Nginx/Apache for:
# - Wildcard subdomain support
# - SPA routing
# - HTTPS with Let's Encrypt
```

📖 **Full deployment guide**: See [MULTI_TENANT_SETUP.md](./MULTI_TENANT_SETUP.md)

---

## 🔒 Security

### Security Features

- **Data Isolation** - Each family's data is completely separate
- **Subdomain Security** - No cross-family data access
- **Password Hashing** - Bcrypt encryption for admin passwords
- **Email Validation** - Globally unique admin emails
- **RLS Support** - Row Level Security can be enabled in Supabase
- **Secure Functions** - Database functions run with proper permissions

### Public Repository Security

This is an **open-source project** safe for public GitHub repositories:

**✅ Safe to Commit:**

- **SQL Schema Files** (`db/schema.sql`, `db/migrations/*.sql`) - Only table structures and functions, no credentials
- **Frontend Code** - Public by design, no secrets in React code
- **Configuration Templates** - Example files without real credentials

**❌ Never Commit:**

- **`.env.local`** - Contains your Supabase URL and API keys (already in `.gitignore`)
- **Environment Variables** - Any file with `REACT_APP_SUPABASE_*` values
- **Admin Passwords** - All passwords are hashed in database
- **API Keys** - Keep Supabase keys in environment variables only

**Security Checklist:**

- ✅ `.gitignore` configured to exclude `.env.local` and `.env.*`
- ✅ SQL files contain no credentials (just schema definitions)
- ✅ Supabase keys stored in environment variables only
- ✅ Database passwords hashed with bcrypt
- ✅ Row Level Security policies in place
- ✅ No hardcoded secrets in source code

---

## 📱 User Guide

### For New Families

1. **Visit** `familywall.in`
2. **Click** "Create Your Family Tree"
3. **Fill in:**
   - Family name (e.g., "Smith")
   - Admin username
   - Email address
   - Password
4. **Get your URL** (e.g., `smith.familywall.in`)
5. **Share** the URL with family members

### For Administrators

**Quick Access from Homepage:**

1. Visit `familywall.in`
2. Click "Admin Login" button (header or search section)
3. Enter your family subdomain and credentials
4. Auto-redirected to your admin panel with full editing access

**Login from Your Family's Subdomain:**

1. Visit your family's subdomain (e.g., `smith.familywall.in`)
2. Click "Admin Login" (lock icon)
3. Enter credentials
4. Full admin panel access enabled

**Add Family Members:**

1. Click "+" button on canvas
2. Enter name, birth year, optional death year
3. Select parent (if applicable)
4. Upload optional photo
5. Save

**Change Theme:**

1. Click settings icon
2. Select from 6 themes
3. Changes apply instantly

### For Public Visitors

**Search for a Family Tree:**

1. Visit `familywall.in`
2. In the "Search Family Tree" section, enter the surname
3. Press Search
4. Directed to that family's public tree (if it exists)

**Direct URL Access:**

- Visit `familyname.familywall.in` directly
- Example: `smith.familywall.in`
- View public family tree without login
- Contact admin if tree is not yet set up

**View Family Members:**

1. Zoom with mouse wheel
2. Pan by dragging canvas
3. Click members to see details
4. No login required for public view

---

## 📂 Project Structure

```
family-tree/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   │   ├── ErrorBoundary.js
│   │   └── InitialSetup.js
│   ├── pages/              # Page components
│   │   └── LandingPage.js
│   ├── services/           # Business logic
│   │   └── familyTreeService.js
│   ├── utils/              # Helper functions
│   │   └── subdomain.js
│   ├── __mocks__/          # Test mocks
│   ├── App.js              # Main application
│   ├── index.js            # Entry point
│   └── supabaseClient.js   # Database connection
├── db/                     # Database scripts
│   ├── schema.sql
│   └── rpc_functions.sql
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Style

- Follow ESLint rules
- Use Prettier for formatting
- Write tests for new features
- Update documentation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure
- **React Team** - Frontend framework
- **Tailwind Labs** - CSS framework
- **Framer** - Animation library
- **Lucide** - Icon system

---

## 📞 Support

- 🌐 **Website**: [familywall.in](https://familywall.in)
- 📧 **Email**: support@familywall.in
- 📖 **Documentation**: See docs folder and inline code comments
- 💬 **Issues**: [GitHub Issues](https://github.com/yourusername/family-tree/issues)

---

## 🗺️ Roadmap

### Completed ✅

- Multi-tenant architecture
- Theme system (6 themes)
- Doodle patterns (6 styles)
- Admin authentication
- Family tree CRUD operations
- Responsive design
- Error handling
- Test suite foundation
- Photo uploads with cropping
- Auto-close notifications
- Parent-child relationship management

### Planned 🎯

- Relationship types (sibling, cousin, etc.)
- Export tree as PDF/image
- Email invitations
- Activity history
- Advanced search
- Mobile app
- Multi-language support
- Social sharing features

---

<div align="center">

**Made with ❤️ for families everywhere**

⭐ Star this repo if you find it helpful!

**Developed by [OneMark.co.in](https://onemark.co.in)**

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Styled with Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

</div>
