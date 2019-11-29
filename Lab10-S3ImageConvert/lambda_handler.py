'''
* Lambda runtime: Python 3.7

* Choose one of the following to upload python Pillow package:
    1. Download https://awscn.s3.cn-northwest-1.amazonaws.com.cn/python-Pillow-6.2.1.zip
    2. Install python Pillow on Amazon Linux 2, and package as zipfile

    Upload the zip file to Lambda Layer and add this layer to your function
    How to create Lambda Layer? Refer to: 
    https://aws.amazon.com/cn/blogs/china/use-aws-lambda-layer-function/

* Set appropriate Lambda Memory (e.g. 256MB) and timeout (e.g. 1 min)

* Optional: Change your image output format in code:
    convert_format = 'WebP'
    convert_postfix = '.webp'

* Setup Lambda trigger by S3 bucket with "input/" prefix

* Upload img file to S3 Bucket with "input/" prefix and Lambda will output the
    file to the same bucket with "output/" prefix and .webp postfix
'''
#####################
import os

preserv_original_format = os.environ['preserv_original_format'] == 'True'
# True: detect original image format and keep it to target
# False: convert original image to the format as below
convert_format = os.environ['convert_format']  # Target format
convert_postfix = os.environ['convert_postfix']  # Target file postfix

resize_feature = os.environ['resize_feature']
# Disable: do not resize image
# Percentile: resize base on below resize_Percentile and keep ratio
# FixSize: resize base on below FixSize and keep ratio
# PercentileNoRatio: resize base on below resize_Percentile and DO NOT keep ratio
# FixSizeNoRatio: resize base on below FixSize and DO NOT keep ratio
resize_Percentile_w = float(os.environ['resize_Percentile_w'])
resize_Percentile_h = float(os.environ['resize_Percentile_h'])
resize_FixSize_w = int(os.environ['resize_FixSize_w'])
resize_FixSize_h = int(os.environ['resize_FixSize_h'])

save_quality = int(os.environ['save_quality']) # output image quality for webp, jpeg ...
jpeg_progressive = os.environ['jpeg_progressive'] == 'True' # progressive mode for JPEG
auto_orientation = os.environ['auto_orientation'] == 'True' # auto rotate iamge base on exif info

#TODO: Watermark with text, image
#TODO: Blur, Contrast, Bright, Sharp, Rotate

# Best practise: 
# Implement above variable to Lambda Environment Variable and read from os.environ
#####################

import logging
import boto3
import json
from PIL import Image, ExifTags, ImageOps
import io
import urllib.parse

#logging.basicConfig(filename='logger.log')
logger = logging.getLogger()
logger.setLevel(logging.INFO)
client = boto3.client('s3')

# get img from s3
def load_s3(bucket, key):
    logger.info(f'load from s3://{bucket}/{key}')

    try:
        response = client.get_object(
            Bucket=bucket,
            Key=key
        )
        logger.info(json.dumps(response, default=str))
    except Exception as e:
        logging.error(json.dumps(e, default=str))
    body = response['Body'].read()
    return body

# auto orientation base on exif info from image
def auto_exif_orientation(image):
    try:
        exif = image._getexif()
    except AttributeError:
        exif = None
    if exif is None:
        logger.info('no exif_orientation')
        return image
    exif = {ExifTags.TAGS[k]: v for k, v in exif.items() if k in ExifTags.TAGS}
    orientation = exif.get('Orientation', None)
    logger.info(f'original orientation:{orientation} to:')

    if orientation == 1:
        logger.info('no change')
        return image
    elif orientation == 2:
        logger.info('left-to-right mirror')
        return ImageOps.mirror(image)
    elif orientation == 3:
        logger.info('rotate 180')
        return image.transpose(Image.ROTATE_180)
    elif orientation == 4:
        logger.info('top-to-bottom mirror')
        return ImageOps.flip(image)
    elif orientation == 5:
        logger.info('top-to-left mirror')
        return ImageOps.mirror(image.transpose(Image.ROTATE_270))
    elif orientation == 6:
        logger.info('rotate 270')
        return image.transpose(Image.ROTATE_270)
    elif orientation == 7:
        logger.info('top-to-right mirror')
        return ImageOps.mirror(image.transpose(Image.ROTATE_90))
    elif orientation == 8:
        logger.info('rotate 90')
        return image.transpose(Image.ROTATE_90)
    else:
        return image


# convert
def img_convert(body, convert_format, in_mem_img):
    logger.info('convert ...')
    
    try:
        im = Image.open(io.BytesIO(body))
        if preserv_original_format:
            convert_format = im.format

        # auto orientation
        if auto_orientation:
            im = auto_exif_orientation(im)

        # resize
        if resize_feature.lower() == 'percentile':
            logger.info('resizing percentile and keep ratio ...')
            w, h = im.size
            w, h = int(w*resize_Percentile_w), int(h*resize_Percentile_h)
            im.thumbnail((w,h))
        if resize_feature.lower() == 'fixsize':
            logger.info('resizing fixsize and keep ratio ...')
            w, h = resize_FixSize_w, resize_FixSize_h
            im.thumbnail((w, h))
        if resize_feature.lower() == 'percentilenoratio':
            logger.info('resizing percentile and ignore ratio ...')
            w, h = im.size
            w, h = int(w*resize_Percentile_w), int(h*resize_Percentile_h)
            im = im.resize((w, h), resample=Image.BICUBIC)
        if resize_feature.lower() == 'fixsizenoratio':
            logger.info('resizing fixsize and igore ratio ...')
            w, h = resize_FixSize_w, resize_FixSize_h
            im = im.resize((w, h), resample=Image.BICUBIC)

        logger.info(f'target size:{im.size}')

        # convert PNG RGBA mode to RGB for JPEG
        if im.mode != 'RGB' and convert_format.lower() == 'jpeg':
            im = im.convert(mode='RGB')

        #save to target format        
        im.save(in_mem_img, format=convert_format,
                lossless=True, quality=save_quality, progressive=jpeg_progressive)
        in_mem_img.seek(0)
    except Exception as e:
        logging.error(json.dumps(e, default=str))
    return in_mem_img

# put img to s3
def save_s3(bucket, key, body):
    logger.info(f'save to s3://{bucket}/{key}')
    try:
        response = client.put_object(
            Bucket=bucket,
            Key=key,
            Body=body
        )
        logger.info(json.dumps(response, default=str))
    except Exception as e:
        logging.error(json.dumps(e, default=str))
    return

# change prefix from input/ to output/ and change postfix
def change_key(key, convert_postfix):
    key_pre = os.path.splitext(key)[0].replace('input', 'output', 1)
    if not preserv_original_format:
        key_new = key_pre+convert_postfix
    else: 
        key_new = key_pre+os.path.splitext(key)[1]
    return key_new


def lambda_handler(event, context):
    logger.info(json.dumps(event, default=str))
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')

    img_org = load_s3(bucket, key)
    in_mem_img = io.BytesIO()
    body = img_convert(img_org, convert_format, in_mem_img)
    key_new = change_key(key, convert_postfix)
    save_s3(bucket, key_new, body)

    return {
        'statusCode': 200,
        'body': 'OK'
    }
