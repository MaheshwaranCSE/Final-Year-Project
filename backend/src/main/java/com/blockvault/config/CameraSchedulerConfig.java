package com.blockvault.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration
@EnableScheduling
public class CameraSchedulerConfig {

    @Bean(name = "cameraTaskScheduler")
    public ThreadPoolTaskScheduler cameraTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(8);
        scheduler.setThreadNamePrefix("camera-sched-");
        scheduler.setErrorHandler(throwable -> {
            System.err.println("Uncaught exception in cameraTaskScheduler: " + throwable.getMessage());
        });
        scheduler.initialize();
        return scheduler;
    }
}
