import os
from flask import Flask, request, render_template, jsonify, send_file
from werkzeug.utils import secure_filename
from model_loader import load_model
from predict import predict_image
from heatmap import generate_heatmap
from report_generator import generate_pdf_report
import uuid

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join('static','uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

ALLOWED_EXTENSIONS = {'png','jpg','jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS


# Load Model
MODEL_PATH = r"C:\lung_cancer\lung_detection_model_v2.pth"

print("Loading model...")
model = load_model()
print("Model loaded successfully")


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/predict', methods=['POST'])
def predict_api():

    if 'file' not in request.files:
        return jsonify({'error':'No file uploaded'}),400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error':'No file selected'}),400

    if file and allowed_file(file.filename):

        ext = file.filename.rsplit('.',1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:

            result = predict_image(model, filepath)

            heatmap_filename = f"heatmap_{filename}"
            heatmap_path = os.path.join(app.config['UPLOAD_FOLDER'], heatmap_filename)

            generate_heatmap(model, filepath, heatmap_path)

            result["original_image"] = f"/static/uploads/{filename}"
            result["heatmap_image"] = f"/static/uploads/{heatmap_filename}"

            return jsonify(result)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error":str(e)}),500

    return jsonify({"error":"Invalid file type"}),400


@app.route('/report', methods=['POST'])
def generate_report():

    data = request.json

    try:
        pdf_path = generate_pdf_report(data)
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name="Lung_Cancer_AI_Report.pdf"
        )

    except Exception as e:
        return jsonify({"error":str(e)}),500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)