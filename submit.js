document.addEventListener('DOMContentLoaded', () => {
    const memoryTypeSelect = document.getElementById('memoryType');
    const textInputArea = document.getElementById('textInputArea');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const memoryFileInput = document.getElementById('memoryFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    // Function to show/hide sections based on memory type
    function updateFormVisibility() {
        const selectedType = memoryTypeSelect.value;

        // Hide all conditional areas first
        textInputArea.style.display = 'none';
        fileUploadArea.style.display = 'none';

        // Show relevant area based on selection
        if (selectedType === 'letter') {
            textInputArea.style.display = 'block';
        } else if (selectedType === 'image' || selectedType === 'audio') {
            fileUploadArea.style.display = 'block';
        }
    }

    // Event listener for memory type select change
    memoryTypeSelect.addEventListener('change', updateFormVisibility);

    // Event listener for file input change to display file name
    memoryFileInput.addEventListener('change', () => {
        if (memoryFileInput.files.length > 0) {
            fileNameDisplay.textContent = memoryFileInput.files[0].name;
        } else {
            fileNameDisplay.textContent = '';
        }
    });

    // Initial call to set correct form state on page load
    updateFormVisibility();

    // Add event listeners and logic for form submission and preview updates later
});
