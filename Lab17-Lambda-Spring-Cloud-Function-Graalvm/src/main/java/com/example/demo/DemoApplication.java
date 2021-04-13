package com.example.demo;

import com.example.demo.function.ApiGwHandler;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.module.paramnames.ParameterNamesModule;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.cloud.function.context.FunctionRegistration;
import org.springframework.cloud.function.context.FunctionType;
import org.springframework.cloud.function.context.FunctionalSpringApplication;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.support.GenericApplicationContext;


@SpringBootConfiguration
public class DemoApplication implements ApplicationContextInitializer<GenericApplicationContext> {
	private static final Logger logger = LoggerFactory.getLogger(DemoApplication.class);
	public static void main(String[] args) {
		FunctionalSpringApplication.run(DemoApplication.class, args);
	}

	@Override
	public void initialize(GenericApplicationContext context) {
		ObjectMapper mapper = new ObjectMapper();
		mapper.registerModule(new ParameterNamesModule(JsonCreator.Mode.PROPERTIES));
		mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
		mapper.enable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT);
		mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);

		try {
			context.registerBean(ObjectMapper.class, () -> mapper);

			//use constructor based dependency injection
			context.registerBean("apiGwHandler", FunctionRegistration.class,
					() -> new FunctionRegistration<>(new ApiGwHandler(context.getBean(ObjectMapper.class))).type(FunctionType.consumer(String.class).to(String.class)));
		}
		catch (Exception ex){
			logger.error("Demo application initialization failed: ",ex);
			throw new RuntimeException(ex);
		}

	}



}