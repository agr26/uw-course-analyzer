class CourseAnalyzerPopup {
    constructor() {
        this.searchInput = document.getElementById('courseSearch');
        this.courseDisplay = document.getElementById('courseDisplay');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Add input event listener with debouncing
        let timeout = null;
        this.searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.handleSearch(), 300);
        });
    }

    async handleSearch() {
        const query = this.searchInput.value.trim().toUpperCase();
        if (query.length < 3) {
            this.courseDisplay.innerHTML = '';
            return;
        }

        const courseCode = this.normalizeCourseCode(query);
        if (courseCode && courseData[courseCode]) {
            this.displayCourseInfo(courseCode);
        } else {
            this.courseDisplay.innerHTML = `
                <div class="course-info">
                    <p>No data found for ${query}</p>
                </div>
            `;
        }
    }

    normalizeCourseCode(query) {
        // Handle different input formats (e.g., "CSE142", "CSE 142")
        const match = query.match(/([A-Z&]+)\s*(\d+)/);
        return match ? `${match[1]}${match[2]}` : null;
    }

    displayCourseInfo(courseCode) {
        const courseInfo = courseData[courseCode];
        if (!courseInfo) return;

        this.courseDisplay.innerHTML = `
            <div class="course-info">
                <h2>${courseInfo.department} ${courseInfo.number}</h2>
                <h3>${courseInfo.title}</h3>
                
                <div class="offering-pattern">
                    ${this.renderQuarterStats(courseInfo.historicalPatterns)}
                </div>

                <div class="time-patterns">
                    <h4>Common Time Slots</h4>
                    ${this.renderTimePatterns(courseInfo.historicalPatterns.typicalTimes)}
                </div>

                <div class="workload-info">
                    <h4>Course Information</h4>
                    <p>Total Offerings: ${Object.keys(courseInfo.offerings).length}</p>
                    <p>Most Recent: ${this.getMostRecentOffering(courseInfo.offerings)}</p>
                </div>
            </div>
        `;
    }

    renderQuarterStats(patterns) {
        const quarters = ['AUT', 'WIN', 'SPR', 'SUM'];
        return quarters.map(quarter => `
            <div class="quarter-stat">
                <div class="quarter-label">${quarter}</div>
                <div class="probability ${this.getProbabilityClass(patterns.offeringQuarters.includes(quarter))}">
                    ${patterns.offeringQuarters.includes(quarter) ? "Offered" : "Not offered"}
                </div>
            </div>
        `).join('');
    }

    renderTimePatterns(times) {
        if (!times || Object.keys(times).length === 0) {
            return '<p>No time pattern data available</p>';
        }

        return Object.entries(times)
            .map(([days, slots]) => `
                <div class="time-slot">
                    <span class="days">${days}</span>
                    <span class="slots">${slots.join(', ')}</span>
                </div>
            `).join('');
    }

    getProbabilityClass(offered) {
        return offered ? 'high' : 'low';
    }

    getMostRecentOffering(offerings) {
        const quarters = Object.keys(offerings).sort().reverse();
        return quarters[0] || 'No recent offerings';
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CourseAnalyzerPopup();
});