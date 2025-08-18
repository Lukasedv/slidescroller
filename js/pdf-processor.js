/**
 * PDF Processor for SlideScroller Game
 * Handles loading PDF files and converting pages to images for use as slide backgrounds
 */

class PDFProcessor {
    constructor() {
        this.pdfDocument = null;
        this.pageImages = [];
        this.isLoaded = false;
        this.loadingProgress = 0;
        this.onLoadCallback = null;
        this.onProgressCallback = null;
        this.currentPassword = null;
    }

    /**
     * Load PDF.js library dynamically
     */
    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            if (window.pdfjsLib) {
                resolve();
                return;
            }

            // Load PDF.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                // Set worker path
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Discover PDF files in the presentation folder
     */
    async discoverPDFFiles() {
        try {
            // List of common PDF filenames to try
            const commonNames = [
                'presentation.pdf',
                'slides.pdf', 
                'slide.pdf',
                'deck.pdf',
                'talk.pdf'
            ];

            // Try each filename and see if it exists
            for (const filename of commonNames) {
                try {
                    // Use relative path that works with local file serving
                    const testUrl = `presentation/${filename}`;
                    console.log(`Trying to load: ${testUrl}`);
                    
                    const response = await fetch(testUrl, {
                        method: 'HEAD', // Just check if file exists
                        mode: 'no-cors' // Allow no-cors for local files
                    });
                    
                    console.log(`Response for ${filename}:`, response.status, response.type);
                    
                    // For no-cors mode, we can't read the status, so try to actually load
                    const fullResponse = await fetch(testUrl);
                    if (fullResponse.ok || fullResponse.status === 0) { // status 0 can mean success for local files
                        console.log(`Found PDF: ${filename}`);
                        return testUrl;
                    }
                } catch (error) {
                    console.log(`${filename} not found:`, error.message);
                    // Continue to next file
                }
            }

            console.log('No PDF found with common names');
            return null;

        } catch (error) {
            console.error('Error discovering PDF files:', error);
            return null;
        }
    }

    /**
     * Load PDF from file input
     */
    async loadPDFFromFile(file) {
        try {
            console.log('Loading PDF from file:', file.name);
            
            // Load PDF.js first
            await this.loadPDFJS();

            this.updateProgress(10, 'Reading file...');

            // Convert file to ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            
            this.updateProgress(20, 'Loading PDF...');

            // Load the PDF document from ArrayBuffer
            const loadingTask = window.pdfjsLib.getDocument({
                data: arrayBuffer
            });

            // Handle password requests
            loadingTask.onPassword = (callback, reason) => {
                console.log('PDF requires password:', reason);
                const userPassword = prompt('This PDF requires a password:');
                if (userPassword) {
                    this.currentPassword = userPassword;
                    callback(userPassword);
                } else {
                    callback(''); // User cancelled
                }
            };

            this.pdfDocument = await loadingTask.promise;
            this.updateProgress(30, 'PDF loaded, processing pages...');

            const numPages = Math.min(this.pdfDocument.numPages, 100); // Limit to 100 pages
            console.log(`Processing ${numPages} pages from uploaded PDF`);

            // Convert each page to image
            this.pageImages = [];
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                try {
                    const image = await this.convertPageToImage(pageNum);
                    this.pageImages.push(image);
                    
                    const progress = 30 + (pageNum / numPages) * 70;
                    this.updateProgress(progress, `Processing page ${pageNum}/${numPages}...`);
                } catch (error) {
                    console.error(`Error processing page ${pageNum}:`, error);
                    // Add a placeholder for failed pages
                    this.pageImages.push(null);
                }
            }

            this.isLoaded = true;
            this.updateProgress(100, 'PDF processing complete!');
            
            if (this.onLoadCallback) {
                this.onLoadCallback(this.pageImages);
            }

            return true;

        } catch (error) {
            console.error('Error loading PDF from file:', error);
            this.updateProgress(0, 'Error loading PDF');
            return false;
        }
    }
    /**
     * Load and process PDF file
     */
    async loadPDF(pdfUrl = null, password = null) {
        try {
            // Load PDF.js first
            await this.loadPDFJS();

            // Discover PDF if no URL provided
            if (!pdfUrl) {
                pdfUrl = await this.discoverPDFFiles();
                if (!pdfUrl) {
                    console.log('No PDF found, using default slides');
                    return false;
                }
            }

            this.updateProgress(10, 'Loading PDF...');

            // Try to load the PDF document
            let loadingTask;
            try {
                loadingTask = window.pdfjsLib.getDocument({
                    url: pdfUrl,
                    password: password || this.currentPassword
                });
            } catch (corsError) {
                console.warn('CORS error loading PDF, trying alternative method:', corsError);
                // If CORS fails, suggest file upload
                this.updateProgress(0, 'CORS error - please use Upload PDF button');
                return false;
            }

            // Handle password requests
            loadingTask.onPassword = (callback, reason) => {
                console.log('PDF requires password:', reason);
                const userPassword = prompt('This PDF requires a password:');
                if (userPassword) {
                    this.currentPassword = userPassword;
                    callback(userPassword);
                } else {
                    callback(''); // User cancelled
                }
            };

            try {
                this.pdfDocument = await loadingTask.promise;
            } catch (loadError) {
                console.warn('Failed to load PDF from URL:', loadError);
                this.updateProgress(0, 'Failed to load PDF - try Upload PDF button');
                return false;
            }

            this.updateProgress(30, 'PDF loaded, processing pages...');

            const numPages = Math.min(this.pdfDocument.numPages, 50); // Reduced from 100 for better performance
            console.log(`Processing ${numPages} pages from PDF`);

            // Convert each page to image with better progress feedback
            this.pageImages = [];
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                try {
                    // Add small delay to prevent blocking the UI
                    if (pageNum % 5 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 10)); // 10ms break every 5 pages
                    }
                    
                    const image = await this.convertPageToImage(pageNum);
                    this.pageImages.push(image);
                    
                    const progress = 30 + (pageNum / numPages) * 70;
                    this.updateProgress(progress, `Processing page ${pageNum}/${numPages}...`);
                } catch (error) {
                    console.error(`Error processing page ${pageNum}:`, error);
                    // Add a placeholder for failed pages
                    this.pageImages.push(null);
                }
            }

            this.isLoaded = true;
            this.updateProgress(100, 'PDF processing complete!');
            
            if (this.onLoadCallback) {
                this.onLoadCallback(this.pageImages);
            }

            return true;

        } catch (error) {
            console.error('Error loading PDF:', error);
            this.updateProgress(0, 'Error loading PDF - try Upload PDF button');
            return false;
        }
    }

    /**
     * Convert a single PDF page to image
     */
    async convertPageToImage(pageNumber) {
        const page = await this.pdfDocument.getPage(pageNumber);
        
        // Calculate scale based on screen resolution for balanced quality/performance
        const screenWidth = window.innerWidth || 1920;
        const screenHeight = window.innerHeight || 1080;
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // Optimized scale calculation for better performance
        let scale = 1.5; // Reduced from 3.0 for better performance
        
        // More conservative scaling for high-resolution displays
        if (screenWidth >= 3840 || screenHeight >= 2160) {
            scale = 2.5; // Reduced from 6.0 for 4K
        } else if (screenWidth >= 2560 || screenHeight >= 1440) {
            scale = 2.0; // Reduced from 4.5 for 1440p
        } else if (screenWidth >= 1920 || screenHeight >= 1080) {
            scale = 1.8; // Slightly increased from base
        }
        
        // Apply device pixel ratio but cap it to prevent excessive scaling
        scale *= Math.min(devicePixelRatio, 2.0); // Cap at 2x to prevent performance issues
        
        const viewport = page.getViewport({ scale });

        // Create canvas to render the page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Enable high-quality rendering
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Render page to canvas
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Use JPEG for better performance and smaller file size
        // Quality of 0.9 provides good balance between quality and performance
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Create image object
        const img = new Image();
        img.src = imageDataUrl;
        
        // Clean up canvas to free memory
        canvas.width = 0;
        canvas.height = 0;
        
        return new Promise((resolve) => {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });
    }

    /**
     * Update loading progress
     */
    updateProgress(progress, message) {
        this.loadingProgress = progress;
        console.log(`PDF Processing: ${progress}% - ${message}`);
        
        // Provide performance tips for users
        if (progress === 30 && this.pdfDocument && this.pdfDocument.numPages > 50) {
            console.log('Performance tip: Large PDFs may take a moment to process. Consider using smaller PDFs (under 50 pages) for optimal performance.');
        }
        
        if (this.onProgressCallback) {
            this.onProgressCallback(progress, message);
        }
    }

    /**
     * Get processed page images
     */
    getPageImages() {
        return this.pageImages;
    }

    /**
     * Get number of pages
     */
    getPageCount() {
        return this.pageImages.length;
    }

    /**
     * Check if PDF is loaded
     */
    isReady() {
        return this.isLoaded && this.pageImages.length > 0;
    }

    /**
     * Set callback for when PDF loading is complete
     */
    onLoad(callback) {
        this.onLoadCallback = callback;
    }

    /**
     * Set callback for progress updates
     */
    onProgress(callback) {
        this.onProgressCallback = callback;
    }

    /**
     * Reset processor state
     */
    reset() {
        this.pdfDocument = null;
        this.pageImages = [];
        this.isLoaded = false;
        this.loadingProgress = 0;
        this.currentPassword = null;
    }
}

// Export for use in other modules
window.PDFProcessor = PDFProcessor;
