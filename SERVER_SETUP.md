# SlideScroller - Local Server Setup

Due to browser security restrictions (CORS), loading PDF files directly from the file system may not work. Here are several ways to run SlideScroller properly:

## Method 1: File Upload (Easiest)
1. Open `index.html` in your browser
2. Click the **"Upload PDF"** button in the game
3. Select your PDF file
4. The game will process and display your PDF slides

## Method 2: Local HTTP Server

### Using Python (if you have Python installed):
```bash
# Navigate to the slidescroller folder
cd /path/to/slidescroller

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Then open: http://localhost:8000
```

### Using Node.js (if you have Node.js installed):
```bash
# Install a simple server globally
npm install -g http-server

# Navigate to the slidescroller folder
cd /path/to/slidescroller

# Start server
http-server

# Then open: http://localhost:8080
```

### Using PHP (if you have PHP installed):
```bash
# Navigate to the slidescroller folder
cd /path/to/slidescroller

# Start PHP server
php -S localhost:8000

# Then open: http://localhost:8000
```

### Using Live Server (VS Code Extension):
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Method 3: Place PDF in Presentation Folder
1. Save your PDF as `presentation.pdf` in the `/presentation/` folder
2. Use one of the local server methods above
3. The game will automatically detect and load your PDF

## Troubleshooting
- If you see CORS errors, use the file upload method (#1)
- For large PDFs, processing may take a few moments
- Password-protected PDFs will prompt for the password
- The game supports up to 100 PDF pages

## Recommended Approach
For the best experience, use **Method 1 (File Upload)** as it bypasses all CORS issues and works in any browser without additional setup.
