package com.blockvault.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sqs.SqsClient;

@Configuration
public class AwsConfig {

    private static final Logger log = LoggerFactory.getLogger(AwsConfig.class);

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Bean
    public SqsClient sqsClient() {
        try {
            return SqsClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
        } catch (Exception e) {
            log.warn("AWS SQS Client initialization skipped or failed (will use local fallback): {}", e.getMessage());
            return null;
        }
    }

    @Bean
    public SnsClient snsClient() {
        try {
            return SnsClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
        } catch (Exception e) {
            log.warn("AWS SNS Client initialization skipped or failed (will use local fallback): {}", e.getMessage());
            return null;
        }
    }
}
