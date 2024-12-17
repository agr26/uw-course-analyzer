from scraper.time_schedule import TimeScheduleScraper

def main():
    scraper = TimeScheduleScraper()
    
    # Test with recent quarters (2020-2024)
    years = ['20', '21', '22', '23', '24']
    quarters = ['AUT', 'WIN', 'SPR', 'SUM']
    
    for year in years:
        for quarter in quarters:
            print(f"Scraping {quarter}{year}...")
            courses = scraper.scrape_quarter(quarter, year)
            if courses:
                print(f"Found {len(courses)} courses")
            else:
                print(f"No courses found or error occurred")
            print("-------------------")

if __name__ == "__main__":
    main()