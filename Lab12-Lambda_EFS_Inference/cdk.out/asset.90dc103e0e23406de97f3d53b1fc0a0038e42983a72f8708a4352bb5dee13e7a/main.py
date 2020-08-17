import urllib
import json
import os

import torch
from PIL import Image
from torchvision import transforms

transform_test = transforms.Compose([
    transforms.Resize((600, 600), Image.BILINEAR),
    transforms.CenterCrop((448, 448)),
    transforms.ToTensor(),
    transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
])

model = torch.hub.load('nicolalandro/ntsnet-cub200', 'ntsnet', pretrained=True, **{'topN': 6, 'device':'cpu', 'num_classes': 200})
model.eval()

def lambda_handler(event, context):
    url = event['queryStringParameters']['url']
    
    img = Image.open(urllib.request.urlopen(url))
    scaled_img = transform_test(img)
    torch_images = scaled_img.unsqueeze(0)

    with torch.no_grad():
        top_n_coordinates, concat_out, raw_logits, concat_logits, part_logits, top_n_index, top_n_prob = model(torch_images)

        _, predict = torch.max(concat_logits, 1)
        pred_id = predict.item()
        bird_class = model.bird_classes[pred_id]
        print('bird_class:', bird_class)

    return json.dumps({
        "bird_class": bird_class,
    })