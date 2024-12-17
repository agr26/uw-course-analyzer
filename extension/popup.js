// popup.js

class CourseAnalyzerPopup {
    constructor() {
        this.searchInput = document.getElementById('courseSearch');
        this.courseDisplay = document.getElementById('courseDisplay');
        this.initializeEventListeners();
        this.loadActiveTabCourse();
    }

    initializeEventListeners() {
        this.searchInput.addEventListener('input', () => this.handleSearch());

        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'COURSE_SELECTED') {
                this.displayCourseInfo(message.courseCode);
            }
        });
    }

    async loadActiveTabCourse() {
        // Check if we're on MyPlan and get selected course
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url.includes('washington.edu/myplan')) {
            chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTED_COURSE' });
        }
    }

    async handleSearch() {
        const query = this.searchInput.value.trim().toUpperCase();
        if (query.length < 3) return;

        const courseCode = this.normalizeCourseCode(query);
        if (courseCode) {
            await this.displayCourseInfo(courseCode);
        }
    }

    normalizeCourseCode(query) {
        // Handle different input formats (e.g., "CSE142", "CSE 142")
        const match = query.match(/([A-Z&]+)\s*(\d+)/);
        return match ? `${match[1]}${match[2]}` : null;
    }

    async displayCourseInfo(courseCode) {
        const courseInfo = await this.fetchCourseInfo(courseCode);
        if (!courseInfo) {
            this.courseDisplay.innerHTML = `
                <div class="course-info">
                    <p>No data found for ${courseCode}</p>
                </div>
            `;
            return;
        }

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
                    <p>Credits: ${courseInfo.credits}</p>
                    <p>Average Workload: ${this.getWorkloadDescription(courseInfo)}</p>
                </div>
            </div>
        `;
    }

    renderQuarterStats(patterns) {
        const quarters = ['AUT', 'WIN', 'SPR', 'SUM'];
        return quarters.map(quarter => `
            <div class="quarter-stat">
                <div class="quarter-label">${quarter}</div>
                <div class="probability ${this.getProbabilityClass(patterns.frequency[quarter])}">
                    ${this.formatProbability(patterns.frequency[quarter])}
                </div>
            </div>
        `).join('');
    }

    renderTimePatterns(times) {
        return Object.entries(times)
            .map(([days, slots]) => `
                <div class="time-slot">
                    <span class="days">${days}</span>
                    <span class="slots">${slots.join(', ')}</span>
                </div>
            `).join('');
    }

    getProbabilityClass(prob) {
        if (prob > 0.7) return 'high';
        if (prob > 0.3) return 'medium';
        return 'low';
    }

    formatProbability(prob) {
        if (prob > 0.9) return "Very Likely";
        if (prob > 0.7) return "Likely";
        if (prob > 0.3) return "Possible";
        return "Unlikely";
    }

    getWorkloadDescription(courseInfo) {
        // Calculate workload based on credits and historical data
        const avgWorkload = courseInfo.offerings.reduce((sum, o) => 
            sum + (o.averageWorkload === "heavy" ? 3 : o.averageWorkload === "medium" ? 2 : 1), 0
        ) / courseInfo.offerings.length;

        if (avgWorkload > 2.5) return "Heavy";
        if (avgWorkload > 1.5) return "Medium";
        return "Light";
    }

    async fetchCourseInfo(courseCode) {
        return new Promise(resolve => {
            chrome.runtime.sendMessage(
                { type: 'GET_COURSE_INFO', courseCode },
                response => resolve(response)
            );
        });
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    new CourseAnalyzerPopup();
});