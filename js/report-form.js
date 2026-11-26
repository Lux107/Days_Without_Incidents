
const form = document.getElementById('incident-form');

form.addEventListener('submit', function (event) {
    event.preventDefault();

    // Collect selected categories
    const tags = [
        ...document.querySelectorAll('input[name="tags"]:checked')
    ].map(input => input.value);

    // Generate a unique report ID
    const report = {
        id: `INC-${Date.now()}`,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        reportedBy: document.getElementById('reportedBy').value,
        tags: tags,
        summary: document.getElementById('summary').value.trim(),
        perspective: document.getElementById('perspective').value.trim(),
        cause: document.getElementById('cause').value.trim(),
        needs: document.getElementById('needs').value.trim(),
        reflection: document.getElementById('reflection').value.trim(),
        resolution: document.getElementById('resolution').value.trim(),
        status: document.getElementById('status').value
    };

    // Convert report into JSON
    const json = JSON.stringify(report, null, 4);

    // Create downloadable file
    const blob = new Blob([json], {
        type: 'application/json'
    });

    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');

    downloadLink.href = url;
    downloadLink.download = `${report.id}.json`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(url);

    document.getElementById('form-message').textContent =
        'Your incident report has been downloaded successfully.';
});
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');

dateInput.addEventListener('click', () => {
    dateInput.showPicker();
});

timeInput.addEventListener('click', () => {
    timeInput.showPicker();
});