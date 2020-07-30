import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.personalizeevents.AmazonPersonalizeEvents;
import com.amazonaws.services.personalizeevents.AmazonPersonalizeEventsClientBuilder;
import com.amazonaws.services.personalizeevents.model.Event;
import com.amazonaws.services.personalizeevents.model.PutEventsRequest;
import com.amazonaws.services.personalizeevents.model.PutEventsResult;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class PersonalizeEventTest {

    private static final String TRACKING_ID = "$tracking-id";

    private AWSCredentialsProvider provider = new DefaultAWSCredentialsProviderChain();

    private AmazonPersonalizeEvents client = AmazonPersonalizeEventsClientBuilder
            .standard()
            .withCredentials(provider)
            .withRegion(Regions.US_EAST_1)
            .build();


    @Test
    public void test(){

        String userId = "userId";
        String sessionId = "sessionId";
        String eventType = "eventType";
//                ByteBuffer properties = ((String) jsonObject.get("EVENT_TYPE")).getBytes("UTF-8");

        List<Event> eventList = new ArrayList<Event>();

        PutEventsRequest request = new PutEventsRequest();
        request.setSessionId(sessionId);
        request.setTrackingId(TRACKING_ID);
        request.setUserId(userId);

        Event event1 = new Event();
        event1.setEventId("1");
        event1.setEventType(eventType);
        String properties = "{\"itemId\": \"2\"}";
        event1.setProperties(properties);
        event1.setSentAt(new Date());
        eventList.add(event1);

        request.setEventList(eventList);

        PutEventsResult putEventsResult =client.putEvents(request);
        System.out.println(putEventsResult.getSdkResponseMetadata().toString());

    }
}
