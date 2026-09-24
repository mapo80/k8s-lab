package it.its.impianti.config;

import java.net.http.HttpClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(OpenDataProperties.class)
public class OpenDataClientConfig {

    /**
     * Il client verso l'open data, con timeout espliciti: senza, il client HTTP
     * del JDK aspetta la risposta per sempre e una sorgente lenta blocca l'import.
     */
    @Bean
    RestClient openDataRestClient(RestClient.Builder builder, OpenDataProperties proprieta) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(proprieta.connectTimeout())
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        JdkClientHttpRequestFactory fabbrica = new JdkClientHttpRequestFactory(httpClient);
        fabbrica.setReadTimeout(proprieta.readTimeout());
        return builder.requestFactory(fabbrica).build();
    }
}
