document.addEventListener('DOMContentLoaded', () => {

    // --- Index Page Logic ---
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');
    const dropzoneContent = document.getElementById('dropzoneContent');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    let currentFile = null;

    if (dropzone) {
        // Drag events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('border-medical-500', 'bg-medical-50');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('border-medical-500', 'bg-medical-50');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        });

        dropzone.addEventListener('click', () => {
            if (!currentFile) {
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', function () {
            handleFiles(this.files);
        });

        removeImageBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent opening file dialog
            clearUpload();
        });

        function handleFiles(files) {
            if (files.length === 0) return;

            const file = files[0];
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];

            hideError();

            if (!validTypes.includes(file.type)) {
                showError("Please upload a valid PNG or JPG image.");
                return;
            }

            if (file.size > 16 * 1024 * 1024) {
                showError("File size must be under 16MB.");
                return;
            }

            currentFile = file;

            // Generate preview
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = function () {
                imagePreview.src = reader.result;
                dropzoneContent.classList.add('hidden');
                imagePreviewContainer.classList.remove('hidden');
                imagePreviewContainer.classList.add('flex');

                // Enable button
                submitBtn.disabled = false;
                submitBtn.classList.remove('bg-slate-900', 'hover:bg-slate-800');
                submitBtn.classList.add('bg-medical-600', 'hover:bg-medical-700', 'shadow-md');
            }

            // Need to update the input files object for FormData to work later
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
        }

        function clearUpload() {
            currentFile = null;
            fileInput.value = '';
            imagePreview.src = '#';
            imagePreviewContainer.classList.add('hidden');
            imagePreviewContainer.classList.remove('flex');
            dropzoneContent.classList.remove('hidden');

            // Disable button
            submitBtn.disabled = true;
            submitBtn.classList.add('bg-slate-900', 'hover:bg-slate-800');
            submitBtn.classList.remove('bg-medical-600', 'hover:bg-medical-700', 'shadow-md');
        }

        function showError(msg) {
            errorMessage.querySelector('span').textContent = msg;
            errorMessage.classList.remove('hidden');
            errorMessage.classList.add('flex');
        }

        function hideError() {
            errorMessage.classList.add('hidden');
            errorMessage.classList.remove('flex');
        }

        // Form submission via API
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentFile) {
                showError("Please upload an image first.");
                return;
            }

            // Show loading
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');
            submitBtn.disabled = true;

            const formData = new FormData();
            formData.append('file', currentFile);

            try {
                const response = await fetch('/predict', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to analyze image');
                }

                // Instead of jumping pages, in a single page flow we might inject the result.html
                // However, our backend renders result.html separately or returns JSON.
                // Since our backend returns JSON on `/predict`, we map it to sessionStorage
                // and redirect to a results viewer via JS, OR we manipulate DOM.

                // Let's store results in sessionStorage and redirect to a conceptual results URL 
                // Wait, our backend doesn't have a GET /results route.
                // Let's replace the page content dynamically for a smooth SPA feel.

                sessionStorage.setItem('ai_result', JSON.stringify(data));

                // Fetch the result template
                const resultHTMLReq = await fetch('/static/result_template.html'); // Fallback if needed
                // Realistically, we replace the body or redirect. 
                // Let's redirect to a hash or just populate a hidden result div.
                // Actually, let's redirect via window location and append data if it was a GET param, 
                // but since it's JSON, let's do a trick: we render the result.html via a GET route if we want.
                // Let's amend app.py logic... wait, app.py doesn't have /result GET.
                // Ok, we will dynamically fetch /result if we made one, or just replace the body HTML from a string inside this JS.
                window.location.href = `/?show_results=true`;
                // We'll handle this smoothly below.

            } catch (err) {
                console.error(err);
                showError(err.message);
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });
    }

    // --- Result Page Logic Setup ---
    // If we land on page with data in storage
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('show_results') === 'true') {
        const data = JSON.parse(sessionStorage.getItem('ai_result'));
        if (data) {
            // We need to fetch the result.html template manually and inject it
            fetchResultTemplateAndInject(data);
        } else {
            window.location.href = '/';
        }
    }

    // Fallback UI injector since we didn't define a GET /result in app.py
    async function fetchResultTemplateAndInject(data) {
        // Since we created result.html in templates, we can't fetch it directly from /static/
        // We will build the UI dynamically, or we can add a route to app.py. 
        // Building dynamically:

        document.body.innerHTML = `
        <nav class="bg-white shadow border-b border-slate-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 flex items-center space-x-3 gap-2">
                            <div class="w-10 h-10 rounded-full bg-medical-100 flex items-center justify-center text-medical-600">
                                <i class="fa-solid fa-lungs text-xl"></i>
                            </div>
                            <span class="font-bold text-xl text-slate-800 tracking-tight">OncoSense <span class="text-medical-600 font-medium">AI</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        <main class="flex-grow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 fade-in-up">
                <!-- Header -->
                <div class="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
                    <div>
                        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">AI Diagnostic Report</h1>
                        <p class="text-slate-500 mt-1">Detailed analysis and prediction from the PyTorch inference engine</p>
                    </div>
                    <div>
                        <a href="/" class="text-slate-500 hover:text-slate-800 transition-colors flex items-center font-medium px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                            <i class="fa-solid fa-arrow-left mr-2 text-sm"></i> New Scan
                        </a>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                    <!-- Visualizations Column -->
                    <div class="lg:col-span-7 flex flex-col gap-6 fade-in-up delay-100">
                        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-700 uppercase tracking-wider flex justify-between items-center">
                                <span>Scan Imagery & Heatmap</span>
                                <i class="fa-solid fa-layer-group text-slate-400"></i>
                            </div>
                            <div class="p-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <div class="flex flex-col items-center">
                                        <span class="text-sm text-slate-500 font-medium mb-3">Original CT Scan</span>
                                        <div class="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-slate-300">
                                            <img src="${data.original_image}" alt="Original CT" class="max-w-full max-h-full object-contain hover-zoom-img">
                                        </div>
                                    </div>
                                    <div class="flex flex-col items-center">
                                        <span class="text-sm inline-flex items-center gap-2 mb-3 font-medium">
                                            <span class="w-2 h-2 rounded-full bg-medical-500"></span> AI Heatmap
                                        </span>
                                        <div class="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-slate-300">
                                            <img src="${data.heatmap_image}" alt="Heatmap" class="max-w-full max-h-full object-contain hover-zoom-img">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Results Data Column -->
                    <div class="lg:col-span-5 flex flex-col gap-6 fade-in-up delay-200">
                        <div class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden relative">
                            <div id="statusBanner" class="h-2 w-full ${data.prediction === 'Normal' ? 'bg-green-500' : (data.risk === 'High' ? 'bg-red-500' : 'bg-orange-500')}"></div>
                            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 class="text-sm font-bold text-slate-500 uppercase tracking-widest">Prediction Summary</h3>
                                <div class="px-2.5 py-1 rounded text-xs font-bold ${data.prediction === 'Normal' ? 'bg-green-100 text-green-700 border-green-200' : (data.risk === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200')}">
                                    ${data.prediction === 'Normal' ? 'Clear' : data.risk + ' Risk'}
                                </div>
                            </div>
                            <div class="p-6 sm:p-8 space-y-6">
                                <div>
                                    <p class="text-sm text-slate-500 font-medium mb-1">AI Diagnosis</p>
                                    <h2 class="text-3xl font-extrabold ${data.prediction === 'Normal' ? 'text-green-600' : 'text-slate-900'} leading-none">${data.prediction}</h2>
                                </div>
                                <div>
                                    <p class="text-sm text-slate-500 font-medium mb-1">Detected Subtype</p>
                                    <p class="text-xl font-semibold text-slate-800">${data.subtype}</p>
                                </div>
                                <div>
                                    <div class="flex justify-between items-end mb-2">
                                        <p class="text-sm text-slate-500 font-medium">Model Confidence</p>
                                        <span class="text-lg font-bold text-slate-800">${data.confidence}%</span>
                                    </div>
                                    <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div class="${data.prediction === 'Normal' ? 'bg-green-500' : 'bg-medical-500'} h-2.5 rounded-full" style="width: ${data.confidence}%"></div>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                    <div>
                                        <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Extrapolated Stage</p>
                                        <p class="font-medium text-slate-800">${data.stage}</p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Survival Indicator</p>
                                        <p class="font-medium text-slate-800">${data.survival}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                            <button id="downloadBtn" class="w-full bg-medical-600 hover:bg-medical-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-300 flex justify-center items-center gap-2 shadow hover:shadow-md">
                                <i class="fa-solid fa-file-pdf"></i>
                                <span>Generate PDF Report</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        `;

        // Report Generation Binding
        document.getElementById('downloadBtn').addEventListener('click', async () => {
            const btn = document.getElementById('downloadBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`;
            btn.disabled = true;
            btn.classList.add('opacity-75');

            try {
                const response = await fetch('/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) throw new Error("Report generation failed");

                // Get Blob and trigger download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Lung_Cancer_AI_Report_${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

            } catch (e) {
                alert("Failed to generate PDF Report");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.classList.remove('opacity-75');
            }
        });
    }

});
