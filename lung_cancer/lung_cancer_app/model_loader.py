import torch
from torchvision import models
import os

MODEL_PATH = "lung_detection_model_v2.pth"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model():

    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features,4)

    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))

    model = model.to(device)
    model.eval()

    return model