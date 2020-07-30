package com.sample;

import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.KinesisEvent;
import com.amazonaws.services.lambda.runtime.events.KinesisEvent.KinesisEventRecord;
import com.amazonaws.services.personalizeevents.AmazonPersonalizeEvents;
import com.amazonaws.services.personalizeevents.AmazonPersonalizeEventsClientBuilder;
import com.amazonaws.services.personalizeevents.model.Event;
import com.amazonaws.services.personalizeevents.model.PutEventsRequest;

import org.apache.http.ParseException;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import java.io.StringWriter;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Random;

public class ClickStreamProcess implements RequestHandler<KinesisEvent, Void>{

    private static final String TRACKING_ID = "$tracking-id";// 使用 personalize Event tracker  菜单下的 Tracking ID 替换
    private final CharsetDecoder decoder = Charset.forName("UTF-8").newDecoder();
    private AWSCredentialsProvider provider = new DefaultAWSCredentialsProviderChain();

    private AmazonPersonalizeEvents client = AmazonPersonalizeEventsClientBuilder
            .standard()
            .withCredentials(provider)
            .withRegion(Regions.US_EAST_1)
            .build();


    public Void handleRequest(KinesisEvent event, Context context) {
        for (KinesisEventRecord record : event.getRecords()) {
            try {
                // Kinesis 数据是已Base64编码格式传入的，所以在处理的时候需要先解码
                String data = decoder.decode(record.getKinesis().getData()).toString();

                JSONParser parser = new JSONParser();
                JSONObject jsonObject = (JSONObject) parser.parse(data);
                System.out.println("kinesis msg is :"+data);

                // 解析客户端发过来的事件，如果格式或者名称与personalize不同，可以在这里转换
                String userId = (String) jsonObject.get("USER_ID");
                String sessionId = (String) jsonObject.get("SESSION_ID");
                String eventType = (String) jsonObject.get("EVENT_TYPE");
                String itemId = (String) jsonObject.get("ITEM_ID");

                //转换kinesis时间数据格式为Personalize事件数据格式
                JSONObject obj = new JSONObject();
                obj.put("itemId",itemId);
                StringWriter out = new StringWriter();
                obj.writeJSONString(out);
                String jsonText = out.toString();
                System.out.println(jsonText);


                //发送事件数据到Personalize
                List<Event> eventList = new ArrayList<Event>();
                PutEventsRequest request = new PutEventsRequest();
                request.setSessionId(sessionId);
                request.setTrackingId(TRACKING_ID);
                request.setUserId(userId);

                Event event1 = new Event();
                event1.setEventId(new Random().nextInt(12)+"");
                event1.setEventType(eventType);
                String properties = jsonText;
                event1.setProperties(properties);
                event1.setSentAt(new Date());
                eventList.add(event1);

                request.setEventList(eventList);

                client.putEvents(request);

            } catch (CharacterCodingException e) {
                e.printStackTrace();
            } catch (ParseException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return null;
    }
}