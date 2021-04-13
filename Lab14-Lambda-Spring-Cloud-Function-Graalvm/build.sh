#!/bin/bash
docker build . -t lambda-spring-cloud-function-graalvm
mkdir -p build
docker run --rm --entrypoint cat lambda-spring-cloud-function-graalvm /task/target/lambda-spring-cloud-function-graalvm-0.0.1-native-zip.zip > build/lambda-spring-cloud-function-graalvm-0.0.1-native-zip.zip
