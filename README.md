# Routiny

A personal productivity application with AI-powered coaching features, built with Next.js, TypeScript.

## Features

- **Smart Task Breakdown**: AI-powered task decomposition for better productivity
- **Progress Tracking**: Visual progress indicators and milestone tracking
- **Gamification**: Achievement system and progress visualization
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live progress tracking and notifications

## Tech Stack

- **Framework**: Next.js 15.5.2 with App Router and TypeScript
- **Styling**: Tailwind CSS v4 with mobile-first responsive design
- **State Management**: Zustand for client-side state
- **Database**: Supabase PostgreSQL with real-time features
- **Authentication**: Supabase Auth with magic link authentication
- **AI Integration**: OpenRouter for task breakdown and coaching
- **Deployment**: Vercel with automatic Git integration

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm 9.0 or higher

### Environment Setup

1. Copy the environment template:

   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your environment variables in `.env.local`

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd routiny
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Code Quality

This project uses ESLint and Prettier for consistent code quality. All code is automatically formatted on save and during CI/CD.

## Project Structure

```
routiny/
├── .github/workflows/    # CI/CD workflows
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and configuration
│   ├── services/        # API service layer
│   ├── stores/          # Zustand stores
│   └── types/           # TypeScript type definitions
├── pages/api/           # API routes
└── docs/                # Project documentation
```

## Contributing

1. Follow the established coding standards
2. Run `npm run lint` and `npm run format` before committing
3. Ensure all tests pass with `npm run test`
4. Update documentation as needed

## License

This project is private and proprietary.
