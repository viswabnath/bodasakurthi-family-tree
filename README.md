# 🌳 Bodasakurthi Family Tree Heritage

<div align="center">

![Family Tree](https://img.shields.io/badge/Family%20Tree-Heritage%20Wall-amber?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuNzUgOC4yNUwyMC41IDE2TDEyIDIyTDMuNSAxNkw4LjI1IDguMjVMMTIgMloiIGZpbGw9ImN1cnJlbnRDb2xvciIvPgo8L3N2Zz4K)
![Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)
![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?style=for-the-badge&logo=framer)

**A Professional Interactive Family Tree Application with Scandinavian Design**

[🔗 Live Demo](https://bodasakurthi-family-tree-viswanath-bodasakurthis-projects.vercel.app) • [📖 Documentation](./DEPLOYMENT.md) • [🐛 Report Bug](https://github.com/viswabnath/bodasakurthi-family-tree/issues)

</div>

## ✨ Features

### 🏠 **Multi-Mode Experience**
- **🌍 Public View** (`/`) - Beautiful family tree visualization accessible to everyone
- **👑 Admin Panel** (`/admin`) - Secure management interface with full editing capabilities  
- **🚀 Setup Wizard** (`/register`) - Guided family tree creation for new users

### 🎨 **Scandinavian Design System**
- **Elegant Aesthetics** - Clean, minimalist design with soft shadows and rounded corners
- **Responsive Layout** - Seamless experience across desktop, tablet, and mobile devices
- **Warm Color Palette** - Amber, orange, and cream tones creating a heritage atmosphere
- **Google Fonts Integration** - Playfair Display for names, Inter for UI elements
- **Smooth Animations** - Framer Motion powered transitions and hover effects

### 👥 **Advanced Family Management**
- **Smart Positioning Algorithm** - Intelligent family-based positioning that groups children with parents
- **Gender-Based Styling** - Visual distinction with blue squares (male) and pink circles (female)
- **Comprehensive Member Profiles** - Full names, dates of birth/death, marriage details, birth stars
- **Photo Management** - Upload and crop profile photos with live preview
- **Living Status Tracking** - Clear indicators for living/deceased family members
- **Relationship Mapping** - Visual connection lines showing parent-child relationships

### 🔐 **Security & Administration**
- **Role-Based Access** - Public viewing vs. admin editing permissions
- **Secure Authentication** - Username/password based admin login system
- **Database Integration** - Supabase backend with Row Level Security (RLS)
- **Auto-Save Functionality** - Changes automatically saved to cloud database
- **Error Boundaries** - Graceful error handling with recovery options

### 🎯 **Interactive Features**
- **Detailed Person Cards** - Click any family member to view comprehensive information
- **Zoom & Pan Controls** - Google Maps style navigation with zoom controls
- **Form Validation** - Real-time validation with helpful error messages
- **Photo Cropping** - Built-in image cropping tool for profile pictures
- **Responsive Modals** - Beautiful overlay dialogs for adding/editing members

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager
- Supabase account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/viswabnath/bodasakurthi-family-tree.git
   cd bodasakurthi-family-tree
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create .env.local file
   echo "REACT_APP_SUPABASE_URL=your_supabase_url" >> .env.local
   echo "REACT_APP_SUPABASE_ANON_KEY=your_supabase_key" >> .env.local
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

5. **Open in Browser**
   ```
   http://localhost:3000
   ```

## 🌐 Live Application

Your family tree application is live and accessible at:
**[https://bodasakurthi-family-tree-viswanath-bodasakurthis-projects.vercel.app](https://bodasakurthi-family-tree-viswanath-bodasakurthis-projects.vercel.app)**

### Try the Different Modes:
- **🏠 Public View**: Visit the main URL to see the family tree
- **👑 Admin Access**: Add `/admin` to login and manage the tree
- **🚀 Setup New Tree**: Add `/register` to create a new family tree

## 🌐 Application Routes

| Route | Purpose | Access Level |
|-------|---------|-------------|
| `/` | Public family tree view | 🌍 Everyone |
| `/admin` | Admin login & management | 👑 Admin Only |
| `/register` | Create new family tree | 🚀 Setup Only |

## 🏗️ Architecture & Technology Stack

### **Frontend Stack**
```json
{
  "framework": "React 18.2.0",
  "styling": "Tailwind CSS with custom Scandinavian theme",
  "animations": "Framer Motion 10.16.16",
  "ui_components": "Headless UI + Lucide React icons",
  "image_handling": "React Image Crop",
  "routing": "React Router DOM",
  "testing": "Jest + React Testing Library"
}
```

### **Backend & Infrastructure**
```json
{
  "database": "Supabase PostgreSQL",
  "authentication": "Custom admin system with RLS",
  "storage": "Supabase Storage (for photos)",
  "deployment": "Vercel/Netlify ready",
  "monitoring": "Web Vitals integration"
}
```

### **Design System**
```json
{
  "colors": {
    "primary": "Amber family (#F59E0B, #D97706, #92400E)",
    "secondary": "Orange accents (#EA580C, #C2410C)",
    "background": "Soft creams (#FEF3C7, #FDE68A)",
    "text": "Deep browns (#451A03, #92400E)"
  },
  "typography": {
    "heading": "Playfair Display (serif)",
    "body": "Inter (sans-serif)"
  },
  "spacing": "Tailwind default with custom extensions"
}
```

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

## 📦 Building for Production

```bash
# Create production build
npm run build

# Analyze bundle size
npx webpack-bundle-analyzer build/static/js/*.js

# Test production build locally
npx serve -s build
```

## 🚀 Deployment Options

### **Vercel (Recommended)** ✅ Currently Deployed
```bash
npm install -g vercel
vercel --prod
```

**Live Example**: [bodasakurthi-family-tree-viswanath-bodasakurthis-projects.vercel.app](https://bodasakurthi-family-tree-viswanath-bodasakurthis-projects.vercel.app)

### **Netlify**
```bash
npm run build
# Upload build/ folder to Netlify
```

### **Traditional Hosting**
```bash
npm run build
# Upload build/ contents to web server
# Configure server for SPA routing
```

## 🎨 Key Components

### **Family Tree Visualization**
- `renderPersonCard()` - Individual family member cards with photos and details
- `renderConnections()` - SVG lines showing family relationships
- Smart positioning algorithm that groups families together

### **Admin Management**
- `InitialSetup.js` - First-time setup wizard for new family trees
- Form validation with real-time feedback
- Photo upload and cropping functionality

### **Database Layer**
- `familyTreeService.js` - Complete API abstraction layer
- Supabase integration with error handling
- Auto-save functionality with status indicators

## 🔧 Configuration

### **Environment Variables**
```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Tailwind Configuration**
Custom theme with Scandinavian color palette and extended spacing system.

### **Database Schema**
- `family_trees` - Main family data storage
- `admin_users` - Admin authentication
- Row Level Security (RLS) enabled

## 📱 Mobile Experience

- **Responsive Design** - Optimized for all screen sizes
- **Touch Interactions** - Mobile-friendly zoom and pan
- **Progressive Enhancement** - Core features work without JavaScript
- **Performance Optimized** - Fast loading on mobile networks

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Design Inspiration** - Scandinavian minimalism and heritage themes
- **Icons** - Lucide React icon library
- **Animations** - Framer Motion for smooth interactions
- **Database** - Supabase for backend infrastructure

## 📞 Support

- 📧 **Email**: your-email@domain.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/viswabnath/bodasakurthi-family-tree/issues)
- 📖 **Documentation**: [Deployment Guide](./DEPLOYMENT.md)

---

<div align="center">

**Built with ❤️ for preserving family heritage**

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Styled with Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>
