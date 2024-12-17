from flask import Flask, jsonify
from flask_cors import CORS
from database.database import init_db
import logging

app = Flask(__name__)
CORS(app)

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database
init_db()

@app.route('/api/course/<department>/<code>')
def get_course_history(department, code):
    try:
        # Implement course history retrieval
        return jsonify({"status": "success", "data": []})
    except Exception as e:
        logger.error(f"Error retrieving course history: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)