import json
import os
from pathlib import Path

def convert_json_to_js():
    # Path to your processed JSON files
    json_dir = Path("data/processed")
    output_file = Path("extension/courseData.js")
    
    # Combined data structure
    combined_data = {}
    
    # Process each JSON file
    print("Processing JSON files...")
    for filepath in json_dir.glob('*.json'):
        print(f"Reading {filepath.name}")
        quarter = filepath.stem  # Gets filename without .json
        
        with open(filepath, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                
                # Process each course in the file
                for course in data:
                    course_code = f"{course['department']}{course['number']}"
                    
                    # Initialize course data if not exists
                    if course_code not in combined_data:
                        combined_data[course_code] = {
                            'department': course['department'],
                            'number': course['number'],
                            'title': course['title'],
                            'offerings': {},
                            'historicalPatterns': {
                                'offeringQuarters': set(),
                                'typicalTimes': {},
                                'frequency': {
                                    'AUT': 0, 'WIN': 0, 'SPR': 0, 'SUM': 0
                                }
                            }
                        }
                    
                    # Add offering data
                    combined_data[course_code]['offerings'][quarter] = {
                        'sections': course['sections']
                    }
                    
                    # Update historical patterns
                    quarter_type = quarter[:3]  # Get AUT, WIN, SPR, or SUM
                    combined_data[course_code]['historicalPatterns']['offeringQuarters'].add(quarter_type)
                    
                    # Process times
                    for section in course['sections']:
                        if section.get('times'):
                            try:
                                days = section['times'].split()[0]
                                time = section['times'].split()[1]
                                if days not in combined_data[course_code]['historicalPatterns']['typicalTimes']:
                                    combined_data[course_code]['historicalPatterns']['typicalTimes'][days] = set()
                                combined_data[course_code]['historicalPatterns']['typicalTimes'][days].add(time)
                            except IndexError:
                                continue
            except json.JSONDecodeError:
                print(f"Error reading {filepath.name} - skipping")
                continue
    
    print("\nProcessing historical patterns...")
    # Convert sets to lists for JSON serialization
    for course_code, course in combined_data.items():
        print(f"Processing {course_code}")
        course['historicalPatterns']['offeringQuarters'] = list(course['historicalPatterns']['offeringQuarters'])
        for days in course['historicalPatterns']['typicalTimes']:
            course['historicalPatterns']['typicalTimes'][days] = list(course['historicalPatterns']['typicalTimes'][days])
    
    print("\nWriting to courseData.js...")
    # Write to JavaScript file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('const courseData = ')
        json.dump(combined_data, f, indent=2)
        f.write(';')
    
    print(f"Complete! Processed {len(combined_data)} courses.")

if __name__ == "__main__":
    convert_json_to_js()