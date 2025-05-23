
document.addEventListener('DOMContentLoaded', () => {
    // --- Animated Quill Title ---
    const svg = document.getElementById('title-animation-svg');
    const quill = document.getElementById('quillSvg');
    const textPathAtlas = document.getElementById('textPathAtlas');
    const textPathArchives = document.getElementById('textPathArchives');
    const actualH1 = document.querySelector('.main-title.visually-hidden'); // Get the H1

    if (svg && quill && textPathAtlas && textPathArchives && gsap) {
        // Ensure the original H1 font styles are loaded before getting its size
        // This is a bit of a trick to make SVG somewhat responsive to text flow if needed
        // but mostly we rely on viewBox and SVG width/height in CSS.
        // For now, let's assume fixed size based on SVG viewBox and CSS.

        // Paths to animate
        const paths = [textPathAtlas, textPathArchives];
        const pathLengths = paths.map(p => p.getTotalLength());

        // Initialize paths for drawing animation
        paths.forEach((p, i) => {
            gsap.set(p, {
                strokeDasharray: pathLengths[i],
                strokeDashoffset: pathLengths[i],
                opacity: 1 // Make sure path is visible for stroke animation
            });
        });

        // Initial Quill Position (relative to SVG viewBox)
        // Position it near the start of the first path. Adjust these X, Y values.
        // These need to be the coordinates of where the "Atlas" path starts in your SVG viewBox.
        // The placeholder "Atlas" path starts around X=50, Y=100. Quill nib is at its local 0,0.
        gsap.set(quill, { x: 40, y: 110, autoAlpha: 1, scale: 1.5, rotate: -15 }); // Make quill visible, scaled and rotated

        // Create GSAP Timeline
        const tl = gsap.timeline({
            onComplete: () => {
                // After animation, fill the text and fade out quill or move it
                console.log("Animation complete");


        console.log("SVG:", svg);
        console.log("Quill:", quill);
        console.log("textPathAtlas:", textPathAtlas);
        console.log("textPathArchives:", textPathArchives);
        console.log("GSAP timeline created:", tl);

                gsap.to(paths, { duration: 0.5, fill: 'var(--color-ink-main)', strokeWidth: 2.5 });
                gsap.to(quill, { duration: 0.5, autoAlpha: 0, x: '+=50', y: '+=20' }); // Move quill away
                // Optional: if the actual H1 should appear AFTER animation
                // if (actualH1) {
                //     gsap.set(actualH1, { className: 'main-title' }); // Remove visually-hidden
                //     gsap.set(svg, { display: 'none' }); // Hide SVG
                // }
            }
        });

        // --- Animate "Atlas" ---
        const atlasDuration = pathLengths[0] / 200; // Adjust speed factor (lower is faster drawing)

        // Quill movement for "Atlas" - Approximation
        // We need to find a few key points on the actual "Atlas" path.
        // For placeholder "d=M50 100 Q75 50 100 100 T150 100 M125 75 L175 75 M160 50 L160 125"
        // This is very simplified. For a real path, this would be more points or using MotionPathPlugin.
        tl.to(quill, { x: 90, y: 60, duration: atlasDuration * 0.3, ease: "power1.inOut" }) // Move to mid-A
          .to(quill, { x: 170, y: 90, duration: atlasDuration * 0.7, ease: "sine.inOut" })   // Move towards end of Atlas
          // Draw "Atlas" text path while quill moves for the total duration
          .to(textPathAtlas, { strokeDashoffset: 0, duration: atlasDuration, ease: "linear" }, "<"); // "<" starts at same time as previous tween


        // --- Animate "Archives" ---
        const archivesStartDelay = 0.2; // Small pause before writing next word
        const archivesDuration = pathLengths[1] / 180; // Adjust speed factor

        // Move quill to start of "Archives" - Adjust X, Y to actual start of "Archives" path
        // Placeholder Archives starts around X=250, Y=100
        tl.to(quill, { x: 240, y: 110, duration: 0.3, ease: "power1.inOut", delay: archivesStartDelay });

        // Quill movement for "Archives" - Approximation
        tl.to(quill, { x: 290, y: 60, duration: archivesDuration * 0.3, ease: "power1.inOut" }) // Mid-Archives
          .to(quill, { x: 440, y: 90, duration: archivesDuration * 0.7, ease: "sine.inOut" })    // End of Archives
          // Draw "Archives" text path
          .to(textPathArchives, { strokeDashoffset: 0, duration: archivesDuration, ease: "linear" }, "<"); // "<"


        // Add a final pause if needed or other clean up
        tl.to({}, {duration: 0.5}); // Keep timeline active for onComplete

    } else {
        // Fallback if GSAP or elements not found: just show the H1
        if (actualH1) actualH1.classList.remove('visually-hidden');
        if (svg) svg.style.display = 'none';
        console.warn("GSAP or SVG elements for title animation not found. Displaying static title.");
    }



    // DOM Elements
    const memoryGrid = document.querySelector('.memory-grid');
    const filterTagsWrapper = document.querySelector('.filter-tags-wrapper');
    const noMemoriesMessage = document.querySelector('.no-memories-message');

    // Modal Elements
    const memoryModal = document.getElementById('memoryModal');
    const modalOverlay = memoryModal.querySelector('.modal-overlay');
    const modalCloseButton = memoryModal.querySelector('.modal-close-button');
    const modalTitleElement = memoryModal.querySelector('#modalTitle');
    const modalDateElement = memoryModal.querySelector('.modal-memory-date');
    const modalDescriptionElement = memoryModal.querySelector('.modal-memory-description');
    const modalBodyContentElement = memoryModal.querySelector('.modal-body-content');

    let allMemories = [];
    let activeFilterTag = 'all';
    let lastFocusedElement = null; // For returning focus after modal closes

    // --- 1. FETCH MEMORIES & INITIALIZE ---
    async function fetchMemories() {
        try {
            const response = await fetch('memories.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allMemories = await response.json();
            if (allMemories.length === 0) {
                showNoMemoriesMessage(true, "No memories found in the archives yet.");
                return;
            }
            populateFilterTags();
            displayMemories(allMemories);
        } catch (error) {
            console.error("Could not fetch memories:", error);
            showNoMemoriesMessage(true, "Could not load memories. Please try again later.");
        }
    }

    // --- 2. POPULATE FILTER TAGS ---
    function populateFilterTags() {
        const tags = new Set();
        allMemories.forEach(memory => {
            memory.tags.forEach(tag => tags.add(tag));
        });

        // Clear any example tags except "All Whispers"
        const existingTags = filterTagsWrapper.querySelectorAll('.filter-tag:not([data-tag="all"])');
        existingTags.forEach(tag => tag.remove());


        tags.forEach(tag => {
            const button = document.createElement('button');
            button.classList.add('filter-tag');
            button.dataset.tag = tag.toLowerCase().replace(/\s+/g, '-'); // Create a slug-like data-tag
            button.textContent = tag;
            button.addEventListener('click', () => handleFilterClick(tag, button));
            filterTagsWrapper.appendChild(button);
        });

        // Add event listener to the "All Whispers" button
        const allButton = filterTagsWrapper.querySelector('.filter-tag[data-tag="all"]');
        if(allButton) {
            allButton.addEventListener('click', () => handleFilterClick('all', allButton));
        }
    }

    // --- 3. DISPLAY MEMORY CAPSULES ---
    function displayMemories(memoriesToDisplay) {
        memoryGrid.innerHTML = ''; // Clear existing grid items

        if (memoriesToDisplay.length === 0) {
            showNoMemoriesMessage(true);
            return;
        }
        showNoMemoriesMessage(false);

        memoriesToDisplay.forEach((memory, index) => {
            const capsule = document.createElement('article');
            capsule.classList.add('memory-capsule', `memory-type-${memory.type.toLowerCase()}`);
            capsule.dataset.id = memory.id;

            // Image Preview
            const previewImageWrapper = document.createElement('div');
            previewImageWrapper.classList.add('capsule-preview-image-wrapper');
            const previewImage = document.createElement('img');
            previewImage.src = memory.image_preview || 'assets/images/previews/placeholder_default.png'; // Fallback
            previewImage.alt = `Preview for ${memory.title}`;
            previewImage.classList.add('capsule-preview-image');
            previewImageWrapper.appendChild(previewImage);

            // Content Area
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('capsule-content');

            const title = document.createElement('h3');
            title.classList.add('capsule-title');
            title.textContent = memory.title;

            const date = document.createElement('p');
            date.classList.add('capsule-date');
            date.textContent = memory.date_display;

            const tagsDiv = document.createElement('div');
            tagsDiv.classList.add('capsule-tags');
            memory.tags.forEach(tagText => {
                const tagSpan = document.createElement('span');
                tagSpan.classList.add('capsule-tag-item');
                tagSpan.textContent = tagText;
                tagsDiv.appendChild(tagSpan);
            });

            contentDiv.appendChild(title);
            contentDiv.appendChild(date);
            contentDiv.appendChild(tagsDiv);

            capsule.appendChild(previewImageWrapper);
            capsule.appendChild(contentDiv);

            capsule.addEventListener('click', () => openModal(memory.id));
            memoryGrid.appendChild(capsule);

            // Staggered animation reveal
            setTimeout(() => {
                capsule.classList.add('visible');
            }, index * 100); // 100ms delay between each item
        });
    }

    function showNoMemoriesMessage(show, message = "No memories found for the selected filter.") {
        if (show) {
            noMemoriesMessage.textContent = message;
            noMemoriesMessage.style.display = 'block';
        } else {
            noMemoriesMessage.style.display = 'none';
        }
    }

    // --- 4. HANDLE FILTERING ---
    function handleFilterClick(tagValue, clickedButton) {
        activeFilterTag = tagValue.toLowerCase().replace(/\s+/g, '-'); // Use consistent tag format

        // Update active class on buttons
        filterTagsWrapper.querySelectorAll('.filter-tag').forEach(btn => {
            btn.classList.remove('active');
        });
        clickedButton.classList.add('active');

        let filteredMemories;
        if (tagValue === 'all') {
            filteredMemories = allMemories;
        } else {
            filteredMemories = allMemories.filter(memory =>
                memory.tags.some(memTag => memTag.toLowerCase().replace(/\s+/g, '-') === activeFilterTag) ||
                memory.tags.some(memTag => memTag === tagValue) // Check original tag value too
            );
        }
        displayMemories(filteredMemories);
    }

    // --- 5. MODAL FUNCTIONALITY ---
    let currentModalSound = null;

    function openModal(memoryId) {
        lastFocusedElement = document.activeElement; // Store current focus

        const memory = allMemories.find(m => m.id === memoryId);
        if (!memory) return;

        modalTitleElement.textContent = memory.title;
        modalDateElement.textContent = memory.date_display || '';
        modalDescriptionElement.textContent = memory.modal_content.description || '';
        modalBodyContentElement.innerHTML = ''; // Clear previous content

        const content = memory.modal_content;
        if (content.type === 'text' && content.text) {
            const textElement = document.createElement('p');
            // Replace newlines with <br> for HTML display
            textElement.innerHTML = content.text.replace(/\n/g, '<br>');
            modalBodyContentElement.appendChild(textElement);
        } else if (content.type === 'image' && memory.content_path) {
            const imageElement = document.createElement('img');
            imageElement.src = memory.content_path;
            imageElement.alt = memory.title;
            modalBodyContentElement.appendChild(imageElement);
        } else if (content.type === 'audio' && memory.content_path) {
            const audioElement = document.createElement('audio');
            audioElement.controls = true;
            audioElement.src = memory.content_path;
            modalBodyContentElement.appendChild(audioElement);
        }

        memoryModal.style.display = 'flex'; // Use flex for centering if needed by CSS
        setTimeout(() => memoryModal.classList.add('show'), 10); // Timeout for CSS transition

        // Play sound
        if (memory.audio_on_open) {
            if (currentModalSound) {
                currentModalSound.stop();
            }
            currentModalSound = new Howl({
                src: [memory.audio_on_open],
                volume: 0.7, // Adjust volume as needed
                html5: true // Recommended for wider compatibility if files are local/simple
            });
            currentModalSound.play();
        }
        
        // Focus management for accessibility
        modalCloseButton.focus(); 
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    function closeModal() {
        memoryModal.classList.remove('show');
        document.body.style.overflow = ''; // Restore background scroll

        // Stop sound
        if (currentModalSound) {
            currentModalSound.stop();
            currentModalSound = null;
        }

        // Only hide after transition (ensure transition duration matches CSS)
        setTimeout(() => {
            memoryModal.style.display = 'none';
            modalBodyContentElement.innerHTML = ''; // Clear content for next time
            if (lastFocusedElement) {
                lastFocusedElement.focus(); // Return focus
            }
        }, 400); // Match transition-duration from CSS (.archive-modal)
    }

    // Modal Event Listeners
    modalCloseButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && memoryModal.classList.contains('show')) {
            closeModal();
        }
    });

    // --- INITIALIZE THE PAGE ---
    fetchMemories();
});
