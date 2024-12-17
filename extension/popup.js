(function() {
    // Ensure courseData is globally available immediately
    if (typeof courseData !== 'undefined') {
      window.courseData = courseData;
    }
  
    function initializeSearch() {
      console.log('Initializing search functionality');
      console.log('Global courseData:', window.courseData);
  
      const searchInput = document.getElementById('courseSearch');
      const courseDisplay = document.getElementById('courseDisplay');
  
      if (!searchInput || !courseDisplay) {
        console.error('Required DOM elements not found');
        return;
      }
  
      // Verify courseData before setting up search
      if (!window.courseData || Object.keys(window.courseData).length === 0) {
        courseDisplay.innerHTML = `
          <div class="course-info">
            <p>Error: No course data available</p>
          </div>`;
        return;
      }
  
      console.log('Total courses:', Object.keys(window.courseData).length);
      console.log('Sample course keys:', Object.keys(window.courseData).slice(0, 5));
  
      function handleSearch() {
        const query = searchInput.value.trim().toUpperCase();
        
        if (query.length < 3) {
          courseDisplay.innerHTML = '';
          return;
        }
  
        const match = query.match(/([A-Z&]+)\s*(\d+)/);
        
        if (!match) {
          courseDisplay.innerHTML = `
            <div class="course-info">
              <p>Please enter a valid course code (e.g., INFO 200)</p>
            </div>`;
          return;
        }
  
        const searchDept = match[1];
        const searchNumber = match[2];
  
        const matchingCourseCode = Object.keys(window.courseData).find(courseCode => 
          courseCode.startsWith(searchDept) && courseCode.includes(searchNumber)
        );
  
        if (!matchingCourseCode) {
          courseDisplay.innerHTML = `
            <div class="course-info">
              <p>No data found for ${query}</p>
            </div>`;
          return;
        }
  
        const courseInfo = window.courseData[matchingCourseCode];
  
        const formattedNumber = courseInfo.number.replace(/(\d+)/, ' $1');
  
        courseDisplay.innerHTML = `
          <div class="course-info">
            <h2>${courseInfo.department} ${formattedNumber}</h2>
            <h3>${courseInfo.title}</h3>
            
            <div class="offering-pattern">
              ${['AUT', 'WIN', 'SPR', 'SUM'].map(quarter => `
                <div class="quarter-stat">
                  <div class="quarter-label">${quarter}</div>
                  <div class="probability ${courseInfo.historicalPatterns?.offeringQuarters?.includes(quarter) ? 'high' : 'low'}">
                    ${courseInfo.historicalPatterns?.offeringQuarters?.includes(quarter) ? "Offered" : "Not offered"}
                  </div>
                </div>
              `).join('')}
            </div>
  
            <div class="time-patterns">
              <h4>Common Time Slots</h4>
              ${courseInfo.historicalPatterns?.typicalTimes && Object.keys(courseInfo.historicalPatterns.typicalTimes).length > 0 ? 
                Object.entries(courseInfo.historicalPatterns.typicalTimes).map(([days, times]) => `
                  <div class="time-slot">
                    <span>${days}</span>
                    <span>${Array.isArray(times) ? times.join(', ') : times}</span>
                  </div>
                `).join('') : 
                '<p>No typical time slots found</p>'}
            </div>
          </div>
        `;
      }
  
      let timeout = null;
      searchInput.addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(handleSearch, 300);
      });
  
      console.log('Search functionality initialized');
    }
  
    // Multiple ways to ensure initialization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSearch);
    } else {
      initializeSearch();
    }
  })();