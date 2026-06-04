# Vigilance DEMS | Command Center & Sovereign Integrity Archive
### Sovereign Digital Evidence Management System — Production & Local Run Blueprint

Vigilance DEMS is a state-of-the-art full-stack forensic block and Digital Evidence Management System (DEMS). This codebase partition isolates client-side React assets from secure sandbox server environments on export.

Below are step-by-step local launch instructions to setup and start both the backend server and frontend components on your user machine simultaneously.

---

## 📋 Architectural Separation

```
├── /backend                      # Secure Node.js / Express Server Environment
│   ├── server.ts                 # API Gateway & Static Asset Provider
│   └── db.ts                     # Local File persistent DAO Layer
│
├── /frontend                     # Client-Side SPA React Application (Vite-Powered)
│   └── /src                      # React functional components & custom views
│       ├── /components           # Responsive Micro-View files
│       ├── App.tsx               # Main layout coordinator & custom secureFetch engine
│       ├── index.css             # Fluid Tailwind styling directives
│       ├── main.tsx              # React mounting catalyst
│       ├── types.ts              # Declarative ledger schemas & definitions
│       └── utils.ts              # Cryptographic algorithms & byte helpers
│
├── /db                           # Local persistent volume mock register
│   └── evidence.json             # Serialized local system registers & ledgers
│
├── index.html                    # Root HTML mounting frame pointing to frontend/src/main.tsx
├── package.json                  # Audited & consolidated production dependency manifest
├── tsconfig.json                 # Shared ESNext structure compilation parameters
└── vite.config.ts                # Hot-reload & chunk mapping compilation config
```

---

## ⚙️ Initial Local Machine Setup & Environmental Config

Ensure you have **Node.js (v18.0.0 or higher)** and **npm** installed on your workstation or host device.

### Step 1: Extract and Initialize Directory
Extract the exported ZIP package to your desired local directory and open a terminal inside the root workspace folder:
```bash
cd vigilance-dems
```

### Step 2: Configure Local Environment Variables
A `.env.example` file is included in your project root. Copy it to create your local active environment variables container:
- **Operating Systems (macOS & Linux Terminal):**
  ```bash
  cp .env.example .env
  ```
- **Windows System (Command Prompt / Powershell):**
  ```cmd
  copy .env.example .env
  ```

---

## 🚀 Running the Full-Stack Application Simultaneously

Vigilance DEMS features a unified full-stack architecture where the Express API server acts as the central orchestrator, running on port `3000`. It feeds data and hosts the interactive React client in both Dev and Production modes simultaneously.

### Option A: Running in Development Mode (Live Hot-Reloading)

To debug, audit, or make modifications to the system with automatic hot reload triggers:

1. **Install required dependencies:**
   This command automatically resolves and downloads all necessary client-side and server-side dependencies from `package.json` into a local `node_modules` workspace:
   ```bash
   npm install
   ```

2. **Boot the Unified Development Engine:**
   Run the dev script to mount the Express backend server using the `tsx` compiler. This also integrates Vite's secure development middleware, serving up the modern React frontend with live HMR:
   ```bash
   npm run dev
   ```

3. **Access the System console:**
   Open a browser to access the local console:
   - **Workspace Access Link:** `http://localhost:3000`

---

### Option B: Running in Production Mode (Optimized Binary Sandbox)

To simulate a pristine production deployment locally with highly optimized, minified static distribution bundles and a compiled standalone server wrapper:

1. **Clean prior artifacts & Build client-side assets + server bundle:**
   Produces an optimized client build inside `/dist` and bundles `/backend/server.ts` into a fast, compiled CommonJS module at `/dist/server.cjs` via `esbuild`:
   ```bash
   npm run build
   ```

2. **Launch the production node engine:**
   Fires up the compiled, self-contained server bundle immediately utilizing Node's built-in runtime engine:
   ```bash
   npm run start
   ```

3. **Access the Production Suite:**
   The container starts hosting on `http://localhost:3000`.

---

## 🔒 Custom secureFetch Architecture Features

- **8-Second Timeout Handshake:** A custom abstraction layer handles standard fetch payloads to actively abort lagging calls and shield UI operations from hanging indefinitely.
- **Amber Connection Sentinel Banner:** Automatically triggers high-fidelity network-interrupted banners when queries fail or servers drop connections.
- **Full Viewport Scroll Reset:** Fully optimized to scroll the main panel (`mainScrollContainerRef`) cleanly back to the absolute top `(0, 0)` immediately on any sidebar tab change.
