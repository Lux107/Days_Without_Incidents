
const reportsList = document.getElementById('reports-list');
const filterTags = document.getElementById('filter-tags');
const reportCount = document.getElementById('report-count');

let reports = [];

async function loadReports() {
    try {
        const response = await fetch('data/incidents.json');

        if (!response.ok) {
            throw new Error('Could not load reports.');
        }

        const data = await response.json();
        reports = data.incidents || [];

        displayReports();

    } catch (error) {
        console.error(error);
        reportsList.textContent = 'Unable to load reports.';
    }
}

function displayReports() {
    const selectedTags = [
        ...filterTags.querySelectorAll('input:checked')
    ].map(input => input.value);

    const filteredReports = reports.filter(report => {

        if (selectedTags.length === 0) {
            return true;
        }

        return selectedTags.some(tag =>
            (report.tags || []).includes(tag)
        );
    });

    reportCount.textContent = `${filteredReports.length} RECORDS`;

    reportsList.innerHTML = '';

    if (filteredReports.length === 0) {
        reportsList.textContent = 'No reports found.';
        return;
    }

    filteredReports
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach(report => {

            const card = document.createElement('article');
            card.className = 'report-card';

            // Make the entire card clickable
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                openReport(report);
            });

            const title = document.createElement('h3');
            title.textContent = report.id || 'Untitled report';

            const date = document.createElement('p');
            date.textContent = report.date || 'No date';

            const summary = document.createElement('p');
            summary.textContent = report.summary || 'No summary available.';

            const reporter = document.createElement('span');
            reporter.textContent =
                `Reported by: ${report.reportedBy || 'Unknown'}`;

            const tags = document.createElement('div');
            tags.className = 'report-tags';

            (report.tags || []).forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.textContent = tag;
                tags.appendChild(tagElement);
            });

            card.append(title, date, summary, reporter, tags);

            reportsList.appendChild(card);
        });
}

function openReport(report) {
    sessionStorage.setItem(
        'selectedReport',
        JSON.stringify(report)
    );

    window.location.href = 'report.html';
}

filterTags.addEventListener('change', displayReports);

loadReports();
