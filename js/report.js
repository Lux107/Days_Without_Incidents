
const report = JSON.parse(
    sessionStorage.getItem('selectedReport') || 'null'
);

if (!report) {
    window.location.href = 'reports.html';
} else {

    function setText(id, value) {
        document.getElementById(id).textContent = value || 'Not provided';
    }

    setText('report-id', report.id);
    setText('report-date', report.date);

    setText('detail-date', report.date);
    setText('detail-time', report.time);
    setText('detail-reporter', report.reportedBy);

    setText('detail-summary', report.summary);
    setText('detail-perspective', report.perspective);
    setText('detail-cause', report.cause);
    setText('detail-needs', report.needs);
    setText('detail-reflection', report.reflection);
    setText('detail-resolution', report.resolution);
    setText('detail-status', report.status);

    setText('report-status', report.status || 'STATUS');

    const tagsContainer = document.getElementById('detail-tags');

    (report.tags || []).forEach(tag => {
        const element = document.createElement('span');
        element.textContent = tag;
        tagsContainer.appendChild(element);
    });
}
