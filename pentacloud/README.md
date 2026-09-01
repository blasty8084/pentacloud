# PENTACLOUD

A personal/team cloud storage system that combines 5 separate Backblaze B2 accounts (10GB free tier each) into ONE unified 50GB storage pool, accessible through a single dashboard.

## Features

- **Unified Storage Pool**: Combines 5 Backblaze B2 accounts (50GB total)
- **Smart Routing**: Files automatically route to the account with the most free space
- **File Management**: Upload, download, rename, move, delete, share
- **Folder Organization**: Nested folders with drag-and-drop
- **File Preview**: Images, PDFs, text files
- **Shareable Links**: Expiring download links
- **Storage Dashboard**: Real-time usage per account
- **Dark Mode First**: Clean, modern UI
- **Authentication**: JWT with refresh tokens, bcrypt password hashing
- **Rate Limiting**: Protection on auth and upload endpoints

## Tech Stack

### Frontend (client/)
- React 18 + Vite
- React Router v6
- Tailwind CSS
- Axios for API calls
- Lucide React for icons

### Backend (server/)
- Node.js + Express
- Better-SQLite3 for database
- Backblaze B2 SDK
- JWT authentication
- bcrypt password hashing
- express-rate-limit
- express-validator

## Project Structure

```
pentacloud/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── api/                 # API client
│   │   ├── context/             # React context providers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # Node/Express backend
│   ├── config/
│   │   └── b2accounts.js        # Reads 5 B2 accounts from env
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── fileController.js
│   │   └── storageController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── services/
│   │   ├── b2Service.js         # B2 API wrapper
│   │   └── routerService.js     # Smart routing logic
│   ├── db/
│   │   ├── schema.sql
│   │   └── db.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── file.routes.js
│   │   └── storage.routes.js
│   └── server.js
│
├── .env.example
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm
- 5 Backblaze B2 accounts with buckets created

### Installation

```bash
# Clone and navigate
cd pentacloud

# Install all dependencies
npm run install:all
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your Backblaze B2 credentials for all 5 accounts:
```env
B2_1_KEY_ID=your-key-id
B2_1_APPLICATION_KEY=your-application-key
B2_1_BUCKET_ID=your-bucket-id
B2_1_BUCKET_NAME=your-bucket-name
B2_1_BUCKET_REGION=us-west-000

# Repeat for B2_2 through B2_5...
```

3. Generate a strong JWT secret:
```bash
openssl rand -base64 32
```

### Development

```bash
# Start both frontend and backend
npm run dev

# Or individually:
npm run dev:server  # Backend on http://localhost:4000
npm run dev:client  # Frontend on http://localhost:5173
```

### Production Build

```bash
npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Files
- `GET /api/files` - List files (supports folderId, search)
- `POST /api/files/upload` - Upload file (multipart/form-data)
- `GET /api/files/:id/download` - Download file
- `PATCH /api/files/:id` - Rename/move file
- `DELETE /api/files/:id` - Delete file

### Folders
- `GET /api/folders` - List folders
- `GET /api/folders/tree` - Get folder tree
- `POST /api/folders` - Create folder
- `PATCH /api/folders/:id` - Rename/move folder
- `DELETE /api/folders/:id` - Delete folder

### Storage
- `GET /api/storage/stats` - Get storage statistics
- `POST /api/storage/stats/refresh` - Refresh usage stats

### Shares
- `POST /api/shares` - Create share link
- `GET /api/shares/:token` - Download via share link
- `DELETE /api/shares/:token` - Delete share link

### Settings (Admin only)
- `GET /api/settings/b2-accounts` - List B2 accounts
- `POST /api/settings/b2-accounts` - Add B2 account
- `DELETE /api/settings/b2-accounts/:id` - Delete B2 account

## Database Schema

- **users**: id, email, password_hash, name, role, created_at
- **files**: id, name, original_name, mime_type, size, folder_id, user_id, b2_account_index, b2_file_id, b2_file_name, created_at, updated_at
- **folders**: id, name, parent_id, user_id, created_at, updated_at
- **shares**: id, file_id, token, expires_at, created_at

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT access tokens (15 min) + refresh tokens (7 days)
- HTTPS-only cookies in production
- Ownership verification on all file/folder operations
- File type validation and size limits
- Filename sanitization
- Rate limiting on auth/upload endpoints
- Input validation with express-validator

## Smart Routing Logic

When a file is uploaded:
1. Calculate free space for each B2 account
2. Select account with most free space
3. Upload to that account's bucket
4. Store file metadata with account index
5. Update local usage cache

## License

MIT