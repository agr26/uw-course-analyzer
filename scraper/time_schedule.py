import requests
from bs4 import BeautifulSoup
import json
import logging
from pathlib import Path
import re
import os

class TimeScheduleScraper:
   def __init__(self):
       self.raw_data_dir = Path("data/raw/time_schedule")
       self.processed_data_dir = Path("data/processed")
       
       self.processed_data_dir.mkdir(parents=True, exist_ok=True)
       
       logging.basicConfig(
           level=logging.INFO,
           format='%(asctime)s - %(levelname)s - %(message)s'
       )
       self.logger = logging.getLogger(__name__)

   def parse_course_info(self, html_content, filename):
       """Parse course information from a department's HTML content."""
       soup = BeautifulSoup(html_content, 'html.parser')
       courses = []

       # Expanded list of possible background colors
       bg_colors = [
           '#ffcccc', '#99ccff',  # Autumn/Winter - pink/blue
           '#ccffcc',             # Spring - green
           '#ffffcc',             # Summer - yellow
           'ffcccc', '99ccff',    # Without # prefix
           'ccffcc',
           'ffffcc',
           '#FFCCCC', '#99CCFF',  # Uppercase versions
           '#CCFFCC',
           '#FFFFCC',
           'FFCCCC', '99CCFF',
           'CCFFCC',
           'FFFFCC'
       ]
       
       # Find course tables with any of these background colors
       course_tables = soup.find_all('table', attrs={'bgcolor': bg_colors})
       
       if not course_tables:
           # Try finding tables by structure if no bgcolor match
           all_tables = soup.find_all('table')
           course_tables = [t for t in all_tables if t.find('td', attrs={'width': '50%'}) 
                          and any(word in t.get_text() for word in ['COURSE', 'Prerequisites', 'Credit'])]
       
       print(f"Found {len(course_tables)} course tables in {filename}")

       for i, course_table in enumerate(course_tables):
           try:
               # Get course header info
               header_cell = course_table.find('td', attrs={'width': '50%'})
               if not header_cell:
                   continue

               # Get the text content
               course_text = header_cell.get_text(strip=True)
               print(f"Processing course: {course_text}")
               
               # More flexible pattern to match course codes and titles
               pattern = r'([A-Z &]+)\s*(\d+[A-Z0-9]*\s*[A-Z0-9]*)\s*(.+?)(?:\([^)]*\))?$'
               match = re.match(pattern, course_text)
               
               if not match:
                   print(f"Could not parse course text: {course_text}")
                   continue

               dept, number, title = match.groups()
               
               course = {
                   'department': dept.strip(),
                   'number': number.strip(),
                   'title': title.strip(),
                   'sections': []
               }

               # Get sections
               current_table = course_table
               while True:
                   current_table = current_table.find_next_sibling('table')
                   if not current_table or current_table.get('bgcolor', '').lower() in bg_colors:
                       break
                       
                   pre_tag = current_table.find('pre')
                   if not pre_tag:
                       continue

                   section_text = pre_tag.get_text(strip=True)
                   section = self._parse_section(section_text)
                   if section:
                       course['sections'].append(section)

               courses.append(course)
               print(f"Successfully parsed course {dept} {number} with {len(course['sections'])} sections")

           except Exception as e:
               print(f"Error parsing course in {filename}: {str(e)}")
               continue

       return courses

   def _parse_section(self, section_text):
       """Parse individual section information."""
       try:
           # Extract SLN (5-digit number)
           sln_match = re.search(r'\b(\d{5})\b', section_text)
           sln = sln_match.group(1) if sln_match else ""

           # Extract section ID (typically a letter or two after the SLN)
           section_id_match = re.search(r'\d{5}\s+([A-Z]{1,2}[0-9]?)\b', section_text)
           section_id = section_id_match.group(1) if section_id_match else ""

           # Extract meeting times
           times_match = re.search(r'\b([MTWF][WAThF]*\s+\d{1,4}[-\s]+\d{1,4}[AP]?M?)\b', section_text)
           times = times_match.group(1) if times_match else ""

           # Extract room/building
           building_match = re.search(r'\b([A-Z]{2,4})\s+(\d+[A-Z0-9]*)\b', section_text)
           building = building_match.group(1) if building_match else ""
           room = building_match.group(2) if building_match else ""

           # Extract instructor
           instructor = ""
           if building and room:
               instructor_pattern = fr'(?:{building}\s+{room}\s+)([^C][^l][^\s].*?)(?:Open|Closed|Restr|$)'
               instructor_match = re.search(instructor_pattern, section_text)
               instructor = instructor_match.group(1).strip() if instructor_match else ""

           # Extract status
           status = "Closed" if "Closed" in section_text else "Open" if "Open" in section_text else ""

           # Extract additional info (notes, restrictions, etc.)
           additional_info = []
           for line in section_text.split('\n'):
               line = line.strip()
               if line and not any(x in line for x in [sln, section_id, times, building]):
                   clean_line = ' '.join(line.split())  # Normalize whitespace
                   if clean_line:
                       additional_info.append(clean_line)

           return {
               'sln': sln,
               'section_id': section_id,
               'times': times,
               'building': building,
               'room': room,
               'instructor': instructor,
               'status': status,
               'additional_info': additional_info
           }
       except Exception as e:
           print(f"Error parsing section: {str(e)}")
           return None

   def process_saved_files(self):
       """Process all saved HTML files and create JSON output."""
       total_files = 0
       processed_files = 0
       failed_files = 0
       skipped_files = 0

       # Get list of all HTML files
       html_files = list(self.raw_data_dir.glob('*.html'))
       print(f"\nFound {len(html_files)} total HTML files")
       
       # Create a log of failed files
       failed_log = open('failed_files.txt', 'w')
       
       for html_file in sorted(html_files):
           total_files += 1
           try:
               print(f"\n{'='*50}")
               print(f"Processing {html_file.name}...")
               
               with open(html_file, 'r', encoding='utf-8') as f:
                   html_content = f.read()
               
               # Look for course tables
               soup = BeautifulSoup(html_content, 'html.parser')
               course_tables = soup.find_all('table', attrs={'bgcolor': [
                   '#ffcccc', '#99ccff',  # Autumn/Winter - pink/blue
                   '#ccffcc',             # Spring - green
                   '#ffffcc',             # Summer - yellow
                   'ffcccc', '99ccff',    # Without # prefix
                   'ccffcc',
                   'ffffcc',
                   '#FFCCCC', '#99CCFF',  # Uppercase versions
                   '#CCFFCC',
                   '#FFFFCC',
                   'FFCCCC', '99CCFF',
                   'CCFFCC',
                   'FFFFCC'
               ]})
               
               if not course_tables:
                   print(f"No course tables found in {html_file.name}")
                   # Debug info about the file
                   tables = soup.find_all('table')
                   print(f"Total tables found: {len(tables)}")
                   if tables:
                       print("First table bgcolor:", tables[0].get('bgcolor', 'None'))
                   skipped_files += 1
                   failed_log.write(f"{html_file.name}: No course tables found\n")
                   continue
               
               courses = self.parse_course_info(html_content, html_file.name)
               
               if courses:
                   output_file = self.processed_data_dir / f"{html_file.stem}.json"
                   with open(output_file, 'w', encoding='utf-8') as f:
                       json.dump(courses, f, indent=2, ensure_ascii=False)
                   
                   num_sections = sum(len(course['sections']) for course in courses)
                   print(f"Successfully processed: Found {len(courses)} courses with {num_sections} sections")
                   processed_files += 1
               else:
                   print(f"No courses parsed from {html_file.name}")
                   failed_files += 1
                   failed_log.write(f"{html_file.name}: Parsed no courses\n")
               
           except Exception as e:
               print(f"Error processing {html_file}: {str(e)}")
               failed_files += 1
               failed_log.write(f"{html_file.name}: Error - {str(e)}\n")
               continue

       failed_log.close()

       print(f"\nProcessing Summary:")
       print(f"Total files found: {total_files}")
       print(f"Successfully processed: {processed_files}")
       print(f"Failed to process: {failed_files}")
       print(f"Skipped (no tables): {skipped_files}")
       print("\nCheck failed_files.txt for details on failures")

def main():
   scraper = TimeScheduleScraper()
   scraper.process_saved_files()

if __name__ == "__main__":
   main()