import torch
from torchvision import transforms
from PIL import Image

classes = [
    'adenocarcinoma',
    'large_cell_carcinoma',
    'normal',
    'squamous_cell_carcinoma'
]

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor()
])


def estimate_stage(label):
    if label == "adenocarcinoma":
        return "Stage I"
    elif label == "large_cell_carcinoma":
        return "Stage II"
    elif label == "squamous_cell_carcinoma":
        return "Stage III"
    elif label == "normal":
        return "No Cancer"
    return "Unknown"


def estimate_risk(confidence, label):
    if label == "normal":
        return "Low Risk"

    if confidence > 90:
        return "High Risk"
    elif confidence > 70:
        return "Moderate Risk"
    else:
        return "Low Risk"


def estimate_survival(stage):
    if stage == "Stage I":
        return "High Survival Rate"
    elif stage == "Stage II":
        return "Moderate Survival Rate"
    elif stage == "Stage III":
        return "Needs Immediate Treatment"
    elif stage == "No Cancer":
        return "Healthy"
    return "Consult Oncologist"


def predict_image(model, img_path):

    image = Image.open(img_path).convert("RGB")
    tensor = transform(image).unsqueeze(0)

    model.eval()

    with torch.no_grad():
        outputs = model(tensor)

    probs = torch.softmax(outputs, dim=1)
    confidence, pred = torch.max(probs,1)

    label = classes[pred.item()]
    confidence = float(confidence.item()) * 100

    stage = estimate_stage(label)
    risk = estimate_risk(confidence, label)
    survival = estimate_survival(stage)

    return {
        "prediction": "Cancer Detected" if label != "normal" else "Normal Lung",
        "subtype": label.replace("_"," ").title(),
        "confidence": round(confidence,2),
        "stage": stage,
        "risk": risk,
        "survival": survival
    }