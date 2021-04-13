package com.example.demo.function;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.function.Function;

public class ApiGwHandler implements Function<String, String> {
	private static final Logger logger = LoggerFactory.getLogger(ApiGwHandler.class);

	private ObjectMapper mapper;
	public ApiGwHandler(ObjectMapper mapper){
		this.mapper=mapper;
	}

	@Override
	public String apply(String  eventObject) {
		APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
		try {
			logger.info("ApiGwHandler begins");
			APIGatewayProxyRequestEvent requestEvent=mapper.readValue(eventObject, APIGatewayProxyRequestEvent.class);
			response.setBody(requestEvent.getRequestContext().getAccountId());
			response.setStatusCode(200);
			return mapper.writeValueAsString( response);
		} catch (Exception ex) {
			logger.error("ApiGwHandler processing failed",ex);
			throw new RuntimeException(ex);
		}



	}

}
