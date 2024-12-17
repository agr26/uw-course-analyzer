// background.js

const courseDatabase = {
    courses: {
        // Example structure
        "CSE142": {
            department: "CSE",
            number: "142",
            title: "Computer Programming I",
            credits: 4,
            historicalPatterns: {
                offeringQuarters: ["AUT", "WIN", "SPR"], // Which quarters it's typically offered
                typicalTimes: {
                    "MWF": ["8:30", "9:30", "10:30"],   // Common time slots
                    "TTh": ["9:00", "11:30"]
                },
                frequency: {
                    "AUT": 0.95,  // Offered 95% of autumn quarters
                    "WIN": 0.90,
                    "SPR": 0.85,
                    "SUM": 0.10
                }
            },
            offerings: {
                // Detailed quarter-by-quarter data
                "AUT2022": {
                    sections: [
                        {
                            times: "MWF 8:30-9:20",
                            enrollment: 100,
                            maxEnrollment: 100
                        }
                        // ... other sections
                    ],
                    totalCredits: 4,
                    averageWorkload: "medium" // Based on credit load + historical patterns
                }
                // ... other quarters
            }
        }
    }
};

async function processJsonData() {
    try {
        const data = await loadAllJsonFiles();
        
        // Process each course
        data.forEach(quarterData => {
            quarterData.courses.forEach(course => {
                const courseCode = `${course.department}${course.number}`;
                
                // Initialize or update course data
                if (!courseDatabase.courses[courseCode]) {
                    courseDatabase.courses[courseCode] = {
                        department: course.department,
                        number: course.number,
                        title: course.title,
                        credits: extractCredits(course),
                        historicalPatterns: initializePatterns(),
                        offerings: {}
                    };
                }

                // Update historical patterns
                updateOfferingPatterns(courseDatabase.courses[courseCode], course);
                
                // Store detailed offering data
                storeQuarterOffering(courseDatabase.courses[courseCode], course);
            });
        });

        // Calculate conflict probabilities
        calculateTimeConflicts();

        // Store processed data
        await chrome.storage.local.set({ courseDatabase });

    } catch (error) {
        console.error('Error processing course data:', error);
    }
}

// Helper functions for answering key questions
async function willCourseBeOffered(courseCode, targetQuarter) {
    const course = await getCourseInfo(courseCode);
    return calculateOfferingProbability(course, targetQuarter);
}

async function checkTimeConflicts(courses, quarter) {
    // Check for historical time conflicts between courses
    return analyzeTimeConflicts(courses, quarter);
}

async function analyzeCourseLoad(courses) {
    // Analyze total credits and historical difficulty
    return calculateWorkload(courses);
}

// Message handler for content script requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch(request.type) {
        case 'CHECK_COURSE_OFFERING':
            willCourseBeOffered(request.courseCode, request.quarter).then(sendResponse);
            return true;
        case 'CHECK_CONFLICTS':
            checkTimeConflicts(request.courses, request.quarter).then(sendResponse);
            return true;
        case 'ANALYZE_WORKLOAD':
            analyzeCourseLoad(request.courses).then(sendResponse);
            return true;
    }
});