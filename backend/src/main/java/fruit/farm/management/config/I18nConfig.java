package fruit.farm.management.config;

import org.hibernate.validator.messageinterpolation.ResourceBundleMessageInterpolator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.validation.beanvalidation.LocaleContextMessageInterpolator;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.List;
import java.util.Locale;

/**
 * Internationalization wiring. The frontend sends the chosen UI language as an
 * {@code Accept-Language} header (pl / en); these beans turn that into localized
 * Bean Validation messages and {@link MessageSource} lookups.
 */
@Configuration
public class I18nConfig {

    static final Locale PL = Locale.of("pl");
    static final Locale EN = Locale.of("en");

    /**
     * Resolves the request locale from the {@code Accept-Language} header,
     * restricted to the supported languages and defaulting to Polish. The
     * DispatcherServlet publishes the resolved locale to LocaleContextHolder for
     * the duration of the request.
     */
    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setSupportedLocales(List.of(PL, EN));
        resolver.setDefaultLocale(PL);
        return resolver;
    }

    /**
     * Validator that resolves {@code {key}} constraint messages from the
     * ValidationMessages bundle, interpolated with the per-request locale so the
     * same constraint yields Polish or English depending on Accept-Language.
     */
    @Bean
    public LocalValidatorFactoryBean getValidator() {
        LocalValidatorFactoryBean factory = new LocalValidatorFactoryBean();
        factory.setMessageInterpolator(
                new LocaleContextMessageInterpolator(new ResourceBundleMessageInterpolator()));
        return factory;
    }
}
