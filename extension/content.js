// content.js

class MyPlanEnhancer {
    constructor() {
        this.courseDatabase = null;
        this.init();
    }

    async init() {
        // Get course database from background script
        const data = await chrome.storage.local.get('courseDatabase');
        this.courseDatabase = data.courseDatabase;
        
        // Start observing for MyPlan changes
        this.observePageChanges();
        
        // Do initial enhancement
        this.enhanceMyPlan();
    }

    observePageChanges() {
        // Watch for dynamic content loading in MyPlan
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    this.enhanceMyPlan();
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async enhanceMyPlan() {
        // Find all course blocks in the plan
        const courseBlocks = document.querySelectorAll('.course-block');
        
        for (const block of courseBlocks) {
            if (block.dataset.enhanced) continue; // Skip if already enhanced
            
            const courseCode = this.extractCourseCode(block);
            const quarter = this.extractQuarter(block);
            
            // Add our enhancements
            this.addHistoricalInfo(block, courseCode, quarter);
            this.checkTimeConflicts(block, courseCode, quarter);
            this.analyzeWorkload(block, courseCode);
            
            block.dataset.enhanced = 'true';
        }

        // Analyze overall quarter workload
        this.analyzeQuarterWorkload();
    }

    addHistoricalInfo(block, courseCode, quarter) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'historical-info';
        
        // Get historical offering data
        const courseInfo = this.courseDatabase?.courses[courseCode];
        if (!courseInfo) return;

        // Calculate offering probability
        const probability = this.calculateOfferingProbability(courseInfo, quarter);
        
        // Create info display
        infoDiv.innerHTML = `
            <div class="offering-probability ${probability > 0.7 ? 'high' : probability > 0.3 ? 'medium' : 'low'}">
                <span class="label">Typically offered:</span>
                <span class="value">${this.formatProbability(probability)}</span>
            </div>
            <div class="typical-times">
                <span class="label">Common times:</span>
                <span class="value">${this.formatTypicalTimes(courseInfo.historicalPatterns.typicalTimes)}</span>
            </div>
        `;

        block.appendChild(infoDiv);
    }

    async checkTimeConflicts(block, courseCode, quarter) {
        // Get all courses in the same quarter
        const quarterCourses = this.getQuarterCourses(quarter);
        
        // Check for potential conflicts
        const conflicts = await chrome.runtime.sendMessage({
            type: 'CHECK_CONFLICTS',
            courses: quarterCourses,
            quarter: quarter
        });

        if (conflicts.length > 0) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'time-conflict-warning';
            warningDiv.innerHTML = `
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">Potential time conflict with: ${conflicts.join(', ')}</span>
            `;
            block.appendChild(warningDiv);
        }
    }

    async analyzeWorkload(block, courseCode) {
        const workload = await chrome.runtime.sendMessage({
            type: 'ANALYZE_WORKLOAD',
            courses: [courseCode]
        });

        const workloadDiv = document.createElement('div');
        workloadDiv.className = `workload-indicator ${workload.level}`;
        workloadDiv.innerHTML = `
            <span class="label">Expected workload:</span>
            <span class="value">${workload.description}</span>
        `;
        block.appendChild(workloadDiv);
    }

    async analyzeQuarterWorkload() {
        const quarterBlocks = document.querySelectorAll('.quarter-block');
        
        for (const quarterBlock of quarterBlocks) {
            const courses = Array.from(quarterBlock.querySelectorAll('.course-block'))
                .map(block => this.extractCourseCode(block));
                
            const quarterWorkload = await chrome.runtime.sendMessage({
                type: 'ANALYZE_WORKLOAD',
                courses: courses
            });

            if (quarterWorkload.level === 'high') {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'quarter-workload-warning';
                warningDiv.innerHTML = `
                    <span class="warning-icon">⚠️</span>
                    <span class="warning-text">Heavy course load detected! ${quarterWorkload.credits} credits</span>
                    <div class="warning-details">${quarterWorkload.details}</div>
                `;
                quarterBlock.insertBefore(warningDiv, quarterBlock.firstChild);
            }
        }
    }

    // Helper methods
    extractCourseCode(block) {
        const courseText = block.querySelector('.course-code')?.textContent;
        return courseText?.replace(/\s+/g, '') || '';
    }

    extractQuarter(block) {
        return block.closest('.quarter-block')?.dataset.quarter || '';
    }

    getQuarterCourses(quarter) {
        const quarterBlock = document.querySelector(`.quarter-block[data-quarter="${quarter}"]`);
        return Array.from(quarterBlock?.querySelectorAll('.course-block') || [])
            .map(block => this.extractCourseCode(block));
    }

    formatProbability(prob) {
        if (prob > 0.9) return "Very likely";
        if (prob > 0.7) return "Likely";
        if (prob > 0.3) return "Possible";
        return "Unlikely";
    }

    formatTypicalTimes(times) {
        return Object.entries(times)
            .map(([days, slots]) => `${days}: ${slots.join(', ')}`)
            .join(' | ');
    }
}

// Initialize when page loads
new MyPlanEnhancer();