package it.its.impianti.config;

import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** La sorgente open data: indirizzo e timeout, tutti in configurazione. */
@ConfigurationProperties("impianti.open-data")
public record OpenDataProperties(URI url, Duration connectTimeout, Duration readTimeout) {
}
