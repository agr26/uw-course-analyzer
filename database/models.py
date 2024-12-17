from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Course(Base):
    __tablename__ = 'courses'
    
    id = Column(Integer, primary_key=True)
    department = Column(String)
    code = Column(String)
    title = Column(String)
    credits = Column(String)
    
    offerings = relationship("CourseOffering", back_populates="course")
    
    def __repr__(self):
        return f"<Course {self.department} {self.code}>"

class CourseOffering(Base):
    __tablename__ = 'course_offerings'
    
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'))
    quarter = Column(String)
    year = Column(String)
    days = Column(String)
    time_start = Column(String)
    time_end = Column(String)
    building = Column(String)
    room = Column(String)
    instructor = Column(String)
    
    course = relationship("Course", back_populates="offerings")
    
    def __repr__(self):
        return f"<CourseOffering {self.course.department} {self.course.code} {self.quarter}{self.year}>"