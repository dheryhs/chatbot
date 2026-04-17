# WhatsApp Chatbot Management System

A comprehensive WhatsApp chatbot management platform built with Next.js, integrating with WAHA (WhatsApp HTTP API) and Google's Generative AI for intelligent conversations.

## Features

- 🤖 **AI-Powered Chatbot** - Integration with Google Generative AI for intelligent responses
- 💬 **Multi-Agent Support** - Create and manage multiple chatbot agents with different personalities
- 📊 **Contact Management** - Import, organize, and manage WhatsApp contacts
- 📢 **Broadcast Messages** - Send bulk messages with pause/resume capabilities
- 📦 **Product Management** - Manage product catalog for e-commerce integration
- 🏪 **Warehouse Management** - Track inventory across multiple locations
- 📈 **Analytics Dashboard** - Monitor chatbot performance and interactions
- 🔐 **Authentication** - Secure user authentication with NextAuth
- 💾 **Database** - PostgreSQL with Prisma ORM

## Tech Stack

- **Framework**: Next.js 16.2.3 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js
- **AI**: Google Generative AI
- **UI**: React 19 with CSS Modules
- **Charts**: Chart.js & react-chartjs-2
- **WhatsApp API**: WAHA (WhatsApp HTTP API)
- **Deployment**: Docker & Docker Compose

## Prerequisites

- Node.js 20 or higher
- PostgreSQL database
- WAHA instance (WhatsApp HTTP API)
- Google Generative AI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dheryhs/chatbot.git
   cd chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `POSTGRES_PASSWORD` - Database password
   - `NEXTAUTH_URL` - Your application URL
   - `NEXTAUTH_SECRET` - Secret for NextAuth (generate with `openssl rand -base64 32`)
   - `WAHA_API_KEY` - Your WAHA API key
   - `WAHA_BASE_URL` - WAHA instance URL

4. **Set up the database**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment

The project includes Docker configuration for easy deployment:

```bash
docker-compose up -d
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── register/         # User registration
├── components/            # Reusable React components
│   ├── layout/           # Layout components (Navbar, Sidebar)
│   └── ui/               # UI components (Modal, ToggleSwitch)
├── lib/                   # Utility libraries
│   ├── ai.ts             # AI integration
│   ├── auth.ts           # Authentication helpers
│   ├── broadcast.ts      # Broadcast functionality
│   ├── prisma.ts         # Prisma client
│   └── waha.ts           # WAHA API client
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## Key Features

### Agent Management
Create AI agents with customized:
- System prompts
- Knowledge bases (file upload support)
- Behavior patterns

### Contact Management
- Import contacts from CSV
- Filter and organize contacts
- Bulk operations

### Broadcast System
- Schedule and send bulk messages
- Pause/resume broadcasts
- Track delivery status

### Analytics
- Real-time dashboard statistics
- Message history tracking
- User engagement metrics

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Agents
- `GET/POST /api/agents` - List/create agents
- `GET/PUT/DELETE /api/agents/[id]` - Manage specific agent
- `POST /api/agents/[id]/knowledge-upload` - Upload knowledge files

### Contacts
- `GET/POST /api/contacts` - List/create contacts
- `POST /api/contacts/import` - Import from CSV
- `POST /api/contacts/bulk` - Bulk operations

### Broadcasts
- `GET/POST /api/broadcast` - List/create broadcasts
- `GET /api/broadcast/[id]/status` - Check status
- `POST /api/broadcast/[id]/pause` - Pause broadcast
- `POST /api/broadcast/[id]/resume` - Resume broadcast

### WhatsApp Sessions
- `GET/POST /api/sessions` - Manage WhatsApp sessions
- `POST /api/sessions/[id]/[action]` - Control session (start/stop/logout)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## License

This project is private and proprietary.

## Contributing

This is a private project. Please contact the repository owner for contribution guidelines.
