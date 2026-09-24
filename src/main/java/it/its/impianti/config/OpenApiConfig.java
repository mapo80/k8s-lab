package it.its.impianti.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI openApi() {
        return new OpenAPI().info(new Info()
                .title("Impianti sportivi in Puglia")
                .version("1.0.0")
                .description("Enti proprietari di impianti sportivi, importati dall'open data "
                        + "della Regione Puglia. Gli errori seguono RFC 9457 (ProblemDetail)."));
    }
}
