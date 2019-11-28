# Lab 10 Amazon S3 自动转换图片格式（Layer与环境变量）
Amazon S3 存储桶 input 目录新增文件自动触发 AWS Lambda。Lambda 取 S3 文件做转换并存回去 S3 同一个桶的 output 目录下。本 Lab 使用 Python Pillow 做图片转换，读者可以参考 Pillow 文档进行功能扩展。  
## 实现以下功能
### 转换格式
指定以下格式转换，或者选择保留原图格式
* Full Suported image formats: BMP, DIB, EPS, GIF, ICNS, ICO, IM, JPEG, JPEG 2000, MSP, PCX, PNG, PPM, SGI, SPIDER, TGA, TIFF, WebP, XBM
* Read-only formats: BLP, CUR, DCX, DDS, FLI, FLC, FPX, FTEX, GBR, GD, IMT, IPTC/NAA, MCIDAS, MIC, MPO, PCD, PIXAR, PSD, WAL, XPM
* Write-only formats: PALM, PDF, XV Thumbnails  

更多详情参考 Pillow 文档: https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html

### 转换图像大小
* 指定图像宽度和高度进行转换
* 按原图的百分比进行缩放
* 可选择是否保留原图的纵横比 Ratio

### 控制图像质量
* 输出 JPEG，WebP 等图像格式式指定输出的图像质量 0-100，网页展示用可设置 80  
* 输出为 JPEG 渐进式格式

### 其他功能
* 自适应旋转图像。根据原图的 Exif 信息，自动旋转图像
   
## 配置步骤如下：  
1. 新建 S3 桶
新建一个 Amazon S3 的存储桶。用于存放上传的文件和转换后的文件。  
本 Lab 的代码会针对该桶的 input/ 目录提取文件，并把转换后的文件存放在该桶的 output/ 目录。  

2. 创建 IAM 角色
创建一个 IAM Role 给 Lambda 运行使用，具有读写 S3 的权限和写 Log 的权限。参考 [policy.js](./policy.js)

3. 创建 Lambda 函数  
创建一个 Lambda 函数，代码见 [lambda_handler.py](./lambda_handler.py)
设置运行环境为 Python3.7，运行内存 256MB，运行超时时间 5 分钟。  

4. 设置 Lambda 环境变量  
该 Lambda 函数引用了以下的环境变量作为转换方式的配置，请配置以下的环境变量，可参考以下值配置：  
    * `preserv_original_format = False`   
    True: 自动检测并保留原图格式和文件后缀  
    False: 转换图像格式为以下格式  
    * `convert_format = 'WebP'`  
    转换的目标图像格式  
    * `convert_postfix = '.webp'`  
    转换后的图像文件后缀  
    * `resize_feature = 'FixSize'`  
    Disable: 不转换大小   
    Percentile: 基于以下百分比转换大小，并保持纵横比    
    FixSize: 基于以下指定大小来转换，并保持纵横比   
    PercentileNoRatio: 严格按以下百分比转换大小，不保持纵横比   
    FixSizeNoRatio: 严格按以下指定大小来转换，不保持纵横比  
    * `resize_Percentile_w = 0.5`  
    宽度百分比大小 0-1 值  
    * `resize_Percentile_h = 0.5`  
    高度百分比大小 0-1 值  
    * `resize_FixSize_w = 640`  
    指定宽度  
    * `resize_FixSize_h = 640`  
    指定高度  
    * `save_quality = 95` 
    输出的图像质量，针对 JPEG, WebP 等支持 quality 参数的格式  
    * `jpeg_progressive = True`  
    是否启用 JPEG 的渐进式格式  
    * `auto_orientation = True`  
    是否启用基于图像 Exif 信息的，自适应旋转功能  
    如果启用，但图像 Exif 中没有 Orientation 信息，则该功能不生效  
  
以下为环境变量配置界面示例：  
![Lambda Env](./img/img01.png)
  
* TODO: Watermark with text, image  
* TODO: Blur, Contract, Bright, Sharp, Rotate  
  
### 配置依赖的层（Pillow包）
* 下载安装 Pillow 包  
建议在 Amazon Linux 2 环境，安装对应的 Python 版本（此例为 Python3.7）再安装和打包依赖包。这样保证跟 Lambda 运行环境一致   
安装 Python3.7
```
sudo yum install python37 -y
```
安装 Pillow 并打包
```
mkdir python
cd python
pip3 install Pillow -t .
zip -r9 python-Pillow.zip ../python
```
如果不方便自己下载安装，可以采用本Lab准备好的包(Amazon Linux Python37环境下打包的)：
[python-Pillow.zip](./python-Pillow-6.2.1.zip)  
关于 AWS Lambda 的运行环境，[参考文档](https://docs.aws.amazon.com/zh_cn/lambda/latest/dg/lambda-runtimes.html)  

* 创建 Lambda Layer  
在 Lambda 界面，左侧菜单 “层”（Layer），创建层。  
上传 python-Pillow.zip 文件，并标注一下兼容运行时为 Python 3.7  
  
  ![lambda layer](./img/img02.png)

* 将 Lambda 函数关联 Layer  
  进入刚才新建的 Lambda 函数界面，将函数关联刚才创建的层  

  ![Lambda associat layer](./img/img03.png)

更多关于如何创建和管理层，参见：  
https://aws.amazon.com/cn/blogs/china/use-aws-lambda-layer-function/
https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html

### 设置 S3 触发 Lambda
* 设置 S3 触发 Lambda  
在 Lambda 函数界面点击“添加触发器”，选择 S3，并配置桶和前缀。  
![触发器](./img/img04.png)
  
### 测试上传文件  
尝试调整环境变量中各种参数：  
* 上传 JPG 文件转换格式为 WebP  
* 保留原 JPG 格式，只改变大小为指定大小 640*640，保留纵横比  
* 转换格式以及改变大小，并且不保持纵横比  

在 S3 桶中，创建一个“input”目录，并上传图像文件到该目录中，查看该 S3 桶“output”目录下新输出的文件。  
