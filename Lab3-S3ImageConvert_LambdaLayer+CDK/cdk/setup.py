import setuptools


with open("README.md") as fp:
    long_description = fp.read()


setuptools.setup(
    name="cdk_img_process",
    version="0.0.1",

    description="S3-image-convert-app",
    long_description=long_description,
    long_description_content_type="text/markdown",

    author="James Huang",

    package_dir={"": "cdk_img_process"},
    packages=setuptools.find_packages(where="cdk_img_process"),

    install_requires=[
        "aws-cdk.core", 
        "aws-cdk.aws_s3_notifications",
        "aws-cdk.aws_lambda_event_sources",
        "aws-cdk.aws_iam",
        "aws-cdk.aws-events",
        "aws-cdk.aws-events-targets",
        "aws-cdk.aws-lambda",
        "aws-cdk.aws-s3",
        "aws-cdk.aws-certificatemanager",
        "aws-cdk.aws-cloudwatch",
        "cdk-watchful",
        "boto3"
    ],


    python_requires=">=3.6",

    classifiers=[
        "Development Status :: 4 - Beta",

        "Intended Audience :: Developers",

        "License :: OSI Approved :: Apache Software License",

        "Programming Language :: JavaScript",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",

        "Topic :: Software Development :: Code Generators",
        "Topic :: Utilities",

        "Typing :: Typed",
    ],
)
